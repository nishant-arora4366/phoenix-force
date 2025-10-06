-- Migration to refactor player schema for dynamic skills
-- Remove conflicting columns and add missing fields

-- Add mobile number if not exists
ALTER TABLE players ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(15);

-- Remove conflicting columns that will be handled by dynamic skills
ALTER TABLE players DROP COLUMN IF EXISTS is_bowler;
ALTER TABLE players DROP COLUMN IF EXISTS is_batter;
ALTER TABLE players DROP COLUMN IF EXISTS is_wicket_keeper;
ALTER TABLE players DROP COLUMN IF EXISTS bowling_rating;
ALTER TABLE players DROP COLUMN IF EXISTS batting_rating;
ALTER TABLE players DROP COLUMN IF EXISTS wicket_keeping_rating;
ALTER TABLE players DROP COLUMN IF EXISTS group_name;
ALTER TABLE players DROP COLUMN IF EXISTS stage_name;
ALTER TABLE players DROP COLUMN IF EXISTS base_price;

-- Insert default player skills
INSERT INTO player_skills (skill_name, skill_type, is_required, display_order) VALUES
('Role', 'select', true, 1),
('Batting Style', 'select', false, 2),
('Bowling Style', 'select', false, 3),
('Group', 'select', false, 4),
('Base Price', 'select', true, 5)
ON CONFLICT (skill_name) DO NOTHING;

-- Insert default skill values for Role
INSERT INTO player_skill_values (skill_id, value_name, display_order, is_active) 
SELECT 
  ps.id,
  role_value,
  row_number() OVER (ORDER BY role_value),
  true
FROM player_skills ps,
(VALUES 
  ('Batsman'),
  ('Bowler'),
  ('All-rounder'),
  ('Wicket-keeper'),
  ('Wicket-keeper Batsman')
) AS roles(role_value)
WHERE ps.skill_name = 'Role'
ON CONFLICT (skill_id, value_name) DO NOTHING;

-- Insert default skill values for Batting Style
INSERT INTO player_skill_values (skill_id, value_name, display_order, is_active) 
SELECT 
  ps.id,
  batting_value,
  row_number() OVER (ORDER BY batting_value),
  true
FROM player_skills ps,
(VALUES 
  ('Right Hand'),
  ('Left Hand')
) AS batting(batting_value)
WHERE ps.skill_name = 'Batting Style'
ON CONFLICT (skill_id, value_name) DO NOTHING;

-- Insert default skill values for Bowling Style
INSERT INTO player_skill_values (skill_id, value_name, display_order, is_active) 
SELECT 
  ps.id,
  bowling_value,
  row_number() OVER (ORDER BY bowling_value),
  true
FROM player_skills ps,
(VALUES 
  ('Right Arm Fast'),
  ('Right Arm Medium'),
  ('Right Arm Spin'),
  ('Left Arm Fast'),
  ('Left Arm Medium'),
  ('Left Arm Spin'),
  ('Leg Spin'),
  ('Off Spin')
) AS bowling(bowling_value)
WHERE ps.skill_name = 'Bowling Style'
ON CONFLICT (skill_id, value_name) DO NOTHING;

-- Insert default skill values for Group
INSERT INTO player_skill_values (skill_id, value_name, display_order, is_active) 
SELECT 
  ps.id,
  group_value,
  row_number() OVER (ORDER BY group_value),
  true
FROM player_skills ps,
(VALUES 
  ('A'),
  ('B'),
  ('C'),
  ('D')
) AS groups(group_value)
WHERE ps.skill_name = 'Group'
ON CONFLICT (skill_id, value_name) DO NOTHING;

-- Insert default skill values for Base Price
INSERT INTO player_skill_values (skill_id, value_name, display_order, is_active) 
SELECT 
  ps.id,
  price_value,
  row_number() OVER (ORDER BY price_value::integer),
  true
FROM player_skills ps,
(VALUES 
  ('50000'),
  ('100000'),
  ('150000'),
  ('200000'),
  ('250000'),
  ('300000'),
  ('350000'),
  ('400000'),
  ('450000'),
  ('500000')
) AS prices(price_value)
WHERE ps.skill_name = 'Base Price'
ON CONFLICT (skill_id, value_name) DO NOTHING;
