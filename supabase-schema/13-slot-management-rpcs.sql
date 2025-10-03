-- Slot Management RPCs with Transaction Handling
-- This script creates atomic RPCs for slot reservation, confirmation, and player registration

-- ==============================================
-- 1. RESERVE SLOT RPC
-- ==============================================

CREATE OR REPLACE FUNCTION reserve_slot(
    p_tournament_id UUID,
    p_player_id UUID,
    p_slot_number INTEGER DEFAULT NULL,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_tournament RECORD;
    v_slot RECORD;
    v_available_slot RECORD;
    v_result JSON;
    v_slot_id UUID;
BEGIN
    -- Start transaction
    BEGIN
        -- Validate tournament exists and is in registration phase
        SELECT * INTO v_tournament 
        FROM tournaments 
        WHERE id = p_tournament_id 
        AND status IN ('registration_open', 'registration_closed');
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Tournament not found or not accepting registrations',
                'tournament_id', p_tournament_id
            );
        END IF;
        
        -- Check if player is already registered in this tournament
        IF EXISTS (
            SELECT 1 FROM tournament_slots 
            WHERE tournament_id = p_tournament_id 
            AND player_id = p_player_id 
            AND status IN ('pending', 'confirmed')
        ) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Player is already registered in this tournament',
                'player_id', p_player_id
            );
        END IF;
        
        -- If specific slot number provided, check if it's available
        IF p_slot_number IS NOT NULL THEN
            SELECT * INTO v_slot 
            FROM tournament_slots 
            WHERE tournament_id = p_tournament_id 
            AND slot_number = p_slot_number;
            
            IF FOUND AND v_slot.status != 'empty' THEN
                RETURN json_build_object(
                    'success', false,
                    'error', 'Requested slot is not available',
                    'slot_number', p_slot_number,
                    'current_status', v_slot.status
                );
            END IF;
            
            -- Reserve the specific slot
            IF FOUND THEN
                UPDATE tournament_slots 
                SET 
                    player_id = p_player_id,
                    status = 'pending',
                    requested_at = NOW()
                WHERE tournament_id = p_tournament_id 
                AND slot_number = p_slot_number
                RETURNING id INTO v_slot_id;
            ELSE
                -- Create new slot if it doesn't exist
                INSERT INTO tournament_slots (
                    tournament_id, slot_number, player_id, status, requested_at
                ) VALUES (
                    p_tournament_id, p_slot_number, p_player_id, 'pending', NOW()
                ) RETURNING id INTO v_slot_id;
            END IF;
        ELSE
            -- Find first available slot
            SELECT * INTO v_available_slot
            FROM tournament_slots 
            WHERE tournament_id = p_tournament_id 
            AND status = 'empty'
            ORDER BY slot_number
            LIMIT 1
            FOR UPDATE; -- Lock the row to prevent race conditions
            
            IF FOUND THEN
                -- Reserve the first available slot
                UPDATE tournament_slots 
                SET 
                    player_id = p_player_id,
                    status = 'pending',
                    requested_at = NOW()
                WHERE id = v_available_slot.id
                RETURNING id INTO v_slot_id;
            ELSE
                -- Check if we can create a new slot
                IF (SELECT COUNT(*) FROM tournament_slots WHERE tournament_id = p_tournament_id) < v_tournament.total_slots THEN
                    -- Create new slot
                    INSERT INTO tournament_slots (
                        tournament_id, 
                        slot_number, 
                        player_id, 
                        status, 
                        requested_at
                    ) VALUES (
                        p_tournament_id, 
                        (SELECT COALESCE(MAX(slot_number), 0) + 1 FROM tournament_slots WHERE tournament_id = p_tournament_id),
                        p_player_id, 
                        'pending', 
                        NOW()
                    ) RETURNING id INTO v_slot_id;
                ELSE
                    -- Tournament is full, add to waitlist
                    INSERT INTO waitlist (tournament_id, player_id, position)
                    VALUES (
                        p_tournament_id, 
                        p_player_id, 
                        (SELECT COALESCE(MAX(position), 0) + 1 FROM waitlist WHERE tournament_id = p_tournament_id)
                    );
                    
                    RETURN json_build_object(
                        'success', true,
                        'message', 'Tournament is full. Player added to waitlist.',
                        'tournament_id', p_tournament_id,
                        'player_id', p_player_id,
                        'waitlist_position', (SELECT MAX(position) FROM waitlist WHERE tournament_id = p_tournament_id)
                    );
                END IF;
            END IF;
        END IF;
        
        -- Return success with slot details
        RETURN json_build_object(
            'success', true,
            'message', 'Slot reserved successfully',
            'tournament_id', p_tournament_id,
            'player_id', p_player_id,
            'slot_id', v_slot_id,
            'slot_number', p_slot_number,
            'status', 'pending'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback on any error
            RETURN json_build_object(
                'success', false,
                'error', 'Failed to reserve slot: ' || SQLERRM,
                'tournament_id', p_tournament_id,
                'player_id', p_player_id
            );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 2. CONFIRM SLOT RPC
-- ==============================================

CREATE OR REPLACE FUNCTION confirm_slot(
    p_tournament_id UUID,
    p_slot_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_tournament RECORD;
    v_slot RECORD;
    v_result JSON;
BEGIN
    -- Start transaction
    BEGIN
        -- Validate tournament exists and is in correct phase
        SELECT * INTO v_tournament 
        FROM tournaments 
        WHERE id = p_tournament_id;
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Tournament not found',
                'tournament_id', p_tournament_id
            );
        END IF;
        
        -- Get slot details
        SELECT * INTO v_slot 
        FROM tournament_slots 
        WHERE id = p_slot_id 
        AND tournament_id = p_tournament_id;
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Slot not found',
                'slot_id', p_slot_id
            );
        END IF;
        
        -- Check if slot is in pending status
        IF v_slot.status != 'pending' THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Slot is not in pending status',
                'current_status', v_slot.status
            );
        END IF;
        
        -- Confirm the slot
        UPDATE tournament_slots 
        SET 
            status = 'confirmed',
            confirmed_at = NOW()
        WHERE id = p_slot_id;
        
        -- Return success
        RETURN json_build_object(
            'success', true,
            'message', 'Slot confirmed successfully',
            'tournament_id', p_tournament_id,
            'slot_id', p_slot_id,
            'player_id', v_slot.player_id,
            'slot_number', v_slot.slot_number,
            'status', 'confirmed'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Failed to confirm slot: ' || SQLERRM,
                'tournament_id', p_tournament_id,
                'slot_id', p_slot_id
            );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 3. REGISTER PLAYER RPC
-- ==============================================

CREATE OR REPLACE FUNCTION register_player(
    p_tournament_id UUID,
    p_player_id UUID,
    p_preferred_slot INTEGER DEFAULT NULL,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_tournament RECORD;
    v_player RECORD;
    v_result JSON;
    v_slot_id UUID;
BEGIN
    -- Start transaction
    BEGIN
        -- Validate tournament exists and is accepting registrations
        SELECT * INTO v_tournament 
        FROM tournaments 
        WHERE id = p_tournament_id 
        AND status = 'registration_open';
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Tournament not found or not accepting registrations',
                'tournament_id', p_tournament_id
            );
        END IF;
        
        -- Validate player exists
        SELECT * INTO v_player 
        FROM players 
        WHERE id = p_player_id;
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Player not found',
                'player_id', p_player_id
            );
        END IF;
        
        -- Check if player is already registered
        IF EXISTS (
            SELECT 1 FROM tournament_slots 
            WHERE tournament_id = p_tournament_id 
            AND player_id = p_player_id
        ) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Player is already registered in this tournament',
                'player_id', p_player_id
            );
        END IF;
        
        -- Use reserve_slot function to handle the registration
        SELECT reserve_slot(p_tournament_id, p_player_id, p_preferred_slot, p_user_id) INTO v_result;
        
        -- Return the result from reserve_slot
        RETURN v_result;
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Failed to register player: ' || SQLERRM,
                'tournament_id', p_tournament_id,
                'player_id', p_player_id
            );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 4. ADDITIONAL UTILITY RPCs
-- ==============================================

-- Get tournament registration status
CREATE OR REPLACE FUNCTION get_tournament_status(p_tournament_id UUID)
RETURNS JSON AS $$
DECLARE
    v_tournament RECORD;
    v_slots_count INTEGER;
    v_confirmed_count INTEGER;
    v_pending_count INTEGER;
    v_waitlist_count INTEGER;
BEGIN
    -- Get tournament details
    SELECT * INTO v_tournament 
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Tournament not found'
        );
    END IF;
    
    -- Count slots by status
    SELECT 
        COUNT(*) as total_slots,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_slots,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_slots
    INTO v_slots_count, v_confirmed_count, v_pending_count
    FROM tournament_slots 
    WHERE tournament_id = p_tournament_id;
    
    -- Count waitlist
    SELECT COUNT(*) INTO v_waitlist_count
    FROM waitlist 
    WHERE tournament_id = p_tournament_id;
    
    RETURN json_build_object(
        'success', true,
        'tournament_id', p_tournament_id,
        'tournament_name', v_tournament.name,
        'status', v_tournament.status,
        'total_slots', v_tournament.total_slots,
        'filled_slots', v_slots_count,
        'confirmed_slots', v_confirmed_count,
        'pending_slots', v_pending_count,
        'available_slots', v_tournament.total_slots - v_slots_count,
        'waitlist_count', v_waitlist_count,
        'is_full', v_slots_count >= v_tournament.total_slots
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cancel slot reservation
CREATE OR REPLACE FUNCTION cancel_slot_reservation(
    p_tournament_id UUID,
    p_slot_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_slot RECORD;
BEGIN
    -- Get slot details
    SELECT * INTO v_slot 
    FROM tournament_slots 
    WHERE id = p_slot_id 
    AND tournament_id = p_tournament_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Slot not found'
        );
    END IF;
    
    -- Check if slot can be cancelled (only pending slots)
    IF v_slot.status != 'pending' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Only pending slots can be cancelled',
            'current_status', v_slot.status
        );
    END IF;
    
    -- Cancel the slot
    UPDATE tournament_slots 
    SET 
        player_id = NULL,
        status = 'empty',
        requested_at = NULL
    WHERE id = p_slot_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Slot reservation cancelled',
        'slot_id', p_slot_id,
        'tournament_id', p_tournament_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to cancel slot: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
