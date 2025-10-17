-- ==============================================
-- SUPABASE STORAGE SETUP FOR TOURNAMENT SCHEDULES
-- ==============================================

-- Create storage bucket for tournament schedules
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tournament-schedules',
  'tournament-schedules',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- RLS POLICIES FOR TOURNAMENT SCHEDULES BUCKET
-- ==============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Tournament hosts and admins can upload schedules" ON storage.objects;
DROP POLICY IF EXISTS "Tournament hosts and admins can update schedules" ON storage.objects;
DROP POLICY IF EXISTS "Tournament hosts and admins can delete schedules" ON storage.objects;
DROP POLICY IF EXISTS "Tournament schedules are publicly readable" ON storage.objects;

-- Policy: Allow tournament hosts and admins to upload schedules
CREATE POLICY "Tournament hosts and admins can upload schedules" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'tournament-schedules' 
  AND auth.role() = 'authenticated'
  AND (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Check if user is tournament host
    EXISTS (
      SELECT 1 FROM tournaments t
      JOIN users u ON u.id = t.host_id
      WHERE t.id::text = (storage.foldername(name))[2]
      AND u.id = auth.uid()
      AND u.role = 'host'
    )
  )
);

-- Policy: Allow tournament hosts and admins to update schedules
CREATE POLICY "Tournament hosts and admins can update schedules" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'tournament-schedules' 
  AND auth.role() = 'authenticated'
  AND (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Check if user is tournament host
    EXISTS (
      SELECT 1 FROM tournaments t
      JOIN users u ON u.id = t.host_id
      WHERE t.id::text = (storage.foldername(name))[2]
      AND u.id = auth.uid()
      AND u.role = 'host'
    )
  )
);

-- Policy: Allow tournament hosts and admins to delete schedules
CREATE POLICY "Tournament hosts and admins can delete schedules" ON storage.objects
FOR DELETE USING (
  bucket_id = 'tournament-schedules' 
  AND auth.role() = 'authenticated'
  AND (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Check if user is tournament host
    EXISTS (
      SELECT 1 FROM tournaments t
      JOIN users u ON u.id = t.host_id
      WHERE t.id::text = (storage.foldername(name))[2]
      AND u.id = auth.uid()
      AND u.role = 'host'
    )
  )
);

-- Policy: Allow public read access to tournament schedules
CREATE POLICY "Tournament schedules are publicly readable" ON storage.objects
FOR SELECT USING (
  bucket_id = 'tournament-schedules'
);

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Function to get tournament schedule URL
CREATE OR REPLACE FUNCTION get_tournament_schedule_url(tournament_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schedule_url text;
BEGIN
  -- Get the schedule URL for the tournament
  SELECT schedule_image_url INTO schedule_url
  FROM tournaments
  WHERE id = tournament_id_param;
  
  RETURN COALESCE(schedule_url, '');
END;
$$;

-- Function to clean up old schedule images when new ones are uploaded
CREATE OR REPLACE FUNCTION cleanup_old_tournament_schedules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_file_path text;
BEGIN
  -- If this is an update and the schedule_image_url changed
  IF TG_OP = 'UPDATE' AND OLD.schedule_image_url IS DISTINCT FROM NEW.schedule_image_url THEN
    -- Extract file path from old URL
    old_file_path := regexp_replace(OLD.schedule_image_url, '^.*/storage/v1/object/public/tournament-schedules/', '');
    
    -- Delete old file from storage (if it exists and is not empty)
    IF old_file_path IS NOT NULL AND old_file_path != '' THEN
      DELETE FROM storage.objects 
      WHERE bucket_id = 'tournament-schedules' 
      AND name = old_file_path;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to clean up old schedule images
DROP TRIGGER IF EXISTS cleanup_old_tournament_schedules_trigger ON tournaments;
CREATE TRIGGER cleanup_old_tournament_schedules_trigger
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_tournament_schedules();

-- ==============================================
-- STORAGE CONFIGURATION
-- ==============================================

-- Set up storage configuration for tournament schedules
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  public = true
WHERE id = 'tournament-schedules';

-- ==============================================
-- ADD SCHEDULE COLUMNS TO TOURNAMENTS TABLE
-- ==============================================

-- Add schedule_image_url column to tournaments table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tournaments' 
        AND column_name = 'schedule_image_url'
    ) THEN
        ALTER TABLE tournaments ADD COLUMN schedule_image_url text;
    END IF;
END $$;

-- Add schedule_images column to tournaments table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tournaments' 
        AND column_name = 'schedule_images'
    ) THEN
        ALTER TABLE tournaments ADD COLUMN schedule_images text[];
    END IF;
END $$;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'tournament-schedules';

-- Verify RLS policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%schedule%';

-- Verify functions were created
SELECT proname, prosrc FROM pg_proc WHERE proname IN ('get_tournament_schedule_url', 'cleanup_old_tournament_schedules');

-- Verify schedule columns were added to tournaments table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
AND column_name IN ('schedule_image_url', 'schedule_images');
