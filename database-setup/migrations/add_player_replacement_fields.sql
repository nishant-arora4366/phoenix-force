-- Add player replacement tracking fields to auction_players table
-- This allows tracking when a player is replaced after auction completion

ALTER TABLE auction_players
ADD COLUMN IF NOT EXISTS is_replaced BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS replaced_by UUID REFERENCES players(id),
ADD COLUMN IF NOT EXISTS replaced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS replaced_by_user UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS replacement_reason TEXT;

-- Add index for querying replaced players
CREATE INDEX IF NOT EXISTS idx_auction_players_is_replaced ON auction_players(is_replaced);
CREATE INDEX IF NOT EXISTS idx_auction_players_replaced_by ON auction_players(replaced_by);

-- Comment the columns
COMMENT ON COLUMN auction_players.is_replaced IS 'True if this player was replaced after auction completion';
COMMENT ON COLUMN auction_players.replaced_by IS 'Player ID of the replacement player';
COMMENT ON COLUMN auction_players.replaced_at IS 'Timestamp when the replacement occurred';
COMMENT ON COLUMN auction_players.replaced_by_user IS 'User ID (admin/host) who made the replacement';
COMMENT ON COLUMN auction_players.replacement_reason IS 'Optional reason for the replacement';
