-- Function to update team statistics when a player is sold
CREATE OR REPLACE FUNCTION update_team_stats_on_sale(
    p_auction_id UUID,
    p_team_id UUID,
    p_sold_price INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- Update the team's statistics
    UPDATE auction_teams
    SET 
        players_count = players_count + 1,
        total_spent = total_spent + p_sold_price,
        remaining_purse = remaining_purse - p_sold_price,
        updated_at = NOW()
    WHERE 
        auction_id = p_auction_id 
        AND id = p_team_id;
    
    -- Check if the update was successful
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Team not found for auction % and team %', p_auction_id, p_team_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
