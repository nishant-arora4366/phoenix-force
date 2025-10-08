-- =====================================================
-- PHOENIX FORCE CRICKET - LIVE DATABASE FUNCTIONS
-- =====================================================
-- This file contains ALL database functions extracted from the LIVE database
-- Generated on: $(date)
-- Source: Live Supabase database (ydhwhnwuzbjzsfhixsou)
-- Total Functions: 29
-- 
-- Usage: Run this script to recreate all functions on a new database
-- =====================================================

-- =====================================================
-- EXTRACTED FUNCTIONS FROM LIVE DATABASE
-- =====================================================

CREATE OR REPLACE FUNCTION "public"."auto_promote_waitlist"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."auto_promote_waitlist"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_promote_waitlist"() IS 'Automatically promotes the first waitlist player when a main slot becomes available';



CREATE OR REPLACE FUNCTION "public"."cancel_slot_reservation"("p_tournament_id" "uuid", "p_slot_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."cancel_slot_reservation"("p_tournament_id" "uuid", "p_slot_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_promote_waitlist"("p_tournament_id" "uuid") RETURNS TABLE("promoted_count" integer, "success" boolean)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."check_and_promote_waitlist"("p_tournament_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_and_promote_waitlist"("p_tournament_id" "uuid") IS 'Checks and promotes all possible waitlist players when tournament is loaded';



CREATE OR REPLACE FUNCTION "public"."confirm_slot"("p_tournament_id" "uuid", "p_slot_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."confirm_slot"("p_tournament_id" "uuid", "p_slot_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finalize_auction"("p_tournament_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."finalize_auction"("p_tournament_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_and_promote_waitlist"("p_tournament_id" "uuid") RETURNS TABLE("success" boolean, "promoted_player_id" "uuid", "new_slot_number" integer, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."find_and_promote_waitlist"("p_tournament_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_username_from_email"("email" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN LOWER(SPLIT_PART(email, '@', 1));
END;
$$;


ALTER FUNCTION "public"."generate_username_from_email"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auction_results"("p_tournament_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_auction_results"("p_tournament_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auction_status"("p_tournament_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_auction_status"("p_tournament_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_available_main_slot"("p_tournament_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_next_available_main_slot"("p_tournament_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_next_available_main_slot"("p_tournament_id" "uuid") IS 'Returns the next available main slot number for a tournament';



CREATE OR REPLACE FUNCTION "public"."get_recommended_slots"("tournament_format" character varying) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  CASE tournament_format
    WHEN 'Bilateral' THEN RETURN 22; -- 11 players per team * 2 teams
    WHEN 'TriSeries' THEN RETURN 33; -- 11 players per team * 3 teams
    WHEN 'Quad' THEN RETURN 44; -- 11 players per team * 4 teams
    WHEN '6 Team' THEN RETURN 66; -- 11 players per team * 6 teams
    WHEN '8 Team' THEN RETURN 88; -- 11 players per team * 8 teams
    WHEN '10 Team' THEN RETURN 110; -- 11 players per team * 10 teams
    WHEN '12 Team' THEN RETURN 132; -- 11 players per team * 12 teams
    WHEN '16 Team' THEN RETURN 176; -- 11 players per team * 16 teams
    WHEN '20 Team' THEN RETURN 220; -- 11 players per team * 20 teams
    WHEN '24 Team' THEN RETURN 264; -- 11 players per team * 24 teams
    WHEN '32 Team' THEN RETURN 352; -- 11 players per team * 32 teams
    ELSE RETURN 88; -- Default to 8 teams worth of slots
  END CASE;
END;
$$;


ALTER FUNCTION "public"."get_recommended_slots"("tournament_format" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recommended_teams"("tournament_format" character varying) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  CASE tournament_format
    WHEN 'Bilateral' THEN RETURN 2;
    WHEN 'TriSeries' THEN RETURN 3;
    WHEN 'Quad' THEN RETURN 4;
    WHEN '6 Team' THEN RETURN 6;
    WHEN '8 Team' THEN RETURN 8;
    WHEN '10 Team' THEN RETURN 10;
    WHEN '12 Team' THEN RETURN 12;
    WHEN '16 Team' THEN RETURN 16;
    WHEN '20 Team' THEN RETURN 20;
    WHEN '24 Team' THEN RETURN 24;
    WHEN '32 Team' THEN RETURN 32;
    ELSE RETURN 8; -- Default to 8 teams
  END CASE;
END;
$$;


ALTER FUNCTION "public"."get_recommended_teams"("tournament_format" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tournament_status"("p_tournament_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_tournament_status"("p_tournament_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "role" character varying(20) DEFAULT 'viewer'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "username" character varying(50),
    "firstname" character varying(100) DEFAULT ''::character varying NOT NULL,
    "middlename" character varying(100),
    "lastname" character varying(100) DEFAULT ''::character varying NOT NULL,
    "photo" "text",
    "password_hash" character varying(255),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    CONSTRAINT "users_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['viewer'::character varying, 'host'::character varying, 'captain'::character varying, 'admin'::character varying])::"text"[]))),
    CONSTRAINT "users_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_display_name"("user_record" "public"."users") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF user_record.username IS NOT NULL AND user_record.username != '' THEN
    RETURN user_record.username;
  ELSE
    RETURN get_user_full_name(user_record);
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_user_display_name"("user_record" "public"."users") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_full_name"("user_record" "public"."users") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN CONCAT_WS(' ', 
    user_record.firstname,
    COALESCE(user_record.middlename, ''),
    user_record.lastname
  );
END;
$$;


ALTER FUNCTION "public"."get_user_full_name"("user_record" "public"."users") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_waitlist_position"("p_tournament_id" "uuid", "p_player_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_waitlist_position"("p_tournament_id" "uuid", "p_player_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_waitlist_position"("p_tournament_id" "uuid", "p_player_id" "uuid") IS 'Returns the position of a player in the waitlist (1-based)';



CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_team_captain"("team_id" "uuid", "user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teams 
    WHERE id = team_id AND captain_user_id = user_id
  );
END;
$$;


ALTER FUNCTION "public"."is_team_captain"("team_id" "uuid", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_tournament_host"("tournament_id" "uuid", "user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tournaments 
    WHERE id = tournament_id AND host_id = user_id
  );
END;
$$;


ALTER FUNCTION "public"."is_tournament_host"("tournament_id" "uuid", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."manual_promote_waitlist"("p_tournament_id" "uuid") RETURNS TABLE("promoted_player_id" "uuid", "new_slot_number" integer, "success" boolean)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."manual_promote_waitlist"("p_tournament_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE notifications
    SET read_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND read_at IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE notifications
    SET read_at = NOW(),
        updated_at = NOW()
    WHERE id = p_notification_id
      AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."place_bid"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_team_id" "uuid", "p_bid_amount" numeric) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."place_bid"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_team_id" "uuid", "p_bid_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_player"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_preferred_slot" integer DEFAULT NULL::integer, "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."register_player"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_preferred_slot" integer, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_slot"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_slot_number" integer DEFAULT NULL::integer, "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."reserve_slot"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_slot_number" integer, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_auction"("p_tournament_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."reset_auction"("p_tournament_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_promote_waitlist_player"("p_tournament_id" "uuid", "p_waitlist_slot_id" "uuid", "p_main_slot_id" "uuid") RETURNS TABLE("success" boolean, "promoted_player_id" "uuid", "new_slot_number" integer, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."safe_promote_waitlist_player"("p_tournament_id" "uuid", "p_waitlist_slot_id" "uuid", "p_main_slot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert or update user in public.users
  INSERT INTO public.users (
    id,
    email,
    username,
    firstname,
    middlename,
    lastname,
    photo,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', generate_username_from_email(NEW.email)),
    COALESCE(NEW.raw_user_meta_data->>'firstname', ''),
    NEW.raw_user_meta_data->>'middlename',
    COALESCE(NEW.raw_user_meta_data->>'lastname', ''),
    NEW.raw_user_meta_data->>'photo',
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, users.username),
    firstname = COALESCE(EXCLUDED.firstname, users.firstname),
    middlename = COALESCE(EXCLUDED.middlename, users.middlename),
    lastname = COALESCE(EXCLUDED.lastname, users.lastname),
    photo = COALESCE(EXCLUDED.photo, users.photo),
    role = COALESCE(EXCLUDED.role, users.role),
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_tournament_data"("p_format" character varying, "p_selected_teams" integer, "p_total_slots" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if format is valid
  IF p_format NOT IN ('Bilateral', 'TriSeries', 'Quad', '6 Team', '8 Team', '10 Team', '12 Team', '16 Team', '20 Team', '24 Team', '32 Team') THEN
    RETURN FALSE;
  END IF;
  
  -- Check if selected teams matches format
  IF p_selected_teams != get_recommended_teams(p_format) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if total slots matches format
  IF p_total_slots != get_recommended_slots(p_format) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."validate_tournament_data"("p_format" character varying, "p_selected_teams" integer, "p_total_slots" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auction_bids" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid",
    "player_id" "uuid",
    "team_id" "uuid",
    "bid_amount" numeric(10,2) NOT NULL,
    "bidder_user_id" "uuid",
    "is_winning_bid" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auction_bids" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auction_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid",
    "player_order" "jsonb",
    "is_captain_bidding" boolean DEFAULT false,
    "auction_mode" character varying(20),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "auction_config_auction_mode_check" CHECK ((("auction_mode")::"text" = ANY ((ARRAY['host_controlled'::character varying, 'captain_bidding'::character varying])::"text"[])))
);


ALTER TABLE "public"."auction_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "data" "jsonb",
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'User notifications for real-time updates';



COMMENT ON COLUMN "public"."notifications"."type" IS 'Type of notification (waitlist_promotion, slot_approved, etc.)';



COMMENT ON COLUMN "public"."notifications"."data" IS 'Additional data for the notification';



COMMENT ON COLUMN "public"."notifications"."read_at" IS 'When the notification was read (NULL if unread)';



CREATE TABLE IF NOT EXISTS "public"."player_skill_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid",
    "skill_id" "uuid",
    "skill_value_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "value_array" "text"[],
    "skill_value_ids" "uuid"[],
    CONSTRAINT "player_skill_assignments_value_check" CHECK ((("skill_value_id" IS NOT NULL) OR ("skill_value_ids" IS NOT NULL)))
);


ALTER TABLE "public"."player_skill_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_skill_values" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "skill_id" "uuid",
    "value_name" character varying(100) NOT NULL,
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."player_skill_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "skill_name" character varying(100) NOT NULL,
    "skill_type" character varying(50) NOT NULL,
    "is_required" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_admin_managed" boolean DEFAULT false,
    "viewer_can_see" boolean DEFAULT true
);


ALTER TABLE "public"."player_skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_tags" (
    "player_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."player_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "display_name" character varying(255) NOT NULL,
    "bio" "text",
    "profile_pic_url" "text",
    "mobile_number" character varying(20),
    "cricheroes_profile_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    CONSTRAINT "players_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid",
    "player_id" "uuid",
    "final_bid_amount" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid",
    "name" character varying(255) NOT NULL,
    "captain_id" "uuid",
    "captain_user_id" "uuid",
    "initial_budget" numeric(10,2),
    "budget_remaining" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tournaments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "host_id" "uuid",
    "host_player_id" "uuid",
    "status" character varying(30) DEFAULT 'draft'::character varying,
    "total_slots" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "format" character varying(50) NOT NULL,
    "selected_teams" integer NOT NULL,
    "tournament_date" "date",
    "description" "text",
    CONSTRAINT "tournaments_format_check" CHECK ((("format")::"text" = ANY ((ARRAY['Bilateral'::character varying, 'TriSeries'::character varying, 'Quad'::character varying, '6 Team'::character varying, '8 Team'::character varying, '10 Team'::character varying, '12 Team'::character varying, '16 Team'::character varying, '20 Team'::character varying, '24 Team'::character varying, '32 Team'::character varying])::"text"[]))),
    CONSTRAINT "tournaments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'registration_open'::character varying, 'registration_closed'::character varying, 'auction_started'::character varying, 'auction_completed'::character varying])::"text"[])))
);


ALTER TABLE "public"."tournaments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tournaments"."host_id" IS 'User ID of the tournament host';



COMMENT ON COLUMN "public"."tournaments"."total_slots" IS 'Total number of player slots available';



COMMENT ON COLUMN "public"."tournaments"."format" IS 'Tournament format: Bilateral, TriSeries, Quad, 6 Team, 8 Team, etc.';



COMMENT ON COLUMN "public"."tournaments"."selected_teams" IS 'Number of teams selected for this tournament';



COMMENT ON COLUMN "public"."tournaments"."tournament_date" IS 'Date when the tournament will be held';



COMMENT ON COLUMN "public"."tournaments"."description" IS 'Description of the tournament';



CREATE OR REPLACE VIEW "public"."tournament_details" AS
 SELECT "id",
    "name",
    "host_id",
    "host_player_id",
    "status",
    "total_slots",
    "created_at",
    "updated_at",
    "format",
    "selected_teams",
    "tournament_date",
    "description",
    "public"."get_recommended_teams"("format") AS "recommended_teams",
    "public"."get_recommended_slots"("format") AS "recommended_slots",
        CASE
            WHEN ("selected_teams" = "public"."get_recommended_teams"("format")) THEN 'Recommended'::"text"
            ELSE 'Custom'::"text"
        END AS "team_selection_status",
        CASE
            WHEN ("total_slots" = "public"."get_recommended_slots"("format")) THEN 'Recommended'::"text"
            ELSE 'Custom'::"text"
        END AS "slot_selection_status"
   FROM "public"."tournaments" "t";


ALTER VIEW "public"."tournament_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tournament_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid",
    "slot_number" integer NOT NULL,
    "player_id" "uuid",
    "status" character varying(20) DEFAULT 'empty'::character varying,
    "is_host_assigned" boolean DEFAULT false,
    "requested_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tournament_slots_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['empty'::character varying, 'pending'::character varying, 'confirmed'::character varying, 'waitlist'::character varying])::"text"[])))
);


ALTER TABLE "public"."tournament_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid",
    "player_id" "uuid",
    "position" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


ALTER TABLE ONLY "public"."auction_bids"
    ADD CONSTRAINT "auction_bids_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auction_config"
    ADD CONSTRAINT "auction_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auction_config"
    ADD CONSTRAINT "auction_config_tournament_id_key" UNIQUE ("tournament_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_skill_assignments"
    ADD CONSTRAINT "player_skill_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_skill_assignments"
    ADD CONSTRAINT "player_skill_assignments_player_id_skill_id_key" UNIQUE ("player_id", "skill_id");



ALTER TABLE ONLY "public"."player_skill_values"
    ADD CONSTRAINT "player_skill_values_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_skill_values"
    ADD CONSTRAINT "player_skill_values_skill_id_value_name_key" UNIQUE ("skill_id", "value_name");



ALTER TABLE ONLY "public"."player_skills"
    ADD CONSTRAINT "player_skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_skills"
    ADD CONSTRAINT "player_skills_skill_name_key" UNIQUE ("skill_name");



ALTER TABLE ONLY "public"."player_tags"
    ADD CONSTRAINT "player_tags_pkey" PRIMARY KEY ("player_id", "tag_id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_players"
    ADD CONSTRAINT "team_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_slots"
    ADD CONSTRAINT "tournament_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_slots"
    ADD CONSTRAINT "unique_tournament_player" UNIQUE ("tournament_id", "player_id");



ALTER TABLE ONLY "public"."tournament_slots"
    ADD CONSTRAINT "unique_tournament_slot" UNIQUE ("tournament_id", "slot_number");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_read_at" ON "public"."notifications" USING "btree" ("read_at");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_player_skill_assignments_player_id" ON "public"."player_skill_assignments" USING "btree" ("player_id");



CREATE INDEX "idx_player_skill_assignments_skill_id" ON "public"."player_skill_assignments" USING "btree" ("skill_id");



CREATE INDEX "idx_player_skill_values_skill_id" ON "public"."player_skill_values" USING "btree" ("skill_id");



CREATE INDEX "idx_players_status" ON "public"."players" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_players_user_id" ON "public"."players" USING "btree" ("user_id");



CREATE INDEX "idx_tournament_slots_player_status" ON "public"."tournament_slots" USING "btree" ("player_id", "status");



CREATE INDEX "idx_tournament_slots_tournament_slot_number" ON "public"."tournament_slots" USING "btree" ("tournament_id", "slot_number");



CREATE INDEX "idx_tournaments_date" ON "public"."tournaments" USING "btree" ("tournament_date");



CREATE INDEX "idx_tournaments_format" ON "public"."tournaments" USING "btree" ("format");



CREATE INDEX "idx_tournaments_host" ON "public"."tournaments" USING "btree" ("host_id");



CREATE INDEX "idx_tournaments_selected_teams" ON "public"."tournaments" USING "btree" ("selected_teams");



CREATE UNIQUE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_status" ON "public"."users" USING "btree" ("status");



CREATE INDEX "idx_users_username" ON "public"."users" USING "btree" ("username");



CREATE OR REPLACE TRIGGER "trigger_auto_promote_waitlist" AFTER DELETE OR UPDATE ON "public"."tournament_slots" FOR EACH ROW EXECUTE FUNCTION "public"."auto_promote_waitlist"();



ALTER TABLE ONLY "public"."auction_bids"
    ADD CONSTRAINT "auction_bids_bidder_user_id_fkey" FOREIGN KEY ("bidder_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."auction_bids"
    ADD CONSTRAINT "auction_bids_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auction_bids"
    ADD CONSTRAINT "auction_bids_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auction_bids"
    ADD CONSTRAINT "auction_bids_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auction_config"
    ADD CONSTRAINT "auction_config_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_skill_assignments"
    ADD CONSTRAINT "player_skill_assignments_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_skill_assignments"
    ADD CONSTRAINT "player_skill_assignments_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."player_skills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_skill_assignments"
    ADD CONSTRAINT "player_skill_assignments_skill_value_id_fkey" FOREIGN KEY ("skill_value_id") REFERENCES "public"."player_skill_values"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_skill_values"
    ADD CONSTRAINT "player_skill_values_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."player_skills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_tags"
    ADD CONSTRAINT "player_tags_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_tags"
    ADD CONSTRAINT "player_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_players"
    ADD CONSTRAINT "team_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_players"
    ADD CONSTRAINT "team_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_captain_id_fkey" FOREIGN KEY ("captain_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_captain_user_id_fkey" FOREIGN KEY ("captain_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_slots"
    ADD CONSTRAINT "tournament_slots_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tournament_slots"
    ADD CONSTRAINT "tournament_slots_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_host_player_id_fkey" FOREIGN KEY ("host_player_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete users" ON "public"."users" FOR DELETE USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can insert users" ON "public"."users" FOR INSERT WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all players" ON "public"."players" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage auction config" ON "public"."auction_config" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage player skill values" ON "public"."player_skill_values" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text") AND (("users"."status")::"text" = 'approved'::"text")))));



CREATE POLICY "Admins can manage player skills" ON "public"."player_skills" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text") AND (("users"."status")::"text" = 'approved'::"text")))));



CREATE POLICY "Admins can manage player tags" ON "public"."player_tags" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage tags" ON "public"."tags" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage team players" ON "public"."team_players" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage waitlist" ON "public"."waitlist" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Allow admins and hosts to manage all slots" ON "public"."tournament_slots" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'host'::character varying])::"text"[]))))));



CREATE POLICY "Allow all users to update users" ON "public"."users" FOR UPDATE USING (true);



CREATE POLICY "Allow all users to view users" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Allow authenticated users to view tournament slots" ON "public"."tournament_slots" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow user registration" ON "public"."users" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow users to delete own profile" ON "public"."users" FOR DELETE USING (true);



CREATE POLICY "Allow users to insert their own slot registrations" ON "public"."tournament_slots" FOR INSERT TO "authenticated" WITH CHECK (("player_id" IN ( SELECT "players"."id"
   FROM "public"."players"
  WHERE ("players"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow users to update their own slot registrations" ON "public"."tournament_slots" FOR UPDATE TO "authenticated" USING (("player_id" IN ( SELECT "players"."id"
   FROM "public"."players"
  WHERE ("players"."user_id" = "auth"."uid"()))));



CREATE POLICY "Anyone can view auction bids" ON "public"."auction_bids" FOR SELECT USING (true);



CREATE POLICY "Anyone can view player skill assignments" ON "public"."player_skill_assignments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view player skill values" ON "public"."player_skill_values" FOR SELECT USING (true);



CREATE POLICY "Anyone can view player skills" ON "public"."player_skills" FOR SELECT USING (true);



CREATE POLICY "Anyone can view teams" ON "public"."teams" FOR SELECT USING (true);



CREATE POLICY "Anyone can view tournament slots" ON "public"."tournament_slots" FOR SELECT USING (true);



CREATE POLICY "Anyone can view tournaments" ON "public"."tournaments" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can view auction config" ON "public"."auction_config" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view bids" ON "public"."auction_bids" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view player tags" ON "public"."player_tags" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view players" ON "public"."players" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view tags" ON "public"."tags" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view team players" ON "public"."team_players" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view teams" ON "public"."teams" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view tournament slots" ON "public"."tournament_slots" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view tournaments" ON "public"."tournaments" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view waitlist" ON "public"."waitlist" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Bidders can delete their bids" ON "public"."auction_bids" FOR DELETE USING (("auth"."uid"() = "bidder_user_id"));



CREATE POLICY "Bidders can update their bids" ON "public"."auction_bids" FOR UPDATE USING (("auth"."uid"() = "bidder_user_id"));



CREATE POLICY "Captains and admins can place bids" ON "public"."auction_bids" FOR INSERT WITH CHECK (("public"."is_team_captain"("team_id", "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Captains and admins can update their team" ON "public"."teams" FOR UPDATE USING ((("captain_user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Captains can bid for their teams" ON "public"."auction_bids" FOR INSERT WITH CHECK ((("auth"."uid"() = "bidder_user_id") AND (EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "auction_bids"."team_id") AND ("teams"."captain_user_id" = "auth"."uid"()))))));



CREATE POLICY "Hosts and admins can manage teams" ON "public"."teams" USING (("public"."is_tournament_host"("tournament_id", "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Hosts and admins can manage tournament slots" ON "public"."tournament_slots" USING (("public"."is_tournament_host"("tournament_id", "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Hosts and admins can manage tournaments" ON "public"."tournaments" USING ((("host_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Hosts can assign slots" ON "public"."tournament_slots" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."tournaments"
  WHERE (("tournaments"."id" = "tournament_slots"."tournament_id") AND ("tournaments"."host_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."users"
          WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'host'::"text"))))))) OR (("player_id" IS NOT NULL) AND ("auth"."uid"() = "player_id"))));



CREATE POLICY "Hosts can create teams" ON "public"."teams" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tournaments"
  WHERE (("tournaments"."id" = "teams"."tournament_id") AND ("tournaments"."host_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."users"
          WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'host'::"text"))))))));



CREATE POLICY "Hosts can create tournaments" ON "public"."tournaments" FOR INSERT WITH CHECK ((("auth"."uid"() = "host_id") AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'host'::"text"))))));



CREATE POLICY "Hosts can delete their tournaments" ON "public"."tournaments" FOR DELETE USING ((("auth"."uid"() = "host_id") AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'host'::"text"))))));



CREATE POLICY "Hosts can update their tournaments" ON "public"."tournaments" FOR UPDATE USING ((("auth"."uid"() = "host_id") AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'host'::"text"))))));



CREATE POLICY "Players can request slots" ON "public"."tournament_slots" FOR INSERT WITH CHECK (((("player_id" IS NOT NULL) AND ("auth"."uid"() = "player_id")) OR (EXISTS ( SELECT 1
   FROM "public"."tournaments"
  WHERE (("tournaments"."id" = "tournament_slots"."tournament_id") AND ("tournaments"."host_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."users"
          WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'host'::"text")))))))));



CREATE POLICY "System can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Team captains can manage their teams" ON "public"."teams" FOR UPDATE USING ((("auth"."uid"() = "captain_user_id") OR (EXISTS ( SELECT 1
   FROM "public"."tournaments"
  WHERE (("tournaments"."id" = "teams"."tournament_id") AND ("tournaments"."host_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."users"
          WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'host'::"text")))))))));



CREATE POLICY "Users can manage their own skill assignments" ON "public"."player_skill_assignments" USING ((EXISTS ( SELECT 1
   FROM "public"."players"
  WHERE (("players"."id" = "player_skill_assignments"."player_id") AND ("players"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile or admins can update all" ON "public"."users" FOR UPDATE USING ((("auth"."uid"() = "id") OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own profile or admins can view all" ON "public"."users" FOR SELECT USING ((("auth"."uid"() = "id") OR "public"."is_admin"("auth"."uid"())));



ALTER TABLE "public"."auction_bids" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_skill_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_skill_values" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament_slots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournaments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_promote_waitlist"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_promote_waitlist"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_promote_waitlist"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_slot_reservation"("p_tournament_id" "uuid", "p_slot_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_slot_reservation"("p_tournament_id" "uuid", "p_slot_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_slot_reservation"("p_tournament_id" "uuid", "p_slot_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_promote_waitlist"("p_tournament_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_promote_waitlist"("p_tournament_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_promote_waitlist"("p_tournament_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."confirm_slot"("p_tournament_id" "uuid", "p_slot_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."confirm_slot"("p_tournament_id" "uuid", "p_slot_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_slot"("p_tournament_id" "uuid", "p_slot_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."finalize_auction"("p_tournament_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."finalize_auction"("p_tournament_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."finalize_auction"("p_tournament_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_and_promote_waitlist"("p_tournament_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."find_and_promote_waitlist"("p_tournament_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_and_promote_waitlist"("p_tournament_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_username_from_email"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_username_from_email"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_username_from_email"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auction_results"("p_tournament_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_auction_results"("p_tournament_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auction_results"("p_tournament_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auction_status"("p_tournament_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_auction_status"("p_tournament_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auction_status"("p_tournament_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_available_main_slot"("p_tournament_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_available_main_slot"("p_tournament_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_available_main_slot"("p_tournament_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recommended_slots"("tournament_format" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recommended_slots"("tournament_format" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recommended_slots"("tournament_format" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recommended_teams"("tournament_format" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recommended_teams"("tournament_format" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recommended_teams"("tournament_format" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tournament_status"("p_tournament_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_tournament_status"("p_tournament_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tournament_status"("p_tournament_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_display_name"("user_record" "public"."users") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_display_name"("user_record" "public"."users") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_display_name"("user_record" "public"."users") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_full_name"("user_record" "public"."users") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_full_name"("user_record" "public"."users") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_full_name"("user_record" "public"."users") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_waitlist_position"("p_tournament_id" "uuid", "p_player_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_waitlist_position"("p_tournament_id" "uuid", "p_player_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_waitlist_position"("p_tournament_id" "uuid", "p_player_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_team_captain"("team_id" "uuid", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_team_captain"("team_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_team_captain"("team_id" "uuid", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_tournament_host"("tournament_id" "uuid", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_tournament_host"("tournament_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_tournament_host"("tournament_id" "uuid", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."manual_promote_waitlist"("p_tournament_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."manual_promote_waitlist"("p_tournament_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."manual_promote_waitlist"("p_tournament_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."place_bid"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_team_id" "uuid", "p_bid_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."place_bid"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_team_id" "uuid", "p_bid_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."place_bid"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_team_id" "uuid", "p_bid_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."register_player"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_preferred_slot" integer, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."register_player"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_preferred_slot" integer, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_player"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_preferred_slot" integer, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_slot"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_slot_number" integer, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_slot"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_slot_number" integer, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_slot"("p_tournament_id" "uuid", "p_player_id" "uuid", "p_slot_number" integer, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_auction"("p_tournament_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reset_auction"("p_tournament_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_auction"("p_tournament_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_promote_waitlist_player"("p_tournament_id" "uuid", "p_waitlist_slot_id" "uuid", "p_main_slot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_promote_waitlist_player"("p_tournament_id" "uuid", "p_waitlist_slot_id" "uuid", "p_main_slot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_promote_waitlist_player"("p_tournament_id" "uuid", "p_waitlist_slot_id" "uuid", "p_main_slot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_tournament_data"("p_format" character varying, "p_selected_teams" integer, "p_total_slots" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_tournament_data"("p_format" character varying, "p_selected_teams" integer, "p_total_slots" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_tournament_data"("p_format" character varying, "p_selected_teams" integer, "p_total_slots" integer) TO "service_role";



GRANT ALL ON TABLE "public"."auction_bids" TO "anon";
GRANT ALL ON TABLE "public"."auction_bids" TO "authenticated";
GRANT ALL ON TABLE "public"."auction_bids" TO "service_role";



GRANT ALL ON TABLE "public"."auction_config" TO "anon";
GRANT ALL ON TABLE "public"."auction_config" TO "authenticated";
GRANT ALL ON TABLE "public"."auction_config" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."player_skill_assignments" TO "anon";
GRANT ALL ON TABLE "public"."player_skill_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."player_skill_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."player_skill_values" TO "anon";
GRANT ALL ON TABLE "public"."player_skill_values" TO "authenticated";
GRANT ALL ON TABLE "public"."player_skill_values" TO "service_role";



GRANT ALL ON TABLE "public"."player_skills" TO "anon";
GRANT ALL ON TABLE "public"."player_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."player_skills" TO "service_role";



GRANT ALL ON TABLE "public"."player_tags" TO "anon";
GRANT ALL ON TABLE "public"."player_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."player_tags" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."team_players" TO "anon";
GRANT ALL ON TABLE "public"."team_players" TO "authenticated";
GRANT ALL ON TABLE "public"."team_players" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."tournaments" TO "anon";
GRANT ALL ON TABLE "public"."tournaments" TO "authenticated";
GRANT ALL ON TABLE "public"."tournaments" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_details" TO "anon";
GRANT ALL ON TABLE "public"."tournament_details" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_details" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_slots" TO "anon";
GRANT ALL ON TABLE "public"."tournament_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_slots" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







RESET ALL;
