-- Enhanced Auction System Schema
-- Adds support for comprehensive auction management with drafts, detailed config, and real-time bidding

-- ==============================================
-- DROP EXISTING AUCTION TABLES (if needed for clean slate)
-- ==============================================
-- Uncomment these if you want to completely recreate the auction system
-- DROP TABLE IF EXISTS auction_bids CASCADE;
-- DROP TABLE IF EXISTS auction_players CASCADE;
-- DROP TABLE IF EXISTS auction_teams CASCADE;
-- DROP TABLE IF EXISTS auction_config CASCADE;
-- DROP TABLE IF EXISTS auctions CASCADE;

-- ==============================================
-- ENHANCED AUCTION TABLES
-- ==============================================

-- Main auctions table with enhanced fields
CREATE TABLE IF NOT EXISTS auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'draft', -- draft, pending, live, paused, completed, cancelled
  
  -- Current auction state
  current_player_id UUID REFERENCES players(id),
  current_player_index INTEGER DEFAULT 0,
  current_bid INTEGER DEFAULT 0,
  current_highest_bidder_team_id UUID,
  
  -- Configuration
  max_tokens_per_captain INTEGER DEFAULT 2000,
  min_bid_amount INTEGER DEFAULT 100,
  use_base_price BOOLEAN DEFAULT false,
  min_increment INTEGER DEFAULT 50,
  use_fixed_increments BOOLEAN DEFAULT true,
  custom_increments JSONB, -- [{min: 0, max: 200, increment: 50}, ...]
  timer_seconds INTEGER DEFAULT 30,
  player_order_type VARCHAR(50) DEFAULT 'base_price_desc', -- base_price_desc, base_price_asc, alphabetical, random
  player_order JSONB, -- Array of player IDs in order
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Auction teams with enhanced tracking
CREATE TABLE IF NOT EXISTS auction_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  captain_id UUID NOT NULL REFERENCES players(id),
  captain_user_id UUID REFERENCES users(id),
  team_name VARCHAR(255) NOT NULL,
  
  -- Budget tracking
  max_tokens INTEGER NOT NULL,
  total_spent INTEGER DEFAULT 0,
  remaining_purse INTEGER NOT NULL,
  
  -- Team composition
  players_count INTEGER DEFAULT 0,
  required_players INTEGER NOT NULL, -- Total players needed for this team
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(auction_id, captain_id)
);

-- Auction players with enhanced status tracking
CREATE TABLE IF NOT EXISTS auction_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  
  -- Player auction state
  status VARCHAR(50) DEFAULT 'pending', -- pending, current, sold, unsold, skipped
  base_price INTEGER DEFAULT 0,
  sold_to UUID REFERENCES auction_teams(id),
  sold_price INTEGER,
  
  -- Ordering
  display_order INTEGER,
  times_skipped INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(auction_id, player_id)
);

-- Auction bids with enhanced tracking
CREATE TABLE IF NOT EXISTS auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  team_id UUID NOT NULL REFERENCES auction_teams(id),
  
  -- Bid details
  bid_amount INTEGER NOT NULL,
  bidder_user_id UUID REFERENCES users(id),
  is_winning_bid BOOLEAN DEFAULT false,
  is_final BOOLEAN DEFAULT false, -- True when player is sold
  
  -- Metadata
  bid_sequence INTEGER, -- Order of bids for this player
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- For undo functionality
  undone_at TIMESTAMP WITH TIME ZONE,
  undone_by UUID REFERENCES users(id)
);

-- Auction actions log for complete audit trail
CREATE TABLE IF NOT EXISTS auction_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  
  -- Action details
  action_type VARCHAR(50) NOT NULL, -- bid_placed, player_sold, player_skipped, undo_bid, undo_assignment, next_player, prev_player, pause, resume, complete, cancel
  action_by UUID REFERENCES users(id),
  
  -- Action data
  player_id UUID REFERENCES players(id),
  team_id UUID REFERENCES auction_teams(id),
  bid_amount INTEGER,
  previous_state JSONB, -- Store previous state for undo
  new_state JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Temporary players for filling slots
CREATE TABLE IF NOT EXISTS temp_auction_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  player_name VARCHAR(255) NOT NULL,
  is_temp BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_auctions_tournament_id ON auctions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_current_player ON auctions(current_player_id);

CREATE INDEX IF NOT EXISTS idx_auction_teams_auction_id ON auction_teams(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_teams_captain ON auction_teams(captain_id);

CREATE INDEX IF NOT EXISTS idx_auction_players_auction_id ON auction_players(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_players_status ON auction_players(status);
CREATE INDEX IF NOT EXISTS idx_auction_players_order ON auction_players(auction_id, display_order);

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_player_id ON auction_bids(player_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_team_id ON auction_bids(team_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_created ON auction_bids(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auction_actions_auction_id ON auction_actions(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_actions_created ON auction_actions(created_at DESC);

-- ==============================================
-- FUNCTIONS FOR AUCTION MANAGEMENT
-- ==============================================

-- Function to calculate max bid possible for a team
CREATE OR REPLACE FUNCTION calculate_max_bid_possible(
  p_team_id UUID,
  p_auction_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_remaining_purse INTEGER;
  v_players_count INTEGER;
  v_required_players INTEGER;
  v_remaining_slots INTEGER;
  v_min_bid INTEGER;
  v_max_bid_possible INTEGER;
BEGIN
  -- Get team details
  SELECT remaining_purse, players_count, required_players
  INTO v_remaining_purse, v_players_count, v_required_players
  FROM auction_teams
  WHERE id = p_team_id;
  
  -- Calculate remaining slots
  v_remaining_slots := v_required_players - v_players_count - 1; -- -1 for current player
  
  -- Get minimum bid from auction
  SELECT min_bid_amount INTO v_min_bid
  FROM auctions
  WHERE id = p_auction_id;
  
  -- If no more slots after this, can bid full purse
  IF v_remaining_slots <= 0 THEN
    RETURN v_remaining_purse;
  END IF;
  
  -- Must reserve min_bid for each remaining slot
  v_max_bid_possible := v_remaining_purse - (v_remaining_slots * v_min_bid);
  
  -- Can't bid negative
  IF v_max_bid_possible < 0 THEN
    RETURN 0;
  END IF;
  
  RETURN v_max_bid_possible;
END;
$$;

-- Function to get next increment based on current bid
CREATE OR REPLACE FUNCTION get_next_increment(
  p_auction_id UUID,
  p_current_bid INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_use_fixed BOOLEAN;
  v_min_increment INTEGER;
  v_custom_increments JSONB;
  v_increment_rule JSONB;
BEGIN
  -- Get auction increment settings
  SELECT use_fixed_increments, min_increment, custom_increments
  INTO v_use_fixed, v_min_increment, v_custom_increments
  FROM auctions
  WHERE id = p_auction_id;
  
  -- If using fixed increments
  IF v_use_fixed THEN
    RETURN v_min_increment;
  END IF;
  
  -- If using custom increments, find applicable range
  IF v_custom_increments IS NOT NULL THEN
    FOR v_increment_rule IN SELECT * FROM jsonb_array_elements(v_custom_increments)
    LOOP
      IF p_current_bid >= (v_increment_rule->>'min')::INTEGER 
         AND p_current_bid < (v_increment_rule->>'max')::INTEGER THEN
        RETURN (v_increment_rule->>'increment')::INTEGER;
      END IF;
    END LOOP;
  END IF;
  
  -- Default to min increment
  RETURN v_min_increment;
END;
$$;

-- Function to place a bid with all validations
CREATE OR REPLACE FUNCTION place_auction_bid(
  p_auction_id UUID,
  p_player_id UUID,
  p_team_id UUID,
  p_bid_amount INTEGER,
  p_bidder_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_auction RECORD;
  v_team RECORD;
  v_player RECORD;
  v_current_bid INTEGER;
  v_required_increment INTEGER;
  v_max_bid_possible INTEGER;
  v_bid_sequence INTEGER;
BEGIN
  -- Get auction details
  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
  END IF;
  
  IF v_auction.status != 'live' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auction is not live');
  END IF;
  
  IF v_auction.current_player_id != p_player_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'This player is not currently up for auction');
  END IF;
  
  -- Get team details
  SELECT * INTO v_team FROM auction_teams WHERE id = p_team_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team not found');
  END IF;
  
  -- Get current highest bid
  SELECT COALESCE(MAX(bid_amount), 0) INTO v_current_bid
  FROM auction_bids
  WHERE auction_id = p_auction_id AND player_id = p_player_id AND undone_at IS NULL;
  
  -- If first bid, check against base price or min bid
  IF v_current_bid = 0 THEN
    SELECT base_price INTO v_player FROM auction_players 
    WHERE auction_id = p_auction_id AND player_id = p_player_id;
    
    IF v_auction.use_base_price AND v_player.base_price > 0 THEN
      IF p_bid_amount < v_player.base_price THEN
        RETURN jsonb_build_object(
          'success', false, 
          'error', 'First bid must be at least the base price',
          'required_amount', v_player.base_price
        );
      END IF;
    ELSIF p_bid_amount < v_auction.min_bid_amount THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Bid must be at least the minimum bid amount',
        'required_amount', v_auction.min_bid_amount
      );
    END IF;
  ELSE
    -- Check increment requirement
    v_required_increment := get_next_increment(p_auction_id, v_current_bid);
    IF p_bid_amount < v_current_bid + v_required_increment THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Bid must be at least ' || v_required_increment || ' higher than current bid',
        'required_amount', v_current_bid + v_required_increment
      );
    END IF;
  END IF;
  
  -- Check if team can afford this bid
  v_max_bid_possible := calculate_max_bid_possible(p_team_id, p_auction_id);
  IF p_bid_amount > v_max_bid_possible THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bid exceeds maximum possible bid for this team',
      'max_bid_possible', v_max_bid_possible,
      'remaining_purse', v_team.remaining_purse
    );
  END IF;
  
  -- Get bid sequence
  SELECT COALESCE(MAX(bid_sequence), 0) + 1 INTO v_bid_sequence
  FROM auction_bids
  WHERE auction_id = p_auction_id AND player_id = p_player_id;
  
  -- Mark previous bids as not winning
  UPDATE auction_bids
  SET is_winning_bid = false
  WHERE auction_id = p_auction_id AND player_id = p_player_id AND undone_at IS NULL;
  
  -- Insert new bid
  INSERT INTO auction_bids (
    auction_id, player_id, team_id, bid_amount, bidder_user_id,
    is_winning_bid, bid_sequence
  ) VALUES (
    p_auction_id, p_player_id, p_team_id, p_bid_amount, p_bidder_user_id,
    true, v_bid_sequence
  );
  
  -- Update auction current bid
  UPDATE auctions
  SET current_bid = p_bid_amount,
      current_highest_bidder_team_id = p_team_id,
      updated_at = NOW()
  WHERE id = p_auction_id;
  
  -- Log action
  INSERT INTO auction_actions (auction_id, action_type, action_by, player_id, team_id, bid_amount)
  VALUES (p_auction_id, 'bid_placed', p_bidder_user_id, p_player_id, p_team_id, p_bid_amount);
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Bid placed successfully',
    'bid_amount', p_bid_amount,
    'team_id', p_team_id
  );
END;
$$;

-- Function to sell player to highest bidder
CREATE OR REPLACE FUNCTION sell_player_to_highest_bidder(
  p_auction_id UUID,
  p_player_id UUID,
  p_action_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_winning_bid RECORD;
  v_team RECORD;
BEGIN
  -- Get winning bid
  SELECT * INTO v_winning_bid
  FROM auction_bids
  WHERE auction_id = p_auction_id 
    AND player_id = p_player_id 
    AND is_winning_bid = true
    AND undone_at IS NULL
  ORDER BY bid_amount DESC, created_at ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No bids found for this player');
  END IF;
  
  -- Mark bid as final
  UPDATE auction_bids
  SET is_final = true
  WHERE id = v_winning_bid.id;
  
  -- Update auction player status
  UPDATE auction_players
  SET status = 'sold',
      sold_to = v_winning_bid.team_id,
      sold_price = v_winning_bid.bid_amount,
      updated_at = NOW()
  WHERE auction_id = p_auction_id AND player_id = p_player_id;
  
  -- Update team
  UPDATE auction_teams
  SET total_spent = total_spent + v_winning_bid.bid_amount,
      remaining_purse = remaining_purse - v_winning_bid.bid_amount,
      players_count = players_count + 1,
      updated_at = NOW()
  WHERE id = v_winning_bid.team_id;
  
  -- Log action
  INSERT INTO auction_actions (
    auction_id, action_type, action_by, player_id, team_id, bid_amount
  ) VALUES (
    p_auction_id, 'player_sold', p_action_by, p_player_id, 
    v_winning_bid.team_id, v_winning_bid.bid_amount
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Player sold successfully',
    'team_id', v_winning_bid.team_id,
    'sold_price', v_winning_bid.bid_amount
  );
END;
$$;

-- ==============================================
-- ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE temp_auction_players ENABLE ROW LEVEL SECURITY;

-- Policies for auctions
CREATE POLICY "Anyone can view auctions" ON auctions FOR SELECT USING (true);
CREATE POLICY "Hosts and admins can manage auctions" ON auctions FOR ALL USING (
  created_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for auction_teams
CREATE POLICY "Anyone can view auction teams" ON auction_teams FOR SELECT USING (true);
CREATE POLICY "Auction creator can manage teams" ON auction_teams FOR ALL USING (
  EXISTS (SELECT 1 FROM auctions WHERE id = auction_id AND created_by = auth.uid())
);

-- Policies for auction_players
CREATE POLICY "Anyone can view auction players" ON auction_players FOR SELECT USING (true);

-- Policies for auction_bids
CREATE POLICY "Anyone can view auction bids" ON auction_bids FOR SELECT USING (true);
CREATE POLICY "Captains can place bids" ON auction_bids FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM auction_teams 
    WHERE id = team_id AND captain_user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM auctions a
    JOIN tournaments t ON a.tournament_id = t.id
    WHERE a.id = auction_id AND (t.host_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ))
  )
);

-- Policies for auction_actions
CREATE POLICY "Anyone can view auction actions" ON auction_actions FOR SELECT USING (true);

COMMENT ON TABLE auctions IS 'Main auction table with comprehensive configuration and state management';
COMMENT ON TABLE auction_teams IS 'Teams participating in auction with budget tracking';
COMMENT ON TABLE auction_players IS 'Players available in auction with status tracking';
COMMENT ON TABLE auction_bids IS 'All bids placed during auction with complete history';
COMMENT ON TABLE auction_actions IS 'Complete audit log of all auction actions';
COMMENT ON FUNCTION calculate_max_bid_possible IS 'Calculates maximum bid a team can place while reserving for remaining slots';
COMMENT ON FUNCTION get_next_increment IS 'Gets the required increment based on current bid and auction settings';
COMMENT ON FUNCTION place_auction_bid IS 'Places a bid with all validations and updates';
COMMENT ON FUNCTION sell_player_to_highest_bidder IS 'Finalizes sale of player to highest bidder';
