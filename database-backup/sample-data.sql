-- =====================================================
-- PHOENIX FORCE CRICKET - SAMPLE DATA
-- =====================================================
-- This script creates sample data for testing
-- Run this in Supabase SQL Editor after restoring schema
-- =====================================================

-- Sample Users
INSERT INTO users (id, email, username, firstname, lastname, role, status) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@phoenixforce.com', 'admin', 'Admin', 'User', 'admin', 'approved'),
('22222222-2222-2222-2222-222222222222', 'host@phoenixforce.com', 'host1', 'John', 'Host', 'host', 'approved'),
('33333333-3333-3333-3333-333333333333', 'captain@phoenixforce.com', 'captain1', 'Mike', 'Captain', 'captain', 'approved'),
('44444444-4444-4444-4444-444444444444', 'player1@phoenixforce.com', 'player1', 'Alex', 'Player', 'viewer', 'approved'),
('55555555-5555-5555-5555-555555555555', 'player2@phoenixforce.com', 'player2', 'Sam', 'Player', 'viewer', 'approved'),
('66666666-6666-6666-6666-666666666666', 'player3@phoenixforce.com', 'player3', 'Tom', 'Player', 'viewer', 'approved'),
('77777777-7777-7777-7777-777777777777', 'player4@phoenixforce.com', 'player4', 'Ben', 'Player', 'viewer', 'approved'),
('88888888-8888-8888-8888-888888888888', 'player5@phoenixforce.com', 'player5', 'Jake', 'Player', 'viewer', 'approved');

-- Sample Players
INSERT INTO players (id, user_id, display_name, bio, mobile_number, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'Alex Smith', 'Experienced batsman with 5+ years of cricket', '+1234567890', 'approved'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'Sam Wilson', 'All-rounder, good with both bat and ball', '+1234567891', 'approved'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '66666666-6666-6666-6666-666666666666', 'Tom Brown', 'Fast bowler, known for yorkers', '+1234567892', 'approved'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '77777777-7777-7777-7777-777777777777', 'Ben Davis', 'Wicket keeper and middle order batsman', '+1234567893', 'approved'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '88888888-8888-8888-8888-888888888888', 'Jake Miller', 'Opening batsman, aggressive style', '+1234567894', 'approved');

-- Sample Tournament
INSERT INTO tournaments (id, name, host_id, host_player_id, status, total_slots, format, selected_teams, tournament_date, description) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Summer Championship 2024', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'registration_open', 22, 'Bilateral', 2, '2024-12-25', 'Annual summer cricket championship with 2 teams');

-- Sample Tournament Slots
INSERT INTO tournament_slots (id, tournament_id, slot_number, player_id, status, requested_at) VALUES
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'confirmed', NOW() - INTERVAL '1 day'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 2, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'confirmed', NOW() - INTERVAL '1 day'),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'pending', NOW() - INTERVAL '2 hours'),
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 4, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'pending', NOW() - INTERVAL '1 hour'),
('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'waitlist', NOW() - INTERVAL '30 minutes');

-- Sample Teams
INSERT INTO teams (id, tournament_id, name, captain_id, captain_user_id, initial_budget, budget_remaining) VALUES
('llllllll-llll-llll-llll-llllllllllll', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Team Alpha', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 100000.00, 100000.00),
('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Team Beta', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 100000.00, 100000.00);

-- Sample Player Skills
INSERT INTO player_skills (id, skill_name, skill_type, is_required, display_order, is_admin_managed, viewer_can_see) VALUES
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', 'Batting Style', 'text', true, 1, false, true),
('oooooooo-oooo-oooo-oooo-oooooooooooo', 'Bowling Style', 'text', true, 2, false, true),
('pppppppp-pppp-pppp-pppp-pppppppppppp', 'Experience Level', 'select', true, 3, false, true),
('qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', 'Preferred Position', 'select', false, 4, false, true);

-- Sample Player Skill Values
INSERT INTO player_skill_values (id, skill_id, value_name, display_order, is_active) VALUES
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', 'Right Handed', 1, true),
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', 'Left Handed', 2, true),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'oooooooo-oooo-oooo-oooo-oooooooooooo', 'Right Arm Fast', 1, true),
('uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', 'oooooooo-oooo-oooo-oooo-oooooooooooo', 'Left Arm Spin', 2, true),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv', 'pppppppp-pppp-pppp-pppp-pppppppppppp', 'Beginner', 1, true),
('wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww', 'pppppppp-pppp-pppp-pppp-pppppppppppp', 'Intermediate', 2, true),
('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'pppppppp-pppp-pppp-pppp-pppppppppppp', 'Advanced', 3, true);

-- Sample Player Skill Assignments
INSERT INTO player_skill_assignments (id, player_id, skill_id, skill_value_id) VALUES
('yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr'),
('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pppppppp-pppp-pppp-pppp-pppppppppppp', 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'),
('11111111-1111-1111-1111-111111111112', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', 'ssssssss-ssss-ssss-ssss-ssssssssssss'),
('11111111-1111-1111-1111-111111111113', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'pppppppp-pppp-pppp-pppp-pppppppppppp', 'wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww');

-- Sample Tags
INSERT INTO tags (id, name) VALUES
('11111111-1111-1111-1111-111111111114', 'All Rounder'),
('11111111-1111-1111-1111-111111111115', 'Fast Bowler'),
('11111111-1111-1111-1111-111111111116', 'Batsman'),
('11111111-1111-1111-1111-111111111117', 'Wicket Keeper');

-- Sample Player Tags
INSERT INTO player_tags (player_id, tag_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111116'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111114'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111115'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111117');

-- Sample Notifications
INSERT INTO notifications (id, user_id, type, title, message, data, created_at) VALUES
('11111111-1111-1111-1111-111111111118', '44444444-4444-4444-4444-444444444444', 'slot_confirmed', 'Slot Confirmed', 'Your slot in Summer Championship 2024 has been confirmed!', '{"tournament_id": "ffffffff-ffff-ffff-ffff-ffffffffffff", "slot_number": 1}', NOW() - INTERVAL '1 day'),
('11111111-1111-1111-1111-111111111119', '55555555-5555-5555-5555-555555555555', 'slot_confirmed', 'Slot Confirmed', 'Your slot in Summer Championship 2024 has been confirmed!', '{"tournament_id": "ffffffff-ffff-ffff-ffff-ffffffffffff", "slot_number": 2}', NOW() - INTERVAL '1 day'),
('11111111-1111-1111-1111-111111111120', '66666666-6666-6666-6666-666666666666', 'slot_pending', 'Slot Pending Approval', 'Your slot request for Summer Championship 2024 is pending approval.', '{"tournament_id": "ffffffff-ffff-ffff-ffff-ffffffffffff", "slot_number": 3}', NOW() - INTERVAL '2 hours');

-- Verify data insertion
SELECT 'Sample data inserted successfully!' as status;
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'tournaments', COUNT(*) FROM tournaments
UNION ALL
SELECT 'tournament_slots', COUNT(*) FROM tournament_slots
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'player_skills', COUNT(*) FROM player_skills
UNION ALL
SELECT 'player_skill_values', COUNT(*) FROM player_skill_values
UNION ALL
SELECT 'player_skill_assignments', COUNT(*) FROM player_skill_assignments
UNION ALL
SELECT 'tags', COUNT(*) FROM tags
UNION ALL
SELECT 'player_tags', COUNT(*) FROM player_tags
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;
