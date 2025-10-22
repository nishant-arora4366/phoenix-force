-- Performance optimization indexes for auction system
-- Run these on your Supabase database to improve query performance

-- Indexes for auction_bids table
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_player 
ON auction_bids(auction_id, player_id) 
WHERE is_undone = false;

CREATE INDEX IF NOT EXISTS idx_auction_bids_winning 
ON auction_bids(auction_id, is_winning_bid) 
WHERE is_undone = false AND is_winning_bid = true;

CREATE INDEX IF NOT EXISTS idx_auction_bids_created_at 
ON auction_bids(created_at DESC);

-- Indexes for auction_players table
CREATE INDEX IF NOT EXISTS idx_auction_players_current 
ON auction_players(auction_id, current_player) 
WHERE current_player = true;

CREATE INDEX IF NOT EXISTS idx_auction_players_status 
ON auction_players(auction_id, status);

CREATE INDEX IF NOT EXISTS idx_auction_players_order 
ON auction_players(auction_id, display_order) 
WHERE status = 'available';

-- Indexes for auction_teams table
CREATE INDEX IF NOT EXISTS idx_auction_teams_auction 
ON auction_teams(auction_id);

CREATE INDEX IF NOT EXISTS idx_auction_teams_captain 
ON auction_teams(captain_id);

-- Indexes for players table
CREATE INDEX IF NOT EXISTS idx_players_user 
ON players(user_id);

-- Create materialized view for auction statistics (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS auction_stats AS
SELECT 
  a.id as auction_id,
  a.status,
  COUNT(DISTINCT ap.player_id) as total_players,
  COUNT(DISTINCT ap.player_id) FILTER (WHERE ap.status = 'sold') as sold_players,
  COUNT(DISTINCT ap.player_id) FILTER (WHERE ap.status = 'available') as available_players,
  COUNT(DISTINCT at.id) as total_teams,
  SUM(at.total_spent) as total_money_spent,
  MAX(ab.bid_amount) as highest_bid,
  AVG(ab.bid_amount) FILTER (WHERE ab.is_winning_bid = true) as avg_winning_bid
FROM auctions a
LEFT JOIN auction_players ap ON ap.auction_id = a.id
LEFT JOIN auction_teams at ON at.auction_id = a.id
LEFT JOIN auction_bids ab ON ab.auction_id = a.id AND ab.is_undone = false
GROUP BY a.id, a.status;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_auction_stats_auction_id 
ON auction_stats(auction_id);

-- Function to refresh auction stats (call periodically or on major events)
CREATE OR REPLACE FUNCTION refresh_auction_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY auction_stats;
END;
$$ LANGUAGE plpgsql;

-- Optimized function for atomic bid placement with better locking
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
  LIMIT 1;
  
  -- Validate bid increment
  IF v_current_bid IS NOT NULL AND p_bid_amount <= v_current_bid THEN
    RAISE EXCEPTION 'BID_OUTDATED::Bid must be higher than current bid of %', v_current_bid;
  END IF;
  
  IF v_current_bid IS NOT NULL AND (p_bid_amount - v_current_bid) < v_min_increment THEN
    RAISE EXCEPTION 'INVALID_INCREMENT::Bid increment must be at least %', v_min_increment;
  END IF;
  
  -- Check team purse
  SELECT remaining_purse INTO v_team_purse
  FROM auction_teams
  WHERE id = p_team_id AND auction_id = p_auction_id;
  
  IF v_team_purse IS NULL THEN
    RAISE EXCEPTION 'TEAM_NOT_FOUND::Team not found';
  END IF;
  
  IF p_bid_amount > v_team_purse THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS::Bid exceeds remaining purse of %', v_team_purse;
  END IF;
  
  -- Mark previous bids as not winning
  UPDATE auction_bids
  SET is_winning_bid = false
  WHERE auction_id = p_auction_id 
    AND player_id = v_current_player_id
    AND is_winning_bid = true;
  
  -- Insert new bid
  INSERT INTO auction_bids (
    auction_id, player_id, team_id, bid_amount, 
    is_winning_bid, created_by
  ) VALUES (
    p_auction_id, v_current_player_id, p_team_id, p_bid_amount,
    true, p_user_id
  ) RETURNING id INTO v_bid_id;
  
  -- Return result
  v_result := jsonb_build_object(
    'bid', jsonb_build_object(
      'id', v_bid_id,
      'amount', p_bid_amount,
      'team_id', p_team_id
    ),
    'current_bid', p_bid_amount
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise with original message
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Function to get current player with caching hints
CREATE OR REPLACE FUNCTION get_current_player(p_auction_id UUID)
RETURNS TABLE (
  player_id UUID,
  display_name TEXT,
  profile_pic_url TEXT,
  base_price INTEGER,
  current_bid INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH current_player_cte AS (
    SELECT ap.player_id, ap.status
    FROM auction_players ap
    WHERE ap.auction_id = p_auction_id 
      AND ap.current_player = true
    LIMIT 1
  ),
  current_bid_cte AS (
    SELECT ab.player_id, ab.bid_amount
    FROM auction_bids ab
    WHERE ab.auction_id = p_auction_id
      AND ab.is_winning_bid = true
      AND ab.is_undone = false
      AND EXISTS (
        SELECT 1 FROM current_player_cte cp 
        WHERE cp.player_id = ab.player_id
      )
    LIMIT 1
  )
  SELECT 
    p.id as player_id,
    p.display_name,
    p.profile_pic_url,
    COALESCE(p.base_price, 0) as base_price,
    cb.bid_amount as current_bid,
    cp.status
  FROM current_player_cte cp
  JOIN players p ON p.id = cp.player_id
  LEFT JOIN current_bid_cte cb ON cb.player_id = cp.player_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable query result caching for read-heavy queries
ALTER FUNCTION get_current_player SET work_mem = '256MB';

-- Vacuum and analyze tables for better query planning
VACUUM ANALYZE auction_bids;
VACUUM ANALYZE auction_players;
VACUUM ANALYZE auction_teams;
VACUUM ANALYZE auctions;
