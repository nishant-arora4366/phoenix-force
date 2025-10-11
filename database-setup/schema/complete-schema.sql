-- Phoenix Force Database Schema
-- Generated from real Supabase database
-- Generated on: 2025-10-11T11:52:21.742Z

-- ==============================================
-- EXTENSIONS
-- ==============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- TABLES
-- ==============================================

-- Table: api_usage_analytics
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

-- Table: auction_bids
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

-- Table: auction_config
CREATE TABLE IF NOT EXISTS auction_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid,
  player_order jsonb,
  is_captain_bidding boolean DEFAULT false,
  auction_mode character varying(20),
  created_at timestamp with time zone DEFAULT now()
);

-- Table: auction_players
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

-- Table: auction_teams
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

-- Table: auctions
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

-- Table: notifications
-- User notifications for real-time updates
CREATE TABLE IF NOT EXISTS notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type character varying(50) NOT NULL -- Type of notification (waitlist_promotion, slot_approved, etc.),
  title character varying(255) NOT NULL,
  message text NOT NULL,
  data jsonb -- Additional data for the notification,
  read_at timestamp with time zone -- When the notification was read (NULL if unread),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: player_skill_assignments
CREATE TABLE IF NOT EXISTS player_skill_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid,
  skill_id uuid,
  skill_value_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  value_array ARRAY,
  skill_value_ids ARRAY
);

-- Table: player_skill_values
CREATE TABLE IF NOT EXISTS player_skill_values (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  skill_id uuid,
  value_name character varying(100) NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: player_skills
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

-- Table: player_tags
CREATE TABLE IF NOT EXISTS player_tags (
  player_id uuid NOT NULL,
  tag_id uuid NOT NULL
);

-- Table: players
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
  created_by uuid -- User ID of the user who created this player record. Used for access control - hosts can only edit/delete players they created.
);

-- Table: tags
CREATE TABLE IF NOT EXISTS tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL
);

-- Table: team_players
CREATE TABLE IF NOT EXISTS team_players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid,
  player_id uuid,
  final_bid_amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: teams
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

-- Table: tournament_slots
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

-- Table: tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  host_id uuid -- User ID of the tournament host,
  host_player_id uuid,
  status character varying(30) DEFAULT 'draft'::character varying,
  total_slots integer NOT NULL -- Total number of player slots available,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  format character varying(50) NOT NULL -- Tournament format: Bilateral, TriSeries, Quad, 6 Team, 8 Team, etc.,
  selected_teams integer NOT NULL -- Number of teams selected for this tournament,
  description text -- Description of the tournament,
  venue text -- Physical location or venue name for the tournament,
  google_maps_link text -- Google Maps URL or link to the tournament venue location,
  tournament_date timestamp with time zone -- Date and time when the tournament will be held,
  community_restrictions ARRAY -- Array of allowed community values for tournament registration,
  base_price_restrictions ARRAY -- Array of allowed base price values for tournament registration,
  min_base_price numeric -- Minimum base price allowed for tournament registration,
  max_base_price numeric -- Maximum base price allowed for tournament registration
);

-- Table: users
-- Auth: Stores user login data within a secure schema.
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

-- Table: users
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

-- Table: waitlist
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid,
  player_id uuid,
  position integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ==============================================
-- FOREIGN KEYS
-- ==============================================

-- Foreign key: api_usage_analytics_user_id_fkey
ALTER TABLE api_usage_analytics ADD CONSTRAINT api_usage_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Foreign key: auction_bids_bidder_user_id_fkey
ALTER TABLE auction_bids ADD CONSTRAINT auction_bids_bidder_user_id_fkey FOREIGN KEY (bidder_user_id) REFERENCES users(id);

-- Foreign key: auction_bids_player_id_fkey
ALTER TABLE auction_bids ADD CONSTRAINT auction_bids_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);

-- Foreign key: auction_bids_team_id_fkey
ALTER TABLE auction_bids ADD CONSTRAINT auction_bids_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id);

-- Foreign key: auction_bids_tournament_id_fkey
ALTER TABLE auction_bids ADD CONSTRAINT auction_bids_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id);

-- Foreign key: auction_config_tournament_id_fkey
ALTER TABLE auction_config ADD CONSTRAINT auction_config_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id);

-- Foreign key: auction_players_auction_id_fkey
ALTER TABLE auction_players ADD CONSTRAINT auction_players_auction_id_fkey FOREIGN KEY (auction_id) REFERENCES auctions(id);

-- Foreign key: auction_players_player_id_fkey
ALTER TABLE auction_players ADD CONSTRAINT auction_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);

-- Foreign key: auction_players_sold_to_fkey
ALTER TABLE auction_players ADD CONSTRAINT auction_players_sold_to_fkey FOREIGN KEY (sold_to) REFERENCES players(id);

-- Foreign key: auction_teams_auction_id_fkey
ALTER TABLE auction_teams ADD CONSTRAINT auction_teams_auction_id_fkey FOREIGN KEY (auction_id) REFERENCES auctions(id);

-- Foreign key: auction_teams_captain_id_fkey
ALTER TABLE auction_teams ADD CONSTRAINT auction_teams_captain_id_fkey FOREIGN KEY (captain_id) REFERENCES players(id);

-- Foreign key: auctions_current_player_id_fkey
ALTER TABLE auctions ADD CONSTRAINT auctions_current_player_id_fkey FOREIGN KEY (current_player_id) REFERENCES players(id);

-- Foreign key: auctions_tournament_id_fkey
ALTER TABLE auctions ADD CONSTRAINT auctions_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id);

-- Foreign key: notifications_user_id_fkey
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Foreign key: player_skill_assignments_player_id_fkey
ALTER TABLE player_skill_assignments ADD CONSTRAINT player_skill_assignments_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);

-- Foreign key: player_skill_assignments_skill_id_fkey
ALTER TABLE player_skill_assignments ADD CONSTRAINT player_skill_assignments_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES player_skills(id);

-- Foreign key: player_skill_assignments_skill_value_id_fkey
ALTER TABLE player_skill_assignments ADD CONSTRAINT player_skill_assignments_skill_value_id_fkey FOREIGN KEY (skill_value_id) REFERENCES player_skill_values(id);

-- Foreign key: player_skill_values_skill_id_fkey
ALTER TABLE player_skill_values ADD CONSTRAINT player_skill_values_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES player_skills(id);

-- Foreign key: player_tags_player_id_fkey
ALTER TABLE player_tags ADD CONSTRAINT player_tags_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);

-- Foreign key: player_tags_tag_id_fkey
ALTER TABLE player_tags ADD CONSTRAINT player_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id);

-- Foreign key: players_created_by_fkey
ALTER TABLE players ADD CONSTRAINT players_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);

-- Foreign key: players_user_id_fkey
ALTER TABLE players ADD CONSTRAINT players_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Foreign key: team_players_player_id_fkey
ALTER TABLE team_players ADD CONSTRAINT team_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);

-- Foreign key: team_players_team_id_fkey
ALTER TABLE team_players ADD CONSTRAINT team_players_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id);

-- Foreign key: teams_captain_id_fkey
ALTER TABLE teams ADD CONSTRAINT teams_captain_id_fkey FOREIGN KEY (captain_id) REFERENCES players(id);

-- Foreign key: teams_captain_user_id_fkey
ALTER TABLE teams ADD CONSTRAINT teams_captain_user_id_fkey FOREIGN KEY (captain_user_id) REFERENCES users(id);

-- Foreign key: teams_tournament_id_fkey
ALTER TABLE teams ADD CONSTRAINT teams_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id);

-- Foreign key: tournament_slots_player_id_fkey
ALTER TABLE tournament_slots ADD CONSTRAINT tournament_slots_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);

-- Foreign key: tournament_slots_tournament_id_fkey
ALTER TABLE tournament_slots ADD CONSTRAINT tournament_slots_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id);

-- Foreign key: tournaments_host_id_fkey
ALTER TABLE tournaments ADD CONSTRAINT tournaments_host_id_fkey FOREIGN KEY (host_id) REFERENCES users(id);

-- Foreign key: tournaments_host_player_id_fkey
ALTER TABLE tournaments ADD CONSTRAINT tournaments_host_player_id_fkey FOREIGN KEY (host_player_id) REFERENCES players(id);

-- Foreign key: waitlist_player_id_fkey
ALTER TABLE waitlist ADD CONSTRAINT waitlist_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);

-- Foreign key: waitlist_tournament_id_fkey
ALTER TABLE waitlist ADD CONSTRAINT waitlist_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id);

-- ==============================================
-- INDEXES
-- ==============================================

-- Index: api_usage_analytics_created_at_idx
CREATE INDEX api_usage_analytics_created_at_idx ON public.api_usage_analytics USING btree (created_at);

-- Index: api_usage_analytics_pkey
CREATE UNIQUE INDEX api_usage_analytics_pkey ON public.api_usage_analytics USING btree (id);

-- Index: api_usage_analytics_response_status_idx
CREATE INDEX api_usage_analytics_response_status_idx ON public.api_usage_analytics USING btree (response_status);

-- Index: api_usage_analytics_route_method_created_at_idx
CREATE INDEX api_usage_analytics_route_method_created_at_idx ON public.api_usage_analytics USING btree (route, method, created_at);

-- Index: api_usage_analytics_route_method_idx
CREATE INDEX api_usage_analytics_route_method_idx ON public.api_usage_analytics USING btree (route, method);

-- Index: api_usage_analytics_user_id_idx
CREATE INDEX api_usage_analytics_user_id_idx ON public.api_usage_analytics USING btree (user_id);

-- Index: api_usage_analytics_user_role_idx
CREATE INDEX api_usage_analytics_user_role_idx ON public.api_usage_analytics USING btree (user_role);

-- Index: auction_bids_pkey
CREATE UNIQUE INDEX auction_bids_pkey ON public.auction_bids USING btree (id);

-- Index: idx_auction_bids_created_at
CREATE INDEX idx_auction_bids_created_at ON public.auction_bids USING btree (created_at DESC);

-- Index: idx_auction_bids_player_id
CREATE INDEX idx_auction_bids_player_id ON public.auction_bids USING btree (player_id);

-- Index: idx_auction_bids_team_id
CREATE INDEX idx_auction_bids_team_id ON public.auction_bids USING btree (team_id);

-- Index: idx_auction_bids_tournament_id
CREATE INDEX idx_auction_bids_tournament_id ON public.auction_bids USING btree (tournament_id);

-- Index: auction_config_pkey
CREATE UNIQUE INDEX auction_config_pkey ON public.auction_config USING btree (id);

-- Index: auction_config_tournament_id_key
CREATE UNIQUE INDEX auction_config_tournament_id_key ON public.auction_config USING btree (tournament_id);

-- Index: auction_players_auction_id_player_id_key
CREATE UNIQUE INDEX auction_players_auction_id_player_id_key ON public.auction_players USING btree (auction_id, player_id);

-- Index: auction_players_pkey
CREATE UNIQUE INDEX auction_players_pkey ON public.auction_players USING btree (id);

-- Index: idx_auction_players_auction_id
CREATE INDEX idx_auction_players_auction_id ON public.auction_players USING btree (auction_id);

-- Index: idx_auction_players_status
CREATE INDEX idx_auction_players_status ON public.auction_players USING btree (status);

-- Index: auction_teams_auction_id_captain_id_key
CREATE UNIQUE INDEX auction_teams_auction_id_captain_id_key ON public.auction_teams USING btree (auction_id, captain_id);

-- Index: auction_teams_pkey
CREATE UNIQUE INDEX auction_teams_pkey ON public.auction_teams USING btree (id);

-- Index: idx_auction_teams_auction_id
CREATE INDEX idx_auction_teams_auction_id ON public.auction_teams USING btree (auction_id);

-- Index: idx_auction_teams_captain_id
CREATE INDEX idx_auction_teams_captain_id ON public.auction_teams USING btree (captain_id);

-- Index: auctions_pkey
CREATE UNIQUE INDEX auctions_pkey ON public.auctions USING btree (id);

-- Index: idx_notifications_created_at
CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);

-- Index: idx_notifications_read_at
CREATE INDEX idx_notifications_read_at ON public.notifications USING btree (read_at);

-- Index: idx_notifications_type
CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);

-- Index: idx_notifications_user_id
CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

-- Index: notifications_pkey
CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

-- Index: idx_player_skill_assignments_player_id
CREATE INDEX idx_player_skill_assignments_player_id ON public.player_skill_assignments USING btree (player_id);

-- Index: idx_player_skill_assignments_skill_id
CREATE INDEX idx_player_skill_assignments_skill_id ON public.player_skill_assignments USING btree (skill_id);

-- Index: player_skill_assignments_pkey
CREATE UNIQUE INDEX player_skill_assignments_pkey ON public.player_skill_assignments USING btree (id);

-- Index: player_skill_assignments_player_id_skill_id_key
CREATE UNIQUE INDEX player_skill_assignments_player_id_skill_id_key ON public.player_skill_assignments USING btree (player_id, skill_id);

-- Index: idx_player_skill_values_skill_id
CREATE INDEX idx_player_skill_values_skill_id ON public.player_skill_values USING btree (skill_id);

-- Index: player_skill_values_pkey
CREATE UNIQUE INDEX player_skill_values_pkey ON public.player_skill_values USING btree (id);

-- Index: player_skill_values_skill_id_value_name_key
CREATE UNIQUE INDEX player_skill_values_skill_id_value_name_key ON public.player_skill_values USING btree (skill_id, value_name);

-- Index: player_skills_pkey
CREATE UNIQUE INDEX player_skills_pkey ON public.player_skills USING btree (id);

-- Index: player_skills_skill_name_key
CREATE UNIQUE INDEX player_skills_skill_name_key ON public.player_skills USING btree (skill_name);

-- Index: player_tags_pkey
CREATE UNIQUE INDEX player_tags_pkey ON public.player_tags USING btree (player_id, tag_id);

-- Index: idx_players_created_by
CREATE INDEX idx_players_created_by ON public.players USING btree (created_by);

-- Index: idx_players_status
CREATE INDEX idx_players_status ON public.players USING btree (status);

-- Index: idx_players_user_id
CREATE UNIQUE INDEX idx_players_user_id ON public.players USING btree (user_id);

-- Index: players_pkey
CREATE UNIQUE INDEX players_pkey ON public.players USING btree (id);

-- Index: tags_name_key
CREATE UNIQUE INDEX tags_name_key ON public.tags USING btree (name);

-- Index: tags_pkey
CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

-- Index: team_players_pkey
CREATE UNIQUE INDEX team_players_pkey ON public.team_players USING btree (id);

-- Index: teams_pkey
CREATE UNIQUE INDEX teams_pkey ON public.teams USING btree (id);

-- Index: idx_tournament_slots_player_status
CREATE INDEX idx_tournament_slots_player_status ON public.tournament_slots USING btree (player_id, status);

-- Index: tournament_slots_pkey
CREATE UNIQUE INDEX tournament_slots_pkey ON public.tournament_slots USING btree (id);

-- Index: unique_tournament_player
CREATE UNIQUE INDEX unique_tournament_player ON public.tournament_slots USING btree (tournament_id, player_id);

-- Index: idx_tournaments_base_price_restrictions
CREATE INDEX idx_tournaments_base_price_restrictions ON public.tournaments USING gin (base_price_restrictions);

-- Index: idx_tournaments_community_restrictions
CREATE INDEX idx_tournaments_community_restrictions ON public.tournaments USING gin (community_restrictions);

-- Index: idx_tournaments_datetime
CREATE INDEX idx_tournaments_datetime ON public.tournaments USING btree (tournament_date);

-- Index: idx_tournaments_format
CREATE INDEX idx_tournaments_format ON public.tournaments USING btree (format);

-- Index: idx_tournaments_host
CREATE INDEX idx_tournaments_host ON public.tournaments USING btree (host_id);

-- Index: idx_tournaments_price_range
CREATE INDEX idx_tournaments_price_range ON public.tournaments USING btree (min_base_price, max_base_price);

-- Index: idx_tournaments_selected_teams
CREATE INDEX idx_tournaments_selected_teams ON public.tournaments USING btree (selected_teams);

-- Index: tournaments_pkey
CREATE UNIQUE INDEX tournaments_pkey ON public.tournaments USING btree (id);

-- Index: idx_users_email
CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email);

-- Index: idx_users_status
CREATE INDEX idx_users_status ON public.users USING btree (status);

-- Index: idx_users_username
CREATE INDEX idx_users_username ON public.users USING btree (username);

-- Index: users_email_key
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

-- Index: users_pkey
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

-- Index: users_username_key
CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);

-- Index: waitlist_pkey
CREATE UNIQUE INDEX waitlist_pkey ON public.waitlist USING btree (id);

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Function: cancel_slot_reservation

DECLARE
    v_slot RECORD;
BEGIN
    -- Get slot details
    SELECT * INTO v_slot 
    FROM tournament_slots 
    WHERE id = p_slot_id 
    AND tournament_id = p_tournament_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Slot not found'
        );
    END IF;
    
    -- Check if slot can be cancelled (only pending slots)
    IF v_slot.status != 'pending' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Only pending slots can be cancelled',
            'current_status', v_slot.status
        );
    END IF;
    
    -- Cancel the slot
    UPDATE tournament_slots 
    SET 
        player_id = NULL,
        status = 'empty',
        requested_at = NULL
    WHERE id = p_slot_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Slot reservation cancelled',
        'slot_id', p_slot_id,
        'tournament_id', p_tournament_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to cancel slot: ' || SQLERRM
        );
END;


-- Function: cleanup_old_api_analytics

BEGIN
    -- Delete analytics data older than 90 days
    DELETE FROM public.api_usage_analytics 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;


-- Function: confirm_slot

DECLARE
    v_tournament RECORD;
    v_slot RECORD;
    v_result JSON;
BEGIN
    -- Start transaction
    BEGIN
        -- Validate tournament exists and is in correct phase
        SELECT * INTO v_tournament 
        FROM tournaments 
        WHERE id = p_tournament_id;
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Tournament not found',
                'tournament_id', p_tournament_id
            );
        END IF;
        
        -- Get slot details
        SELECT * INTO v_slot 
        FROM tournament_slots 
        WHERE id = p_slot_id 
        AND tournament_id = p_tournament_id;
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Slot not found',
                'slot_id', p_slot_id
            );
        END IF;
        
        -- Check if slot is in pending status
        IF v_slot.status != 'pending' THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Slot is not in pending status',
                'current_status', v_slot.status
            );
        END IF;
        
        -- Confirm the slot
        UPDATE tournament_slots 
        SET 
            status = 'confirmed',
            confirmed_at = NOW()
        WHERE id = p_slot_id;
        
        -- Return success
        RETURN json_build_object(
            'success', true,
            'message', 'Slot confirmed successfully',
            'tournament_id', p_tournament_id,
            'slot_id', p_slot_id,
            'player_id', v_slot.player_id,
            'slot_number', v_slot.slot_number,
            'status', 'confirmed'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Failed to confirm slot: ' || SQLERRM,
                'tournament_id', p_tournament_id,
                'slot_id', p_slot_id
            );
    END;
END;


-- Function: finalize_auction

DECLARE
    v_tournament RECORD;
    v_winning_bids JSON;
    v_team_budget_updates JSON;
    v_finalized_count INTEGER := 0;
    v_total_budget_deducted DECIMAL(10,2) := 0;
    v_result JSON;
    v_bid JSON;
    v_team RECORD;
    v_existing_allocation RECORD;
    v_bid_record RECORD;
BEGIN
    -- Start transaction
    BEGIN
        -- Validate tournament exists and is in correct status
        SELECT * INTO v_tournament 
        FROM tournaments 
        WHERE id = p_tournament_id;
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Tournament not found',
                'tournament_id', p_tournament_id
            );
        END IF;
        
        -- Check if tournament is in auction_started status
        IF v_tournament.status != 'auction_started' THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Tournament is not in auction_started status',
                'current_status', v_tournament.status,
                'tournament_id', p_tournament_id
            );
        END IF;
        
        -- Check if user has permission to finalize auction
        -- Only tournament host or admin can finalize
        IF NOT EXISTS (
            SELECT 1 FROM users 
            WHERE id = p_user_id 
            AND (role = 'admin' OR id = v_tournament.host_id)
        ) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Insufficient permissions to finalize auction',
                'user_id', p_user_id
            );
        END IF;
        
        -- Get all winning bids (highest bid per player) using a simpler approach
        WITH winning_bids AS (
            SELECT DISTINCT ON (ab.player_id)
                ab.id as bid_id,
                ab.tournament_id,
                ab.player_id,
                ab.team_id,
                ab.bid_amount,
                ab.bidder_user_id,
                ab.created_at,
                t.name as team_name,
                t.budget_remaining,
                p.display_name as player_name
            FROM auction_bids ab
            JOIN teams t ON ab.team_id = t.id
            JOIN players p ON ab.player_id = p.id
            WHERE ab.tournament_id = p_tournament_id
            ORDER BY ab.player_id, ab.bid_amount DESC, ab.created_at ASC
        )
        SELECT COALESCE(
            json_agg(
                json_build_object(
                    'bid_id', bid_id,
                    'tournament_id', tournament_id,
                    'player_id', player_id,
                    'team_id', team_id,
                    'bid_amount', bid_amount,
                    'bidder_user_id', bidder_user_id,
                    'team_name', team_name,
                    'budget_remaining', budget_remaining,
                    'player_name', player_name,
                    'created_at', created_at
                )
            ), 
            '[]'::json
        ) INTO v_winning_bids
        FROM winning_bids;
        
        -- Check if there are any winning bids
        IF v_winning_bids IS NULL OR json_array_length(v_winning_bids) = 0 THEN
            RETURN json_build_object(
                'success', false,
                'error', 'No winning bids found for this tournament',
                'tournament_id', p_tournament_id
            );
        END IF;
        
        -- Validate that all teams have sufficient budget for their winning bids
        FOR v_bid_record IN 
            SELECT * FROM json_to_recordset(v_winning_bids) AS x(
                bid_id UUID,
                tournament_id UUID,
                player_id UUID,
                team_id UUID,
                bid_amount DECIMAL,
                bidder_user_id UUID,
                team_name TEXT,
                budget_remaining DECIMAL,
                player_name TEXT,
                created_at TIMESTAMPTZ
            )
        LOOP
            -- Check if team has sufficient budget
            IF v_bid_record.budget_remaining IS NULL OR 
               v_bid_record.budget_remaining < v_bid_record.bid_amount THEN
                RETURN json_build_object(
                    'success', false,
                    'error', 'Insufficient budget for team allocation',
                    'team_id', v_bid_record.team_id,
                    'team_name', v_bid_record.team_name,
                    'required_amount', v_bid_record.bid_amount,
                    'available_budget', v_bid_record.budget_remaining
                );
            END IF;
        END LOOP;
        
        -- Clear existing team_players allocations for this tournament
        DELETE FROM team_players 
        WHERE team_id IN (
            SELECT id FROM teams WHERE tournament_id = p_tournament_id
        );
        
        -- Process each winning bid
        FOR v_bid_record IN 
            SELECT * FROM json_to_recordset(v_winning_bids) AS x(
                bid_id UUID,
                tournament_id UUID,
                player_id UUID,
                team_id UUID,
                bid_amount DECIMAL,
                bidder_user_id UUID,
                team_name TEXT,
                budget_remaining DECIMAL,
                player_name TEXT,
                created_at TIMESTAMPTZ
            )
        LOOP
            -- Insert into team_players (final allocation)
            INSERT INTO team_players (
                team_id,
                player_id,
                final_bid_amount,
                created_at
            ) VALUES (
                v_bid_record.team_id,
                v_bid_record.player_id,
                v_bid_record.bid_amount,
                NOW()
            );
            
            -- Update team budget
            UPDATE teams 
            SET 
                budget_remaining = budget_remaining - v_bid_record.bid_amount,
                updated_at = NOW()
            WHERE id = v_bid_record.team_id;
            
            -- Update auction_bids to mark as winning
            UPDATE auction_bids 
            SET is_winning_bid = TRUE
            WHERE id = v_bid_record.bid_id;
            
            v_finalized_count := v_finalized_count + 1;
            v_total_budget_deducted := v_total_budget_deducted + v_bid_record.bid_amount;
        END LOOP;
        
        -- Update tournament status to auction_completed
        UPDATE tournaments 
        SET 
            status = 'auction_completed',
            updated_at = NOW()
        WHERE id = p_tournament_id;
        
        -- Get final team budget summary
        SELECT COALESCE(
            json_agg(
                json_build_object(
                    'team_id', t.id,
                    'team_name', t.name,
                    'initial_budget', t.initial_budget,
                    'budget_remaining', t.budget_remaining,
                    'total_spent', t.initial_budget - t.budget_remaining,
                    'players_count', (
                        SELECT COUNT(*) 
                        FROM team_players tp 
                        WHERE tp.team_id = t.id
                    )
                )
            ),
            '[]'::json
        ) INTO v_team_budget_updates
        FROM teams t
        WHERE t.tournament_id = p_tournament_id;
        
        -- Return comprehensive results
        RETURN json_build_object(
            'success', true,
            'message', 'Auction finalized successfully',
            'tournament_id', p_tournament_id,
            'tournament_name', v_tournament.name,
            'finalized_players', v_finalized_count,
            'total_budget_deducted', v_total_budget_deducted,
            'winning_bids', v_winning_bids,
            'team_summaries', v_team_budget_updates,
            'finalized_at', NOW()
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback on any error
            RETURN json_build_object(
                'success', false,
                'error', 'Failed to finalize auction: ' || SQLERRM,
                'tournament_id', p_tournament_id,
                'details', SQLSTATE
            );
    END;
END;


-- Function: generate_username_from_email

BEGIN
  RETURN LOWER(SPLIT_PART(email, '@', 1));
END;


-- Function: get_api_usage_stats

BEGIN
    RETURN QUERY
    SELECT 
        aua.route,
        aua.method,
        COUNT(*) as total_requests,
        COUNT(DISTINCT aua.user_id) as unique_users,
        ROUND(AVG(aua.response_time_ms), 2) as avg_response_time_ms,
        ROUND(
            (COUNT(*) FILTER (WHERE aua.response_status >= 200 AND aua.response_status < 300))::NUMERIC / 
            COUNT(*)::NUMERIC * 100, 2
        ) as success_rate,
        COUNT(*) FILTER (WHERE aua.response_status >= 400) as total_errors
    FROM public.api_usage_analytics aua
    WHERE aua.created_at BETWEEN start_date AND end_date
    GROUP BY aua.route, aua.method
    ORDER BY total_requests DESC;
END;


-- Function: get_auction_results

DECLARE
    v_tournament RECORD;
    v_results JSON;
BEGIN
    -- Get tournament details
    SELECT * INTO v_tournament 
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Tournament not found'
        );
    END IF;
    
    -- Get final auction results
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'team_id', t.id,
                'team_name', t.name,
                'captain_name', p.display_name,
                'initial_budget', t.initial_budget,
                'budget_remaining', t.budget_remaining,
                'total_spent', t.initial_budget - t.budget_remaining,
                'players', (
                    SELECT COALESCE(
                        json_agg(
                            json_build_object(
                                'player_id', tp.player_id,
                                'player_name', pl.display_name,
                                'final_bid_amount', tp.final_bid_amount,
                                'allocated_at', tp.created_at
                            )
                        ),
                        '[]'::json
                    )
                    FROM team_players tp
                    JOIN players pl ON tp.player_id = pl.id
                    WHERE tp.team_id = t.id
                )
            )
        ),
        '[]'::json
    ) INTO v_results
    FROM teams t
    LEFT JOIN players p ON t.captain_id = p.id
    WHERE t.tournament_id = p_tournament_id;
    
    RETURN json_build_object(
        'success', true,
        'tournament_id', p_tournament_id,
        'tournament_name', v_tournament.name,
        'tournament_status', v_tournament.status,
        'results', v_results,
        'total_teams', COALESCE(json_array_length(v_results), 0)
    );
END;


-- Function: get_auction_status

DECLARE
    v_tournament_status VARCHAR(30);
    v_active_bids JSON;
    v_teams JSON;
    v_result JSON;
BEGIN
    -- Get tournament status
    SELECT status INTO v_tournament_status
    FROM public.tournaments
    WHERE id = p_tournament_id;
    
    -- Get active bids
    SELECT json_agg(
        json_build_object(
            'player_id', player_id,
            'team_id', team_id,
            'bid_amount', bid_amount,
            'bidder_user_id', bidder_user_id,
            'is_winning_bid', is_winning_bid,
            'created_at', created_at
        )
    ) INTO v_active_bids
    FROM public.auction_bids
    WHERE tournament_id = p_tournament_id
    AND is_winning_bid = true;
    
    -- Get teams
    SELECT json_agg(
        json_build_object(
            'team_id', id,
            'name', name,
            'captain_user_id', captain_user_id,
            'budget_remaining', budget_remaining
        )
    ) INTO v_teams
    FROM public.teams
    WHERE tournament_id = p_tournament_id;
    
    -- Build result
    v_result := json_build_object(
        'tournament_id', p_tournament_id,
        'status', v_tournament_status,
        'active_bids', COALESCE(v_active_bids, '[]'::json),
        'teams', COALESCE(v_teams, '[]'::json)
    );
    
    RETURN v_result;
END;


-- Function: get_hourly_usage_patterns

BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM aua.created_at)::INTEGER as hour_of_day,
        COUNT(*) as total_requests,
        COUNT(DISTINCT aua.user_id) as unique_users,
        ROUND(AVG(aua.response_time_ms), 2) as avg_response_time_ms
    FROM public.api_usage_analytics aua
    WHERE aua.created_at BETWEEN start_date AND end_date
    GROUP BY EXTRACT(HOUR FROM aua.created_at)
    ORDER BY hour_of_day;
END;


-- Function: get_recommended_slots

BEGIN
  CASE tournament_format
    WHEN 'Bilateral' THEN RETURN 22; -- 11 players per team * 2 teams
    WHEN 'TriSeries' THEN RETURN 33; -- 11 players per team * 3 teams
    WHEN 'Quad' THEN RETURN 44; -- 11 players per team * 4 teams
    WHEN '6 Team' THEN RETURN 66; -- 11 players per team * 6 teams
    WHEN '8 Team' THEN RETURN 88; -- 11 players per team * 8 teams
    WHEN '10 Team' THEN RETURN 110; -- 11 players per team * 10 teams
    WHEN '12 Team' THEN RETURN 132; -- 11 players per team * 12 teams
    WHEN '16 Team' THEN RETURN 176; -- 11 players per team * 16 teams
    WHEN '20 Team' THEN RETURN 220; -- 11 players per team * 20 teams
    WHEN '24 Team' THEN RETURN 264; -- 11 players per team * 24 teams
    WHEN '32 Team' THEN RETURN 352; -- 11 players per team * 32 teams
    ELSE RETURN 88; -- Default to 8 teams worth of slots
  END CASE;
END;


-- Function: get_recommended_teams

BEGIN
  CASE tournament_format
    WHEN 'Bilateral' THEN RETURN 2;
    WHEN 'TriSeries' THEN RETURN 3;
    WHEN 'Quad' THEN RETURN 4;
    WHEN '6 Team' THEN RETURN 6;
    WHEN '8 Team' THEN RETURN 8;
    WHEN '10 Team' THEN RETURN 10;
    WHEN '12 Team' THEN RETURN 12;
    WHEN '16 Team' THEN RETURN 16;
    WHEN '20 Team' THEN RETURN 20;
    WHEN '24 Team' THEN RETURN 24;
    WHEN '32 Team' THEN RETURN 32;
    ELSE RETURN 8; -- Default to 8 teams
  END CASE;
END;


-- Function: get_tournament_status

DECLARE
    v_tournament RECORD;
    v_slots_count INTEGER;
    v_confirmed_count INTEGER;
    v_pending_count INTEGER;
    v_waitlist_count INTEGER;
BEGIN
    -- Get tournament details
    SELECT * INTO v_tournament 
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Tournament not found'
        );
    END IF;
    
    -- Count slots by status
    SELECT 
        COUNT(*) as total_slots,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_slots,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_slots
    INTO v_slots_count, v_confirmed_count, v_pending_count
    FROM tournament_slots 
    WHERE tournament_id = p_tournament_id;
    
    -- Count waitlist
    SELECT COUNT(*) INTO v_waitlist_count
    FROM waitlist 
    WHERE tournament_id = p_tournament_id;
    
    RETURN json_build_object(
        'success', true,
        'tournament_id', p_tournament_id,
        'tournament_name', v_tournament.name,
        'status', v_tournament.status,
        'total_slots', v_tournament.total_slots,
        'filled_slots', v_slots_count,
        'confirmed_slots', v_confirmed_count,
        'pending_slots', v_pending_count,
        'available_slots', v_tournament.total_slots - v_slots_count,
        'waitlist_count', v_waitlist_count,
        'is_full', v_slots_count >= v_tournament.total_slots
    );
END;


-- Function: get_user_activity_stats

BEGIN
    RETURN QUERY
    SELECT 
        aua.user_id,
        u.email as user_email,
        aua.user_role,
        COUNT(*) as total_requests,
        COUNT(DISTINCT aua.route) as unique_routes,
        MAX(aua.created_at) as last_activity,
        ROUND(AVG(aua.response_time_ms), 2) as avg_response_time_ms
    FROM public.api_usage_analytics aua
    LEFT JOIN public.users u ON aua.user_id = u.id
    WHERE aua.created_at BETWEEN start_date AND end_date
    AND aua.user_id IS NOT NULL
    GROUP BY aua.user_id, u.email, aua.user_role
    ORDER BY total_requests DESC;
END;


-- Function: get_user_display_name

BEGIN
  IF user_record.username IS NOT NULL AND user_record.username != '' THEN
    RETURN user_record.username;
  ELSE
    RETURN get_user_full_name(user_record);
  END IF;
END;


-- Function: get_user_full_name

BEGIN
  RETURN CONCAT_WS(' ', 
    user_record.firstname,
    COALESCE(user_record.middlename, ''),
    user_record.lastname
  );
END;


-- Function: is_admin

BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND role = 'admin'
  );
END;


-- Function: is_team_captain

BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teams 
    WHERE id = team_id AND captain_user_id = user_id
  );
END;


-- Function: is_tournament_host

BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tournaments 
    WHERE id = tournament_id AND host_id = user_id
  );
END;


-- Function: manual_promote_waitlist

DECLARE
    v_total_slots INTEGER;
    v_first_waitlist_player RECORD;
    v_empty_main_slot INTEGER;
BEGIN
    -- Get tournament total slots
    SELECT total_slots INTO v_total_slots
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    -- Find the first empty main slot
    SELECT MIN(slot_number) INTO v_empty_main_slot
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND slot_number <= v_total_slots
      AND player_id IS NULL;
    
    -- If no empty main slot, return failure
    IF v_empty_main_slot IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::INTEGER, FALSE;
        RETURN;
    END IF;
    
    -- Find the first waitlist player
    SELECT * INTO v_first_waitlist_player
    FROM tournament_slots
    WHERE tournament_id = p_tournament_id
      AND slot_number > v_total_slots
      AND player_id IS NOT NULL
      AND status = 'waitlist'
    ORDER BY requested_at ASC
    LIMIT 1;
    
    -- If no waitlist player, return failure
    IF v_first_waitlist_player IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::INTEGER, FALSE;
        RETURN;
    END IF;
    
    -- Promote the waitlist player
    UPDATE tournament_slots
    SET slot_number = v_empty_main_slot,
        status = 'pending',
        updated_at = NOW()
    WHERE id = v_first_waitlist_player.id;
    
    -- Return success
    RETURN QUERY SELECT v_first_waitlist_player.player_id, v_empty_main_slot, TRUE;
END;


-- Function: mark_all_notifications_read

DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE notifications
    SET read_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND read_at IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;


-- Function: mark_notification_read

BEGIN
    UPDATE notifications
    SET read_at = NOW(),
        updated_at = NOW()
    WHERE id = p_notification_id
      AND user_id = auth.uid();
    
    RETURN FOUND;
END;


-- Function: place_bid

DECLARE
    v_bidder_user_id UUID;
    v_current_winning_bid DECIMAL(10,2);
    v_min_increment DECIMAL(10,2);
    v_tournament_status VARCHAR(30);
    v_is_captain BOOLEAN;
    v_team_budget DECIMAL(10,2);
    v_bid_id UUID;
    v_result JSON;
BEGIN
    -- Get the authenticated user
    v_bidder_user_id := auth.uid();
    
    -- Validate user is authenticated
    IF v_bidder_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;
    
    -- Check if user is captain of the team
    SELECT captain_user_id = v_bidder_user_id, budget_remaining
    INTO v_is_captain, v_team_budget
    FROM public.teams
    WHERE id = p_team_id;
    
    IF NOT v_is_captain THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Only team captains can place bids'
        );
    END IF;
    
    -- Check tournament status
    SELECT status, min_increment
    INTO v_tournament_status, v_min_increment
    FROM public.tournaments
    WHERE id = p_tournament_id;
    
    IF v_tournament_status != 'auction_started' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Auction is not active'
        );
    END IF;
    
    -- Get current winning bid for this player
    SELECT COALESCE(MAX(bid_amount), 0)
    INTO v_current_winning_bid
    FROM public.auction_bids
    WHERE tournament_id = p_tournament_id 
    AND player_id = p_player_id 
    AND is_winning_bid = true;
    
    -- Validate bid amount
    IF p_bid_amount <= v_current_winning_bid THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bid amount must be higher than current winning bid',
            'current_bid', v_current_winning_bid
        );
    END IF;
    
    -- Check minimum increment
    IF v_min_increment IS NOT NULL AND p_bid_amount < (v_current_winning_bid + v_min_increment) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bid must be at least ' || v_min_increment || ' higher than current bid',
            'required_amount', v_current_winning_bid + v_min_increment
        );
    END IF;
    
    -- Check team budget
    IF p_bid_amount > v_team_budget THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bid exceeds team budget',
            'available_budget', v_team_budget
        );
    END IF;
    
    -- Start transaction for atomic operations
    BEGIN
        -- Mark all previous bids for this player as not winning
        UPDATE public.auction_bids
        SET is_winning_bid = false
        WHERE tournament_id = p_tournament_id 
        AND player_id = p_player_id;
        
        -- Insert new bid
        INSERT INTO public.auction_bids (
            tournament_id,
            player_id,
            team_id,
            bid_amount,
            bidder_user_id,
            is_winning_bid
        ) VALUES (
            p_tournament_id,
            p_player_id,
            p_team_id,
            p_bid_amount,
            v_bidder_user_id,
            true
        ) RETURNING id INTO v_bid_id;
        
        -- Update team budget
        UPDATE public.teams
        SET budget_remaining = budget_remaining - p_bid_amount
        WHERE id = p_team_id;
        
        -- Return success
        RETURN json_build_object(
            'success', true,
            'bid_id', v_bid_id,
            'bid_amount', p_bid_amount,
            'team_budget_remaining', v_team_budget - p_bid_amount,
            'message', 'Bid placed successfully'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback on any error
            RETURN json_build_object(
                'success', false,
                'error', 'Database error: ' || SQLERRM
            );
    END;
END;


-- Function: register_player

DECLARE
    v_tournament RECORD;
    v_player RECORD;
    v_result JSON;
    v_slot_id UUID;
BEGIN
    -- Start transaction
    BEGIN
        -- Validate tournament exists and is accepting registrations
        SELECT * INTO v_tournament 
        FROM tournaments 
        WHERE id = p_tournament_id 
        AND status = 'registration_open';
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Tournament not found or not accepting registrations',
                'tournament_id', p_tournament_id
            );
        END IF;
        
        -- Validate player exists
        SELECT * INTO v_player 
        FROM players 
        WHERE id = p_player_id;
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Player not found',
                'player_id', p_player_id
            );
        END IF;
        
        -- Check if player is already registered
        IF EXISTS (
            SELECT 1 FROM tournament_slots 
            WHERE tournament_id = p_tournament_id 
            AND player_id = p_player_id
        ) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Player is already registered in this tournament',
                'player_id', p_player_id
            );
        END IF;
        
        -- Use reserve_slot function to handle the registration
        SELECT reserve_slot(p_tournament_id, p_player_id, p_preferred_slot, p_user_id) INTO v_result;
        
        -- Return the result from reserve_slot
        RETURN v_result;
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Failed to register player: ' || SQLERRM,
                'tournament_id', p_tournament_id,
                'player_id', p_player_id
            );
    END;
END;


-- Function: reserve_slot

DECLARE
    v_tournament RECORD;
    v_slot RECORD;
    v_available_slot RECORD;
    v_result JSON;
    v_slot_id UUID;
BEGIN
    -- Start transaction
    BEGIN
        -- Validate tournament exists and is in registration phase
        SELECT * INTO v_tournament 
        FROM tournaments 
        WHERE id = p_tournament_id 
        AND status IN ('registration_open', 'registration_closed');
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Tournament not found or not accepting registrations',
                'tournament_id', p_tournament_id
            );
        END IF;
        
        -- Check if player is already registered in this tournament
        IF EXISTS (
            SELECT 1 FROM tournament_slots 
            WHERE tournament_id = p_tournament_id 
            AND player_id = p_player_id 
            AND status IN ('pending', 'confirmed')
        ) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Player is already registered in this tournament',
                'player_id', p_player_id
            );
        END IF;
        
        -- If specific slot number provided, check if it's available
        IF p_slot_number IS NOT NULL THEN
            SELECT * INTO v_slot 
            FROM tournament_slots 
            WHERE tournament_id = p_tournament_id 
            AND slot_number = p_slot_number;
            
            IF FOUND AND v_slot.status != 'empty' THEN
                RETURN json_build_object(
                    'success', false,
                    'error', 'Requested slot is not available',
                    'slot_number', p_slot_number,
                    'current_status', v_slot.status
                );
            END IF;
            
            -- Reserve the specific slot
            IF FOUND THEN
                UPDATE tournament_slots 
                SET 
                    player_id = p_player_id,
                    status = 'pending',
                    requested_at = NOW()
                WHERE tournament_id = p_tournament_id 
                AND slot_number = p_slot_number
                RETURNING id INTO v_slot_id;
            ELSE
                -- Create new slot if it doesn't exist
                INSERT INTO tournament_slots (
                    tournament_id, slot_number, player_id, status, requested_at
                ) VALUES (
                    p_tournament_id, p_slot_number, p_player_id, 'pending', NOW()
                ) RETURNING id INTO v_slot_id;
            END IF;
        ELSE
            -- Find first available slot
            SELECT * INTO v_available_slot
            FROM tournament_slots 
            WHERE tournament_id = p_tournament_id 
            AND status = 'empty'
            ORDER BY slot_number
            LIMIT 1
            FOR UPDATE; -- Lock the row to prevent race conditions
            
            IF FOUND THEN
                -- Reserve the first available slot
                UPDATE tournament_slots 
                SET 
                    player_id = p_player_id,
                    status = 'pending',
                    requested_at = NOW()
                WHERE id = v_available_slot.id
                RETURNING id INTO v_slot_id;
            ELSE
                -- Check if we can create a new slot
                IF (SELECT COUNT(*) FROM tournament_slots WHERE tournament_id = p_tournament_id) < v_tournament.total_slots THEN
                    -- Create new slot
                    INSERT INTO tournament_slots (
                        tournament_id, 
                        slot_number, 
                        player_id, 
                        status, 
                        requested_at
                    ) VALUES (
                        p_tournament_id, 
                        (SELECT COALESCE(MAX(slot_number), 0) + 1 FROM tournament_slots WHERE tournament_id = p_tournament_id),
                        p_player_id, 
                        'pending', 
                        NOW()
                    ) RETURNING id INTO v_slot_id;
                ELSE
                    -- Tournament is full, add to waitlist
                    INSERT INTO waitlist (tournament_id, player_id, position)
                    VALUES (
                        p_tournament_id, 
                        p_player_id, 
                        (SELECT COALESCE(MAX(position), 0) + 1 FROM waitlist WHERE tournament_id = p_tournament_id)
                    );
                    
                    RETURN json_build_object(
                        'success', true,
                        'message', 'Tournament is full. Player added to waitlist.',
                        'tournament_id', p_tournament_id,
                        'player_id', p_player_id,
                        'waitlist_position', (SELECT MAX(position) FROM waitlist WHERE tournament_id = p_tournament_id)
                    );
                END IF;
            END IF;
        END IF;
        
        -- Return success with slot details
        RETURN json_build_object(
            'success', true,
            'message', 'Slot reserved successfully',
            'tournament_id', p_tournament_id,
            'player_id', p_player_id,
            'slot_id', v_slot_id,
            'slot_number', p_slot_number,
            'status', 'pending'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback on any error
            RETURN json_build_object(
                'success', false,
                'error', 'Failed to reserve slot: ' || SQLERRM,
                'tournament_id', p_tournament_id,
                'player_id', p_player_id
            );
    END;
END;


-- Function: reset_auction

DECLARE
    v_tournament RECORD;
    v_reset_count INTEGER := 0;
BEGIN
    -- Validate tournament exists
    SELECT * INTO v_tournament 
    FROM tournaments 
    WHERE id = p_tournament_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Tournament not found'
        );
    END IF;
    
    -- Check if user has permission (admin or host)
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id 
        AND (role = 'admin' OR id = v_tournament.host_id)
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions to reset auction'
        );
    END IF;
    
    -- Reset tournament status
    UPDATE tournaments 
    SET 
        status = 'auction_started',
        updated_at = NOW()
    WHERE id = p_tournament_id;
    
    -- Clear team_players allocations
    DELETE FROM team_players 
    WHERE team_id IN (
        SELECT id FROM teams WHERE tournament_id = p_tournament_id
    );
    
    -- Reset team budgets
    UPDATE teams 
    SET 
        budget_remaining = initial_budget,
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id;
    
    -- Clear winning bid flags
    UPDATE auction_bids 
    SET is_winning_bid = FALSE
    WHERE tournament_id = p_tournament_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Auction reset successfully',
        'tournament_id', p_tournament_id,
        'reset_at', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to reset auction: ' || SQLERRM
        );
END;


-- Function: sync_auth_user

BEGIN
  -- Insert or update user in public.users
  INSERT INTO public.users (
    id,
    email,
    username,
    firstname,
    middlename,
    lastname,
    photo,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', generate_username_from_email(NEW.email)),
    COALESCE(NEW.raw_user_meta_data->>'firstname', ''),
    NEW.raw_user_meta_data->>'middlename',
    COALESCE(NEW.raw_user_meta_data->>'lastname', ''),
    NEW.raw_user_meta_data->>'photo',
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, users.username),
    firstname = COALESCE(EXCLUDED.firstname, users.firstname),
    middlename = COALESCE(EXCLUDED.middlename, users.middlename),
    lastname = COALESCE(EXCLUDED.lastname, users.lastname),
    photo = COALESCE(EXCLUDED.photo, users.photo),
    role = COALESCE(EXCLUDED.role, users.role),
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;


-- Function: validate_tournament_data

BEGIN
  -- Check if format is valid
  IF p_format NOT IN ('Bilateral', 'TriSeries', 'Quad', '6 Team', '8 Team', '10 Team', '12 Team', '16 Team', '20 Team', '24 Team', '32 Team') THEN
    RETURN FALSE;
  END IF;
  
  -- Check if selected teams matches format
  IF p_selected_teams != get_recommended_teams(p_format) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if total slots matches format
  IF p_total_slots != get_recommended_slots(p_format) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;


-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Policy: Admins can view all API analytics on api_usage_analytics
-- Command: SELECT
-- Roles: {authenticated}
-- Qualification: (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text))))

-- Policy: Service role can insert API analytics on api_usage_analytics
-- Command: INSERT
-- Roles: {service_role}

-- Policy: Users can view their own API analytics on api_usage_analytics
-- Command: SELECT
-- Roles: {authenticated}
-- Qualification: (user_id = auth.uid())

-- Policy: Anyone can view auction bids on auction_bids
-- Command: SELECT
-- Roles: {public}
-- Qualification: true

-- Policy: Authenticated users can view bids on auction_bids
-- Command: SELECT
-- Roles: {public}
-- Qualification: (auth.role() = 'authenticated'::text)

-- Policy: Bidders can delete their bids on auction_bids
-- Command: DELETE
-- Roles: {public}
-- Qualification: (auth.uid() = bidder_user_id)

-- Policy: Bidders can update their bids on auction_bids
-- Command: UPDATE
-- Roles: {public}
-- Qualification: (auth.uid() = bidder_user_id)

-- Policy: Captains and admins can place bids on auction_bids
-- Command: INSERT
-- Roles: {public}

-- Policy: Captains can bid for their teams on auction_bids
-- Command: INSERT
-- Roles: {public}

-- Policy: Admins can manage auction config on auction_config
-- Command: ALL
-- Roles: {public}
-- Qualification: is_admin(auth.uid())

-- Policy: Authenticated users can view auction config on auction_config
-- Command: SELECT
-- Roles: {public}
-- Qualification: (auth.role() = 'authenticated'::text)

-- Policy: System can insert notifications on notifications
-- Command: INSERT
-- Roles: {public}

-- Policy: Users can update their own notifications on notifications
-- Command: UPDATE
-- Roles: {public}
-- Qualification: (user_id = auth.uid())

-- Policy: Users can view their own notifications on notifications
-- Command: SELECT
-- Roles: {public}
-- Qualification: (user_id = auth.uid())

-- Policy: Anyone can view player skill assignments on player_skill_assignments
-- Command: SELECT
-- Roles: {public}
-- Qualification: true

-- Policy: Users can manage their own skill assignments on player_skill_assignments
-- Command: ALL
-- Roles: {public}
-- Qualification: (EXISTS ( SELECT 1
   FROM players
  WHERE ((players.id = player_skill_assignments.player_id) AND (players.user_id = auth.uid()))))

-- Policy: Admins can manage player skill values on player_skill_values
-- Command: ALL
-- Roles: {public}
-- Qualification: (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text) AND ((users.status)::text = 'approved'::text))))

-- Policy: Anyone can view player skill values on player_skill_values
-- Command: SELECT
-- Roles: {public}
-- Qualification: true

-- Policy: Admins can manage player skills on player_skills
-- Command: ALL
-- Roles: {public}
-- Qualification: (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text) AND ((users.status)::text = 'approved'::text))))

-- Policy: Anyone can view player skills on player_skills
-- Command: SELECT
-- Roles: {public}
-- Qualification: true

-- Policy: Admins can manage player tags on player_tags
-- Command: ALL
-- Roles: {public}
-- Qualification: is_admin(auth.uid())

-- Policy: Authenticated users can view player tags on player_tags
-- Command: SELECT
-- Roles: {public}
-- Qualification: (auth.role() = 'authenticated'::text)

-- Policy: Admins can manage all players on players
-- Command: ALL
-- Roles: {public}
-- Qualification: is_admin(auth.uid())

-- Policy: Authenticated users can view players on players
-- Command: SELECT
-- Roles: {public}
-- Qualification: (auth.role() = 'authenticated'::text)

-- Policy: Admins can manage tags on tags
-- Command: ALL
-- Roles: {public}
-- Qualification: is_admin(auth.uid())

-- Policy: Authenticated users can view tags on tags
-- Command: SELECT
-- Roles: {public}
-- Qualification: (auth.role() = 'authenticated'::text)

-- Policy: Admins can manage team players on team_players
-- Command: ALL
-- Roles: {public}
-- Qualification: is_admin(auth.uid())

-- Policy: Authenticated users can view team players on team_players
-- Command: SELECT
-- Roles: {public}
-- Qualification: (auth.role() = 'authenticated'::text)

-- Policy: Anyone can view teams on teams
-- Command: SELECT
-- Roles: {public}
-- Qualification: true

-- Policy: Authenticated users can view teams on teams
-- Command: SELECT
-- Roles: {public}
-- Qualification: (auth.role() = 'authenticated'::text)

-- Policy: Captains and admins can update their team on teams
-- Command: UPDATE
-- Roles: {public}
-- Qualification: ((captain_user_id = auth.uid()) OR is_admin(auth.uid()))

-- Policy: Hosts and admins can manage teams on teams
-- Command: ALL
-- Roles: {public}
-- Qualification: (is_tournament_host(tournament_id, auth.uid()) OR is_admin(auth.uid()))

-- Policy: Hosts can create teams on teams
-- Command: INSERT
-- Roles: {public}

-- Policy: Team captains can manage their teams on teams
-- Command: UPDATE
-- Roles: {public}
-- Qualification: ((auth.uid() = captain_user_id) OR (EXISTS ( SELECT 1
   FROM tournaments
  WHERE ((tournaments.id = teams.tournament_id) AND (tournaments.host_id = auth.uid()) AND (EXISTS ( SELECT 1
           FROM users
          WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'host'::text))))))))

-- Policy: Allow admins and hosts to manage all slots on tournament_slots
-- Command: ALL
-- Roles: {authenticated}
-- Qualification: (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY[('admin'::character varying)::text, ('host'::character varying)::text])))))

-- Policy: Allow public to view tournament slots on tournament_slots
-- Command: SELECT
-- Roles: {public}
-- Qualification: true

-- Policy: Allow users to insert their own slot registrations on tournament_slots
-- Command: INSERT
-- Roles: {authenticated}

-- Policy: Allow users to update their own slot registrations on tournament_slots
-- Command: UPDATE
-- Roles: {authenticated}
-- Qualification: (player_id IN ( SELECT players.id
   FROM players
  WHERE (players.user_id = auth.uid())))

-- Policy: Anyone can view tournament slots on tournament_slots
-- Command: SELECT
-- Roles: {public}
-- Qualification: true

-- Policy: Authenticated users can view tournament slots on tournament_slots
-- Command: SELECT
-- Roles: {public}
-- Qualification: (auth.role() = 'authenticated'::text)

-- Policy: Hosts and admins can manage tournament slots on tournament_slots
-- Command: ALL
-- Roles: {public}
-- Qualification: (is_tournament_host(tournament_id, auth.uid()) OR is_admin(auth.uid()))

-- Policy: Hosts can assign slots on tournament_slots
-- Command: UPDATE
-- Roles: {public}
-- Qualification: ((EXISTS ( SELECT 1
   FROM tournaments
  WHERE ((tournaments.id = tournament_slots.tournament_id) AND (tournaments.host_id = auth.uid()) AND (EXISTS ( SELECT 1
           FROM users
          WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'host'::text))))))) OR ((player_id IS NOT NULL) AND (auth.uid() = player_id)))

-- Policy: Players can request slots on tournament_slots
-- Command: INSERT
-- Roles: {public}

-- Policy: Allow public to view tournaments on tournaments
-- Command: SELECT
-- Roles: {public}
-- Qualification: true

-- Policy: Anyone can view tournaments on tournaments
-- Command: SELECT
-- Roles: {public}
-- Qualification: true

-- Policy: Authenticated users can view tournaments on tournaments
-- Command: SELECT
-- Roles: {public}
-- Qualification: (auth.role() = 'authenticated'::text)

-- Policy: Hosts and admins can manage tournaments on tournaments
-- Command: ALL
-- Roles: {public}
-- Qualification: ((host_id = auth.uid()) OR is_admin(auth.uid()))

-- Policy: Hosts can create tournaments on tournaments
-- Command: INSERT
-- Roles: {public}

-- Policy: Hosts can delete their tournaments on tournaments
-- Command: DELETE
-- Roles: {public}
-- Qualification: ((auth.uid() = host_id) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'host'::text)))))

-- Policy: Hosts can update their tournaments on tournaments
-- Command: UPDATE
-- Roles: {public}
-- Qualification: ((auth.uid() = host_id) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'host'::text)))))

-- Policy: Admins can delete users on users
-- Command: DELETE
-- Roles: {public}
-- Qualification: is_admin(auth.uid())

-- Policy: Admins can insert users on users
-- Command: INSERT
-- Roles: {public}

-- Policy: Allow all users to update users on users
-- Command: UPDATE
-- Roles: {public}
-- Qualification: true

-- Policy: Allow all users to view users on users
-- Command: SELECT
-- Roles: {public}
-- Qualification: true

-- Policy: Allow user registration on users
-- Command: INSERT
-- Roles: {public}

-- Policy: Allow users to delete own profile on users
-- Command: DELETE
-- Roles: {public}
-- Qualification: true

-- Policy: Users can update their own profile on users
-- Command: UPDATE
-- Roles: {public}
-- Qualification: (auth.uid() = id)

-- Policy: Users can update their own profile or admins can update all on users
-- Command: UPDATE
-- Roles: {public}
-- Qualification: ((auth.uid() = id) OR is_admin(auth.uid()))

-- Policy: Users can view their own profile on users
-- Command: SELECT
-- Roles: {public}
-- Qualification: (auth.uid() = id)

-- Policy: Users can view their own profile or admins can view all on users
-- Command: SELECT
-- Roles: {public}
-- Qualification: ((auth.uid() = id) OR is_admin(auth.uid()))

-- Policy: Admins can manage waitlist on waitlist
-- Command: ALL
-- Roles: {public}
-- Qualification: is_admin(auth.uid())

-- Policy: Authenticated users can view waitlist on waitlist
-- Command: SELECT
-- Roles: {public}
-- Qualification: (auth.role() = 'authenticated'::text)

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
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
