-- Auction Players Enhancement Schema
-- Add missing fields to auction_players table to support proper undo functionality

-- Add missing columns to auction_players table
ALTER TABLE auction_players 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_player BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS times_skipped INTEGER DEFAULT 0;

-- Add comments for the new columns
COMMENT ON COLUMN auction_players.display_order IS 'Order in which player appears in auction';
COMMENT ON COLUMN auction_players.current_player IS 'Whether this player is currently up for bidding';
COMMENT ON COLUMN auction_players.sold_at IS 'Timestamp when player was sold (for undo functionality)';
COMMENT ON COLUMN auction_players.times_skipped IS 'Number of times this player was skipped';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auction_players_display_order ON auction_players(auction_id, display_order);
CREATE INDEX IF NOT EXISTS idx_auction_players_current_player ON auction_players(auction_id, current_player);
CREATE INDEX IF NOT EXISTS idx_auction_players_sold_at ON auction_players(auction_id, sold_at);
CREATE INDEX IF NOT EXISTS idx_auction_players_status ON auction_players(auction_id, status);

-- Update existing records to have proper display_order (if not set)
-- This will set display_order based on created_at for existing records
UPDATE auction_players 
SET display_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY auction_id ORDER BY created_at) as row_number
  FROM auction_players
  WHERE display_order = 0 OR display_order IS NULL
) subquery
WHERE auction_players.id = subquery.id;

-- Create a function to set current player
CREATE OR REPLACE FUNCTION set_current_player(p_auction_id UUID, p_player_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Clear all current players for this auction
    UPDATE auction_players 
    SET current_player = false 
    WHERE auction_id = p_auction_id;
    
    -- Set the specified player as current
    UPDATE auction_players 
    SET current_player = true 
    WHERE auction_id = p_auction_id AND player_id = p_player_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get the next player in display order
CREATE OR REPLACE FUNCTION get_next_player(p_auction_id UUID)
RETURNS UUID AS $$
DECLARE
    next_player_id UUID;
BEGIN
    SELECT player_id INTO next_player_id
    FROM auction_players
    WHERE auction_id = p_auction_id
      AND status = 'available'
      AND display_order > (
        SELECT COALESCE(MAX(display_order), 0)
        FROM auction_players
        WHERE auction_id = p_auction_id AND current_player = true
      )
    ORDER BY display_order ASC
    LIMIT 1;
    
    RETURN next_player_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get the previous player in display order
CREATE OR REPLACE FUNCTION get_previous_player(p_auction_id UUID)
RETURNS UUID AS $$
DECLARE
    previous_player_id UUID;
BEGIN
    SELECT player_id INTO previous_player_id
    FROM auction_players
    WHERE auction_id = p_auction_id
      AND status = 'available'
      AND display_order < (
        SELECT COALESCE(MIN(display_order), 999999)
        FROM auction_players
        WHERE auction_id = p_auction_id AND current_player = true
      )
    ORDER BY display_order DESC
    LIMIT 1;
    
    RETURN previous_player_id;
END;
$$ LANGUAGE plpgsql;
