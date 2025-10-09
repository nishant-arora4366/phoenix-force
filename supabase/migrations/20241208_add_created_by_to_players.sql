-- Add created_by field to players table to track who created the player
-- This is needed for proper access control where hosts can only edit/delete players they created

-- Add created_by column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Update existing players to set created_by based on user_id
-- If a player has a user_id, set created_by to that user_id
UPDATE players 
SET created_by = user_id 
WHERE user_id IS NOT NULL AND created_by IS NULL;

-- For players without user_id, we'll leave created_by as NULL
-- These are likely admin-created players and admins have full access anyway

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_players_created_by ON players(created_by);

-- Add comment to document the field
COMMENT ON COLUMN players.created_by IS 'User ID of the user who created this player record. Used for access control - hosts can only edit/delete players they created.';
