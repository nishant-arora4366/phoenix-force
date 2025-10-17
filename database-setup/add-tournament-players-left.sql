-- Add tournament_players_left table to track players who left tournaments
-- This preserves history while keeping current slot calculations clean

-- Create the table
CREATE TABLE IF NOT EXISTS tournament_players_left (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  player_id uuid NOT NULL,
  player_name varchar(255) NOT NULL,
  player_photo_url text,
  left_at timestamp with time zone DEFAULT now(),
  left_reason varchar(50) NOT NULL, -- 'withdrawn', 'removed', 'cancelled'
  left_by uuid, -- user who caused the action (null for self-withdrawal)
  slot_created_at timestamp with time zone, -- when they originally registered
  created_at timestamp with time zone DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_tournament_players_left_tournament 
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  CONSTRAINT fk_tournament_players_left_player 
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT fk_tournament_players_left_user 
    FOREIGN KEY (left_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_players_left_tournament_id 
  ON tournament_players_left(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournament_players_left_player_id 
  ON tournament_players_left(player_id);

CREATE INDEX IF NOT EXISTS idx_tournament_players_left_left_at 
  ON tournament_players_left(tournament_id, left_at DESC);

-- Add RLS policies
ALTER TABLE tournament_players_left ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read players who left (for transparency)
CREATE POLICY "Anyone can view players who left tournaments" 
  ON tournament_players_left FOR SELECT 
  USING (true);

-- Policy: Only authenticated users can insert (when leaving/removing)
CREATE POLICY "Authenticated users can record players leaving" 
  ON tournament_players_left FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Only admins can update/delete (for data integrity)
CREATE POLICY "Only admins can modify players left records" 
  ON tournament_players_left FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE tournament_players_left IS 'Tracks players who left tournaments with complete history and reasons';
COMMENT ON COLUMN tournament_players_left.left_reason IS 'Reason for leaving: withdrawn, removed, cancelled';
COMMENT ON COLUMN tournament_players_left.left_by IS 'User who caused the action (null for self-withdrawal)';
COMMENT ON COLUMN tournament_players_left.slot_created_at IS 'When the player originally registered (for historical context)';
