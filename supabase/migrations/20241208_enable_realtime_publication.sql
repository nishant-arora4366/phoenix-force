-- =====================================================
-- Enable Realtime publication for tournament_slots
-- =====================================================
-- This ensures that INSERT, UPDATE, DELETE events are broadcast
-- to realtime subscribers
-- =====================================================

-- Drop existing publication if it exists
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;

-- Create publication with tournament_slots table (includes INSERT, UPDATE, DELETE)
CREATE PUBLICATION supabase_realtime FOR TABLE tournament_slots;

-- Add other tables that need realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Ensure DELETE events are enabled for tournament_slots
-- This is usually enabled by default, but let's be explicit
ALTER PUBLICATION supabase_realtime SET (publish = 'insert, update, delete');

-- Verify the publication includes tournament_slots
-- You can check this with: SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
