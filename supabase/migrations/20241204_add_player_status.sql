-- Add status column to players table for admin approval
ALTER TABLE players ADD COLUMN IF NOT EXISTS status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);

-- Update existing players to have approved status (if any exist)
UPDATE players SET status = 'approved' WHERE status IS NULL;
