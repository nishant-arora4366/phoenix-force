-- =====================================================
-- SIMPLIFIED FCFS SYSTEM - NO SLOT NUMBERS
-- =====================================================
-- This migration removes slot_number complexity and implements
-- pure timestamp-based FCFS system
-- =====================================================

-- First, let's remove the slot_number column from tournament_slots
-- (We'll keep it for now but make it nullable and not use it)

-- Remove all the complex triggers and functions we don't need
DROP TRIGGER IF EXISTS trigger_reorder_waitlist_slots ON tournament_slots;
DROP TRIGGER IF EXISTS trigger_auto_promote_waitlist ON tournament_slots;
DROP TRIGGER IF EXISTS trigger_reorder_all_slots_fcfs ON tournament_slots;

-- Drop the complex functions we don't need
DROP FUNCTION IF EXISTS reorder_waitlist_slots(UUID);
DROP FUNCTION IF EXISTS reorder_all_slots_fcfs(UUID);
DROP FUNCTION IF EXISTS trigger_reorder_waitlist();
DROP FUNCTION IF EXISTS trigger_reorder_all_slots_fcfs();
DROP FUNCTION IF EXISTS auto_promote_waitlist_fcfs();

-- Keep only the essential functions for promotion
DROP FUNCTION IF EXISTS promote_next_waitlist_player_fcfs(UUID);
DROP FUNCTION IF EXISTS promote_next_player_fcfs(UUID);

-- Create a simple promotion function that works with timestamps
CREATE OR REPLACE FUNCTION promote_next_player_simple(p_tournament_id UUID)
RETURNS TABLE(success BOOLEAN, promoted_player_id UUID, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_slots INTEGER;
    v_next_player RECORD;
    v_main_slot_count INTEGER;
BEGIN
    -- Get tournament total slots
    SELECT total_slots INTO v_total_slots
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    -- Count current main slot players (non-waitlist)
    SELECT COUNT(*) INTO v_main_slot_count
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND player_id IS NOT NULL
      AND status != 'waitlist';
    
    -- Check if we have space in main slots
    IF v_main_slot_count >= v_total_slots THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'No available main slots';
        RETURN;
    END IF;
    
    -- Find the next player in waitlist (earliest requested_at)
    SELECT * INTO v_next_player
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND player_id IS NOT NULL
      AND status = 'waitlist'
    ORDER BY requested_at ASC
    LIMIT 1;
    
    -- If no waitlist player, return failure
    IF v_next_player IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'No waitlist players found';
        RETURN;
    END IF;
    
    -- Promote the player from waitlist to main slots
    UPDATE tournament_slots
    SET status = 'pending',
        updated_at = NOW()
    WHERE id = v_next_player.id;
    
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
        'You have been promoted from the waitlist. Please wait for host approval.',
        json_build_object(
            'tournament_id', p_tournament_id,
            'promoted_at', NOW()
        )
    );
    
    RETURN QUERY SELECT 
        TRUE, 
        v_next_player.player_id,
        'Player successfully promoted from waitlist';
END;
$$;

-- Simple trigger for auto-promotion when a main slot becomes empty
CREATE OR REPLACE FUNCTION auto_promote_simple()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_tournament_id UUID;
    v_promotion_result RECORD;
BEGIN
    -- Get tournament info
    v_tournament_id := COALESCE(NEW.tournament_id, OLD.tournament_id);
    
    -- Check if a main slot became empty (player_id set to NULL or status changed to waitlist)
    IF (TG_OP = 'UPDATE' AND OLD.player_id IS NOT NULL AND NEW.player_id IS NULL) OR
       (TG_OP = 'DELETE' AND OLD.player_id IS NOT NULL) OR
       (TG_OP = 'UPDATE' AND OLD.status != 'waitlist' AND NEW.status = 'waitlist') THEN
        
        -- Try to promote next waitlist player
        SELECT * INTO v_promotion_result
        FROM promote_next_player_simple(v_tournament_id);
        
        IF v_promotion_result.success THEN
            RAISE NOTICE 'Auto-promoted player % from waitlist', v_promotion_result.promoted_player_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create simple auto-promotion trigger
CREATE TRIGGER trigger_auto_promote_simple
    AFTER DELETE OR UPDATE ON tournament_slots
    FOR EACH ROW
    EXECUTE FUNCTION auto_promote_simple();

-- Add comments
COMMENT ON FUNCTION promote_next_player_simple(UUID) IS 'Simple promotion function using timestamp-based FCFS';
COMMENT ON FUNCTION auto_promote_simple() IS 'Simple auto-promotion trigger using timestamp-based FCFS';
