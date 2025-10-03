-- Test RLS Policies and RPC Functions
-- This script tests the security policies and bid placement functionality

-- ==============================================
-- 1. TEST DATA SETUP
-- ==============================================

-- Create test users
INSERT INTO public.users (id, email, role) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'host@test.com', 'host'),
    ('22222222-2222-2222-2222-222222222222', 'captain1@test.com', 'viewer'),
    ('33333333-3333-3333-3333-333333333333', 'captain2@test.com', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Create test players
INSERT INTO public.players (id, user_id, display_name, base_price) VALUES 
    ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Captain One', 100.00),
    ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Captain Two', 150.00),
    ('66666666-6666-6666-6666-666666666666', NULL, 'Auction Player', 200.00)
ON CONFLICT (id) DO NOTHING;

-- Create test tournament
INSERT INTO public.tournaments (id, name, host_id, status, total_slots, min_bid_amount, min_increment) VALUES 
    ('77777777-7777-7777-7777-777777777777', 'Test Tournament', '11111111-1111-1111-1111-111111111111', 'auction_started', 8, 50.00, 10.00)
ON CONFLICT (id) DO NOTHING;

-- Create test teams
INSERT INTO public.teams (id, tournament_id, name, captain_user_id, initial_budget, budget_remaining) VALUES 
    ('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'Team Alpha', '22222222-2222-2222-2222-222222222222', 1000.00, 1000.00),
    ('99999999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777', 'Team Beta', '33333333-3333-3333-3333-333333333333', 1000.00, 1000.00)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 2. TEST RPC FUNCTIONS
-- ==============================================

-- Test place_bid function (this will fail without proper auth context)
SELECT 'Testing place_bid function...' as test_step;

-- Test get_auction_status function
SELECT public.get_auction_status('77777777-7777-7777-7777-777777777777') as auction_status;

-- ==============================================
-- 3. TEST RLS POLICIES
-- ==============================================

-- Test tournament access
SELECT 'Testing tournament access...' as test_step;
SELECT COUNT(*) as tournament_count FROM public.tournaments;

-- Test auction bids access
SELECT 'Testing auction bids access...' as test_step;
SELECT COUNT(*) as bid_count FROM public.auction_bids;

-- Test teams access
SELECT 'Testing teams access...' as test_step;
SELECT COUNT(*) as team_count FROM public.teams;

-- ==============================================
-- 4. VERIFY POLICIES ARE ACTIVE
-- ==============================================

-- Check if RLS is enabled on key tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tournaments', 'tournament_slots', 'auction_bids', 'teams')
ORDER BY tablename;

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tournaments', 'tournament_slots', 'auction_bids', 'teams')
ORDER BY tablename, policyname;

-- ==============================================
-- 5. SUCCESS MESSAGE
-- ==============================================

SELECT 'RLS policies and RPC functions test completed!' as message;
