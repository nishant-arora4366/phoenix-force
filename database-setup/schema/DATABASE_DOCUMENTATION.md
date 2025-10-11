# Phoenix Force Database Documentation

Generated on: 2025-10-11T11:52:21.744Z

## Overview

This document contains comprehensive information about the Phoenix Force database schema.

## Tables

### api_usage_analytics

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| route | text | NO | None | No description |
| method | text | NO | None | No description |
| user_id | uuid | YES | None | No description |
| user_role | text | YES | None | No description |
| ip_address | inet | YES | None | No description |
| user_agent | text | YES | None | No description |
| response_status | integer | YES | None | No description |
| response_time_ms | integer | YES | None | No description |
| request_size_bytes | integer | YES | None | No description |
| response_size_bytes | integer | YES | None | No description |
| created_at | timestamp with time zone | YES | now() | No description |
| updated_at | timestamp with time zone | YES | now() | No description |

### auction_bids

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| tournament_id | uuid | YES | None | No description |
| player_id | uuid | YES | None | No description |
| team_id | uuid | YES | None | No description |
| bid_amount | numeric | NO | None | No description |
| bidder_user_id | uuid | YES | None | No description |
| is_winning_bid | boolean | YES | false | No description |
| created_at | timestamp with time zone | YES | now() | No description |

### auction_config

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| tournament_id | uuid | YES | None | No description |
| player_order | jsonb | YES | None | No description |
| is_captain_bidding | boolean | YES | false | No description |
| auction_mode | character varying | YES | None | No description |
| created_at | timestamp with time zone | YES | now() | No description |

### auction_players

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| auction_id | uuid | NO | None | No description |
| player_id | uuid | NO | None | No description |
| status | character varying | YES | 'available'::character varying | No description |
| sold_to | uuid | YES | None | No description |
| sold_price | integer | YES | None | No description |
| created_at | timestamp with time zone | YES | now() | No description |
| updated_at | timestamp with time zone | YES | now() | No description |

### auction_teams

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| auction_id | uuid | NO | None | No description |
| captain_id | uuid | NO | None | No description |
| team_name | character varying | NO | None | No description |
| total_spent | integer | YES | 0 | No description |
| remaining_purse | integer | NO | None | No description |
| created_at | timestamp with time zone | YES | now() | No description |
| updated_at | timestamp with time zone | YES | now() | No description |

### auctions

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| tournament_id | uuid | NO | None | No description |
| status | character varying | YES | 'pending'::character varying | No description |
| current_player_id | uuid | YES | None | No description |
| current_bid | integer | YES | 0 | No description |
| timer_seconds | integer | YES | 30 | No description |
| total_purse | integer | YES | 1000000 | No description |
| created_at | timestamp with time zone | YES | now() | No description |
| updated_at | timestamp with time zone | YES | now() | No description |

### notifications

**Description:** User notifications for real-time updates

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| user_id | uuid | NO | None | No description |
| type | character varying | NO | None | Type of notification (waitlist_promotion, slot_approved, etc.) |
| title | character varying | NO | None | No description |
| message | text | NO | None | No description |
| data | jsonb | YES | None | Additional data for the notification |
| read_at | timestamp with time zone | YES | None | When the notification was read (NULL if unread) |
| created_at | timestamp with time zone | YES | now() | No description |
| updated_at | timestamp with time zone | YES | now() | No description |

### player_skill_assignments

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| player_id | uuid | YES | None | No description |
| skill_id | uuid | YES | None | No description |
| skill_value_id | uuid | YES | None | No description |
| created_at | timestamp with time zone | YES | now() | No description |
| value_array | ARRAY | YES | None | No description |
| skill_value_ids | ARRAY | YES | None | No description |

### player_skill_values

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| skill_id | uuid | YES | None | No description |
| value_name | character varying | NO | None | No description |
| display_order | integer | YES | 0 | No description |
| is_active | boolean | YES | true | No description |
| created_at | timestamp with time zone | YES | now() | No description |
| updated_at | timestamp with time zone | YES | now() | No description |

### player_skills

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| skill_name | character varying | NO | None | No description |
| skill_type | character varying | NO | None | No description |
| is_required | boolean | YES | false | No description |
| display_order | integer | YES | 0 | No description |
| created_at | timestamp with time zone | YES | now() | No description |
| updated_at | timestamp with time zone | YES | now() | No description |
| is_admin_managed | boolean | YES | false | No description |
| viewer_can_see | boolean | YES | true | No description |

### player_tags

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| player_id | uuid | NO | None | No description |
| tag_id | uuid | NO | None | No description |

### players

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| user_id | uuid | YES | None | No description |
| display_name | character varying | NO | None | No description |
| bio | text | YES | None | No description |
| profile_pic_url | text | YES | None | No description |
| mobile_number | character varying | YES | None | No description |
| cricheroes_profile_url | text | YES | None | No description |
| created_at | timestamp with time zone | YES | now() | No description |
| updated_at | timestamp with time zone | YES | now() | No description |
| status | character varying | YES | 'pending'::character varying | No description |
| created_by | uuid | YES | None | User ID of the user who created this player record. Used for access control - hosts can only edit/delete players they created. |

### tags

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| name | character varying | NO | None | No description |

### team_players

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| team_id | uuid | YES | None | No description |
| player_id | uuid | YES | None | No description |
| final_bid_amount | numeric | NO | None | No description |
| created_at | timestamp with time zone | YES | now() | No description |

### teams

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| tournament_id | uuid | YES | None | No description |
| name | character varying | NO | None | No description |
| captain_id | uuid | YES | None | No description |
| captain_user_id | uuid | YES | None | No description |
| initial_budget | numeric | YES | None | No description |
| budget_remaining | numeric | YES | None | No description |
| created_at | timestamp with time zone | YES | now() | No description |

### tournament_slots

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| tournament_id | uuid | YES | None | No description |
| player_id | uuid | YES | None | No description |
| status | character varying | YES | 'empty'::character varying | No description |
| is_host_assigned | boolean | YES | false | No description |
| requested_at | timestamp with time zone | YES | None | No description |
| confirmed_at | timestamp with time zone | YES | None | No description |
| created_at | timestamp with time zone | YES | now() | No description |

### tournaments

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| name | character varying | NO | None | No description |
| host_id | uuid | YES | None | User ID of the tournament host |
| host_player_id | uuid | YES | None | No description |
| status | character varying | YES | 'draft'::character varying | No description |
| total_slots | integer | NO | None | Total number of player slots available |
| created_at | timestamp with time zone | YES | now() | No description |
| updated_at | timestamp with time zone | YES | now() | No description |
| format | character varying | NO | None | Tournament format: Bilateral, TriSeries, Quad, 6 Team, 8 Team, etc. |
| selected_teams | integer | NO | None | Number of teams selected for this tournament |
| description | text | YES | None | Description of the tournament |
| venue | text | YES | None | Physical location or venue name for the tournament |
| google_maps_link | text | YES | None | Google Maps URL or link to the tournament venue location |
| tournament_date | timestamp with time zone | YES | None | Date and time when the tournament will be held |
| community_restrictions | ARRAY | YES | None | Array of allowed community values for tournament registration |
| base_price_restrictions | ARRAY | YES | None | Array of allowed base price values for tournament registration |
| min_base_price | numeric | YES | None | Minimum base price allowed for tournament registration |
| max_base_price | numeric | YES | None | Maximum base price allowed for tournament registration |

### users

**Description:** Auth: Stores user login data within a secure schema.

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| email | character varying | NO | None | No description |
| role | character varying | YES | 'viewer'::character varying | No description |
| created_at | timestamp with time zone | YES | now() | No description |
| updated_at | timestamp with time zone | YES | now() | No description |
| username | character varying | YES | None | No description |
| firstname | character varying | NO | ''::character varying | No description |
| middlename | character varying | YES | None | No description |
| lastname | character varying | NO | ''::character varying | No description |
| photo | text | YES | None | No description |
| password_hash | character varying | YES | None | No description |
| status | character varying | YES | 'pending'::character varying | No description |

### users

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| email | character varying | NO | None | No description |
| role | character varying | YES | 'viewer'::character varying | No description |
| created_at | timestamp with time zone | YES | now() | No description |
| updated_at | timestamp with time zone | YES | now() | No description |
| username | character varying | YES | None | No description |
| firstname | character varying | NO | ''::character varying | No description |
| middlename | character varying | YES | None | No description |
| lastname | character varying | NO | ''::character varying | No description |
| photo | text | YES | None | No description |
| password_hash | character varying | YES | None | No description |
| status | character varying | YES | 'pending'::character varying | No description |

### waitlist

**Description:** No description available

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | No description |
| tournament_id | uuid | YES | None | No description |
| player_id | uuid | YES | None | No description |
| position | integer | NO | None | No description |
| created_at | timestamp with time zone | YES | now() | No description |

## Foreign Key Relationships

| Table | Column | References | Description |
|-------|--------|------------|-------------|
| api_usage_analytics | user_id | users.id | api_usage_analytics_user_id_fkey |
| auction_bids | bidder_user_id | users.id | auction_bids_bidder_user_id_fkey |
| auction_bids | player_id | players.id | auction_bids_player_id_fkey |
| auction_bids | team_id | teams.id | auction_bids_team_id_fkey |
| auction_bids | tournament_id | tournaments.id | auction_bids_tournament_id_fkey |
| auction_config | tournament_id | tournaments.id | auction_config_tournament_id_fkey |
| auction_players | auction_id | auctions.id | auction_players_auction_id_fkey |
| auction_players | player_id | players.id | auction_players_player_id_fkey |
| auction_players | sold_to | players.id | auction_players_sold_to_fkey |
| auction_teams | auction_id | auctions.id | auction_teams_auction_id_fkey |
| auction_teams | captain_id | players.id | auction_teams_captain_id_fkey |
| auctions | current_player_id | players.id | auctions_current_player_id_fkey |
| auctions | tournament_id | tournaments.id | auctions_tournament_id_fkey |
| notifications | user_id | users.id | notifications_user_id_fkey |
| player_skill_assignments | player_id | players.id | player_skill_assignments_player_id_fkey |
| player_skill_assignments | skill_id | player_skills.id | player_skill_assignments_skill_id_fkey |
| player_skill_assignments | skill_value_id | player_skill_values.id | player_skill_assignments_skill_value_id_fkey |
| player_skill_values | skill_id | player_skills.id | player_skill_values_skill_id_fkey |
| player_tags | player_id | players.id | player_tags_player_id_fkey |
| player_tags | tag_id | tags.id | player_tags_tag_id_fkey |
| players | created_by | users.id | players_created_by_fkey |
| players | user_id | users.id | players_user_id_fkey |
| team_players | player_id | players.id | team_players_player_id_fkey |
| team_players | team_id | teams.id | team_players_team_id_fkey |
| teams | captain_id | players.id | teams_captain_id_fkey |
| teams | captain_user_id | users.id | teams_captain_user_id_fkey |
| teams | tournament_id | tournaments.id | teams_tournament_id_fkey |
| tournament_slots | player_id | players.id | tournament_slots_player_id_fkey |
| tournament_slots | tournament_id | tournaments.id | tournament_slots_tournament_id_fkey |
| tournaments | host_id | users.id | tournaments_host_id_fkey |
| tournaments | host_player_id | players.id | tournaments_host_player_id_fkey |
| waitlist | player_id | players.id | waitlist_player_id_fkey |
| waitlist | tournament_id | tournaments.id | waitlist_tournament_id_fkey |

## Row Level Security Policies

### Admins can view all API analytics (api_usage_analytics)

**Command:** SELECT

**Roles:** {authenticated}

**Qualification:** `(EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text))))`

### Service role can insert API analytics (api_usage_analytics)

**Command:** INSERT

**Roles:** {service_role}

**Qualification:** `None`

### Users can view their own API analytics (api_usage_analytics)

**Command:** SELECT

**Roles:** {authenticated}

**Qualification:** `(user_id = auth.uid())`

### Anyone can view auction bids (auction_bids)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `true`

### Authenticated users can view bids (auction_bids)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `(auth.role() = 'authenticated'::text)`

### Bidders can delete their bids (auction_bids)

**Command:** DELETE

**Roles:** {public}

**Qualification:** `(auth.uid() = bidder_user_id)`

### Bidders can update their bids (auction_bids)

**Command:** UPDATE

**Roles:** {public}

**Qualification:** `(auth.uid() = bidder_user_id)`

### Captains and admins can place bids (auction_bids)

**Command:** INSERT

**Roles:** {public}

**Qualification:** `None`

### Captains can bid for their teams (auction_bids)

**Command:** INSERT

**Roles:** {public}

**Qualification:** `None`

### Admins can manage auction config (auction_config)

**Command:** ALL

**Roles:** {public}

**Qualification:** `is_admin(auth.uid())`

### Authenticated users can view auction config (auction_config)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `(auth.role() = 'authenticated'::text)`

### System can insert notifications (notifications)

**Command:** INSERT

**Roles:** {public}

**Qualification:** `None`

### Users can update their own notifications (notifications)

**Command:** UPDATE

**Roles:** {public}

**Qualification:** `(user_id = auth.uid())`

### Users can view their own notifications (notifications)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `(user_id = auth.uid())`

### Anyone can view player skill assignments (player_skill_assignments)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `true`

### Users can manage their own skill assignments (player_skill_assignments)

**Command:** ALL

**Roles:** {public}

**Qualification:** `(EXISTS ( SELECT 1
   FROM players
  WHERE ((players.id = player_skill_assignments.player_id) AND (players.user_id = auth.uid()))))`

### Admins can manage player skill values (player_skill_values)

**Command:** ALL

**Roles:** {public}

**Qualification:** `(EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text) AND ((users.status)::text = 'approved'::text))))`

### Anyone can view player skill values (player_skill_values)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `true`

### Admins can manage player skills (player_skills)

**Command:** ALL

**Roles:** {public}

**Qualification:** `(EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text) AND ((users.status)::text = 'approved'::text))))`

### Anyone can view player skills (player_skills)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `true`

### Admins can manage player tags (player_tags)

**Command:** ALL

**Roles:** {public}

**Qualification:** `is_admin(auth.uid())`

### Authenticated users can view player tags (player_tags)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `(auth.role() = 'authenticated'::text)`

### Admins can manage all players (players)

**Command:** ALL

**Roles:** {public}

**Qualification:** `is_admin(auth.uid())`

### Authenticated users can view players (players)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `(auth.role() = 'authenticated'::text)`

### Admins can manage tags (tags)

**Command:** ALL

**Roles:** {public}

**Qualification:** `is_admin(auth.uid())`

### Authenticated users can view tags (tags)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `(auth.role() = 'authenticated'::text)`

### Admins can manage team players (team_players)

**Command:** ALL

**Roles:** {public}

**Qualification:** `is_admin(auth.uid())`

### Authenticated users can view team players (team_players)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `(auth.role() = 'authenticated'::text)`

### Anyone can view teams (teams)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `true`

### Authenticated users can view teams (teams)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `(auth.role() = 'authenticated'::text)`

### Captains and admins can update their team (teams)

**Command:** UPDATE

**Roles:** {public}

**Qualification:** `((captain_user_id = auth.uid()) OR is_admin(auth.uid()))`

### Hosts and admins can manage teams (teams)

**Command:** ALL

**Roles:** {public}

**Qualification:** `(is_tournament_host(tournament_id, auth.uid()) OR is_admin(auth.uid()))`

### Hosts can create teams (teams)

**Command:** INSERT

**Roles:** {public}

**Qualification:** `None`

### Team captains can manage their teams (teams)

**Command:** UPDATE

**Roles:** {public}

**Qualification:** `((auth.uid() = captain_user_id) OR (EXISTS ( SELECT 1
   FROM tournaments
  WHERE ((tournaments.id = teams.tournament_id) AND (tournaments.host_id = auth.uid()) AND (EXISTS ( SELECT 1
           FROM users
          WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'host'::text))))))))`

### Allow admins and hosts to manage all slots (tournament_slots)

**Command:** ALL

**Roles:** {authenticated}

**Qualification:** `(EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY[('admin'::character varying)::text, ('host'::character varying)::text])))))`

### Allow public to view tournament slots (tournament_slots)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `true`

### Allow users to insert their own slot registrations (tournament_slots)

**Command:** INSERT

**Roles:** {authenticated}

**Qualification:** `None`

### Allow users to update their own slot registrations (tournament_slots)

**Command:** UPDATE

**Roles:** {authenticated}

**Qualification:** `(player_id IN ( SELECT players.id
   FROM players
  WHERE (players.user_id = auth.uid())))`

### Anyone can view tournament slots (tournament_slots)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `true`

### Authenticated users can view tournament slots (tournament_slots)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `(auth.role() = 'authenticated'::text)`

### Hosts and admins can manage tournament slots (tournament_slots)

**Command:** ALL

**Roles:** {public}

**Qualification:** `(is_tournament_host(tournament_id, auth.uid()) OR is_admin(auth.uid()))`

### Hosts can assign slots (tournament_slots)

**Command:** UPDATE

**Roles:** {public}

**Qualification:** `((EXISTS ( SELECT 1
   FROM tournaments
  WHERE ((tournaments.id = tournament_slots.tournament_id) AND (tournaments.host_id = auth.uid()) AND (EXISTS ( SELECT 1
           FROM users
          WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'host'::text))))))) OR ((player_id IS NOT NULL) AND (auth.uid() = player_id)))`

### Players can request slots (tournament_slots)

**Command:** INSERT

**Roles:** {public}

**Qualification:** `None`

### Allow public to view tournaments (tournaments)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `true`

### Anyone can view tournaments (tournaments)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `true`

### Authenticated users can view tournaments (tournaments)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `(auth.role() = 'authenticated'::text)`

### Hosts and admins can manage tournaments (tournaments)

**Command:** ALL

**Roles:** {public}

**Qualification:** `((host_id = auth.uid()) OR is_admin(auth.uid()))`

### Hosts can create tournaments (tournaments)

**Command:** INSERT

**Roles:** {public}

**Qualification:** `None`

### Hosts can delete their tournaments (tournaments)

**Command:** DELETE

**Roles:** {public}

**Qualification:** `((auth.uid() = host_id) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'host'::text)))))`

### Hosts can update their tournaments (tournaments)

**Command:** UPDATE

**Roles:** {public}

**Qualification:** `((auth.uid() = host_id) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'host'::text)))))`

### Admins can delete users (users)

**Command:** DELETE

**Roles:** {public}

**Qualification:** `is_admin(auth.uid())`

### Admins can insert users (users)

**Command:** INSERT

**Roles:** {public}

**Qualification:** `None`

### Allow all users to update users (users)

**Command:** UPDATE

**Roles:** {public}

**Qualification:** `true`

### Allow all users to view users (users)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `true`

### Allow user registration (users)

**Command:** INSERT

**Roles:** {public}

**Qualification:** `None`

### Allow users to delete own profile (users)

**Command:** DELETE

**Roles:** {public}

**Qualification:** `true`

### Users can update their own profile (users)

**Command:** UPDATE

**Roles:** {public}

**Qualification:** `(auth.uid() = id)`

### Users can update their own profile or admins can update all (users)

**Command:** UPDATE

**Roles:** {public}

**Qualification:** `((auth.uid() = id) OR is_admin(auth.uid()))`

### Users can view their own profile (users)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `(auth.uid() = id)`

### Users can view their own profile or admins can view all (users)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `((auth.uid() = id) OR is_admin(auth.uid()))`

### Admins can manage waitlist (waitlist)

**Command:** ALL

**Roles:** {public}

**Qualification:** `is_admin(auth.uid())`

### Authenticated users can view waitlist (waitlist)

**Command:** SELECT

**Roles:** {public}

**Qualification:** `(auth.role() = 'authenticated'::text)`

## Database Functions

### cancel_slot_reservation

**Return Type:** json

**Arguments:** p_tournament_id uuid, p_slot_id uuid, p_user_id uuid DEFAULT auth.uid()

### cleanup_old_api_analytics

**Return Type:** void

**Arguments:** None

### confirm_slot

**Return Type:** json

**Arguments:** p_tournament_id uuid, p_slot_id uuid, p_user_id uuid DEFAULT auth.uid()

### finalize_auction

**Return Type:** json

**Arguments:** p_tournament_id uuid, p_user_id uuid DEFAULT auth.uid()

### generate_username_from_email

**Return Type:** text

**Arguments:** email text

### get_api_usage_stats

**Return Type:** TABLE(route text, method text, total_requests bigint, unique_users bigint, avg_response_time_ms numeric, success_rate numeric, total_errors bigint)

**Arguments:** start_date timestamp with time zone DEFAULT (now() - '30 days'::interval), end_date timestamp with time zone DEFAULT now()

### get_auction_results

**Return Type:** json

**Arguments:** p_tournament_id uuid

### get_auction_status

**Return Type:** json

**Arguments:** p_tournament_id uuid

### get_hourly_usage_patterns

**Return Type:** TABLE(hour_of_day integer, total_requests bigint, unique_users bigint, avg_response_time_ms numeric)

**Arguments:** start_date timestamp with time zone DEFAULT (now() - '7 days'::interval), end_date timestamp with time zone DEFAULT now()

### get_recommended_slots

**Return Type:** integer

**Arguments:** tournament_format character varying

### get_recommended_teams

**Return Type:** integer

**Arguments:** tournament_format character varying

### get_tournament_status

**Return Type:** json

**Arguments:** p_tournament_id uuid

### get_user_activity_stats

**Return Type:** TABLE(user_id uuid, user_email text, user_role text, total_requests bigint, unique_routes bigint, last_activity timestamp with time zone, avg_response_time_ms numeric)

**Arguments:** start_date timestamp with time zone DEFAULT (now() - '30 days'::interval), end_date timestamp with time zone DEFAULT now()

### get_user_display_name

**Return Type:** text

**Arguments:** user_record users

### get_user_full_name

**Return Type:** text

**Arguments:** user_record users

### is_admin

**Return Type:** boolean

**Arguments:** user_id uuid

### is_team_captain

**Return Type:** boolean

**Arguments:** team_id uuid, user_id uuid

### is_tournament_host

**Return Type:** boolean

**Arguments:** tournament_id uuid, user_id uuid

### manual_promote_waitlist

**Return Type:** TABLE(promoted_player_id uuid, new_slot_number integer, success boolean)

**Arguments:** p_tournament_id uuid

### mark_all_notifications_read

**Return Type:** integer

**Arguments:** p_user_id uuid

### mark_notification_read

**Return Type:** boolean

**Arguments:** p_notification_id uuid

### place_bid

**Return Type:** json

**Arguments:** p_tournament_id uuid, p_player_id uuid, p_team_id uuid, p_bid_amount numeric

### register_player

**Return Type:** json

**Arguments:** p_tournament_id uuid, p_player_id uuid, p_preferred_slot integer DEFAULT NULL::integer, p_user_id uuid DEFAULT auth.uid()

### reserve_slot

**Return Type:** json

**Arguments:** p_tournament_id uuid, p_player_id uuid, p_slot_number integer DEFAULT NULL::integer, p_user_id uuid DEFAULT auth.uid()

### reset_auction

**Return Type:** json

**Arguments:** p_tournament_id uuid, p_user_id uuid DEFAULT auth.uid()

### sync_auth_user

**Return Type:** trigger

**Arguments:** None

### validate_tournament_data

**Return Type:** boolean

**Arguments:** p_format character varying, p_selected_teams integer, p_total_slots integer

