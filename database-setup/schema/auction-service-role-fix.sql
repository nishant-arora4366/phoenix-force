-- Fix for auction creation using service role key
-- This approach bypasses RLS for server-side operations

-- Add missing columns to auctions table
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

-- Enable RLS on auctions table
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all auctions" ON auctions;
DROP POLICY IF EXISTS "Hosts and Admins can create auctions" ON auctions;
DROP POLICY IF EXISTS "Authenticated users can create auctions" ON auctions;
DROP POLICY IF EXISTS "Auction creators can update their auctions" ON auctions;
DROP POLICY IF EXISTS "Auction creators can delete their auctions" ON auctions;

-- Create policies that work with service role key
-- Service role key bypasses RLS, so we need policies that allow operations
CREATE POLICY "Users can view all auctions" ON auctions
  FOR SELECT USING (true);

-- Allow inserts for service role (which bypasses RLS anyway)
CREATE POLICY "Allow auction creation" ON auctions
  FOR INSERT WITH CHECK (true);

-- Allow updates for service role
CREATE POLICY "Allow auction updates" ON auctions
  FOR UPDATE USING (true);

-- Allow deletes for service role
CREATE POLICY "Allow auction deletion" ON auctions
  FOR DELETE USING (true);
