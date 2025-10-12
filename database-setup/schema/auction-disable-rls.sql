-- Temporarily disable RLS for auctions table to test creation
-- This is a quick fix for testing purposes

-- Add missing columns first
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS max_tokens_per_captain INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS min_bid_amount INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS use_base_price BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_increment INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS use_fixed_increments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS player_order_type VARCHAR(50) DEFAULT 'base_price_desc',
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS auction_config JSONB DEFAULT '{}';

-- Add foreign key constraint for created_by if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_auctions_created_by' 
        AND conrelid = 'public.auctions'::regclass
    ) THEN
        ALTER TABLE auctions
        ADD CONSTRAINT fk_auctions_created_by
        FOREIGN KEY (created_by) REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Update existing auctions with default values if needed
UPDATE auctions 
SET 
  max_tokens_per_captain = 2000,
  min_bid_amount = 40,
  use_base_price = false,
  min_increment = 20,
  use_fixed_increments = true,
  player_order_type = 'base_price_desc'
WHERE max_tokens_per_captain IS NULL;

-- Temporarily disable RLS for testing
ALTER TABLE auctions DISABLE ROW LEVEL SECURITY;

-- Note: After testing, you should re-enable RLS with proper policies:
-- ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
-- Then create appropriate policies based on your security requirements
