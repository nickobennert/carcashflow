-- ============================================
-- FIX: Improved handle_new_user trigger
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
  email_prefix TEXT;
BEGIN
  -- Generate safe username from email or fallback to user id
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    -- Extract email prefix and clean it
    email_prefix := LOWER(SPLIT_PART(NEW.email, '@', 1));
    -- Remove any character that's not alphanumeric or underscore
    email_prefix := REGEXP_REPLACE(email_prefix, '[^a-z0-9_]', '_', 'g');
    -- Ensure it starts with a letter (prepend 'u' if it starts with number)
    IF email_prefix ~ '^[0-9]' THEN
      email_prefix := 'u' || email_prefix;
    END IF;
    new_username := email_prefix || '_' || SUBSTRING(NEW.id::text, 1, 4);
  ELSE
    -- Fallback for OAuth without email
    new_username := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;

  -- Insert profile with safe defaults
  INSERT INTO profiles (
    id,
    email,
    first_name,
    username,
    trial_ends_at,
    subscription_tier,
    subscription_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    new_username,
    NOW() + INTERVAL '30 days',
    'trial',
    'trialing'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Username already exists, append more random chars
    new_username := new_username || '_' || SUBSTRING(md5(random()::text), 1, 4);
    INSERT INTO profiles (id, email, first_name, username, trial_ends_at, subscription_tier, subscription_status)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      new_username,
      NOW() + INTERVAL '30 days',
      'trial',
      'trialing'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
