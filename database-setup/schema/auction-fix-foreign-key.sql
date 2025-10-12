-- Fix foreign key constraint for auctions.created_by
-- The constraint should reference public.users, not auth.users

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE auctions DROP CONSTRAINT IF EXISTS fk_auctions_created_by;
ALTER TABLE auctions DROP CONSTRAINT IF EXISTS fk_created_by;

-- Add the correct foreign key constraint referencing public.users
ALTER TABLE auctions
ADD CONSTRAINT fk_auctions_created_by
FOREIGN KEY (created_by) REFERENCES users(id)
ON DELETE SET NULL;

-- Add missing columns if they don't exist
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS max_tokens_per_captain INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS min_bid_amount INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS use_base_price BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_increment INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS use_fixed_increments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS player_order_type VARCHAR(50) DEFAULT 'base_price_desc',
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS auction_config JSONB DEFAULT '{}';

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
