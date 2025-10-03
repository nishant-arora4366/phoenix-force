-- Tournament Tables: tournaments, tournament_slots, waitlist
-- This script creates tournament management tables

-- 1. Tournaments table
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

-- Create index for tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_host ON public.tournaments(host_id);

-- 2. Tournament slots table
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
    
    -- Unique constraints
    CONSTRAINT unique_tournament_slot UNIQUE (tournament_id, slot_number),
    CONSTRAINT unique_tournament_player UNIQUE (tournament_id, player_id)
);

-- 3. Waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tournament tables
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_slots ENABLE ROW LEVEL SECURITY;

-- Enable realtime for tournament_slots
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_slots;
