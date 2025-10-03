-- Fix admin role support with correct column names
-- This script adds admin role and comprehensive RLS policies

-- First, update the role constraint to include 'admin'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('viewer', 'host', 'captain', 'admin'));

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is host of a tournament
CREATE OR REPLACE FUNCTION is_tournament_host(tournament_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tournaments 
    WHERE id = tournament_id AND host_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is captain of a team
CREATE OR REPLACE FUNCTION is_team_captain(team_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teams 
    WHERE id = team_id AND captain_user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to recreate them with admin support
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Hosts can manage their tournaments" ON tournaments;
DROP POLICY IF EXISTS "Authenticated users can view tournaments" ON tournaments;
DROP POLICY IF EXISTS "Hosts can manage tournament slots" ON tournament_slots;
DROP POLICY IF EXISTS "Authenticated users can view tournament slots" ON tournament_slots;
DROP POLICY IF EXISTS "Captains can place bids" ON auction_bids;
DROP POLICY IF EXISTS "Authenticated users can view bids" ON auction_bids;
DROP POLICY IF EXISTS "Hosts can manage teams" ON teams;
DROP POLICY IF EXISTS "Captains can update their team" ON teams;
DROP POLICY IF EXISTS "Authenticated users can view teams" ON teams;

-- Users table policies with admin support
CREATE POLICY "Users can view their own profile or admins can view all" ON users
  FOR SELECT USING (
    auth.uid() = id OR is_admin(auth.uid())
  );

CREATE POLICY "Users can update their own profile or admins can update all" ON users
  FOR UPDATE USING (
    auth.uid() = id OR is_admin(auth.uid())
  );

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (is_admin(auth.uid()));

-- Tournaments table policies with admin support
CREATE POLICY "Hosts and admins can manage tournaments" ON tournaments
  FOR ALL USING (
    host_id = auth.uid() OR is_admin(auth.uid())
  );

CREATE POLICY "Authenticated users can view tournaments" ON tournaments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Tournament slots policies with admin support
CREATE POLICY "Hosts and admins can manage tournament slots" ON tournament_slots
  FOR ALL USING (
    is_tournament_host(tournament_id, auth.uid()) OR is_admin(auth.uid())
  );

CREATE POLICY "Authenticated users can view tournament slots" ON tournament_slots
  FOR SELECT USING (auth.role() = 'authenticated');

-- Auction bids policies with admin support
CREATE POLICY "Captains and admins can place bids" ON auction_bids
  FOR INSERT WITH CHECK (
    is_team_captain(team_id, auth.uid()) OR is_admin(auth.uid())
  );

CREATE POLICY "Authenticated users can view bids" ON auction_bids
  FOR SELECT USING (auth.role() = 'authenticated');

-- Teams policies with admin support
CREATE POLICY "Hosts and admins can manage teams" ON teams
  FOR ALL USING (
    is_tournament_host(tournament_id, auth.uid()) OR is_admin(auth.uid())
  );

CREATE POLICY "Captains and admins can update their team" ON teams
  FOR UPDATE USING (
    captain_user_id = auth.uid() OR is_admin(auth.uid())
  );

CREATE POLICY "Authenticated users can view teams" ON teams
  FOR SELECT USING (auth.role() = 'authenticated');

-- Players table policies with admin support
CREATE POLICY "Admins can manage all players" ON players
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view players" ON players
  FOR SELECT USING (auth.role() = 'authenticated');

-- Tags table policies with admin support
CREATE POLICY "Admins can manage tags" ON tags
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view tags" ON tags
  FOR SELECT USING (auth.role() = 'authenticated');

-- Player tags policies with admin support
CREATE POLICY "Admins can manage player tags" ON player_tags
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view player tags" ON player_tags
  FOR SELECT USING (auth.role() = 'authenticated');

-- Auction config policies with admin support
CREATE POLICY "Admins can manage auction config" ON auction_config
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view auction config" ON auction_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- Team players policies with admin support
CREATE POLICY "Admins can manage team players" ON team_players
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view team players" ON team_players
  FOR SELECT USING (auth.role() = 'authenticated');

-- Waitlist policies with admin support
CREATE POLICY "Admins can manage waitlist" ON waitlist
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view waitlist" ON waitlist
  FOR SELECT USING (auth.role() = 'authenticated');

-- Update nishantarora's role to admin
UPDATE users 
SET role = 'admin', updated_at = NOW()
WHERE id = 'b8c70683-6c9b-4278-a2a3-0edc91b1f8e1';

-- Verify the update
SELECT id, email, role, updated_at FROM users WHERE id = 'b8c70683-6c9b-4278-a2a3-0edc91b1f8e1';
