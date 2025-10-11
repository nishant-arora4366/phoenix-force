-- Data backup for table: player_skill_values
-- Backup timestamp: 2025-10-11T12:08:27.550Z
-- Record count: 21

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Insert data
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('652b42c6-533b-4367-bc26-690f4c1d7917', '66401c99-e797-4966-a742-1a5b4013345a', 'Right Hand Batter', 2, true, '2025-10-08T08:57:06.398666+00:00', '2025-10-08T08:57:06.398666+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('4d1e8210-40b3-4e59-ae78-8e28ffec6ace', '66401c99-e797-4966-a742-1a5b4013345a', 'Left Hand Batter', 1, true, '2025-10-08T08:57:20.502933+00:00', '2025-10-08T08:57:20.502933+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('5cfc7645-3b65-4c7a-a7f5-0ad348dc3164', '1a078475-a428-4548-87f0-2e7e02bec3b3', 'Batter', 1, true, '2025-10-08T08:57:31.178001+00:00', '2025-10-08T08:57:31.178001+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('3ba9c9f2-18f3-48bc-a3d9-87a6dbe1254b', '1a078475-a428-4548-87f0-2e7e02bec3b3', 'Bowler', 2, true, '2025-10-08T08:57:37.978397+00:00', '2025-10-08T08:57:37.978397+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('fe0eb9ee-6ce3-443d-83ff-bc9cb52d4183', '1a078475-a428-4548-87f0-2e7e02bec3b3', 'Wicket Keeper', 3, true, '2025-10-08T08:57:45.464259+00:00', '2025-10-08T08:57:45.464259+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('20e24af7-c2e6-4bc7-9620-46cb71237ce2', '60fba08e-9de9-4542-b444-6a1fcbf68147', 'Right Arm Fast', 1, true, '2025-10-08T08:58:27.774419+00:00', '2025-10-08T08:58:27.774419+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('fcf372ce-6899-4622-a01d-7f486003b624', '60fba08e-9de9-4542-b444-6a1fcbf68147', 'Left Arm Fast', 2, true, '2025-10-08T08:58:44.337308+00:00', '2025-10-08T08:58:44.337308+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('96d2221d-27c0-4bcd-9d3c-277f3c20b23a', '60fba08e-9de9-4542-b444-6a1fcbf68147', 'Left Arm Spin', 6, true, '2025-10-08T08:59:29.253552+00:00', '2025-10-08T08:59:29.253552+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('b8dc6998-23e0-4264-9015-1a584f945a5c', '60fba08e-9de9-4542-b444-6a1fcbf68147', 'Right Arm Medium', 3, true, '2025-10-08T08:58:55.165212+00:00', '2025-10-08T08:58:55.165212+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('88c1748d-cae1-410a-876a-e4eee0328ebf', '60fba08e-9de9-4542-b444-6a1fcbf68147', 'Right Arm Spin', 5, true, '2025-10-08T08:59:13.949945+00:00', '2025-10-08T08:59:13.949945+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('63b058c8-90c6-4511-b0d4-a02fdb35fd0d', '60fba08e-9de9-4542-b444-6a1fcbf68147', 'Left Arm Medium', 4, true, '2025-10-08T08:59:04.805688+00:00', '2025-10-08T08:59:04.805688+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('fb4c43eb-a04d-4e89-a6d1-439a05eab691', 'f36878a0-3fc7-45d9-a5d0-6d70998fa282', '40', 0, true, '2025-10-08T09:03:57.306354+00:00', '2025-10-08T09:03:57.306354+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('18a82ef5-6a94-4eca-b4c1-1c67dceab335', 'f36878a0-3fc7-45d9-a5d0-6d70998fa282', '60', 1, true, '2025-10-08T09:04:04.917258+00:00', '2025-10-08T09:04:04.917258+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('2c5f8dc9-64ab-4a06-bb58-b0ff4d639827', 'f36878a0-3fc7-45d9-a5d0-6d70998fa282', '80', 2, true, '2025-10-08T09:04:11.041865+00:00', '2025-10-08T09:04:11.041865+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('55421821-b856-40b4-8183-da6200c649a0', 'f36878a0-3fc7-45d9-a5d0-6d70998fa282', '100', 3, true, '2025-10-08T09:04:17.686427+00:00', '2025-10-08T09:04:17.686427+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('5e868649-1328-4c90-842b-e9d72afa0eb9', 'f36878a0-3fc7-45d9-a5d0-6d70998fa282', '150', 4, true, '2025-10-08T09:04:39.44+00:00', '2025-10-08T09:04:39.44+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('6dacee83-e6df-444b-b4b0-f3b12dd2221e', 'f36878a0-3fc7-45d9-a5d0-6d70998fa282', '200', 5, true, '2025-10-08T09:04:48.240223+00:00', '2025-10-08T09:04:48.240223+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('45b6f6f8-b608-430e-959a-7a263c00bc2f', '30e8ca29-831d-4000-9157-47ee976d24b4', 'iBlitz', 0, true, '2025-10-08T10:56:38.757181+00:00', '2025-10-08T10:56:38.757181+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('73756899-2eea-48fb-91fe-46b692023f43', '30e8ca29-831d-4000-9157-47ee976d24b4', 'SmashToPlay', 1, true, '2025-10-08T10:56:49.531146+00:00', '2025-10-08T10:56:49.531146+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('122a60b5-8595-4977-8e64-bf9048361c25', '30e8ca29-831d-4000-9157-47ee976d24b4', 'Powerplay', 2, true, '2025-10-08T10:56:57.582059+00:00', '2025-10-08T10:56:57.582059+00:00');
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active, created_at, updated_at) VALUES ('ed0fde02-a0df-47aa-91b0-9f5f8fad84b6', '30e8ca29-831d-4000-9157-47ee976d24b4', 'PlayTM', 3, true, '2025-10-08T10:57:10.537073+00:00', '2025-10-08T10:57:10.537073+00:00');

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

