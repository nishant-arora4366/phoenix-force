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
        RAISE NOTICE 'Added schedule_image_url column to tournaments table';
    ELSE
        RAISE NOTICE 'schedule_image_url column already exists in tournaments table';
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
        RAISE NOTICE 'Added schedule_images column to tournaments table';
    ELSE
        RAISE NOTICE 'schedule_images column already exists in tournaments table';
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
AND column_name IN ('schedule_image_url', 'schedule_images')
ORDER BY column_name;
