-- SQL function and trigger to handle player sold status updates
-- This ensures that when a player is sold, all necessary fields are updated

-- Function to mark a player as sold (deadlock-safe version)
CREATE OR REPLACE FUNCTION mark_player_as_sold(
  p_auction_id UUID,
  p_player_id UUID,
  p_team_id UUID,
  p_sold_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  -- Use advisory lock to prevent concurrent operations on same auction
  PERFORM pg_advisory_xact_lock(hashtext(p_auction_id::text));
  
  -- Single UPDATE to auction_players table with all changes
  UPDATE auction_players
  SET 
    status = 'sold',
    sold_to = p_team_id,
    sold_price = p_sold_amount,
    current_player = false,
    updated_at = NOW()
  WHERE 
    auction_id = p_auction_id 
    AND player_id = p_player_id
    AND status != 'sold'; -- Prevent duplicate updates
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  -- Only update team if player was actually updated
  IF v_updated THEN
    UPDATE auction_teams
    SET 
      total_spent = total_spent + p_sold_amount,
      remaining_purse = remaining_purse - p_sold_amount,
      players_count = players_count + 1,
      updated_at = NOW()
    WHERE 
      id = p_team_id 
      AND auction_id = p_auction_id;
  END IF;
  
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to handle the "Sell Player" action (deadlock-safe version)
CREATE OR REPLACE FUNCTION sell_current_player(
  p_auction_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_current_player_id UUID;
  v_winning_bid RECORD;
  v_result JSONB;
BEGIN
  -- Use advisory lock to prevent concurrent operations on same auction
  PERFORM pg_advisory_xact_lock(hashtext(p_auction_id::text));
  
  -- Get the current player
  SELECT player_id INTO v_current_player_id
  FROM auction_players
  WHERE 
    auction_id = p_auction_id 
    AND current_player = true
  LIMIT 1;
  
  IF v_current_player_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No current player found'
    );
  END IF;
  
  -- Get the winning bid for this player
  SELECT 
    team_id,
    bid_amount
  INTO v_winning_bid
  FROM auction_bids
  WHERE 
    auction_id = p_auction_id 
    AND player_id = v_current_player_id
    AND is_winning_bid = true
    AND is_undone = false
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_winning_bid IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No winning bid found for current player'
    );
  END IF;
  
  -- Mark the player as sold
  PERFORM mark_player_as_sold(
    p_auction_id,
    v_current_player_id,
    v_winning_bid.team_id,
    v_winning_bid.bid_amount
  );
  
  -- Return success with details
  v_result := jsonb_build_object(
    'success', true,
    'player_id', v_current_player_id,
    'team_id', v_winning_bid.team_id,
    'sold_amount', v_winning_bid.bid_amount
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log player sold events for analytics
CREATE TABLE IF NOT EXISTS player_sold_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL,
  player_id UUID NOT NULL,
  team_id UUID NOT NULL,
  sold_amount INTEGER NOT NULL,
  sold_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES auction_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for faster queries
CREATE INDEX idx_player_sold_events_auction ON player_sold_events(auction_id);
CREATE INDEX idx_player_sold_events_created ON player_sold_events(created_at DESC);

-- Trigger function to log when a player is sold
CREATE OR REPLACE FUNCTION log_player_sold_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status changed to 'sold'
  IF NEW.status = 'sold' AND (OLD.status IS NULL OR OLD.status != 'sold') THEN
    INSERT INTO player_sold_events (
      auction_id,
      player_id,
      team_id,
      sold_amount,
      created_at
    ) VALUES (
      NEW.auction_id,
      NEW.player_id,
      NEW.sold_to,
      NEW.sold_price,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_log_player_sold ON auction_players;
CREATE TRIGGER trigger_log_player_sold
AFTER UPDATE ON auction_players
FOR EACH ROW
EXECUTE FUNCTION log_player_sold_event();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION mark_player_as_sold TO authenticated;
GRANT EXECUTE ON FUNCTION sell_current_player TO authenticated;
GRANT SELECT ON player_sold_events TO authenticated;

-- Example usage:
-- SELECT mark_player_as_sold('auction-id', 'player-id', 'team-id', 5000000);
-- SELECT sell_current_player('auction-id', 'user-id');
