-- Add tournament restriction fields for community and base price filtering
-- This allows hosts to restrict tournaments to specific communities and base price ranges

-- Add restriction fields to tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS community_restrictions TEXT[];
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS base_price_restrictions TEXT[];
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS min_base_price DECIMAL(10,2);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS max_base_price DECIMAL(10,2);

-- Add comments for documentation
COMMENT ON COLUMN tournaments.community_restrictions IS 'Array of allowed community values for tournament registration';
COMMENT ON COLUMN tournaments.base_price_restrictions IS 'Array of allowed base price values for tournament registration';
COMMENT ON COLUMN tournaments.min_base_price IS 'Minimum base price allowed for tournament registration';
COMMENT ON COLUMN tournaments.max_base_price IS 'Maximum base price allowed for tournament registration';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tournaments_community_restrictions ON tournaments USING GIN (community_restrictions);
CREATE INDEX IF NOT EXISTS idx_tournaments_base_price_restrictions ON tournaments USING GIN (base_price_restrictions);
CREATE INDEX IF NOT EXISTS idx_tournaments_price_range ON tournaments (min_base_price, max_base_price);

-- Update the tournament_details view to include new fields
DROP VIEW IF EXISTS tournament_details;
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
    venue,
    google_maps_link,
    community_restrictions,
    base_price_restrictions,
    min_base_price,
    max_base_price,
    CASE 
        WHEN total_slots = (selected_teams * 8) THEN 'Standard'::text
        ELSE 'Custom'::text
    END AS slot_selection_status
   FROM tournaments t;

-- Grant permissions on the updated view
GRANT ALL ON TABLE tournament_details TO anon;
GRANT ALL ON TABLE tournament_details TO authenticated;
GRANT ALL ON TABLE tournament_details TO service_role;
