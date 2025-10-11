-- Database Schema Analysis Script
-- This script will help us understand the database structure and relationships

-- 1. Get all tables in the public schema
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Get all columns for each table
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 3. Get all foreign key relationships
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
ORDER BY tc.table_name, kcu.column_name;

-- 4. Get all primary keys
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 5. Get all indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 6. Check specific tables we're interested in
SELECT 'auctions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'auctions' AND table_schema = 'public'
UNION ALL
SELECT 'users' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
UNION ALL
SELECT 'tournaments' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tournaments' AND table_schema = 'public'
UNION ALL
SELECT 'players' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'players' AND table_schema = 'public'
ORDER BY table_name, column_name;

-- 7. Check if there are any user-related tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name LIKE '%user%' OR table_name LIKE '%auth%' OR table_name LIKE '%profile%')
ORDER BY table_name;

-- 8. Check the specific foreign key constraint that's failing
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
    AND tc.table_name = 'auctions'
    AND kcu.column_name = 'created_by';

-- 9. Check what's in the users table (if it exists)
SELECT COUNT(*) as user_count FROM users;

-- 10. Check what's in the tournaments table
SELECT COUNT(*) as tournament_count FROM tournaments;

-- 11. Check the specific tournament we're trying to create an auction for
SELECT id, name, host_id, status, registration_closed
FROM tournaments
WHERE id = '7ec989e3-61c6-4591-99f2-ba1ecd483fd1';

-- 12. Check if the host_id exists in any user table
SELECT 'users' as table_name, COUNT(*) as count
FROM users
WHERE id = '55edaef4-2977-40b8-b533-365cae96fbbe'
UNION ALL
SELECT 'tournaments' as table_name, COUNT(*) as count
FROM tournaments
WHERE host_id = '55edaef4-2977-40b8-b533-365cae96fbbe';
