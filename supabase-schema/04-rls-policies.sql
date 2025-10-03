-- Row Level Security (RLS) Policies
-- This script creates RLS policies for secure data access

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Players table policies
CREATE POLICY "Anyone can view players" ON public.players
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own player profile" ON public.players
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player profile" ON public.players
    FOR UPDATE USING (auth.uid() = user_id);

-- Tournaments table policies
CREATE POLICY "Anyone can view tournaments" ON public.tournaments
    FOR SELECT USING (true);

CREATE POLICY "Hosts can manage their tournaments" ON public.tournaments
    FOR ALL USING (auth.uid() = host_id);

-- Tournament slots policies
CREATE POLICY "Anyone can view tournament slots" ON public.tournament_slots
    FOR SELECT USING (true);

CREATE POLICY "Hosts can manage tournament slots" ON public.tournament_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.tournaments 
            WHERE tournaments.id = tournament_slots.tournament_id 
            AND tournaments.host_id = auth.uid()
        )
    );

-- Teams policies
CREATE POLICY "Anyone can view teams" ON public.teams
    FOR SELECT USING (true);

CREATE POLICY "Team captains can manage their teams" ON public.teams
    FOR ALL USING (auth.uid() = captain_user_id);

-- Auction bids policies
CREATE POLICY "Anyone can view auction bids" ON public.auction_bids
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can place bids" ON public.auction_bids
    FOR INSERT WITH CHECK (auth.uid() = bidder_user_id);

-- Team players policies
CREATE POLICY "Anyone can view team players" ON public.team_players
    FOR SELECT USING (true);
