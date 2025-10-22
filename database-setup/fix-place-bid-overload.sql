-- Alternative solution: Rename functions to avoid overloading
-- This approach keeps both functions but gives them distinct names

-- Drop the ambiguous functions
DROP FUNCTION IF EXISTS place_bid_atomic(uuid, uuid, integer, uuid);
DROP FUNCTION IF EXISTS place_bid_atomic(uuid, integer, uuid, uuid);

-- Create the main function with the correct parameter order
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
  v_bid_id UUID;
  v_result JSONB;
BEGIN
  -- Use advisory lock to prevent concurrent bids on same auction
  PERFORM pg_advisory_xact_lock(hashtext(p_auction_id::text));
  
  -- Get auction status and config in single query
  SELECT status, min_increment 
  INTO v_auction_status, v_min_increment
  FROM auctions 
  WHERE id = p_auction_id;
  
  IF v_auction_status != 'live' THEN
    RAISE EXCEPTION 'AUCTION_NOT_LIVE::Auction is not live';
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
  
  -- Validate bid amount
  IF p_bid_amount <= v_current_bid THEN
    RAISE EXCEPTION 'BID_OUTDATED::Bid amount must be higher than current bid of %', v_current_bid;
  END IF;
  
  IF p_bid_amount < v_current_bid + v_min_increment THEN
    RAISE EXCEPTION 'INVALID_INCREMENT::Bid increment must be at least %', v_min_increment;
  END IF;
  
  -- Check team funds
  SELECT remaining_purse INTO v_team_purse
  FROM auction_teams
  WHERE id = p_team_id AND auction_id = p_auction_id;
  
  IF v_team_purse IS NULL THEN
    RAISE EXCEPTION 'TEAM_NOT_FOUND::Team not found';
  END IF;
  
  IF p_bid_amount > v_team_purse THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS::Team has insufficient funds';
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

-- Check if the function was created successfully
SELECT proname, proargtypes 
FROM pg_proc 
WHERE proname = 'place_bid_atomic';