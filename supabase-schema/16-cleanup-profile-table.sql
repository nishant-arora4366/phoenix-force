-- Cleanup script to remove any separate user profile table
-- This script removes any separate profile table that might have been created
-- and ensures all user data is in the main users table

-- Drop any separate profile table if it exists
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_profile CASCADE;

-- Drop any views that might reference separate profile tables
DROP VIEW IF EXISTS user_profiles CASCADE;
DROP VIEW IF EXISTS user_profiles_view CASCADE;
DROP VIEW IF EXISTS profile_view CASCADE;

-- Drop any functions that might reference separate profile tables
DROP FUNCTION IF EXISTS get_user_profile(UUID);
DROP FUNCTION IF EXISTS update_user_profile(UUID, JSON);
DROP FUNCTION IF EXISTS create_user_profile(UUID, JSON);

-- Ensure the main users table has all the profile fields
-- (This will be handled by the main migration script)

-- Verify that all user data is in the main users table
-- The users table should contain all profile information directly
-- No separate profile table should exist

-- Show current table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
