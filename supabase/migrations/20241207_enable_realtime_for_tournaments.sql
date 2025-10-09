-- Enable real-time for tournaments table
-- This allows real-time updates when tournament status changes

-- Enable real-time for tournaments table
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;

-- Grant necessary permissions for real-time
GRANT SELECT ON tournaments TO anon, authenticated;
GRANT SELECT ON tournaments TO service_role;
