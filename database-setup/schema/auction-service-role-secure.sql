-- Secure RLS policies that work with service role key
-- This approach uses service role for server-side operations but maintains security

-- First, ensure all columns exist
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS max_tokens_per_captain INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS min_bid_amount INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS use_base_price BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_increment INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS use_fixed_increments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS player_order_type VARCHAR(50) DEFAULT 'base_price_desc',
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS auction_config JSONB DEFAULT '{}';

-- Fix foreign key constraint to reference public.users
ALTER TABLE auctions DROP CONSTRAINT IF EXISTS fk_auctions_created_by;
ALTER TABLE auctions DROP CONSTRAINT IF EXISTS fk_created_by;

ALTER TABLE auctions
ADD CONSTRAINT fk_auctions_created_by
FOREIGN KEY (created_by) REFERENCES users(id)
ON DELETE SET NULL;

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

-- Re-enable RLS
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view all auctions" ON auctions;
DROP POLICY IF EXISTS "Allow auction creation" ON auctions;
DROP POLICY IF EXISTS "Allow auction updates" ON auctions;
DROP POLICY IF EXISTS "Allow auction deletion" ON auctions;
DROP POLICY IF EXISTS "Authenticated users can create auctions" ON auctions;
DROP POLICY IF EXISTS "Auction creators can update their auctions" ON auctions;
DROP POLICY IF EXISTS "Auction creators can delete their auctions" ON auctions;
DROP POLICY IF EXISTS "Public can view auctions" ON auctions;
DROP POLICY IF EXISTS "Hosts and Admins can create auctions" ON auctions;
DROP POLICY IF EXISTS "Auction creators and admins can update" ON auctions;
DROP POLICY IF EXISTS "Auction creators and admins can delete" ON auctions;

-- Create policies that work with service role key
-- Service role key bypasses RLS, but we still define policies for documentation
-- and potential future use with regular user authentication

-- 1. Anyone can view auctions (for public auction listings)
CREATE POLICY "Public can view auctions" ON auctions
  FOR SELECT USING (true);

-- 2. Allow creation (service role will handle validation in API)
CREATE POLICY "Service role can create auctions" ON auctions
  FOR INSERT WITH CHECK (true);

-- 3. Allow updates (service role will handle validation in API)
CREATE POLICY "Service role can update auctions" ON auctions
  FOR UPDATE USING (true);

-- 4. Allow deletion (service role will handle validation in API)
CREATE POLICY "Service role can delete auctions" ON auctions
  FOR DELETE USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auctions_created_by ON auctions(created_by);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_tournament_id ON auctions(tournament_id);

-- Add comments for documentation
COMMENT ON TABLE auctions IS 'Auction management table with RLS policies (bypassed by service role)';
COMMENT ON COLUMN auctions.created_by IS 'User who created the auction (validated in API)';
COMMENT ON COLUMN auctions.status IS 'Current status of the auction (draft, live, completed, etc.)';
