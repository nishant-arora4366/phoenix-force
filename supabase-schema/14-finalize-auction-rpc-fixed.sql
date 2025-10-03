-- Finalize Auction RPC with Transaction Handling (Fixed Version)
-- This script creates a comprehensive auction finalization process

-- ==============================================
-- 1. FINALIZE AUCTION RPC
-- ==============================================

CREATE OR REPLACE FUNCTION finalize_auction(
    p_tournament_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_tournament RECORD;
    v_winning_bids JSON;
    v_team_budget_updates JSON;
    v_finalized_count INTEGER := 0;
    v_total_budget_deducted DECIMAL(10,2) := 0;
    v_result JSON;
    v_bid JSON;
    v_team RECORD;
    v_existing_allocation RECORD;
    v_bid_record RECORD;
BEGIN
    -- Start transaction
    BEGIN
        -- Validate tournament exists and is in correct status
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
        
        -- Check if tournament is in auction_started status
        IF v_tournament.status != 'auction_started' THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Tournament is not in auction_started status',
                'current_status', v_tournament.status,
                'tournament_id', p_tournament_id
            );
        END IF;
        
        -- Check if user has permission to finalize auction
        -- Only tournament host or admin can finalize
        IF NOT EXISTS (
            SELECT 1 FROM users 
            WHERE id = p_user_id 
            AND (role = 'admin' OR id = v_tournament.host_id)
        ) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Insufficient permissions to finalize auction',
                'user_id', p_user_id
            );
        END IF;
        
        -- Get all winning bids (highest bid per player) using a simpler approach
        WITH winning_bids AS (
            SELECT DISTINCT ON (ab.player_id)
                ab.id as bid_id,
                ab.tournament_id,
                ab.player_id,
                ab.team_id,
                ab.bid_amount,
                ab.bidder_user_id,
                ab.created_at,
                t.name as team_name,
                t.budget_remaining,
                p.display_name as player_name
            FROM auction_bids ab
            JOIN teams t ON ab.team_id = t.id
            JOIN players p ON ab.player_id = p.id
            WHERE ab.tournament_id = p_tournament_id
            ORDER BY ab.player_id, ab.bid_amount DESC, ab.created_at ASC
        )
        SELECT COALESCE(
            json_agg(
                json_build_object(
                    'bid_id', bid_id,
                    'tournament_id', tournament_id,
                    'player_id', player_id,
                    'team_id', team_id,
                    'bid_amount', bid_amount,
                    'bidder_user_id', bidder_user_id,
                    'team_name', team_name,
                    'budget_remaining', budget_remaining,
                    'player_name', player_name,
                    'created_at', created_at
                )
            ), 
            '[]'::json
        ) INTO v_winning_bids
        FROM winning_bids;
        
        -- Check if there are any winning bids
        IF v_winning_bids IS NULL OR json_array_length(v_winning_bids) = 0 THEN
            RETURN json_build_object(
                'success', false,
                'error', 'No winning bids found for this tournament',
                'tournament_id', p_tournament_id
            );
        END IF;
        
        -- Validate that all teams have sufficient budget for their winning bids
        FOR v_bid_record IN 
            SELECT * FROM json_to_recordset(v_winning_bids) AS x(
                bid_id UUID,
                tournament_id UUID,
                player_id UUID,
                team_id UUID,
                bid_amount DECIMAL,
                bidder_user_id UUID,
                team_name TEXT,
                budget_remaining DECIMAL,
                player_name TEXT,
                created_at TIMESTAMPTZ
            )
        LOOP
            -- Check if team has sufficient budget
            IF v_bid_record.budget_remaining IS NULL OR 
               v_bid_record.budget_remaining < v_bid_record.bid_amount THEN
                RETURN json_build_object(
                    'success', false,
                    'error', 'Insufficient budget for team allocation',
                    'team_id', v_bid_record.team_id,
                    'team_name', v_bid_record.team_name,
                    'required_amount', v_bid_record.bid_amount,
                    'available_budget', v_bid_record.budget_remaining
                );
            END IF;
        END LOOP;
        
        -- Clear existing team_players allocations for this tournament
        DELETE FROM team_players 
        WHERE team_id IN (
            SELECT id FROM teams WHERE tournament_id = p_tournament_id
        );
        
        -- Process each winning bid
        FOR v_bid_record IN 
            SELECT * FROM json_to_recordset(v_winning_bids) AS x(
                bid_id UUID,
                tournament_id UUID,
                player_id UUID,
                team_id UUID,
                bid_amount DECIMAL,
                bidder_user_id UUID,
                team_name TEXT,
                budget_remaining DECIMAL,
                player_name TEXT,
                created_at TIMESTAMPTZ
            )
        LOOP
            -- Insert into team_players (final allocation)
            INSERT INTO team_players (
                team_id,
                player_id,
                final_bid_amount,
                created_at
            ) VALUES (
                v_bid_record.team_id,
                v_bid_record.player_id,
                v_bid_record.bid_amount,
                NOW()
            );
            
            -- Update team budget
            UPDATE teams 
            SET 
                budget_remaining = budget_remaining - v_bid_record.bid_amount,
                updated_at = NOW()
            WHERE id = v_bid_record.team_id;
            
            -- Update auction_bids to mark as winning
            UPDATE auction_bids 
            SET is_winning_bid = TRUE
            WHERE id = v_bid_record.bid_id;
            
            v_finalized_count := v_finalized_count + 1;
            v_total_budget_deducted := v_total_budget_deducted + v_bid_record.bid_amount;
        END LOOP;
        
        -- Update tournament status to auction_completed
        UPDATE tournaments 
        SET 
            status = 'auction_completed',
            updated_at = NOW()
        WHERE id = p_tournament_id;
        
        -- Get final team budget summary
        SELECT COALESCE(
            json_agg(
                json_build_object(
                    'team_id', t.id,
                    'team_name', t.name,
                    'initial_budget', t.initial_budget,
                    'budget_remaining', t.budget_remaining,
                    'total_spent', t.initial_budget - t.budget_remaining,
                    'players_count', (
                        SELECT COUNT(*) 
                        FROM team_players tp 
                        WHERE tp.team_id = t.id
                    )
                )
            ),
            '[]'::json
        ) INTO v_team_budget_updates
        FROM teams t
        WHERE t.tournament_id = p_tournament_id;
        
        -- Return comprehensive results
        RETURN json_build_object(
            'success', true,
            'message', 'Auction finalized successfully',
            'tournament_id', p_tournament_id,
            'tournament_name', v_tournament.name,
            'finalized_players', v_finalized_count,
            'total_budget_deducted', v_total_budget_deducted,
            'winning_bids', v_winning_bids,
            'team_summaries', v_team_budget_updates,
            'finalized_at', NOW()
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback on any error
            RETURN json_build_object(
                'success', false,
                'error', 'Failed to finalize auction: ' || SQLERRM,
                'tournament_id', p_tournament_id,
                'details', SQLSTATE
            );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 2. GET AUCTION RESULTS RPC
-- ==============================================

CREATE OR REPLACE FUNCTION get_auction_results(p_tournament_id UUID)
RETURNS JSON AS $$
DECLARE
    v_tournament RECORD;
    v_results JSON;
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
    
    -- Get final auction results
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'team_id', t.id,
                'team_name', t.name,
                'captain_name', p.display_name,
                'initial_budget', t.initial_budget,
                'budget_remaining', t.budget_remaining,
                'total_spent', t.initial_budget - t.budget_remaining,
                'players', (
                    SELECT COALESCE(
                        json_agg(
                            json_build_object(
                                'player_id', tp.player_id,
                                'player_name', pl.display_name,
                                'final_bid_amount', tp.final_bid_amount,
                                'allocated_at', tp.created_at
                            )
                        ),
                        '[]'::json
                    )
                    FROM team_players tp
                    JOIN players pl ON tp.player_id = pl.id
                    WHERE tp.team_id = t.id
                )
            )
        ),
        '[]'::json
    ) INTO v_results
    FROM teams t
    LEFT JOIN players p ON t.captain_id = p.id
    WHERE t.tournament_id = p_tournament_id;
    
    RETURN json_build_object(
        'success', true,
        'tournament_id', p_tournament_id,
        'tournament_name', v_tournament.name,
        'tournament_status', v_tournament.status,
        'results', v_results,
        'total_teams', COALESCE(json_array_length(v_results), 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 3. RESET AUCTION RPC (for testing/admin use)
-- ==============================================

CREATE OR REPLACE FUNCTION reset_auction(
    p_tournament_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_tournament RECORD;
    v_reset_count INTEGER := 0;
BEGIN
    -- Validate tournament exists
    SELECT * INTO v_tournament 
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Tournament not found'
        );
    END IF;
    
    -- Check if user has permission (admin or host)
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id 
        AND (role = 'admin' OR id = v_tournament.host_id)
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions to reset auction'
        );
    END IF;
    
    -- Reset tournament status
    UPDATE tournaments 
    SET 
        status = 'auction_started',
        updated_at = NOW()
    WHERE id = p_tournament_id;
    
    -- Clear team_players allocations
    DELETE FROM team_players 
    WHERE team_id IN (
        SELECT id FROM teams WHERE tournament_id = p_tournament_id
    );
    
    -- Reset team budgets
    UPDATE teams 
    SET 
        budget_remaining = initial_budget,
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id;
    
    -- Clear winning bid flags
    UPDATE auction_bids 
    SET is_winning_bid = FALSE
    WHERE tournament_id = p_tournament_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Auction reset successfully',
        'tournament_id', p_tournament_id,
        'reset_at', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to reset auction: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
