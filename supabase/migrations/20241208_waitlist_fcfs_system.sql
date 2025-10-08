-- =====================================================
-- WAITLIST FCFS (First Come First Served) SYSTEM
-- =====================================================
-- This migration implements a timestamp-based waitlist system
-- where slot numbers are dynamically assigned based on requested_at
-- instead of fixed slot numbering
-- =====================================================

-- Function to reorder ALL slots (main + waitlist) based on requested_at timestamp (FCFS)
CREATE OR REPLACE FUNCTION reorder_all_slots_fcfs(p_tournament_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_slots INTEGER;
    v_all_players RECORD;
    v_new_slot_number INTEGER;
BEGIN
    -- Get tournament total slots
    SELECT total_slots INTO v_total_slots
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    IF v_total_slots IS NULL THEN
        RETURN;
    END IF;
    
    -- Reorder ALL slots based on requested_at (FCFS)
    -- First assign main slots (1 to total_slots), then waitlist slots (total_slots + 1 onwards)
    v_new_slot_number := 1;
    
    -- Update all slots with new slot numbers based on requested_at
    FOR v_all_players IN
        SELECT id, player_id, requested_at, status
        FROM tournament_slots
        WHERE tournament_id = p_tournament_id
          AND player_id IS NOT NULL
          AND status IN ('pending', 'confirmed', 'waitlist')
        ORDER BY requested_at ASC
    LOOP
        -- Determine if this should be a main slot or waitlist slot
        IF v_new_slot_number <= v_total_slots THEN
            -- Main slot
            UPDATE tournament_slots
            SET slot_number = v_new_slot_number,
                status = CASE 
                    WHEN v_all_players.status = 'waitlist' THEN 'pending'
                    ELSE v_all_players.status
                END,
                updated_at = NOW()
            WHERE id = v_all_players.id;
        ELSE
            -- Waitlist slot
            UPDATE tournament_slots
            SET slot_number = v_new_slot_number,
                status = 'waitlist',
                updated_at = NOW()
            WHERE id = v_all_players.id;
        END IF;
        
        v_new_slot_number := v_new_slot_number + 1;
    END LOOP;
    
    RAISE NOTICE 'Reordered all slots (FCFS) for tournament %', p_tournament_id;
END;
$$;

-- Function to get waitlist position based on requested_at
CREATE OR REPLACE FUNCTION get_waitlist_position_fcfs(p_tournament_id UUID, p_player_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_position INTEGER;
    v_total_slots INTEGER;
    v_player_requested_at TIMESTAMPTZ;
BEGIN
    -- Get tournament total slots
    SELECT total_slots INTO v_total_slots
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    -- Get player's requested_at timestamp
    SELECT requested_at INTO v_player_requested_at
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND player_id = p_player_id
      AND slot_number > v_total_slots
      AND status = 'waitlist';
    
    IF v_player_requested_at IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Count players who requested before this player
    SELECT COUNT(*) + 1 INTO v_position
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND slot_number > v_total_slots
      AND player_id IS NOT NULL
      AND status = 'waitlist'
      AND requested_at < v_player_requested_at;
    
    RETURN v_position;
END;
$$;

-- Function to promote next player using FCFS system
CREATE OR REPLACE FUNCTION promote_next_player_fcfs(p_tournament_id UUID)
RETURNS TABLE(success BOOLEAN, promoted_player_id UUID, new_slot_number INTEGER, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_slots INTEGER;
    v_next_player RECORD;
    v_promoted_slot INTEGER;
BEGIN
    -- Get tournament total slots
    SELECT total_slots INTO v_total_slots
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    -- Find the next player in line (earliest requested_at) who is not in a main slot
    SELECT * INTO v_next_player
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND player_id IS NOT NULL
      AND (slot_number > v_total_slots OR status = 'waitlist')
    ORDER BY requested_at ASC
    LIMIT 1;
    
    -- If no player to promote, return failure
    IF v_next_player IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::INTEGER, 'No players to promote';
        RETURN;
    END IF;
    
    -- Count current main slot players
    SELECT COUNT(*) INTO v_promoted_slot
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND slot_number <= v_total_slots
      AND player_id IS NOT NULL;
    
    -- Check if we have space in main slots
    IF v_promoted_slot >= v_total_slots THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::INTEGER, 'No available main slots';
        RETURN;
    END IF;
    
    -- The new slot number is the next available main slot
    v_promoted_slot := v_promoted_slot + 1;
    
    -- Promote the player to main slot
    UPDATE tournament_slots
    SET slot_number = v_promoted_slot,
        status = 'pending',
        updated_at = NOW()
    WHERE id = v_next_player.id;
    
    -- Reorder all remaining slots using FCFS
    PERFORM reorder_all_slots_fcfs(p_tournament_id);
    
    -- Send notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
    ) VALUES (
        v_next_player.player_id,
        'slot_promotion',
        'You have been promoted to a main slot!',
        'You have been promoted to position ' || v_promoted_slot || ' in the tournament. Please wait for host approval.',
        json_build_object(
            'tournament_id', p_tournament_id,
            'new_slot_number', v_promoted_slot,
            'promoted_at', NOW()
        )
    );
    
    RETURN QUERY SELECT 
        TRUE, 
        v_next_player.player_id, 
        v_promoted_slot,
        'Player successfully promoted using FCFS system';
END;
$$;

-- Trigger function to automatically reorder ALL slots when changes occur (FCFS)
CREATE OR REPLACE FUNCTION trigger_reorder_all_slots_fcfs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_tournament_id UUID;
    v_total_slots INTEGER;
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
    
    -- Handle different trigger operations
    IF TG_OP = 'INSERT' THEN
        -- New entry added - reorder all slots
        IF NEW.player_id IS NOT NULL THEN
            PERFORM reorder_all_slots_fcfs(v_tournament_id);
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Entry updated - reorder if player assignment changed
        IF (NEW.player_id IS NOT NULL AND OLD.player_id IS NULL) OR
           (NEW.player_id IS NULL AND OLD.player_id IS NOT NULL) OR
           (NEW.requested_at != OLD.requested_at) THEN
            PERFORM reorder_all_slots_fcfs(v_tournament_id);
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Entry deleted - reorder all slots
        IF OLD.player_id IS NOT NULL THEN
            PERFORM reorder_all_slots_fcfs(v_tournament_id);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for waitlist reordering
DROP TRIGGER IF EXISTS trigger_reorder_waitlist_slots ON tournament_slots;
CREATE TRIGGER trigger_reorder_waitlist_slots
    AFTER INSERT OR UPDATE OR DELETE ON tournament_slots
    FOR EACH ROW
    EXECUTE FUNCTION trigger_reorder_waitlist();

-- Update the existing auto_promote_waitlist trigger to use FCFS system
CREATE OR REPLACE FUNCTION auto_promote_waitlist_fcfs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_tournament_id UUID;
    v_total_slots INTEGER;
    v_promotion_result RECORD;
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
            
            -- Use the new FCFS promotion function
            SELECT * INTO v_promotion_result
            FROM promote_next_waitlist_player_fcfs(v_tournament_id);
            
            IF v_promotion_result.success THEN
                RAISE NOTICE 'Promoted waitlist player % to main slot %', v_promotion_result.promoted_player_id, v_promotion_result.new_slot_number;
            ELSE
                RAISE NOTICE 'No waitlist players to promote: %', v_promotion_result.message;
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update the existing trigger to use the new FCFS function
DROP TRIGGER IF EXISTS trigger_auto_promote_waitlist ON tournament_slots;
CREATE TRIGGER trigger_auto_promote_waitlist
    AFTER DELETE OR UPDATE ON tournament_slots
    FOR EACH ROW
    EXECUTE FUNCTION auto_promote_waitlist_fcfs();

-- Add comments for documentation
COMMENT ON FUNCTION reorder_waitlist_slots(UUID) IS 'Reorders waitlist slots based on requested_at timestamp (FCFS)';
COMMENT ON FUNCTION get_waitlist_position_fcfs(UUID, UUID) IS 'Gets waitlist position based on requested_at timestamp (FCFS)';
COMMENT ON FUNCTION promote_next_waitlist_player_fcfs(UUID) IS 'Promotes next waitlist player based on FCFS ordering';
COMMENT ON FUNCTION trigger_reorder_waitlist() IS 'Trigger function to automatically reorder waitlist slots when changes occur';
COMMENT ON FUNCTION auto_promote_waitlist_fcfs() IS 'Auto-promotion trigger using FCFS waitlist system';
