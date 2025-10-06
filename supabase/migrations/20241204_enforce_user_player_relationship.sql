-- Enforce 1:1 relationship between users and players
-- Each user can have at most 1 player profile
-- Players can exist without users (created by admins/hosts)

-- Add unique constraint on user_id in players table
-- This ensures each user can only have one player profile
-- First drop the constraint if it exists, then add it
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'players_user_id_unique' 
               AND table_name = 'players') THEN
        ALTER TABLE public.players DROP CONSTRAINT players_user_id_unique;
    END IF;
END $$;

ALTER TABLE public.players 
ADD CONSTRAINT players_user_id_unique UNIQUE (user_id);

-- Update the existing foreign key constraint to be more explicit
-- Allow NULL user_id (for admin-created players without user accounts)
ALTER TABLE public.players 
ALTER COLUMN user_id DROP NOT NULL;

-- Add a check constraint to ensure user_id is unique when not null
-- This is already handled by the unique constraint above, but let's be explicit
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'players_user_id_check' 
               AND table_name = 'players') THEN
        ALTER TABLE public.players DROP CONSTRAINT players_user_id_check;
    END IF;
END $$;

ALTER TABLE public.players 
ADD CONSTRAINT players_user_id_check 
CHECK (user_id IS NULL OR user_id IS NOT NULL);

-- Update RLS policies to reflect the new relationship
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own player profile" ON public.players;
DROP POLICY IF EXISTS "Users can update their own player profile" ON public.players;
DROP POLICY IF EXISTS "Users can create their own player profile" ON public.players;

-- Create new policies for the 1:1 relationship
-- Users can view their own player profile (if it exists)
CREATE POLICY "Users can view their own player profile" ON public.players 
FOR SELECT USING (
  user_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND id = auth.uid()
  )
);

-- Users can update their own player profile
CREATE POLICY "Users can update their own player profile" ON public.players 
FOR UPDATE USING (
  user_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND id = auth.uid()
  )
);

-- Users can create their own player profile (only if they don't have one)
CREATE POLICY "Users can create their own player profile" ON public.players 
FOR INSERT WITH CHECK (
  user_id IS NOT NULL AND 
  user_id = auth.uid() AND
  NOT EXISTS (
    SELECT 1 FROM players 
    WHERE user_id = auth.uid()
  )
);

-- Admins and hosts can manage all players
CREATE POLICY "Admins and hosts can manage all players" ON public.players 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'host')
    AND status = 'approved'
  )
);

-- Anyone can view approved players (for public display)
CREATE POLICY "Anyone can view approved players" ON public.players 
FOR SELECT USING (status = 'approved');
