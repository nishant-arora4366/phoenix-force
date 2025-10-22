-- Complete Database Schema Information
-- Run this in Supabase SQL Editor to get all schema details

-- ==============================================
-- RLS POLICIES
-- ==============================================
SELECT 
  'RLS_POLICIES' as info_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==============================================
-- FUNCTIONS
-- ==============================================
SELECT 
  'FUNCTIONS' as info_type,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments,
  p.prokind as function_type,
  p.prosrc as source_code
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- ==============================================
-- TRIGGERS
-- ==============================================
SELECT 
  'TRIGGERS' as info_type,
  t.trigger_name,
  t.event_manipulation,
  t.event_object_table,
  t.action_statement,
  t.action_timing,
  t.action_orientation
FROM information_schema.triggers t
WHERE t.trigger_schema = 'public'
ORDER BY t.event_object_table, t.trigger_name;

-- ==============================================
-- EXTENSIONS
-- ==============================================
SELECT 
  'EXTENSIONS' as info_type,
  extname,
  extversion,
  extowner,
  extnamespace
FROM pg_extension
ORDER BY extname;

-- ==============================================
-- REALTIME PUBLICATIONS
-- ==============================================
SELECT 
  'PUBLICATIONS' as info_type,
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete,
  pubtruncate
FROM pg_publication
ORDER BY pubname;

-- ==============================================
-- TABLE CONSTRAINTS
-- ==============================================
SELECT 
  'CONSTRAINTS' as info_type,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ==============================================
-- INDEXES
-- ==============================================
SELECT 
  'INDEXES' as info_type,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ==============================================
-- TABLE INFORMATION
-- ==============================================
SELECT 
  'TABLES' as info_type,
  t.table_name,
  t.table_type,
  c.column_name,
  c.data_type,
  c.character_maximum_length,
  c.is_nullable,
  c.column_default,
  c.ordinal_position
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;
