-- Fix RLS policies for auctions table
-- This script handles existing policies and ensures proper permissions

-- First, let's check if the columns exist and add them if they don't
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
DROP POLICY IF EXISTS "Auction creators can update their auctions" ON auctions;
DROP POLICY IF EXISTS "Auction creators can delete their auctions" ON auctions;

-- Create new policies that work with auth.users
CREATE POLICY "Users can view all auctions" ON auctions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create auctions" ON auctions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auction creators can update their auctions" ON auctions
  FOR UPDATE USING (
    created_by = auth.uid()
  );

CREATE POLICY "Auction creators can delete their auctions" ON auctions
  FOR DELETE USING (
    created_by = auth.uid()
  );
