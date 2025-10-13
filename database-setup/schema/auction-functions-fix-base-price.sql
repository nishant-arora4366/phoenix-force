-- Fix database functions to remove base_price column references
-- This script updates the auction player functions to work without the base_price column

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_current_player(UUID);
DROP FUNCTION IF EXISTS move_to_next_player(UUID);
DROP FUNCTION IF EXISTS move_to_previous_player(UUID);

-- Update get_current_player function to remove base_price
CREATE OR REPLACE FUNCTION get_current_player(p_auction_id UUID)
RETURNS TABLE(
    id UUID,
    auction_id UUID,
    player_id UUID,
    status VARCHAR(50),
    sold_to UUID,
    sold_price INTEGER,
    display_order INTEGER,
    times_skipped INTEGER,
    current_player BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    display_name VARCHAR(255),
    profile_pic_url VARCHAR(500),
    skills JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ap.id, ap.auction_id, ap.player_id, ap.status, ap.sold_to, ap.sold_price,
        ap.display_order, ap.times_skipped, ap.current_player,
        ap.created_at, ap.updated_at,
        p.display_name, p.profile_pic_url,
        (
            SELECT jsonb_object_agg(ps.skill_name,
                CASE
                    WHEN psa.value_array IS NOT NULL THEN to_jsonb(psa.value_array)
                    ELSE to_jsonb(psv.value_name)
                END
            )
            FROM player_skill_assignments psa
            JOIN player_skills ps ON psa.skill_id = ps.id
            LEFT JOIN player_skill_values psv ON psa.skill_value_id = psv.id
            WHERE psa.player_id = p.id AND ps.viewer_visible = TRUE
        ) AS skills
    FROM auction_players ap
    JOIN players p ON ap.player_id = p.id
    WHERE ap.auction_id = p_auction_id AND ap.current_player = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update move_to_next_player function
CREATE OR REPLACE FUNCTION move_to_next_player(p_auction_id UUID)
RETURNS TABLE (
    id UUID,
    auction_id UUID,
    player_id UUID,
    status VARCHAR(50),
    sold_to UUID,
    sold_price INTEGER,
    display_order INTEGER,
    times_skipped INTEGER,
    current_player BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    display_name VARCHAR(255),
    profile_pic_url VARCHAR(500),
    skills JSONB
) AS $$
DECLARE
    current_display_order INTEGER;
    next_player_id UUID;
BEGIN
    -- Get the display_order of the current player
    SELECT ap.display_order INTO current_display_order
    FROM auction_players ap
    WHERE ap.auction_id = p_auction_id AND ap.current_player = TRUE;

    -- Find the next player in order that is available
    SELECT ap.player_id INTO next_player_id
    FROM auction_players ap
    WHERE ap.auction_id = p_auction_id
      AND ap.display_order > current_display_order
      AND ap.status = 'available' -- Only consider available players
    ORDER BY ap.display_order ASC
    LIMIT 1;

    IF next_player_id IS NOT NULL THEN
        PERFORM set_current_player(p_auction_id, next_player_id);
    END IF;

    RETURN QUERY SELECT * FROM get_current_player(p_auction_id);
END;
$$ LANGUAGE plpgsql;

-- Update move_to_previous_player function
CREATE OR REPLACE FUNCTION move_to_previous_player(p_auction_id UUID)
RETURNS TABLE (
    id UUID,
    auction_id UUID,
    player_id UUID,
    status VARCHAR(50),
    sold_to UUID,
    sold_price INTEGER,
    display_order INTEGER,
    times_skipped INTEGER,
    current_player BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    display_name VARCHAR(255),
    profile_pic_url VARCHAR(500),
    skills JSONB
) AS $$
DECLARE
    current_display_order INTEGER;
    previous_player_id UUID;
BEGIN
    -- Get the display_order of the current player
    SELECT ap.display_order INTO current_display_order
    FROM auction_players ap
    WHERE ap.auction_id = p_auction_id AND ap.current_player = TRUE;

    -- Find the previous player in order that is available
    SELECT ap.player_id INTO previous_player_id
    FROM auction_players ap
    WHERE ap.auction_id = p_auction_id
      AND ap.display_order < current_display_order
      AND ap.status = 'available' -- Only consider available players
    ORDER BY ap.display_order DESC
    LIMIT 1;

    IF previous_player_id IS NOT NULL THEN
        PERFORM set_current_player(p_auction_id, previous_player_id);
    END IF;

    RETURN QUERY SELECT * FROM get_current_player(p_auction_id);
END;
$$ LANGUAGE plpgsql;
