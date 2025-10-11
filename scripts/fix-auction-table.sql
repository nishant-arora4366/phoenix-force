-- Fix auction table by removing created_by column and its foreign key
-- This will work regardless of the current schema state

-- 1. First, check if the created_by column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'auctions' 
AND table_schema = 'public' 
AND column_name = 'created_by';

-- 2. Drop the foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'auctions_created_by_fkey' 
        AND table_name = 'auctions' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE auctions DROP CONSTRAINT auctions_created_by_fkey;
        RAISE NOTICE 'Dropped foreign key constraint auctions_created_by_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint auctions_created_by_fkey does not exist';
    END IF;
END $$;

-- 3. Drop the created_by column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auctions' 
        AND table_schema = 'public' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE auctions DROP COLUMN created_by;
        RAISE NOTICE 'Dropped created_by column from auctions table';
    ELSE
        RAISE NOTICE 'created_by column does not exist in auctions table';
    END IF;
END $$;

-- 4. Verify the final auctions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'auctions' AND table_schema = 'public'
ORDER BY ordinal_position;
