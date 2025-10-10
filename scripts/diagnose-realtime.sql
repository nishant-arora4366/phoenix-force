-- Diagnostic script to check Supabase Realtime configuration
-- Run this in your Supabase SQL Editor to diagnose realtime issues

-- ============================================
-- 1. CHECK REALTIME PUBLICATION
-- ============================================
SELECT 
    'Realtime Publication Status' as check_name,
    pubname,
    CASE 
        WHEN puballtables THEN 'All Tables'
        ELSE 'Specific Tables'
    END as scope
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- ============================================
-- 2. CHECK WHICH TABLES ARE IN PUBLICATION
-- ============================================
SELECT 
    'Tables in Realtime Publication' as check_name,
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- ============================================
-- 3. CHECK RLS POLICIES FOR TOURNAMENT_SLOTS
-- ============================================
SELECT 
    'tournament_slots RLS Policies' as check_name,
    policyname,
    cmd as command,
    roles::text[],
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'tournament_slots'
ORDER BY policyname;

-- ============================================
-- 4. CHECK RLS POLICIES FOR TOURNAMENTS
-- ============================================
SELECT 
    'tournaments RLS Policies' as check_name,
    policyname,
    cmd as command,
    roles::text[],
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'tournaments'
ORDER BY policyname;

-- ============================================
-- 5. CHECK IF RLS IS ENABLED
-- ============================================
SELECT 
    'RLS Status' as check_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('tournament_slots', 'tournaments')
ORDER BY tablename;

-- ============================================
-- 6. CHECK REPLICA IDENTITY (Important for realtime DELETE events)
-- ============================================
SELECT 
    'Replica Identity' as check_name,
    c.relname as table_name,
    CASE c.relreplident
        WHEN 'd' THEN 'DEFAULT (primary key)'
        WHEN 'f' THEN 'FULL (all columns)'
        WHEN 'i' THEN 'INDEX'
        WHEN 'n' THEN 'NOTHING (DELETE events will not work!)'
    END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN ('tournament_slots', 'tournaments')
ORDER BY c.relname;

-- ============================================
-- 7. TEST PUBLIC ACCESS TO TABLES (simulating anon role)
-- ============================================
-- This checks if anon role can select from these tables
SET ROLE anon;
SELECT 'Public SELECT Test - tournament_slots' as test_name, COUNT(*) as row_count
FROM tournament_slots
LIMIT 1;

SELECT 'Public SELECT Test - tournaments' as test_name, COUNT(*) as row_count
FROM tournaments
LIMIT 1;

RESET ROLE;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
/*
EXPECTED RESULTS FOR WORKING REALTIME:

1. Realtime Publication: Should show 'supabase_realtime' publication exists
2. Tables in Publication: Should include 'tournament_slots' and 'tournaments'
3. RLS Policies: Should have policies allowing public SELECT (USING true)
4. RLS Status: Should show rls_enabled = true
5. Replica Identity: Should be 'DEFAULT' or 'FULL' (NOT 'NOTHING')
6. Public Access Test: Should return counts without errors

IF ANY OF THESE FAIL:
- Missing from publication → Run: ALTER PUBLICATION supabase_realtime ADD TABLE tournament_slots, tournaments;
- No public SELECT policy → Run the migration script we created
- Replica Identity is NOTHING → Run: ALTER TABLE tournament_slots REPLICA IDENTITY DEFAULT;
*/

