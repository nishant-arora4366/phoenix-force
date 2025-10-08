-- =====================================================
-- CLEANUP: Remove Unused Triggers and Functions
-- =====================================================
-- This migration removes all unnecessary triggers and functions
-- since we're using pure timestamp-based FCFS system
-- =====================================================

-- Remove all auto-promotion triggers
DROP TRIGGER IF EXISTS trigger_auto_promote_waitlist ON tournament_slots;
DROP TRIGGER IF EXISTS trigger_auto_promote_simple ON tournament_slots;
DROP TRIGGER IF EXISTS trigger_reorder_waitlist_slots ON tournament_slots;
DROP TRIGGER IF EXISTS trigger_reorder_all_slots_fcfs ON tournament_slots;

-- Remove all promotion functions
DROP FUNCTION IF EXISTS auto_promote_waitlist();
DROP FUNCTION IF EXISTS auto_promote_waitlist_fcfs();
DROP FUNCTION IF EXISTS auto_promote_simple();
DROP FUNCTION IF EXISTS promote_next_waitlist_player_fcfs(UUID);
DROP FUNCTION IF EXISTS promote_next_player_fcfs(UUID);
DROP FUNCTION IF EXISTS promote_next_player_simple(UUID);

-- Remove all reordering functions
DROP FUNCTION IF EXISTS reorder_waitlist_slots(UUID);
DROP FUNCTION IF EXISTS reorder_all_slots_fcfs(UUID);
DROP FUNCTION IF EXISTS trigger_reorder_waitlist();
DROP FUNCTION IF EXISTS trigger_reorder_all_slots_fcfs();

-- Remove other unused functions
DROP FUNCTION IF EXISTS get_waitlist_position_fcfs(UUID, UUID);
DROP FUNCTION IF EXISTS safe_promote_waitlist_player(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS find_and_promote_waitlist(UUID);
DROP FUNCTION IF EXISTS check_and_promote_waitlist(UUID);
DROP FUNCTION IF EXISTS manual_promote_waitlist(UUID);
DROP FUNCTION IF EXISTS get_next_available_main_slot(UUID);
DROP FUNCTION IF EXISTS get_waitlist_position(UUID, UUID);

-- Keep only essential functions that are actually used
-- (These should remain as they're used by the application)
-- - get_waitlist_position(UUID, UUID) - if used by frontend
-- - Other utility functions that are actually needed

-- Note: slot_number column is kept for backward compatibility
-- but is no longer used in the new FCFS system
