-- Core Tables: users, players, tags, player_tags
-- This script creates the foundational tables for the Phoenix Force platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('viewer', 'host')) DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for users
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Players table
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

-- Create index for players
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_user_id ON public.players(user_id);

-- 3. Tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 4. Player tags junction table
CREATE TABLE IF NOT EXISTS public.player_tags (
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (player_id, tag_id)
);

-- Enable RLS on core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
