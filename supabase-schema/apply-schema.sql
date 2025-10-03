-- Phoenix Force Database Schema
-- Complete schema application script
-- Run this in your Supabase SQL Editor

-- ==============================================
-- 1. CORE TABLES
-- ==============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('viewer', 'host')) DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Players table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    display_name VARCHAR(255) NOT NULL,
    stage_name VARCHAR(255),
    bio TEXT,
    profile_pic_url TEXT,
    mobile_number VARCHAR(20),
    cricheroes_profile_url TEXT,
    base_price DECIMAL(10,2) DEFAULT 0,
    group_name VARCHAR(100),
    is_bowler BOOLEAN DEFAULT FALSE,
    is_batter BOOLEAN DEFAULT FALSE,
    is_wicket_keeper BOOLEAN DEFAULT FALSE,
    bowling_rating INTEGER CHECK (bowling_rating >= 0 AND bowling_rating <= 10),
    batting_rating INTEGER CHECK (batting_rating >= 0 AND batting_rating <= 10),
    wicket_keeping_rating INTEGER CHECK (wicket_keeping_rating >= 0 AND wicket_keeping_rating <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_user_id ON public.players(user_id);

-- Tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Player tags junction table
CREATE TABLE IF NOT EXISTS public.player_tags (
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (player_id, tag_id)
);

-- ==============================================
-- 2. TOURNAMENT TABLES
-- ==============================================

-- Tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    host_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    host_player_id UUID REFERENCES public.players(id),
    status VARCHAR(30) CHECK (status IN ('draft','registration_open','registration_closed','auction_started','auction_completed')) DEFAULT 'draft',
    total_slots INTEGER NOT NULL,
    min_bid_amount DECIMAL(10,2),
    min_increment DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_host ON public.tournaments(host_id);

-- Tournament slots table
CREATE TABLE IF NOT EXISTS public.tournament_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    slot_number INTEGER NOT NULL,
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    status VARCHAR(20) CHECK (status IN ('empty', 'pending', 'confirmed', 'waitlist')) DEFAULT 'empty',
    is_host_assigned BOOLEAN DEFAULT FALSE,
    requested_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tournament_slot UNIQUE (tournament_id, slot_number),
    CONSTRAINT unique_tournament_player UNIQUE (tournament_id, player_id)
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- 3. AUCTION AND TEAM TABLES
-- ==============================================

-- Teams table
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

-- Auction configuration table
CREATE TABLE IF NOT EXISTS public.auction_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE UNIQUE,
    player_order JSONB,
    is_captain_bidding BOOLEAN DEFAULT FALSE,
    auction_mode VARCHAR(20) CHECK (auction_mode IN ('host_controlled', 'captain_bidding')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auction bids table (realtime)
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

-- Team players table (final auction results)
CREATE TABLE IF NOT EXISTS public.team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    final_bid_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- 4. ENABLE RLS
-- ==============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_slots ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. ENABLE REALTIME
-- ==============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;

-- ==============================================
-- 6. STORAGE BUCKETS
-- ==============================================

-- Create player-profiles bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'player-profiles',
    'player-profiles',
    true,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 7. SAMPLE DATA
-- ==============================================

-- Insert sample tags
INSERT INTO public.tags (name) VALUES 
    ('All-rounder'),
    ('Aggressive'),
    ('Defensive'),
    ('Power Hitter'),
    ('Spin Bowler'),
    ('Fast Bowler'),
    ('Wicket Keeper'),
    ('Captain Material'),
    ('Experienced'),
    ('Young Talent')
ON CONFLICT (name) DO NOTHING;

-- Success message
SELECT 'Phoenix Force schema applied successfully!' as message;
