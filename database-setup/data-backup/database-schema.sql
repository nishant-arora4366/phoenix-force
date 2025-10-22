-- Complete Database Schema
-- Generated: 2025-10-22T08:52:42.529Z
-- Source: Supabase Database

-- ==============================================
-- TABLE CREATION
-- ==============================================

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT,
  firstname TEXT,
  middlename JSONB,
  lastname TEXT,
  photo JSONB,
  password_hash TEXT,
  status TEXT
);

-- Table: players
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY,
  user_id JSONB,
  display_name TEXT,
  bio JSONB,
  profile_pic_url JSONB,
  mobile_number JSONB,
  cricheroes_profile_url JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT,
  created_by TEXT
);

-- Table: tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY,
  name TEXT,
  host_id UUID,
  host_player_id JSONB,
  status TEXT,
  total_slots NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  format TEXT,
  selected_teams NUMERIC,
  description TEXT,
  venue TEXT,
  google_maps_link TEXT,
  tournament_date TEXT,
  community_restrictions JSONB,
  base_price_restrictions JSONB,
  min_base_price JSONB,
  max_base_price JSONB,
  schedule_images JSONB,
  schedule_image_url TEXT,
  slug TEXT
);

-- Table: tournament_slots
CREATE TABLE IF NOT EXISTS tournament_slots (
  id UUID PRIMARY KEY,
  tournament_id UUID,
  player_id JSONB,
  status TEXT,
  is_host_assigned BOOLEAN,
  requested_at JSONB DEFAULT NOW(),
  confirmed_at JSONB DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE
);

-- Table: auctions
CREATE TABLE IF NOT EXISTS auctions (
  id UUID PRIMARY KEY,
  tournament_id UUID,
  status TEXT,
  max_tokens_per_captain NUMERIC,
  min_bid_amount NUMERIC,
  use_base_price BOOLEAN,
  min_increment NUMERIC,
  use_fixed_increments BOOLEAN,
  custom_increments JSONB,
  timer_seconds NUMERIC,
  player_order_type TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  auction_config JSONB
);

-- Table: auction_teams
CREATE TABLE IF NOT EXISTS auction_teams (
  id UUID PRIMARY KEY,
  auction_id UUID,
  captain_id UUID,
  captain_user_id JSONB,
  team_name TEXT,
  max_tokens NUMERIC,
  total_spent NUMERIC,
  remaining_purse NUMERIC,
  players_count NUMERIC,
  required_players NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: auction_players
CREATE TABLE IF NOT EXISTS auction_players (
  id UUID PRIMARY KEY,
  auction_id UUID,
  player_id UUID,
  status TEXT,
  sold_to TEXT,
  sold_price NUMERIC,
  display_order NUMERIC,
  times_skipped NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_player BOOLEAN,
  sold_at JSONB DEFAULT NOW()
);

-- Table: player_skills
CREATE TABLE IF NOT EXISTS player_skills (
  id UUID PRIMARY KEY,
  skill_name TEXT,
  skill_type TEXT,
  is_required BOOLEAN,
  display_order NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin_managed BOOLEAN,
  viewer_can_see BOOLEAN
);

-- Table: player_skill_values
CREATE TABLE IF NOT EXISTS player_skill_values (
  id UUID PRIMARY KEY,
  skill_id UUID,
  value_name TEXT,
  display_order NUMERIC,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: player_skill_assignments
CREATE TABLE IF NOT EXISTS player_skill_assignments (
  id UUID PRIMARY KEY,
  player_id UUID,
  skill_id UUID,
  skill_value_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  value_array JSONB,
  skill_value_ids JSONB
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  data JSONB,
  read_at JSONB DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: api_usage_analytics
CREATE TABLE IF NOT EXISTS api_usage_analytics (
  id UUID PRIMARY KEY,
  route TEXT,
  method TEXT,
  user_id JSONB,
  user_role JSONB,
  ip_address TEXT,
  user_agent TEXT,
  response_status NUMERIC,
  response_time_ms NUMERIC,
  request_size_bytes NUMERIC,
  response_size_bytes NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users (updated_at);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players (user_id);
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players (created_at);
CREATE INDEX IF NOT EXISTS idx_players_updated_at ON players (updated_at);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_at ON tournaments (created_at);
CREATE INDEX IF NOT EXISTS idx_tournaments_updated_at ON tournaments (updated_at);
CREATE INDEX IF NOT EXISTS idx_tournament_slots_created_at ON tournament_slots (created_at);
CREATE INDEX IF NOT EXISTS idx_auctions_created_at ON auctions (created_at);
CREATE INDEX IF NOT EXISTS idx_auctions_updated_at ON auctions (updated_at);
CREATE INDEX IF NOT EXISTS idx_auction_teams_created_at ON auction_teams (created_at);
CREATE INDEX IF NOT EXISTS idx_auction_teams_updated_at ON auction_teams (updated_at);
CREATE INDEX IF NOT EXISTS idx_auction_players_created_at ON auction_players (created_at);
CREATE INDEX IF NOT EXISTS idx_auction_players_updated_at ON auction_players (updated_at);
CREATE INDEX IF NOT EXISTS idx_player_skills_created_at ON player_skills (created_at);
CREATE INDEX IF NOT EXISTS idx_player_skills_updated_at ON player_skills (updated_at);
CREATE INDEX IF NOT EXISTS idx_player_skill_values_created_at ON player_skill_values (created_at);
CREATE INDEX IF NOT EXISTS idx_player_skill_values_updated_at ON player_skill_values (updated_at);
CREATE INDEX IF NOT EXISTS idx_player_skill_assignments_created_at ON player_skill_assignments (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_updated_at ON notifications (updated_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_analytics_user_id ON api_usage_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_analytics_created_at ON api_usage_analytics (created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_analytics_updated_at ON api_usage_analytics (updated_at);