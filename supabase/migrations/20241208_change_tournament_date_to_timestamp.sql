-- Change tournament_date from date to timestamp to support time
-- This allows storing both date and time for tournament scheduling

-- First, drop the dependent view
DROP VIEW IF EXISTS tournament_details;

-- Add a new column for the datetime
ALTER TABLE tournaments ADD COLUMN tournament_datetime timestamp with time zone;

-- Copy existing date data to the new datetime column (set time to 09:00:00 by default)
UPDATE tournaments 
SET tournament_datetime = (tournament_date + INTERVAL '9 hours')::timestamp with time zone
WHERE tournament_date IS NOT NULL;

-- Drop the old date column
ALTER TABLE tournaments DROP COLUMN tournament_date;

-- Rename the new column to tournament_date for consistency
ALTER TABLE tournaments RENAME COLUMN tournament_datetime TO tournament_date;

-- Update the comment
COMMENT ON COLUMN tournaments.tournament_date IS 'Date and time when the tournament will be held';

-- Recreate the tournament_details view
CREATE OR REPLACE VIEW tournament_details AS
 SELECT id,
    name,
    host_id,
    host_player_id,
    status,
    total_slots,
    created_at,
    updated_at,
    format,
    selected_teams,
    tournament_date,
    description,
    CASE 
        WHEN total_slots = (selected_teams * 8) THEN 'Standard'::text
        ELSE 'Custom'::text
    END AS slot_selection_status
   FROM tournaments t;

-- Update the index to work with timestamp
DROP INDEX IF EXISTS idx_tournaments_date;
CREATE INDEX idx_tournaments_datetime ON tournaments USING btree (tournament_date);

-- Grant permissions on the recreated view
GRANT ALL ON TABLE tournament_details TO anon;
GRANT ALL ON TABLE tournament_details TO authenticated;
GRANT ALL ON TABLE tournament_details TO service_role;
