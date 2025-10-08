-- =====================================================
-- Enable Realtime publication for tournament_slots
-- =====================================================
-- This ensures that INSERT, UPDATE, DELETE events are broadcast
-- to realtime subscribers
-- =====================================================

-- Drop existing publication if it exists
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;

-- Create publication with tournament_slots table
CREATE PUBLICATION supabase_realtime FOR TABLE tournament_slots;

-- Add other tables that need realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Verify the publication includes tournament_slots
-- You can check this with: SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
