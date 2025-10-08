-- =====================================================
-- Remove slot_number column from tournament_slots
-- =====================================================
-- This migration removes the slot_number column since we're using
-- pure timestamp-based FCFS system without slot numbers
-- =====================================================

-- Drop the NOT NULL constraint first
ALTER TABLE tournament_slots ALTER COLUMN slot_number DROP NOT NULL;

-- Drop the unique constraint on slot_number
ALTER TABLE tournament_slots DROP CONSTRAINT IF EXISTS unique_tournament_slot;

-- Drop the slot_number column
ALTER TABLE tournament_slots DROP COLUMN IF EXISTS slot_number;

-- Update any remaining references in the code will be handled separately
