-- Advanced RLS Policies for Phoenix Force Platform
-- This script creates comprehensive security policies for tournaments, slots, and auctions

-- ==============================================
-- 1. TOURNAMENTS TABLE POLICIES
-- ==============================================

-- Enable RLS on tournaments (if not already enabled)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Hosts can manage their tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Hosts can create tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Hosts can update their tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Hosts can delete their tournaments" ON public.tournaments;

-- View policies
CREATE POLICY "Anyone can view tournaments" ON public.tournaments
    FOR SELECT USING (true);

-- Insert policy - only hosts can create tournaments
CREATE POLICY "Hosts can create tournaments" ON public.tournaments
    FOR INSERT WITH CHECK (
        auth.uid() = host_id 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'host'
        )
    );

-- Update policy - only hosts can update their own tournaments
CREATE POLICY "Hosts can update their tournaments" ON public.tournaments
    FOR UPDATE USING (
        auth.uid() = host_id 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'host'
        )
    );

-- Delete policy - only hosts can delete their own tournaments
CREATE POLICY "Hosts can delete their tournaments" ON public.tournaments
    FOR DELETE USING (
        auth.uid() = host_id 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'host'
        )
    );

-- ==============================================
-- 2. TOURNAMENT_SLOTS TABLE POLICIES
-- ==============================================

-- Enable RLS on tournament_slots (if not already enabled)
ALTER TABLE public.tournament_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view tournament slots" ON public.tournament_slots;
DROP POLICY IF EXISTS "Hosts can manage tournament slots" ON public.tournament_slots;
DROP POLICY IF EXISTS "Players can request slots" ON public.tournament_slots;
DROP POLICY IF EXISTS "Hosts can assign slots" ON public.tournament_slots;

-- View policy
CREATE POLICY "Anyone can view tournament slots" ON public.tournament_slots
    FOR SELECT USING (true);

-- Insert policy - players can request slots, hosts can assign
CREATE POLICY "Players can request slots" ON public.tournament_slots
    FOR INSERT WITH CHECK (
        -- Players can request slots for themselves
        (player_id IS NOT NULL AND auth.uid() = player_id) OR
        -- Hosts can assign slots
        EXISTS (
            SELECT 1 FROM public.tournaments 
            WHERE tournaments.id = tournament_slots.tournament_id 
            AND tournaments.host_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role = 'host'
            )
        )
    );

-- Update policy - hosts can manage slots, players can update their own requests
CREATE POLICY "Hosts can assign slots" ON public.tournament_slots
    FOR UPDATE USING (
        -- Hosts can manage all slots in their tournaments
        EXISTS (
            SELECT 1 FROM public.tournaments 
            WHERE tournaments.id = tournament_slots.tournament_id 
            AND tournaments.host_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role = 'host'
            )
        ) OR
        -- Players can update their own slot requests
        (player_id IS NOT NULL AND auth.uid() = player_id)
    );

-- ==============================================
-- 3. AUCTION_BIDS TABLE POLICIES
-- ==============================================

-- Enable RLS on auction_bids (if not already enabled)
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view auction bids" ON public.auction_bids;
DROP POLICY IF EXISTS "Authenticated users can place bids" ON public.auction_bids;
DROP POLICY IF EXISTS "Captains can bid for their teams" ON public.auction_bids;

-- View policy
CREATE POLICY "Anyone can view auction bids" ON public.auction_bids
    FOR SELECT USING (true);

-- Insert policy - only team captains can place bids
CREATE POLICY "Captains can bid for their teams" ON public.auction_bids
    FOR INSERT WITH CHECK (
        auth.uid() = bidder_user_id 
        AND EXISTS (
            SELECT 1 FROM public.teams 
            WHERE teams.id = auction_bids.team_id 
            AND teams.captain_user_id = auth.uid()
        )
    );

-- Update policy - only the bidder can update their own bids
CREATE POLICY "Bidders can update their bids" ON public.auction_bids
    FOR UPDATE USING (auth.uid() = bidder_user_id);

-- Delete policy - only the bidder can delete their own bids
CREATE POLICY "Bidders can delete their bids" ON public.auction_bids
    FOR DELETE USING (auth.uid() = bidder_user_id);

-- ==============================================
-- 4. TEAMS TABLE POLICIES
-- ==============================================

-- Enable RLS on teams (if not already enabled)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view teams" ON public.teams;
DROP POLICY IF EXISTS "Team captains can manage their teams" ON public.teams;
DROP POLICY IF EXISTS "Hosts can create teams" ON public.teams;

-- View policy
CREATE POLICY "Anyone can view teams" ON public.teams
    FOR SELECT USING (true);

-- Insert policy - hosts can create teams
CREATE POLICY "Hosts can create teams" ON public.teams
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tournaments 
            WHERE tournaments.id = teams.tournament_id 
            AND tournaments.host_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role = 'host'
            )
        )
    );

-- Update policy - team captains can manage their teams
CREATE POLICY "Team captains can manage their teams" ON public.teams
    FOR UPDATE USING (
        auth.uid() = captain_user_id OR
        EXISTS (
            SELECT 1 FROM public.tournaments 
            WHERE tournaments.id = teams.tournament_id 
            AND tournaments.host_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role = 'host'
            )
        )
    );

-- ==============================================
-- 5. SUCCESS MESSAGE
-- ==============================================

SELECT 'Advanced RLS policies applied successfully!' as message;
