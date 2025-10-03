-- Auction and Team Tables: teams, auction_config, auction_bids, team_players
-- This script creates auction and team management tables

-- 1. Teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    captain_id UUID REFERENCES public.players(id),
    captain_user_id UUID REFERENCES public.users(id),
    initial_budget DECIMAL(10,2),
    budget_remaining DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Auction configuration table
CREATE TABLE IF NOT EXISTS public.auction_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE UNIQUE,
    player_order JSONB,
    is_captain_bidding BOOLEAN DEFAULT FALSE,
    auction_mode VARCHAR(20) CHECK (auction_mode IN ('host_controlled', 'captain_bidding')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Auction bids table (realtime)
CREATE TABLE IF NOT EXISTS public.auction_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    bid_amount DECIMAL(10,2) NOT NULL,
    bidder_user_id UUID REFERENCES public.users(id),
    is_winning_bid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Team players table (final auction results)
CREATE TABLE IF NOT EXISTS public.team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    final_bid_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime for auction tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
