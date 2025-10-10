-- Fix RLS policies to allow public read access for realtime subscriptions
-- While keeping write operations protected via API authentication

-- =========================================
-- TOURNAMENT_SLOTS TABLE
-- =========================================

-- Drop existing SELECT policy that requires authentication
DROP POLICY IF EXISTS "Allow authenticated users to view tournament slots" ON tournament_slots;

-- Create new policy allowing public SELECT (for realtime)
CREATE POLICY "Allow public to view tournament slots" ON tournament_slots
    FOR SELECT
    USING (true);  -- Anyone can read slots (realtime subscriptions work)

-- Keep write policies intact (these are enforced by API routes with JWT)
-- The existing INSERT/UPDATE policies will continue to work via service role key

-- =========================================
-- TOURNAMENTS TABLE
-- =========================================

-- Check current policies on tournaments
DO $$
BEGIN
    -- Drop existing SELECT policies if they exist
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournaments' 
        AND policyname LIKE '%view%' 
        AND cmd = 'SELECT'
    ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated users to view tournaments" ON tournaments';
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to view tournaments" ON tournaments';
    END IF;
    
    -- Create public SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournaments' 
        AND policyname = 'Allow public to view tournaments'
    ) THEN
        EXECUTE 'CREATE POLICY "Allow public to view tournaments" ON tournaments FOR SELECT USING (true)';
    END IF;
END $$;

-- =========================================
-- NOTIFICATIONS TABLE
-- =========================================

-- Update notifications to allow users to read their own notifications
-- Keep the policy that allows users to see their own notifications
-- (This doesn't need to be public)

-- =========================================
-- COMMENT
-- =========================================

COMMENT ON POLICY "Allow public to view tournament slots" ON tournament_slots IS 
'Public read access for realtime subscriptions. Write operations are protected via API routes with JWT authentication.';

COMMENT ON POLICY "Allow public to view tournaments" ON tournaments IS 
'Public read access for realtime subscriptions. Write operations are protected via API routes with JWT authentication.';

