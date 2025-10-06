-- Add admin management columns to player_skills table
DO $$ 
BEGIN
    -- Add is_admin_managed column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'player_skills' 
        AND column_name = 'is_admin_managed'
    ) THEN
        ALTER TABLE player_skills ADD COLUMN is_admin_managed BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add viewer_can_see column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'player_skills' 
        AND column_name = 'viewer_can_see'
    ) THEN
        ALTER TABLE player_skills ADD COLUMN viewer_can_see BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
