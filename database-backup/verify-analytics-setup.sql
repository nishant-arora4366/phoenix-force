-- Verification script for API Analytics setup
-- Run this in Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if table exists
SELECT 
    'Table exists: api_usage_analytics' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'api_usage_analytics'
        ) THEN '✅ YES'
        ELSE '❌ NO - Run migration: supabase/migrations/20241208_create_api_usage_analytics.sql'
    END as status;

-- 2. Check if functions exist
SELECT 
    'Function exists: get_api_usage_stats' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_proc 
            WHERE proname = 'get_api_usage_stats'
        ) THEN '✅ YES'
        ELSE '❌ NO - Run migration: supabase/migrations/20241208_create_api_usage_analytics.sql'
    END as status
UNION ALL
SELECT 
    'Function exists: get_user_activity_stats' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_proc 
            WHERE proname = 'get_user_activity_stats'
        ) THEN '✅ YES'
        ELSE '❌ NO'
    END as status
UNION ALL
SELECT 
    'Function exists: get_hourly_usage_patterns' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_proc 
            WHERE proname = 'get_hourly_usage_patterns'
        ) THEN '✅ YES'
        ELSE '❌ NO'
    END as status;

-- 3. Check row count in analytics table
SELECT 
    'Row count in api_usage_analytics' as check_name,
    CAST(COUNT(*) as TEXT) || ' rows' as status
FROM public.api_usage_analytics;

-- 4. Check most recent analytics data
SELECT 
    'Most recent analytics entry' as check_name,
    COALESCE(
        'Last entry: ' || TO_CHAR(MAX(created_at), 'YYYY-MM-DD HH24:MI:SS'),
        'No data yet - Analytics will be collected as you use the API'
    ) as status
FROM public.api_usage_analytics;

-- 5. Test get_api_usage_stats function
SELECT 
    'Test get_api_usage_stats function' as check_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM get_api_usage_stats(NOW() - INTERVAL '30 days', NOW())) >= 0 
        THEN '✅ Function working'
        ELSE '❌ Function not working'
    END as status;

