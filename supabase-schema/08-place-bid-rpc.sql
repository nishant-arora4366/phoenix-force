-- Place Bid RPC Function
-- Atomic bid validation and placement function for auction system

-- ==============================================
-- 1. PLACE_BID RPC FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION public.place_bid(
    p_tournament_id UUID,
    p_player_id UUID,
    p_team_id UUID,
    p_bid_amount DECIMAL(10,2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bidder_user_id UUID;
    v_current_winning_bid DECIMAL(10,2);
    v_min_increment DECIMAL(10,2);
    v_tournament_status VARCHAR(30);
    v_is_captain BOOLEAN;
    v_team_budget DECIMAL(10,2);
    v_bid_id UUID;
    v_result JSON;
BEGIN
    -- Get the authenticated user
    v_bidder_user_id := auth.uid();
    
    -- Validate user is authenticated
    IF v_bidder_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;
    
    -- Check if user is captain of the team
    SELECT captain_user_id = v_bidder_user_id, budget_remaining
    INTO v_is_captain, v_team_budget
    FROM public.teams
    WHERE id = p_team_id;
    
    IF NOT v_is_captain THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Only team captains can place bids'
        );
    END IF;
    
    -- Check tournament status
    SELECT status, min_increment
    INTO v_tournament_status, v_min_increment
    FROM public.tournaments
    WHERE id = p_tournament_id;
    
    IF v_tournament_status != 'auction_started' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Auction is not active'
        );
    END IF;
    
    -- Get current winning bid for this player
    SELECT COALESCE(MAX(bid_amount), 0)
    INTO v_current_winning_bid
    FROM public.auction_bids
    WHERE tournament_id = p_tournament_id 
    AND player_id = p_player_id 
    AND is_winning_bid = true;
    
    -- Validate bid amount
    IF p_bid_amount <= v_current_winning_bid THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bid amount must be higher than current winning bid',
            'current_bid', v_current_winning_bid
        );
    END IF;
    
    -- Check minimum increment
    IF v_min_increment IS NOT NULL AND p_bid_amount < (v_current_winning_bid + v_min_increment) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bid must be at least ' || v_min_increment || ' higher than current bid',
            'required_amount', v_current_winning_bid + v_min_increment
        );
    END IF;
    
    -- Check team budget
    IF p_bid_amount > v_team_budget THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bid exceeds team budget',
            'available_budget', v_team_budget
        );
    END IF;
    
    -- Start transaction for atomic operations
    BEGIN
        -- Mark all previous bids for this player as not winning
        UPDATE public.auction_bids
        SET is_winning_bid = false
        WHERE tournament_id = p_tournament_id 
        AND player_id = p_player_id;
        
        -- Insert new bid
        INSERT INTO public.auction_bids (
            tournament_id,
            player_id,
            team_id,
            bid_amount,
            bidder_user_id,
            is_winning_bid
        ) VALUES (
            p_tournament_id,
            p_player_id,
            p_team_id,
            p_bid_amount,
            v_bidder_user_id,
            true
        ) RETURNING id INTO v_bid_id;
        
        -- Update team budget
        UPDATE public.teams
        SET budget_remaining = budget_remaining - p_bid_amount
        WHERE id = p_team_id;
        
        -- Return success
        RETURN json_build_object(
            'success', true,
            'bid_id', v_bid_id,
            'bid_amount', p_bid_amount,
            'team_budget_remaining', v_team_budget - p_bid_amount,
            'message', 'Bid placed successfully'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback on any error
            RETURN json_build_object(
                'success', false,
                'error', 'Database error: ' || SQLERRM
            );
    END;
END;
$$;

-- ==============================================
-- 2. GET_AUCTION_STATUS RPC FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION public.get_auction_status(
    p_tournament_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tournament_status VARCHAR(30);
    v_active_bids JSON;
    v_teams JSON;
    v_result JSON;
BEGIN
    -- Get tournament status
    SELECT status INTO v_tournament_status
    FROM public.tournaments
    WHERE id = p_tournament_id;
    
    -- Get active bids
    SELECT json_agg(
        json_build_object(
            'player_id', player_id,
            'team_id', team_id,
            'bid_amount', bid_amount,
            'bidder_user_id', bidder_user_id,
            'is_winning_bid', is_winning_bid,
            'created_at', created_at
        )
    ) INTO v_active_bids
    FROM public.auction_bids
    WHERE tournament_id = p_tournament_id
    AND is_winning_bid = true;
    
    -- Get teams
    SELECT json_agg(
        json_build_object(
            'team_id', id,
            'name', name,
            'captain_user_id', captain_user_id,
            'budget_remaining', budget_remaining
        )
    ) INTO v_teams
    FROM public.teams
    WHERE tournament_id = p_tournament_id;
    
    -- Build result
    v_result := json_build_object(
        'tournament_id', p_tournament_id,
        'status', v_tournament_status,
        'active_bids', COALESCE(v_active_bids, '[]'::json),
        'teams', COALESCE(v_teams, '[]'::json)
    );
    
    RETURN v_result;
END;
$$;

-- ==============================================
-- 3. GRANT PERMISSIONS
-- ==============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.place_bid(UUID, UUID, UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auction_status(UUID) TO authenticated;

-- ==============================================
-- 4. SUCCESS MESSAGE
-- ==============================================

SELECT 'Place bid RPC functions created successfully!' as message;
