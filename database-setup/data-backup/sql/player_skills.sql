-- Data backup for table: player_skills
-- Backup timestamp: 2025-10-11T12:15:46.590Z
-- Record count: 5

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Insert data
INSERT INTO player_skills (id, skill_name, skill_type, is_required, display_order, created_at, updated_at, is_admin_managed, viewer_can_see) VALUES ('1a078475-a428-4548-87f0-2e7e02bec3b3', 'Role', 'multiselect', true, 1, '2025-10-08T08:52:17.007763+00:00', '2025-10-08T08:52:17.007763+00:00', false, true);
INSERT INTO player_skills (id, skill_name, skill_type, is_required, display_order, created_at, updated_at, is_admin_managed, viewer_can_see) VALUES ('66401c99-e797-4966-a742-1a5b4013345a', 'Batting Style', 'select', false, 2, '2025-10-08T08:53:57.24479+00:00', '2025-10-08T08:53:57.24479+00:00', false, true);
INSERT INTO player_skills (id, skill_name, skill_type, is_required, display_order, created_at, updated_at, is_admin_managed, viewer_can_see) VALUES ('30e8ca29-831d-4000-9157-47ee976d24b4', 'Community', 'multiselect', false, 0, '2025-10-08T10:56:28.815683+00:00', '2025-10-08T10:56:28.815683+00:00', false, true);
INSERT INTO player_skills (id, skill_name, skill_type, is_required, display_order, created_at, updated_at, is_admin_managed, viewer_can_see) VALUES ('60fba08e-9de9-4542-b444-6a1fcbf68147', 'Bowling Style', 'select', false, 3, '2025-10-08T08:58:13.519497+00:00', '2025-10-08T08:58:13.519497+00:00', false, true);
INSERT INTO player_skills (id, skill_name, skill_type, is_required, display_order, created_at, updated_at, is_admin_managed, viewer_can_see) VALUES ('f36878a0-3fc7-45d9-a5d0-6d70998fa282', 'Base Price', 'select', false, 4, '2025-10-08T09:03:37.711655+00:00', '2025-10-08T09:03:37.711655+00:00', true, true);

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

