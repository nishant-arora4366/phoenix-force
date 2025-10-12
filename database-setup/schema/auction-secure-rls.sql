-- Secure RLS policies for auctions table
-- This script re-enables RLS with proper security policies

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

-- Create secure RLS policies
-- 1. Anyone can view auctions (for public auction listings)
CREATE POLICY "Public can view auctions" ON auctions
  FOR SELECT USING (true);

-- 2. Only authenticated users with host/admin role can create auctions
CREATE POLICY "Hosts and Admins can create auctions" ON auctions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = created_by 
      AND users.role IN ('host', 'admin')
    )
  );

-- 3. Only auction creators or admins can update auctions
CREATE POLICY "Auction creators and admins can update" ON auctions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = created_by 
      AND (users.id = created_by OR users.role = 'admin')
    )
  );

-- 4. Only auction creators or admins can delete auctions
CREATE POLICY "Auction creators and admins can delete" ON auctions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = created_by 
      AND (users.id = created_by OR users.role = 'admin')
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auctions_created_by ON auctions(created_by);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_tournament_id ON auctions(tournament_id);

-- Add comments for documentation
COMMENT ON TABLE auctions IS 'Auction management table with RLS policies for security';
COMMENT ON COLUMN auctions.created_by IS 'User who created the auction (must be host or admin)';
COMMENT ON COLUMN auctions.status IS 'Current status of the auction (draft, live, completed, etc.)';
