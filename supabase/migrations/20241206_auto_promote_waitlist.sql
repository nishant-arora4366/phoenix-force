-- Auto-promote waitlist players when main slots become available
-- This migration creates functions and triggers for automatic waitlist promotion

-- Function to promote the first waitlist player to an empty main slot
CREATE OR REPLACE FUNCTION auto_promote_waitlist()
RETURNS TRIGGER AS $$
DECLARE
    v_tournament_id UUID;
    v_total_slots INTEGER;
    v_first_waitlist_player RECORD;
    v_empty_main_slot RECORD;
BEGIN
    -- Get tournament info
    v_tournament_id := COALESCE(NEW.tournament_id, OLD.tournament_id);
    
    -- Get tournament total slots
    SELECT total_slots INTO v_total_slots
    FROM tournaments 
    WHERE id = v_tournament_id;
    
    -- Only proceed if we have a valid tournament
    IF v_tournament_id IS NULL OR v_total_slots IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Check if a main slot became empty (player_id set to NULL)
    IF (TG_OP = 'UPDATE' AND OLD.player_id IS NOT NULL AND NEW.player_id IS NULL) OR
       (TG_OP = 'DELETE' AND OLD.player_id IS NOT NULL) THEN
        
        -- Check if this was a main slot (slot_number <= total_slots)
        IF COALESCE(OLD.slot_number, 0) <= v_total_slots THEN
            RAISE NOTICE 'Main slot % became empty in tournament %', COALESCE(OLD.slot_number, 0), v_tournament_id;
            
            -- Find the first waitlist player (earliest requested_at)
            SELECT * INTO v_first_waitlist_player
            FROM tournament_slots
            WHERE tournament_id = v_tournament_id
              AND slot_number > v_total_slots
              AND player_id IS NOT NULL
              AND status = 'waitlist'
            ORDER BY requested_at ASC
            LIMIT 1;
            
            -- If we found a waitlist player, promote them
            IF v_first_waitlist_player IS NOT NULL THEN
                RAISE NOTICE 'Promoting waitlist player % to main slot %', v_first_waitlist_player.player_id, OLD.slot_number;
                
                -- Update the waitlist player to the empty main slot
                UPDATE tournament_slots
                SET slot_number = OLD.slot_number,
                    status = 'pending',
                    updated_at = NOW()
                WHERE id = v_first_waitlist_player.id;
                
                -- Send notification (this will be handled by the application)
                PERFORM pg_notify('waitlist_promotion', 
                    json_build_object(
                        'tournament_id', v_tournament_id,
                        'player_id', v_first_waitlist_player.player_id,
                        'new_slot_number', OLD.slot_number,
                        'promoted_at', NOW()
                    )::text
                );
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-promotion
DROP TRIGGER IF EXISTS trigger_auto_promote_waitlist ON tournament_slots;
CREATE TRIGGER trigger_auto_promote_waitlist
    AFTER UPDATE OR DELETE ON tournament_slots
    FOR EACH ROW
    EXECUTE FUNCTION auto_promote_waitlist();

-- Function to get waitlist position for a player
CREATE OR REPLACE FUNCTION get_waitlist_position(p_tournament_id UUID, p_player_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_position INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO v_position
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND slot_number > (SELECT total_slots FROM tournaments WHERE id = p_tournament_id)
      AND player_id IS NOT NULL
      AND requested_at < (
          SELECT requested_at 
          FROM tournament_slots 
          WHERE tournament_id = p_tournament_id 
            AND player_id = p_player_id
            AND slot_number > (SELECT total_slots FROM tournaments WHERE id = p_tournament_id)
      );
    
    RETURN COALESCE(v_position, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get next available main slot number
CREATE OR REPLACE FUNCTION get_next_available_main_slot(p_tournament_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_slot_number INTEGER;
    v_total_slots INTEGER;
BEGIN
    -- Get tournament total slots
    SELECT total_slots INTO v_total_slots
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    -- Find the first available main slot
    SELECT MIN(slot_number) INTO v_slot_number
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND slot_number <= v_total_slots
      AND player_id IS NULL;
    
    -- If no empty slot found, return the next slot number
    IF v_slot_number IS NULL THEN
        SELECT COALESCE(MAX(slot_number), 0) + 1 INTO v_slot_number
        FROM tournament_slots
        WHERE tournament_id = p_tournament_id
          AND slot_number <= v_total_slots;
    END IF;
    
    RETURN v_slot_number;
END;
$$ LANGUAGE plpgsql;

-- Manual function to promote waitlist players (can be called from API)
CREATE OR REPLACE FUNCTION manual_promote_waitlist(p_tournament_id UUID)
RETURNS TABLE(
    promoted_player_id UUID,
    new_slot_number INTEGER,
    success BOOLEAN
) AS $$
DECLARE
    v_total_slots INTEGER;
    v_first_waitlist_player RECORD;
    v_empty_main_slot INTEGER;
BEGIN
    -- Get tournament total slots
    SELECT total_slots INTO v_total_slots
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    -- Find the first empty main slot
    SELECT MIN(slot_number) INTO v_empty_main_slot
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND slot_number <= v_total_slots
      AND player_id IS NULL;
    
    -- If no empty main slot, return failure
    IF v_empty_main_slot IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::INTEGER, FALSE;
        RETURN;
    END IF;
    
    -- Find the first waitlist player
    SELECT * INTO v_first_waitlist_player
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND slot_number > v_total_slots
      AND player_id IS NOT NULL
      AND status = 'waitlist'
    ORDER BY requested_at ASC
    LIMIT 1;
    
    -- If no waitlist player, return failure
    IF v_first_waitlist_player IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::INTEGER, FALSE;
        RETURN;
    END IF;
    
    -- Promote the waitlist player
    UPDATE tournament_slots
    SET slot_number = v_empty_main_slot,
        status = 'pending',
        updated_at = NOW()
    WHERE id = v_first_waitlist_player.id;
    
    -- Return success
    RETURN QUERY SELECT v_first_waitlist_player.player_id, v_empty_main_slot, TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check and promote waitlist players when tournament is loaded
CREATE OR REPLACE FUNCTION check_and_promote_waitlist(p_tournament_id UUID)
RETURNS TABLE(promoted_count INTEGER, success BOOLEAN) AS $$
DECLARE
    v_total_slots INTEGER;
    v_promoted_count INTEGER := 0;
    v_promotion_result RECORD;
BEGIN
    -- Get tournament total slots
    SELECT total_slots INTO v_total_slots
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    IF v_total_slots IS NULL THEN
        RETURN QUERY SELECT 0, FALSE;
        RETURN;
    END IF;
    
    -- Keep promoting until no more promotions are possible
    LOOP
        SELECT * INTO v_promotion_result
        FROM manual_promote_waitlist(p_tournament_id);
        
        IF v_promotion_result.success THEN
            v_promoted_count := v_promoted_count + 1;
            RAISE NOTICE 'Promoted waitlist player % to slot %', v_promotion_result.promoted_player_id, v_promotion_result.new_slot_number;
        ELSE
            EXIT; -- No more promotions possible
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT v_promoted_count, TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION auto_promote_waitlist() IS 'Automatically promotes the first waitlist player when a main slot becomes available';
COMMENT ON FUNCTION get_waitlist_position(UUID, UUID) IS 'Returns the position of a player in the waitlist (1-based)';
COMMENT ON FUNCTION get_next_available_main_slot(UUID) IS 'Returns the next available main slot number for a tournament';
COMMENT ON FUNCTION check_and_promote_waitlist(UUID) IS 'Checks and promotes all possible waitlist players when tournament is loaded';
