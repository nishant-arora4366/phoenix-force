-- Sample Data for Testing
-- This script inserts sample data to test the schema

-- Insert sample tags
INSERT INTO public.tags (name) VALUES 
    ('All-rounder'),
    ('Aggressive'),
    ('Defensive'),
    ('Power Hitter'),
    ('Spin Bowler'),
    ('Fast Bowler'),
    ('Wicket Keeper'),
    ('Captain Material'),
    ('Experienced'),
    ('Young Talent')
ON CONFLICT (name) DO NOTHING;

-- Insert sample users (these would normally come from Supabase auth)
-- Note: In production, users are created through Supabase auth.signUp()
INSERT INTO public.users (id, email, role) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'host@example.com', 'host'),
    ('00000000-0000-0000-0000-000000000002', 'player1@example.com', 'viewer'),
    ('00000000-0000-0000-0000-000000000003', 'player2@example.com', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample players
INSERT INTO public.players (id, user_id, display_name, stage_name, bio, base_price, group_name, is_bowler, is_batter, is_wicket_keeper, bowling_rating, batting_rating, wicket_keeping_rating) VALUES 
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Host Player', 'Host', 'Tournament host player', 100.00, 'Group A', true, true, false, 8, 7, 0),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Player One', 'P1', 'Aggressive batsman', 150.00, 'Group A', false, true, false, 0, 9, 0),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Player Two', 'P2', 'All-rounder', 200.00, 'Group B', true, true, true, 8, 8, 7)
ON CONFLICT (id) DO NOTHING;

-- Insert sample tournament
INSERT INTO public.tournaments (id, name, host_id, host_player_id, status, total_slots, min_bid_amount, min_increment) VALUES 
    ('20000000-0000-0000-0000-000000000001', 'Sample Tournament', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'registration_open', 8, 50.00, 10.00)
ON CONFLICT (id) DO NOTHING;

-- Insert sample tournament slots
INSERT INTO public.tournament_slots (tournament_id, slot_number, status) VALUES 
    ('20000000-0000-0000-0000-000000000001', 1, 'empty'),
    ('20000000-0000-0000-0000-000000000001', 2, 'empty'),
    ('20000000-0000-0000-0000-000000000001', 3, 'empty'),
    ('20000000-0000-0000-0000-000000000001', 4, 'empty'),
    ('20000000-0000-0000-0000-000000000001', 5, 'empty'),
    ('20000000-0000-0000-0000-000000000001', 6, 'empty'),
    ('20000000-0000-0000-0000-000000000001', 7, 'empty'),
    ('20000000-0000-0000-0000-000000000001', 8, 'empty')
ON CONFLICT (tournament_id, slot_number) DO NOTHING;
