-- Add missing tournament status values to the constraint
-- This fixes the mismatch between frontend statusFlow configuration and database constraint

-- First, drop the existing constraint
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;

-- Add the new constraint with all required status values
-- These match the statusFlow configuration in the frontend
ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check 
CHECK (status IN (
  'draft',
  'registration_open', 
  'registration_closed',
  'auction_started',
  'auction_completed',
  'teams_formed',
  'completed',
  'in_progress'
));

-- Add comment explaining the status flow
COMMENT ON CONSTRAINT tournaments_status_check ON tournaments IS 
'Allowed tournament statuses matching frontend statusFlow: draft -> registration_open -> registration_closed -> auction_started -> auction_completed -> teams_formed -> completed. in_progress can be set at any time during active phases.';
