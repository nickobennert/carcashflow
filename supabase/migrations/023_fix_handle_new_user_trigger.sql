-- ============================================
-- FIX: Restore complete handle_new_user trigger
-- Migration 022 accidentally replaced the full trigger
-- with a minimal version missing username (NOT NULL),
-- email, trial_ends_at, subscription_tier, subscription_status.
-- This restores the full version from 002 with security
-- fixes from 022 (SET search_path = '', public. prefixes).
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_username TEXT;
  email_prefix TEXT;
BEGIN
  -- Generate safe username from email or fallback to user id
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    email_prefix := LOWER(SPLIT_PART(NEW.email, '@', 1));
    -- Remove any character that's not alphanumeric or underscore
    email_prefix := REGEXP_REPLACE(email_prefix, '[^a-z0-9_]', '_', 'g');
    -- Ensure it starts with a letter
    IF email_prefix ~ '^[0-9]' THEN
      email_prefix := 'u' || email_prefix;
    END IF;
    new_username := email_prefix || '_' || SUBSTRING(NEW.id::text, 1, 4);
  ELSE
    new_username := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    username,
    webhook_token,
    trial_ends_at,
    subscription_tier,
    subscription_status,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    new_username,
    gen_random_uuid(),
    NOW() + INTERVAL '30 days',
    'trial',
    'trialing',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Username collision: append random suffix
    new_username := new_username || '_' || SUBSTRING(md5(random()::text), 1, 4);
    INSERT INTO public.profiles (
      id, email, first_name, username, webhook_token,
      trial_ends_at, subscription_tier, subscription_status, created_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
      ),
      new_username,
      gen_random_uuid(),
      NOW() + INTERVAL '30 days',
      'trial',
      'trialing',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;
