-- Check current database structure for player skills
-- This will help us understand what skill values actually exist

-- 1. Check all player skills
SELECT 
    'Player Skills' as table_name,
    id,
    skill_name,
    skill_type,
    is_required,
    display_order,
    is_admin_managed,
    viewer_can_see
FROM player_skills
ORDER BY display_order;

-- 2. Check all skill values for each skill
SELECT 
    'Skill Values' as table_name,
    ps.skill_name,
    psv.id,
    psv.value_name,
    psv.display_order,
    psv.is_active
FROM player_skills ps
LEFT JOIN player_skill_values psv ON ps.id = psv.skill_id
ORDER BY ps.skill_name, psv.display_order;

-- 3. Check if there are any existing skill assignments
SELECT 
    'Existing Skill Assignments' as table_name,
    COUNT(*) as count
FROM player_skill_assignments;

-- 4. Check if there are any existing players
SELECT 
    'Existing Players' as table_name,
    COUNT(*) as count
FROM players;

-- 5. Check the structure of player_skill_assignments table
SELECT 
    'Table Structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'player_skill_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;
