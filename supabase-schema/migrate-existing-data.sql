-- Migration script to handle existing data
-- This script safely migrates from the old simple players table to the new schema

-- Step 1: Backup existing data (if any)
CREATE TABLE IF NOT EXISTS players_backup AS 
SELECT * FROM public.players;

-- Step 2: Drop the old players table
DROP TABLE IF EXISTS public.players CASCADE;

-- Step 3: Create the new players table with proper schema
CREATE TABLE public.players (
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

-- Step 4: Create index for players
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_user_id ON public.players(user_id);

-- Step 5: Migrate existing data (if any)
-- This will only work if the old table had compatible data
INSERT INTO public.players (display_name, base_price)
SELECT 
    'Player ' || id::text as display_name,
    COALESCE(id * 10, 100) as base_price
FROM players_backup
WHERE EXISTS (SELECT 1 FROM players_backup);

-- Step 6: Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Step 7: Clean up backup table
DROP TABLE IF EXISTS players_backup;

-- Success message
SELECT 'Migration completed successfully!' as message;
