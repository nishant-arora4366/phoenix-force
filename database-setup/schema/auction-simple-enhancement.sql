-- Simple Auction Enhancement Schema
-- Add missing fields to auctions table to support full auction configuration

-- Add new columns to auctions table
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS max_tokens_per_captain INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS min_bid_amount INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS use_base_price BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_increment INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS use_fixed_increments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS player_order_type VARCHAR(50) DEFAULT 'base_price_desc',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS auction_config JSONB DEFAULT '{}';

-- Add comments for the new columns
COMMENT ON COLUMN auctions.max_tokens_per_captain IS 'Maximum tokens each captain can use for bidding';
COMMENT ON COLUMN auctions.min_bid_amount IS 'Minimum bid amount for any player';
COMMENT ON COLUMN auctions.use_base_price IS 'Whether to use player base price as starting bid';
COMMENT ON COLUMN auctions.min_increment IS 'Minimum increment for bid increases';
COMMENT ON COLUMN auctions.use_fixed_increments IS 'Whether to use fixed increments or custom ranges';
COMMENT ON COLUMN auctions.player_order_type IS 'Order in which players will be auctioned';
COMMENT ON COLUMN auctions.created_by IS 'User who created this auction';
COMMENT ON COLUMN auctions.auction_config IS 'Additional auction configuration as JSON';

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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auctions_created_by ON auctions(created_by);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_tournament_id ON auctions(tournament_id);

-- Enable RLS on auctions table
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all auctions
CREATE POLICY "Users can view all auctions" ON auctions
  FOR SELECT USING (true);

-- Policy: Hosts and Admins can create auctions
CREATE POLICY "Hosts and Admins can create auctions" ON auctions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('host', 'admin')
    )
  );

-- Policy: Auction creators can update their auctions
CREATE POLICY "Auction creators can update their auctions" ON auctions
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Auction creators can delete their auctions
CREATE POLICY "Auction creators can delete their auctions" ON auctions
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
