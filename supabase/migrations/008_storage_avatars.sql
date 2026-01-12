-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Policy: Anyone can view avatars (public bucket)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view avatars' AND tablename = 'objects') THEN
    CREATE POLICY "Anyone can view avatars"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Policy: Authenticated users can upload their own avatar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload own avatar' AND tablename = 'objects') THEN
    CREATE POLICY "Users can upload own avatar"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'avatars'
      );
  END IF;
END $$;

-- Policy: Users can update their own avatar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own avatar' AND tablename = 'objects') THEN
    CREATE POLICY "Users can update own avatar"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- Policy: Users can delete their own avatar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own avatar' AND tablename = 'objects') THEN
    CREATE POLICY "Users can delete own avatar"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated'
      );
  END IF;
END $$;
