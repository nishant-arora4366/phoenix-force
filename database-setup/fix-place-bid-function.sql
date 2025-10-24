-- Fix place_bid_atomic function overloading issue
-- This script drops all existing versions and recreates the function with a single signature

-- Drop all existing versions of place_bid_atomic function
DROP FUNCTION IF EXISTS place_bid_atomic(uuid, uuid, integer, uuid);
DROP FUNCTION IF EXISTS place_bid_atomic(uuid, integer, uuid, uuid);

-- Recreate the function with the correct signature
CREATE OR REPLACE FUNCTION place_bid_atomic(
  p_auction_id UUID,
  p_team_id UUID,
  p_bid_amount INTEGER,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_current_player_id UUID;
  v_current_bid INTEGER;
  v_auction_status TEXT;
  v_team_purse INTEGER;
  v_min_increment INTEGER;
  v_use_fixed_increments BOOLEAN;
  v_auction_config JSONB;
  v_use_base_price BOOLEAN;
  v_min_bid_amount INTEGER;
  v_bid_id UUID;
  v_result JSONB;
  v_user_role TEXT;
  v_auction_creator_id UUID;
  v_is_admin_or_host BOOLEAN := false;
  -- Variables for max possible bid validation
  v_remaining_slots INTEGER;
  v_slots_after_purchase INTEGER;
  v_reserve_needed INTEGER;
  v_max_possible_bid INTEGER;
BEGIN
  -- Use advisory lock to prevent concurrent bids on same auction
  PERFORM pg_advisory_xact_lock(hashtext(p_auction_id::text));
  
  -- Get user role
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
  
  -- Get auction status and config in single query
  SELECT status, min_increment, use_fixed_increments, auction_config, use_base_price, min_bid_amount, created_by
  INTO v_auction_status, v_min_increment, v_use_fixed_increments, v_auction_config, v_use_base_price, v_min_bid_amount, v_auction_creator_id
  FROM auctions 
  WHERE id = p_auction_id;
  
  IF v_auction_status != 'live' THEN
    RAISE EXCEPTION 'AUCTION_NOT_LIVE::Auction is not live';
  END IF;
  
  -- Check if user is admin or host (creator of auction)
  IF v_user_role = 'admin' OR (v_user_role = 'host' AND v_auction_creator_id = p_user_id) THEN
    v_is_admin_or_host := true;
  END IF;
  
  -- Get current player
  SELECT player_id INTO v_current_player_id
  FROM auction_players
  WHERE auction_id = p_auction_id 
    AND current_player = true
  LIMIT 1;
  
  IF v_current_player_id IS NULL THEN
    RAISE EXCEPTION 'NO_CURRENT_PLAYER::No current player set';
  END IF;
  
  -- Get current highest bid
  SELECT bid_amount INTO v_current_bid
  FROM auction_bids
  WHERE auction_id = p_auction_id 
    AND player_id = v_current_player_id
    AND is_winning_bid = true
    AND is_undone = false
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default to 0 if no bids yet
  v_current_bid := COALESCE(v_current_bid, 0);
  
  -- Get team purse and calculate remaining slots
  SELECT remaining_purse, required_players, players_count
  INTO v_team_purse, v_remaining_slots, v_remaining_slots  -- reuse variable for temp storage
  FROM auction_teams
  WHERE id = p_team_id AND auction_id = p_auction_id;
  
  IF v_team_purse IS NULL THEN
    RAISE EXCEPTION 'TEAM_NOT_FOUND::Team not found';
  END IF;
  
  -- Admin/Host bypass: Only check purse limit, skip all other validations
  IF v_is_admin_or_host THEN
    IF p_bid_amount > v_team_purse THEN
      RAISE EXCEPTION 'INSUFFICIENT_FUNDS::Exceeds remaining purse';
    END IF;
    -- Skip all other validations for admin/host
  ELSE
    -- Full validation for captains
    
    -- Validate bid amount is higher than current
    IF p_bid_amount <= v_current_bid THEN
      RAISE EXCEPTION 'BID_OUTDATED::Bid amount must be higher than current bid of %', v_current_bid;
    END IF;
    
    -- Increment validation based on auction config
    IF v_use_fixed_increments THEN
      -- Simple fixed increment
      IF p_bid_amount < v_current_bid + v_min_increment THEN
        RAISE EXCEPTION 'INVALID_INCREMENT::Bid increment must be at least %', v_min_increment;
      END IF;
    ELSE
      -- Custom increment ranges
      DECLARE
        v_boundary_1 INTEGER := COALESCE((v_auction_config->>'boundary_1')::INTEGER, 200);
        v_boundary_2 INTEGER := COALESCE((v_auction_config->>'boundary_2')::INTEGER, 500);
        v_increment_1 INTEGER := COALESCE((v_auction_config->>'increment_range_1')::INTEGER, 20);
        v_increment_2 INTEGER := COALESCE((v_auction_config->>'increment_range_2')::INTEGER, 50);
        v_increment_3 INTEGER := COALESCE((v_auction_config->>'increment_range_3')::INTEGER, 100);
        v_required_increment INTEGER;
      BEGIN
        -- Determine required increment based on current bid
        -- Use < instead of <= so that boundary values use the next range's increment
        IF v_current_bid < v_boundary_1 THEN
          v_required_increment := v_increment_1;
        ELSIF v_current_bid < v_boundary_2 THEN
          v_required_increment := v_increment_2;
        ELSE
          v_required_increment := v_increment_3;
        END IF;
        
        IF p_bid_amount < v_current_bid + v_required_increment THEN
          RAISE EXCEPTION 'INVALID_INCREMENT::Bid increment must be at least %', v_required_increment;
        END IF;
      END;
    END IF;
    
    -- Check team funds
    IF p_bid_amount > v_team_purse THEN
      RAISE EXCEPTION 'INSUFFICIENT_FUNDS::Team has insufficient funds';
    END IF;
    
    -- Calculate max possible bid (reserve for remaining slots)
    -- Get actual remaining slots (required - filled)
    SELECT required_players - players_count INTO v_remaining_slots
    FROM auction_teams
    WHERE id = p_team_id;
    
    v_slots_after_purchase := GREATEST(0, v_remaining_slots - 1);
    
    -- Calculate reserve needed based on use_base_price setting
    IF v_slots_after_purchase > 0 THEN
      IF v_use_base_price THEN
        -- Competition-aware reserve calculation
        -- For simplicity in SQL, use conservative estimate: min_bid_amount per slot
        -- Full competition logic would require complex queries
        v_reserve_needed := v_slots_after_purchase * v_min_bid_amount;
      ELSE
        -- Simple reserve: min_bid_amount per slot
        v_reserve_needed := v_slots_after_purchase * v_min_bid_amount;
      END IF;
    ELSE
      v_reserve_needed := 0;
    END IF;
    
    v_max_possible_bid := v_team_purse - v_reserve_needed;
    
    IF p_bid_amount > v_max_possible_bid THEN
      RAISE EXCEPTION 'EXCEEDS_MAX_POSSIBLE::Exceeds max possible bid of %. Reserve % needed for % remaining slots', v_max_possible_bid, v_reserve_needed, v_slots_after_purchase;
    END IF;
  END IF;
  
  -- Mark previous winning bid as not winning
  UPDATE auction_bids 
  SET is_winning_bid = false 
  WHERE auction_id = p_auction_id 
    AND player_id = v_current_player_id 
    AND is_winning_bid = true
    AND is_undone = false;
  
  -- Insert new bid
  INSERT INTO auction_bids (
    auction_id, 
    player_id, 
    team_id, 
    bid_amount, 
    is_winning_bid,
    is_undone
  ) VALUES (
    p_auction_id, 
    v_current_player_id, 
    p_team_id, 
    p_bid_amount, 
    true,
    false
  ) RETURNING id INTO v_bid_id;
  
  -- Build result
  v_result := jsonb_build_object(
    'bid', jsonb_build_object(
      'id', v_bid_id,
      'auction_id', p_auction_id,
      'player_id', v_current_player_id,
      'team_id', p_team_id,
      'bid_amount', p_bid_amount,
      'is_winning_bid', true
    ),
    'current_bid', p_bid_amount
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise with original message format
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION place_bid_atomic(uuid, uuid, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION place_bid_atomic(uuid, uuid, integer, uuid) TO service_role;