-- Simple cleanup script to remove any separate profile tables
-- This script only removes actual tables, not views

-- Drop any separate profile tables if they exist
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_profile CASCADE;
DROP TABLE IF EXISTS user_profiles_table CASCADE;

-- Note: user_profiles is a VIEW (not a table) that provides computed fields
-- It's safe to keep this view as it just provides computed fields from the users table
-- If you want to remove it, use: DROP VIEW IF EXISTS user_profiles CASCADE;

-- Show current table structure to verify
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%profile%'
ORDER BY table_name;
