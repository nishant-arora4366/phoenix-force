-- Step-by-step tournament schema update
-- This script handles the migration in safe steps

-- Step 1: Drop dependent views first
DROP VIEW IF EXISTS tournament_details CASCADE;

-- Step 2: Add new columns to tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS format VARCHAR(50),
ADD COLUMN IF NOT EXISTS selected_teams INTEGER,
ADD COLUMN IF NOT EXISTS tournament_date DATE,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 3: Update existing tournaments to have default values
UPDATE tournaments 
SET 
  format = '8 Team',
  selected_teams = 8,
  tournament_date = CURRENT_DATE + INTERVAL '30 days',
  description = 'Tournament created before schema update'
WHERE format IS NULL;

-- Step 4: Remove bid-related columns (these will be in auction schema)
ALTER TABLE tournaments 
DROP COLUMN IF EXISTS min_bid_amount,
DROP COLUMN IF EXISTS min_increment;

-- Step 5: Create helper functions
CREATE OR REPLACE FUNCTION get_recommended_teams(tournament_format VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  CASE tournament_format
    WHEN 'Bilateral' THEN RETURN 2;
    WHEN 'TriSeries' THEN RETURN 3;
    WHEN 'Quad' THEN RETURN 4;
    WHEN '6 Team' THEN RETURN 6;
    WHEN '8 Team' THEN RETURN 8;
    WHEN '10 Team' THEN RETURN 10;
    WHEN '12 Team' THEN RETURN 12;
    WHEN '16 Team' THEN RETURN 16;
    WHEN '20 Team' THEN RETURN 20;
    WHEN '24 Team' THEN RETURN 24;
    WHEN '32 Team' THEN RETURN 32;
    ELSE RETURN 8; -- Default to 8 teams
  END CASE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_recommended_slots(tournament_format VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  CASE tournament_format
    WHEN 'Bilateral' THEN RETURN 22; -- 11 players per team * 2 teams
    WHEN 'TriSeries' THEN RETURN 33; -- 11 players per team * 3 teams
    WHEN 'Quad' THEN RETURN 44; -- 11 players per team * 4 teams
    WHEN '6 Team' THEN RETURN 66; -- 11 players per team * 6 teams
    WHEN '8 Team' THEN RETURN 88; -- 11 players per team * 8 teams
    WHEN '10 Team' THEN RETURN 110; -- 11 players per team * 10 teams
    WHEN '12 Team' THEN RETURN 132; -- 11 players per team * 12 teams
    WHEN '16 Team' THEN RETURN 176; -- 11 players per team * 16 teams
    WHEN '20 Team' THEN RETURN 220; -- 11 players per team * 20 teams
    WHEN '24 Team' THEN RETURN 264; -- 11 players per team * 24 teams
    WHEN '32 Team' THEN RETURN 352; -- 11 players per team * 32 teams
    ELSE RETURN 88; -- Default to 8 teams worth of slots
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournaments_format ON tournaments(format);
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON tournaments(tournament_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_selected_teams ON tournaments(selected_teams);

-- Step 7: Recreate the tournament_details view
CREATE OR REPLACE VIEW tournament_details AS
SELECT 
  t.*,
  get_recommended_teams(t.format) as recommended_teams,
  get_recommended_slots(t.format) as recommended_slots,
  CASE 
    WHEN t.selected_teams = get_recommended_teams(t.format) THEN 'Recommended'
    ELSE 'Custom'
  END as team_selection_status,
  CASE 
    WHEN t.total_slots = get_recommended_slots(t.format) THEN 'Recommended'
    ELSE 'Custom'
  END as slot_selection_status
FROM tournaments t;

-- Step 8: Add comments to document the schema
COMMENT ON COLUMN tournaments.format IS 'Tournament format: Bilateral, TriSeries, Quad, 6 Team, 8 Team, etc.';
COMMENT ON COLUMN tournaments.selected_teams IS 'Number of teams selected for this tournament';
COMMENT ON COLUMN tournaments.tournament_date IS 'Date when the tournament will be held';
COMMENT ON COLUMN tournaments.description IS 'Description of the tournament';
COMMENT ON COLUMN tournaments.total_slots IS 'Total number of player slots available';
COMMENT ON COLUMN tournaments.host_id IS 'User ID of the tournament host';
