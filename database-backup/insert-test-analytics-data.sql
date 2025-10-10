-- Insert test analytics data to verify the analytics dashboard is working
-- Run this in Supabase SQL Editor AFTER confirming the table exists

-- Insert sample analytics data for testing
INSERT INTO public.api_usage_analytics (
    route, 
    method, 
    user_id, 
    user_role, 
    ip_address, 
    user_agent, 
    response_status, 
    response_time_ms,
    created_at
)
SELECT 
    route,
    method,
    (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1) as user_id,
    'admin' as user_role,
    '127.0.0.1'::INET as ip_address,
    'Mozilla/5.0 (Test Browser)' as user_agent,
    CASE WHEN random() < 0.9 THEN 200 ELSE 500 END as response_status,
    (50 + random() * 200)::INTEGER as response_time_ms,
    NOW() - (interval '1 day' * (random() * 30)) as created_at
FROM (
    VALUES 
        ('/api/players', 'GET'),
        ('/api/players', 'POST'),
        ('/api/tournaments', 'GET'),
        ('/api/tournaments', 'POST'),
        ('/api/player-skills', 'GET'),
        ('/api/users', 'GET'),
        ('/api/auction-status', 'GET'),
        ('/api/place-bid', 'POST'),
        ('/api/player-profile', 'GET'),
        ('/api/user-profile', 'GET')
) AS routes(route, method)
CROSS JOIN generate_series(1, 50) -- Generate 50 records per route
LIMIT 500; -- Total of 500 test records

-- Verify the data was inserted
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT route) as unique_routes,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM public.api_usage_analytics;

-- Show sample data
SELECT 
    route,
    method,
    response_status,
    response_time_ms,
    created_at
FROM public.api_usage_analytics
ORDER BY created_at DESC
LIMIT 10;

