-- =====================================================
-- Remove database functions that still reference slot_number
-- =====================================================
-- These functions are no longer needed with the pure FCFS timestamp system
-- =====================================================

-- Drop triggers that use these functions
DROP TRIGGER IF EXISTS trigger_auto_promote_waitlist ON tournament_slots;

-- Drop functions that reference slot_number
DROP FUNCTION IF EXISTS auto_promote_waitlist();
DROP FUNCTION IF EXISTS safe_promote_waitlist_player(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS promote_next_player_simple(uuid);

-- Drop any other functions that might reference slot_number
DROP FUNCTION IF EXISTS get_next_available_main_slot(uuid);
DROP FUNCTION IF EXISTS get_waitlist_position(uuid, uuid);
DROP FUNCTION IF EXISTS manual_promote_waitlist(uuid, uuid);
DROP FUNCTION IF EXISTS check_and_promote_waitlist(uuid);
DROP FUNCTION IF EXISTS find_and_promote_waitlist(uuid);
DROP FUNCTION IF EXISTS reorder_waitlist_slots(uuid);
DROP FUNCTION IF EXISTS reorder_all_slots_fcfs(uuid);
DROP FUNCTION IF EXISTS get_waitlist_position_fcfs(uuid, uuid);
DROP FUNCTION IF EXISTS promote_next_player_fcfs(uuid);

-- Drop trigger functions
DROP FUNCTION IF EXISTS trigger_reorder_waitlist();
DROP FUNCTION IF EXISTS trigger_reorder_all_slots_fcfs();
DROP FUNCTION IF EXISTS trigger_auto_promote_waitlist();

-- Note: The pure FCFS system doesn't need any of these functions
-- Positions are calculated dynamically in the frontend based on requested_at timestamps
