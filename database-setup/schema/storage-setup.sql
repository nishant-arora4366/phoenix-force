-- ==============================================
-- SUPABASE STORAGE SETUP FOR PROFILE PICTURES
-- ==============================================

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  15728640, -- 15MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- RLS POLICIES FOR PROFILE PICTURES BUCKET
-- ==============================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Policy: Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Policy: Allow public read access to profile pictures
CREATE POLICY "Profile pictures are publicly readable" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profile-pictures'
);

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Function to get profile picture URL for a user
CREATE OR REPLACE FUNCTION get_profile_picture_url(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_pic_url text;
BEGIN
  -- Get the most recent profile picture for the user
  SELECT 
    CASE 
      WHEN p.profile_pic_url IS NOT NULL AND p.profile_pic_url != '' THEN p.profile_pic_url
      ELSE NULL
    END
  INTO profile_pic_url
  FROM players p
  WHERE p.user_id = user_id_param
  ORDER BY p.updated_at DESC
  LIMIT 1;
  
  RETURN profile_pic_url;
END;
$$;

-- Function to clean up old profile pictures when new ones are uploaded
CREATE OR REPLACE FUNCTION cleanup_old_profile_pictures()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_file_path text;
BEGIN
  -- If this is an update and the profile_pic_url changed
  IF TG_OP = 'UPDATE' AND OLD.profile_pic_url IS DISTINCT FROM NEW.profile_pic_url THEN
    -- Extract file path from old URL
    old_file_path := regexp_replace(OLD.profile_pic_url, '^.*/storage/v1/object/public/profile-pictures/', '');
    
    -- Delete old file from storage (if it exists and is not empty)
    IF old_file_path IS NOT NULL AND old_file_path != '' THEN
      DELETE FROM storage.objects 
      WHERE bucket_id = 'profile-pictures' 
      AND name = old_file_path;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to clean up old profile pictures
DROP TRIGGER IF EXISTS cleanup_old_profile_pictures_trigger ON players;
CREATE TRIGGER cleanup_old_profile_pictures_trigger
  AFTER UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_profile_pictures();

-- ==============================================
-- STORAGE CONFIGURATION
-- ==============================================

-- Set up storage configuration for profile pictures
UPDATE storage.buckets 
SET 
  file_size_limit = 15728640, -- 15MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
  public = true
WHERE id = 'profile-pictures';

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'profile-pictures';

-- Verify RLS policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Verify functions were created
SELECT proname, prosrc FROM pg_proc WHERE proname IN ('get_profile_picture_url', 'cleanup_old_profile_pictures');
