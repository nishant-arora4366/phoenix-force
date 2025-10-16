-- Test script to verify the improved undo sell logic
-- This script tests the new sold_at timestamp functionality

-- First, let's check if the new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'auction_players' 
  AND column_name IN ('display_order', 'current_player', 'sold_at', 'times_skipped')
ORDER BY column_name;

-- Test the new functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('set_current_player', 'get_next_player', 'get_previous_player')
  AND routine_schema = 'public';

-- Example query to test the undo logic (this would be used in the API)
-- Find the most recently sold player excluding captains
SELECT 
  ap.id,
  ap.player_id,
  ap.status,
  ap.sold_to,
  ap.sold_price,
  ap.sold_at,
  p.display_name as player_name,
  at.team_name
FROM auction_players ap
JOIN players p ON ap.player_id = p.id
LEFT JOIN auction_teams at ON ap.sold_to = at.id
WHERE ap.auction_id = 'your-auction-id-here'
  AND ap.status = 'sold'
  AND ap.sold_at IS NOT NULL
  -- Exclude captains (you would need to join with auction_teams to get captain_id)
  AND ap.player_id NOT IN (
    SELECT captain_id 
    FROM auction_teams 
    WHERE auction_id = 'your-auction-id-here'
  )
ORDER BY ap.sold_at DESC
LIMIT 1;

-- Test query to verify the order is correct
-- This should show players in the order they were sold (most recent first)
SELECT 
  p.display_name,
  ap.sold_at,
  ap.sold_price,
  at.team_name
FROM auction_players ap
JOIN players p ON ap.player_id = p.id
LEFT JOIN auction_teams at ON ap.sold_to = at.id
WHERE ap.auction_id = 'your-auction-id-here'
  AND ap.status = 'sold'
  AND ap.sold_at IS NOT NULL
ORDER BY ap.sold_at DESC;
