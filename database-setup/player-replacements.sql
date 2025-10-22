-- Schema for tracking player replacements in completed auctions
-- This allows hosts/admins to substitute players who drop out

-- Create table to track player replacements
CREATE TABLE IF NOT EXISTS player_replacements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES auction_teams(id) ON DELETE CASCADE,
  original_player_id UUID NOT NULL REFERENCES players(id),
  replacement_player_id UUID NOT NULL REFERENCES players(id),
  reason TEXT,
  replaced_by UUID NOT NULL REFERENCES users(id),
  replaced_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure no duplicate replacements for same player in same team
  UNIQUE(auction_id, team_id, original_player_id),
  -- Ensure replacement player isn't already in another team in same auction
  UNIQUE(auction_id, replacement_player_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_player_replacements_auction ON player_replacements(auction_id);
CREATE INDEX idx_player_replacements_team ON player_replacements(team_id);
CREATE INDEX idx_player_replacements_status ON player_replacements(status);
CREATE INDEX idx_player_replacements_created ON player_replacements(created_at DESC);

-- Function to add a player replacement
CREATE OR REPLACE FUNCTION add_player_replacement(
  p_auction_id UUID,
  p_team_id UUID,
  p_original_player_id UUID,
  p_replacement_player_id UUID,
  p_reason TEXT,
  p_replaced_by UUID,
  p_auto_approve BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_auction_status TEXT;
  v_team_exists BOOLEAN;
  v_original_in_team BOOLEAN;
  v_replacement_available BOOLEAN;
  v_replacement_id UUID;
BEGIN
  -- Check if auction is completed
  SELECT status INTO v_auction_status
  FROM auctions
  WHERE id = p_auction_id;
  
  IF v_auction_status != 'completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Replacements can only be made for completed auctions'
    );
  END IF;
  
  -- Check if team exists in this auction
  SELECT EXISTS(
    SELECT 1 FROM auction_teams
    WHERE id = p_team_id AND auction_id = p_auction_id
  ) INTO v_team_exists;
  
  IF NOT v_team_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Team not found in this auction'
    );
  END IF;
  
  -- Check if original player is in the team
  SELECT EXISTS(
    SELECT 1 FROM auction_players
    WHERE auction_id = p_auction_id
      AND player_id = p_original_player_id
      AND sold_to = p_team_id
      AND status = 'sold'
  ) INTO v_original_in_team;
  
  IF NOT v_original_in_team THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Original player is not in this team'
    );
  END IF;
  
  -- Check if replacement player is available (not in any team in this auction)
  SELECT NOT EXISTS(
    SELECT 1 FROM auction_players
    WHERE auction_id = p_auction_id
      AND player_id = p_replacement_player_id
      AND status = 'sold'
  ) INTO v_replacement_available;
  
  IF NOT v_replacement_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Replacement player is already in a team in this auction'
    );
  END IF;
  
  -- Insert the replacement record
  INSERT INTO player_replacements (
    auction_id,
    team_id,
    original_player_id,
    replacement_player_id,
    reason,
    replaced_by,
    status,
    approved_by,
    approved_at
  ) VALUES (
    p_auction_id,
    p_team_id,
    p_original_player_id,
    p_replacement_player_id,
    p_reason,
    p_replaced_by,
    CASE WHEN p_auto_approve THEN 'approved' ELSE 'pending' END,
    CASE WHEN p_auto_approve THEN p_replaced_by ELSE NULL END,
    CASE WHEN p_auto_approve THEN NOW() ELSE NULL END
  ) RETURNING id INTO v_replacement_id;
  
  -- If auto-approved, update the auction_players table
  IF p_auto_approve THEN
    -- Remove original player from team
    UPDATE auction_players
    SET 
      status = 'replaced',
      sold_to = NULL,
      sold_price = NULL,
      updated_at = NOW()
    WHERE auction_id = p_auction_id
      AND player_id = p_original_player_id;
    
    -- Add replacement player to team
    INSERT INTO auction_players (
      auction_id,
      player_id,
      status,
      sold_to,
      sold_price,
      display_order,
      created_at
    ) VALUES (
      p_auction_id,
      p_replacement_player_id,
      'sold',
      p_team_id,
      0, -- Replacement players don't have a price
      9999, -- Put at end of order
      NOW()
    )
    ON CONFLICT (auction_id, player_id) 
    DO UPDATE SET
      status = 'sold',
      sold_to = p_team_id,
      sold_price = 0,
      updated_at = NOW();
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'replacement_id', v_replacement_id,
    'status', CASE WHEN p_auto_approve THEN 'approved' ELSE 'pending' END
  );
END;
$$ LANGUAGE plpgsql;

-- Function to approve a replacement
CREATE OR REPLACE FUNCTION approve_player_replacement(
  p_replacement_id UUID,
  p_approved_by UUID
)
RETURNS JSONB AS $$
DECLARE
  v_replacement RECORD;
BEGIN
  -- Get replacement details
  SELECT * INTO v_replacement
  FROM player_replacements
  WHERE id = p_replacement_id;
  
  IF v_replacement IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Replacement not found'
    );
  END IF;
  
  IF v_replacement.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Replacement is not pending approval'
    );
  END IF;
  
  -- Update replacement status
  UPDATE player_replacements
  SET 
    status = 'approved',
    approved_by = p_approved_by,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_replacement_id;
  
  -- Update auction_players table
  -- Remove original player from team
  UPDATE auction_players
  SET 
    status = 'replaced',
    sold_to = NULL,
    sold_price = NULL,
    updated_at = NOW()
  WHERE auction_id = v_replacement.auction_id
    AND player_id = v_replacement.original_player_id;
  
  -- Add replacement player to team
  INSERT INTO auction_players (
    auction_id,
    player_id,
    status,
    sold_to,
    sold_price,
    display_order,
    created_at
  ) VALUES (
    v_replacement.auction_id,
    v_replacement.replacement_player_id,
    'sold',
    v_replacement.team_id,
    0,
    9999,
    NOW()
  )
  ON CONFLICT (auction_id, player_id) 
  DO UPDATE SET
    status = 'sold',
    sold_to = v_replacement.team_id,
    sold_price = 0,
    updated_at = NOW();
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Replacement approved successfully'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get team formation with replacements
CREATE OR REPLACE FUNCTION get_team_formation_with_replacements(
  p_auction_id UUID,
  p_team_id UUID DEFAULT NULL
)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  player_id UUID,
  player_name TEXT,
  player_image TEXT,
  is_replacement BOOLEAN,
  replaced_player_id UUID,
  replaced_player_name TEXT,
  replacement_date TIMESTAMPTZ,
  sold_price INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    at.id as team_id,
    at.team_name,
    p.id as player_id,
    p.display_name as player_name,
    p.profile_pic_url as player_image,
    CASE WHEN pr.replacement_player_id IS NOT NULL THEN true ELSE false END as is_replacement,
    pr.original_player_id as replaced_player_id,
    op.display_name as replaced_player_name,
    pr.replaced_at as replacement_date,
    COALESCE(ap.sold_price, 0) as sold_price
  FROM auction_teams at
  INNER JOIN auction_players ap ON ap.sold_to = at.id AND ap.status = 'sold'
  INNER JOIN players p ON p.id = ap.player_id
  LEFT JOIN player_replacements pr ON pr.replacement_player_id = p.id 
    AND pr.auction_id = p_auction_id 
    AND pr.status = 'approved'
  LEFT JOIN players op ON op.id = pr.original_player_id
  WHERE at.auction_id = p_auction_id
    AND (p_team_id IS NULL OR at.id = p_team_id)
  ORDER BY at.team_name, ap.sold_price DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON player_replacements TO authenticated;
GRANT EXECUTE ON FUNCTION add_player_replacement TO authenticated;
GRANT EXECUTE ON FUNCTION approve_player_replacement TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_formation_with_replacements TO authenticated;
