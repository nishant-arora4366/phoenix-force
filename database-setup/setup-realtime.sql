-- Phoenix Force Realtime Configuration Setup
-- This script sets up realtime for the Phoenix Force application

-- ==============================================
-- REALTIME PUBLICATIONS
-- ==============================================

-- Create main realtime publication (if not exists)
CREATE PUBLICATION IF NOT EXISTS supabase_realtime
FOR ALL TABLES
WITH (publish = 'insert, update, delete');

-- Create realtime messages publication (if not exists)
CREATE PUBLICATION IF NOT EXISTS supabase_realtime_messages_publication
FOR ALL TABLES
WITH (publish = 'insert, update, delete');

-- ==============================================
-- ENABLE REALTIME FOR SPECIFIC TABLES
-- ==============================================

-- Enable realtime for notifications table (user notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable realtime for tournament_slots table (slot updates)
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_slots;

-- Enable realtime for tournaments table (tournament updates)
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;

-- ==============================================
-- REALTIME CONFIGURATION SUMMARY
-- ==============================================

-- Tables with realtime enabled:
-- 1. notifications - For real-time user notifications
-- 2. tournament_slots - For real-time tournament slot updates
-- 3. tournaments - For real-time tournament updates

-- Realtime operations enabled:
-- - INSERT: New records will be broadcast
-- - UPDATE: Record changes will be broadcast
-- - DELETE: Record deletions will be broadcast

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check which tables have realtime enabled
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables pt 
      JOIN pg_publication p ON pt.pubname = p.pubname 
      WHERE pt.schemaname = pg_tables.schemaname 
      AND pt.tablename = pg_tables.tablename
      AND p.pubname LIKE '%realtime%'
    ) THEN 'ENABLED'
    ELSE 'DISABLED'
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check realtime publications
SELECT 
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication
WHERE pubname LIKE '%realtime%'
ORDER BY pubname;
