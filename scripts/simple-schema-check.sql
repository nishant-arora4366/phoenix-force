-- Simple Database Schema Check
-- This script will work with your current database structure

-- 1. Get all tables in the public schema
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check auctions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'auctions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check tournaments table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tournaments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check users table structure (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check foreign key constraints on auctions table
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'auctions';

-- 6. Check if the specific tournament exists
SELECT id, name, host_id, status
FROM tournaments
WHERE id = '7ec989e3-61c6-4591-99f2-ba1ecd483fd1';

-- 7. Check what user-related tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name LIKE '%user%' OR table_name LIKE '%auth%' OR table_name LIKE '%profile%')
ORDER BY table_name;
