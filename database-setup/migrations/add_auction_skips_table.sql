-- Create auction_skips table to track when captains skip players
CREATE TABLE IF NOT EXISTS auction_skips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES auction_teams(id) ON DELETE CASCADE,
  skipped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a team can only skip a player once per auction
  UNIQUE(auction_id, player_id, team_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_auction_skips_auction_id ON auction_skips(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_skips_player_id ON auction_skips(player_id);
CREATE INDEX IF NOT EXISTS idx_auction_skips_team_id ON auction_skips(team_id);
CREATE INDEX IF NOT EXISTS idx_auction_skips_auction_player ON auction_skips(auction_id, player_id);

-- Enable RLS
ALTER TABLE auction_skips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view auction skips" ON auction_skips;
DROP POLICY IF EXISTS "Authenticated users can insert skips" ON auction_skips;
DROP POLICY IF EXISTS "Authenticated users can delete skips" ON auction_skips;

-- Policy: Anyone can view skips (for realtime updates)
CREATE POLICY "Anyone can view auction skips"
  ON auction_skips FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert skips (API will validate captain)
CREATE POLICY "Authenticated users can insert skips"
  ON auction_skips FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users can delete skips (API will validate admin/host)
CREATE POLICY "Authenticated users can delete skips"
  ON auction_skips FOR DELETE
  TO authenticated
  USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE auction_skips;

-- Add comment
COMMENT ON TABLE auction_skips IS 'Tracks when team captains skip bidding on a player during auction';
