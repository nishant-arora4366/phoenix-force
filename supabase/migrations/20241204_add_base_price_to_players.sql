-- Add base_price column to players table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'base_price'
    ) THEN
        ALTER TABLE players ADD COLUMN base_price INTEGER DEFAULT 0;
    END IF;
END $$;
