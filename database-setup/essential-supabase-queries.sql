-- Essential Supabase Configuration Queries
-- Run these queries to get the most important Supabase configurations

-- ==============================================
-- 1. REALTIME CONFIGURATION
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
WHERE pubname LIKE '%realtime%' OR pubname = 'supabase_realtime';

-- ==============================================
-- 2. EXTENSIONS AND SCHEMAS
-- ==============================================

-- Check installed extensions
SELECT 
  extname,
  extversion
FROM pg_extension
ORDER BY extname;

-- Check schemas
SELECT 
  schema_name
FROM information_schema.schemata
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;

-- ==============================================
-- 3. VIEWS AND SEQUENCES
-- ==============================================

-- Check views
SELECT 
  table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check sequences
SELECT 
  sequence_name,
  data_type
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ==============================================
-- 4. CUSTOM TYPES AND ENUMS
-- ==============================================

-- Check custom types
SELECT 
  typname,
  typtype
FROM pg_type
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND typtype IN ('e', 'c', 'd')
ORDER BY typname;

-- Check enum values
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND t.typtype = 'e'
ORDER BY t.typname, e.enumsortorder;

-- ==============================================
-- 5. DATABASE SETTINGS
-- ==============================================

-- Check Supabase-related settings
SELECT 
  name,
  setting
FROM pg_settings
WHERE name LIKE '%supabase%' 
   OR name LIKE '%realtime%'
   OR name LIKE '%jwt%'
ORDER BY name;

-- ==============================================
-- 6. AUTH SUMMARY (No sensitive data)
-- ==============================================

-- Auth users summary
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users
FROM auth.users;

-- Auth providers summary
SELECT 
  provider,
  COUNT(*) as count
FROM auth.identities
GROUP BY provider
ORDER BY count DESC;
