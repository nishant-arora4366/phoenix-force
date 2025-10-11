-- Phoenix Force Database Setup Script with Realtime Configuration
-- Run this script to set up the database from scratch with realtime enabled
-- Generated on: 2025-10-11T12:00:00.000Z

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- CREATE ALL TABLES
-- ==============================================

-- Create table: api_usage_analytics
CREATE TABLE IF NOT EXISTS api_usage_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  route text NOT NULL,
  method text NOT NULL,
  user_id uuid,
  user_role text,
  ip_address inet,
  user_agent text,
  response_status integer,
  response_time_ms integer,
  request_size_bytes integer,
  response_size_bytes integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create table: auction_bids
CREATE TABLE IF NOT EXISTS auction_bids (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid,
  player_id uuid,
  team_id uuid,
  bid_amount numeric NOT NULL,
  bidder_user_id uuid,
  is_winning_bid boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table: auction_config
CREATE TABLE IF NOT EXISTS auction_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid,
  player_order jsonb,
  is_captain_bidding boolean DEFAULT false,
  auction_mode character varying(20),
  created_at timestamp with time zone DEFAULT now()
);

-- Create table: auction_players
CREATE TABLE IF NOT EXISTS auction_players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL,
  player_id uuid NOT NULL,
  status character varying(50) DEFAULT 'available'::character varying,
  sold_to uuid,
  sold_price integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create table: auction_teams
CREATE TABLE IF NOT EXISTS auction_teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL,
  captain_id uuid NOT NULL,
  team_name character varying(255) NOT NULL,
  total_spent integer DEFAULT 0,
  remaining_purse integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create table: auctions
CREATE TABLE IF NOT EXISTS auctions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  status character varying(50) DEFAULT 'pending'::character varying,
  current_player_id uuid,
  current_bid integer DEFAULT 0,
  timer_seconds integer DEFAULT 30,
  total_purse integer DEFAULT 1000000,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create table: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type character varying(50) NOT NULL,
  title character varying(255) NOT NULL,
  message text NOT NULL,
  data jsonb,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create table: player_skill_assignments
CREATE TABLE IF NOT EXISTS player_skill_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid,
  skill_id uuid,
  skill_value_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  value_array ARRAY,
  skill_value_ids ARRAY
);

-- Create table: player_skill_values
CREATE TABLE IF NOT EXISTS player_skill_values (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  skill_id uuid,
  value_name character varying(100) NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create table: player_skills
CREATE TABLE IF NOT EXISTS player_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  skill_name character varying(100) NOT NULL,
  skill_type character varying(50) NOT NULL,
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_admin_managed boolean DEFAULT false,
  viewer_can_see boolean DEFAULT true
);

-- Create table: player_tags
CREATE TABLE IF NOT EXISTS player_tags (
  player_id uuid NOT NULL,
  tag_id uuid NOT NULL
);

-- Create table: players
CREATE TABLE IF NOT EXISTS players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  display_name character varying(255) NOT NULL,
  bio text,
  profile_pic_url text,
  mobile_number character varying(20),
  cricheroes_profile_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status character varying(20) DEFAULT 'pending'::character varying,
  created_by uuid
);

-- Create table: tags
CREATE TABLE IF NOT EXISTS tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL
);

-- Create table: team_players
CREATE TABLE IF NOT EXISTS team_players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid,
  player_id uuid,
  final_bid_amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table: teams
CREATE TABLE IF NOT EXISTS teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid,
  name character varying(255) NOT NULL,
  captain_id uuid,
  captain_user_id uuid,
  initial_budget numeric,
  budget_remaining numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table: tournament_slots
CREATE TABLE IF NOT EXISTS tournament_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid,
  player_id uuid,
  status character varying(20) DEFAULT 'empty'::character varying,
  is_host_assigned boolean DEFAULT false,
  requested_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table: tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  host_id uuid,
  host_player_id uuid,
  status character varying(30) DEFAULT 'draft'::character varying,
  total_slots integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  format character varying(50) NOT NULL,
  selected_teams integer NOT NULL,
  description text,
  venue text,
  google_maps_link text,
  tournament_date timestamp with time zone,
  community_restrictions ARRAY,
  base_price_restrictions ARRAY,
  min_base_price numeric,
  max_base_price numeric
);

-- Create table: users
CREATE TABLE IF NOT EXISTS users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying(255) NOT NULL,
  role character varying(20) DEFAULT 'viewer'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  username character varying(50),
  firstname character varying(100) NOT NULL DEFAULT ''::character varying,
  middlename character varying(100),
  lastname character varying(100) NOT NULL DEFAULT ''::character varying,
  photo text,
  password_hash character varying(255),
  status character varying(20) DEFAULT 'pending'::character varying
);

-- Create table: waitlist
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid,
  player_id uuid,
  position integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ==============================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE api_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_skill_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_skill_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- REALTIME PUBLICATIONS
-- ==============================================

-- Create main realtime publication (if not exists)
CREATE PUBLICATION IF NOT EXISTS supabase_realtime
FOR ALL TABLES
WITH (publish = 'insert, update, delete');

-- Create realtime messages publication (if not exists)
CREATE PUBLICATION IF NOT EXISTS supabase_realtime_messages_publication
FOR ALL TABLES
WITH (publish = 'insert, update, delete');

-- ==============================================
-- ENABLE REALTIME FOR SPECIFIC TABLES
-- ==============================================

-- Enable realtime for notifications table (user notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable realtime for tournament_slots table (slot updates)
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_slots;

-- Enable realtime for tournaments table (tournament updates)
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;

-- ==============================================
-- SETUP COMPLETE
-- ==============================================

-- Database setup complete with realtime configuration
-- 
-- Realtime Publications:
-- - supabase_realtime (main publication)
-- - supabase_realtime_messages_publication (messages)
--
-- Tables with realtime enabled:
-- - notifications (for real-time user notifications)
-- - tournament_slots (for real-time slot updates)
-- - tournaments (for real-time tournament updates)
--
-- Realtime operations enabled:
-- - INSERT: New records will be broadcast
-- - UPDATE: Record changes will be broadcast
-- - DELETE: Record deletions will be broadcast
