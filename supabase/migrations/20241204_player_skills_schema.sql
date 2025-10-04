-- Create player_skills table for configurable player attributes
CREATE TABLE IF NOT EXISTS player_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_name VARCHAR(100) NOT NULL UNIQUE,
  skill_type VARCHAR(50) NOT NULL, -- 'select', 'multiselect', 'text', 'number'
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_skill_values table for skill options
CREATE TABLE IF NOT EXISTS player_skill_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID REFERENCES player_skills(id) ON DELETE CASCADE,
  value_name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(skill_id, value_name)
);

-- Create player_skill_assignments table to link players with their skill values
CREATE TABLE IF NOT EXISTS player_skill_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES player_skills(id) ON DELETE CASCADE,
  skill_value_id UUID REFERENCES player_skill_values(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, skill_id)
);

-- Insert initial player skills
INSERT INTO player_skills (skill_name, skill_type, is_required, display_order) VALUES
('Role', 'select', true, 1),
('Batting Style', 'select', false, 2),
('Bowling Style', 'select', false, 3),
('Group', 'select', false, 4),
('Price', 'number', true, 5);

-- Insert initial skill values
-- Role values
INSERT INTO player_skill_values (skill_id, value_name, display_order) 
SELECT id, 'Batsman', 1 FROM player_skills WHERE skill_name = 'Role'
UNION ALL
SELECT id, 'Bowler', 2 FROM player_skills WHERE skill_name = 'Role'
UNION ALL
SELECT id, 'All-rounder', 3 FROM player_skills WHERE skill_name = 'Role'
UNION ALL
SELECT id, 'Wicket-keeper', 4 FROM player_skills WHERE skill_name = 'Role';

-- Batting Style values
INSERT INTO player_skill_values (skill_id, value_name, display_order) 
SELECT id, 'Right-handed', 1 FROM player_skills WHERE skill_name = 'Batting Style'
UNION ALL
SELECT id, 'Left-handed', 2 FROM player_skills WHERE skill_name = 'Batting Style';

-- Bowling Style values
INSERT INTO player_skill_values (skill_id, value_name, display_order) 
SELECT id, 'Right-arm fast', 1 FROM player_skills WHERE skill_name = 'Bowling Style'
UNION ALL
SELECT id, 'Left-arm fast', 2 FROM player_skills WHERE skill_name = 'Bowling Style'
UNION ALL
SELECT id, 'Right-arm medium', 3 FROM player_skills WHERE skill_name = 'Bowling Style'
UNION ALL
SELECT id, 'Left-arm medium', 4 FROM player_skills WHERE skill_name = 'Bowling Style'
UNION ALL
SELECT id, 'Right-arm spin', 5 FROM player_skills WHERE skill_name = 'Bowling Style'
UNION ALL
SELECT id, 'Left-arm spin', 6 FROM player_skills WHERE skill_name = 'Bowling Style'
UNION ALL
SELECT id, 'Leg spin', 7 FROM player_skills WHERE skill_name = 'Bowling Style'
UNION ALL
SELECT id, 'Off spin', 8 FROM player_skills WHERE skill_name = 'Bowling Style';

-- Group values
INSERT INTO player_skill_values (skill_id, value_name, display_order) 
SELECT id, 'Group A', 1 FROM player_skills WHERE skill_name = 'Group'
UNION ALL
SELECT id, 'Group B', 2 FROM player_skills WHERE skill_name = 'Group'
UNION ALL
SELECT id, 'Group C', 3 FROM player_skills WHERE skill_name = 'Group'
UNION ALL
SELECT id, 'Group D', 4 FROM player_skills WHERE skill_name = 'Group';

-- Add RLS policies
ALTER TABLE player_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_skill_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_skill_assignments ENABLE ROW LEVEL SECURITY;

-- Allow all users to read skills and values
CREATE POLICY "Anyone can view player skills" ON player_skills FOR SELECT USING (true);
CREATE POLICY "Anyone can view player skill values" ON player_skill_values FOR SELECT USING (true);
CREATE POLICY "Anyone can view player skill assignments" ON player_skill_assignments FOR SELECT USING (true);

-- Only admins can modify skills and values
CREATE POLICY "Admins can manage player skills" ON player_skills FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND status = 'approved'
  )
);

CREATE POLICY "Admins can manage player skill values" ON player_skill_values FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND status = 'approved'
  )
);

-- Users can manage their own skill assignments
CREATE POLICY "Users can manage their own skill assignments" ON player_skill_assignments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM players 
    WHERE id = player_id 
    AND user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_player_skill_values_skill_id ON player_skill_values(skill_id);
CREATE INDEX idx_player_skill_assignments_player_id ON player_skill_assignments(player_id);
CREATE INDEX idx_player_skill_assignments_skill_id ON player_skill_assignments(skill_id);
