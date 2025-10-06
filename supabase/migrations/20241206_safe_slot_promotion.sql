-- Safe slot promotion function that handles waitlist to main slot promotion
-- without causing duplicate key constraints or missing slot issues

CREATE OR REPLACE FUNCTION safe_promote_waitlist_player(
    p_tournament_id UUID,
    p_waitlist_slot_id UUID,
    p_main_slot_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    promoted_player_id UUID,
    new_slot_number INTEGER,
    message TEXT
) AS $$
DECLARE
    v_waitlist_player RECORD;
    v_main_slot RECORD;
    v_temp_slot_number INTEGER;
BEGIN
    -- Get waitlist player details
    SELECT * INTO v_waitlist_player
    FROM tournament_slots
    WHERE id = p_waitlist_slot_id AND tournament_id = p_tournament_id;
    
    IF v_waitlist_player IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::INTEGER, 'Waitlist player not found';
        RETURN;
    END IF;
    
    -- Get main slot details
    SELECT * INTO v_main_slot
    FROM tournament_slots
    WHERE id = p_main_slot_id AND tournament_id = p_tournament_id;
    
    IF v_main_slot IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::INTEGER, 'Main slot not found';
        RETURN;
    END IF;
    
    -- Check if main slot is actually empty
    IF v_main_slot.player_id IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::INTEGER, 'Main slot is not empty';
        RETURN;
    END IF;
    
    -- Use a very high temporary slot number to avoid conflicts
    v_temp_slot_number := 999999;
    
    -- Step 1: Move waitlist player to temporary slot
    UPDATE tournament_slots
    SET slot_number = v_temp_slot_number,
        status = 'pending'
    WHERE id = p_waitlist_slot_id;
    
    -- Step 2: Move player from temporary slot to main slot
    UPDATE tournament_slots
    SET slot_number = v_main_slot.slot_number,
        status = 'pending'
    WHERE id = p_waitlist_slot_id;
    
    -- Return success
    RETURN QUERY SELECT 
        TRUE, 
        v_waitlist_player.player_id, 
        v_main_slot.slot_number,
        'Player successfully promoted from waitlist to main slot';
        
END;
$$ LANGUAGE plpgsql;

-- Function to find and promote the first waitlist player
CREATE OR REPLACE FUNCTION find_and_promote_waitlist(p_tournament_id UUID)
RETURNS TABLE(
    success BOOLEAN,
    promoted_player_id UUID,
    new_slot_number INTEGER,
    message TEXT
) AS $$
DECLARE
    v_total_slots INTEGER;
    v_empty_main_slot RECORD;
    v_waitlist_player RECORD;
    v_promotion_result RECORD;
BEGIN
    -- Get tournament total slots
    SELECT total_slots INTO v_total_slots
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    -- Find the first empty main slot
    SELECT * INTO v_empty_main_slot
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND slot_number <= v_total_slots
      AND player_id IS NULL
    ORDER BY slot_number
    LIMIT 1;
    
    -- If no empty main slot, return failure
    IF v_empty_main_slot IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::INTEGER, 'No empty main slots available';
        RETURN;
    END IF;
    
    -- Find the first waitlist player
    SELECT * INTO v_waitlist_player
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND slot_number > v_total_slots
      AND player_id IS NOT NULL
      AND status = 'waitlist'
    ORDER BY requested_at ASC
    LIMIT 1;
    
    -- If no waitlist player, return failure
    IF v_waitlist_player IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::INTEGER, 'No waitlist players found';
        RETURN;
    END IF;
    
    -- Perform the safe promotion
    SELECT * INTO v_promotion_result
    FROM safe_promote_waitlist_player(p_tournament_id, v_waitlist_player.id, v_empty_main_slot.id);
    
    -- Return the result
    RETURN QUERY SELECT 
        v_promotion_result.success,
        v_promotion_result.promoted_player_id,
        v_promotion_result.new_slot_number,
        v_promotion_result.message;
        
END;
$$ LANGUAGE plpgsql;
