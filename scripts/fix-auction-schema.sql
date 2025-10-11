-- Fix auction table schema by removing created_by column
-- Since we can get the creator through tournament.host_id, we don't need to store it separately

-- 1. Drop the foreign key constraint first
ALTER TABLE auctions DROP CONSTRAINT IF EXISTS auctions_created_by_fkey;

-- 2. Drop the created_by column
ALTER TABLE auctions DROP COLUMN IF EXISTS created_by;

-- 3. Verify the auctions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'auctions' AND table_schema = 'public'
ORDER BY ordinal_position;
