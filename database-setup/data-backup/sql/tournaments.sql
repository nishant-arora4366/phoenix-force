-- Data backup for table: tournaments
-- Backup timestamp: 2025-10-11T12:15:46.287Z
-- Record count: 2

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Insert data
INSERT INTO tournaments (id, name, host_id, host_player_id, status, total_slots, created_at, updated_at, format, selected_teams, description, venue, google_maps_link, tournament_date, community_restrictions, base_price_restrictions, min_base_price, max_base_price) VALUES ('7ec989e3-61c6-4591-99f2-ba1ecd483fd1', 'Quad Series 43', '55edaef4-2977-40b8-b533-365cae96fbbe', NULL, 'completed', 32, '2025-10-10T17:38:35.96025+00:00', '2025-10-10T19:12:52.888+00:00', 'Quad', 4, '', 'iBlitz', '', '2025-10-12T01:30:00+00:00', '["iBlitz"]', '["60","150","100","80","200","40"]', NULL, NULL);
INSERT INTO tournaments (id, name, host_id, host_player_id, status, total_slots, created_at, updated_at, format, selected_teams, description, venue, google_maps_link, tournament_date, community_restrictions, base_price_restrictions, min_base_price, max_base_price) VALUES ('3fe7e4ed-33c3-4788-bab4-22710a278c34', 'Quad Series 44', '55edaef4-2977-40b8-b533-365cae96fbbe', NULL, 'registration_open', 32, '2025-10-10T17:41:09.319008+00:00', '2025-10-11T05:48:00.885+00:00', 'Quad', 4, '', 'iBlitz', '', '2025-10-19T01:30:00+00:00', '["iBlitz"]', '["100","60","150","80","200"]', NULL, NULL);

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

