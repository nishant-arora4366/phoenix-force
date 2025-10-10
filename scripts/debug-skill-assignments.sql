-- Debug script to check player skill assignments
-- Run this to diagnose why skills are not being stored properly

-- 1. Check if players were imported
SELECT 
    'Players Imported' as check_type,
    COUNT(*) as count
FROM players 
WHERE created_by = (SELECT id FROM users WHERE email = 'nishantarora1998@gmail.com' AND role = 'admin');

-- 2. Check if skill assignments were created
SELECT 
    'Skill Assignments Created' as check_type,
    COUNT(*) as count
FROM player_skill_assignments psa
JOIN players p ON psa.player_id = p.id
WHERE p.created_by = (SELECT id FROM users WHERE email = 'nishantarora1998@gmail.com' AND role = 'admin');

-- 3. Check what skills exist in the system
SELECT 
    'Available Skills' as check_type,
    ps.skill_name,
    ps.skill_type,
    ps.is_required
FROM player_skills ps
ORDER BY ps.display_order;

-- 4. Check what skill values exist for each skill
SELECT 
    'Skill Values' as check_type,
    ps.skill_name,
    psv.value_name,
    psv.display_order
FROM player_skills ps
JOIN player_skill_values psv ON ps.id = psv.skill_id
ORDER BY ps.skill_name, psv.display_order;

-- 5. Check skill assignments by skill type
SELECT 
    'Skill Assignments by Type' as check_type,
    ps.skill_name,
    COUNT(*) as assignment_count
FROM player_skill_assignments psa
JOIN player_skills ps ON psa.skill_id = ps.id
JOIN players p ON psa.player_id = p.id
WHERE p.created_by = (SELECT id FROM users WHERE email = 'nishantarora1998@gmail.com' AND role = 'admin')
GROUP BY ps.skill_name
ORDER BY ps.skill_name;

-- 6. Show sample player with all their skill assignments
SELECT 
    'Sample Player Skills' as check_type,
    p.display_name,
    ps.skill_name,
    psv.value_name
FROM players p
LEFT JOIN player_skill_assignments psa ON p.id = psa.player_id
LEFT JOIN player_skills ps ON psa.skill_id = ps.id
LEFT JOIN player_skill_values psv ON psa.skill_value_id = psv.id
WHERE p.created_by = (SELECT id FROM users WHERE email = 'nishantarora1998@gmail.com' AND role = 'admin')
AND p.display_name = 'Nishant Arora'
ORDER BY ps.skill_name;

-- 7. Check for any error patterns in skill assignments
SELECT 
    'Skill Assignment Issues' as check_type,
    psa.player_id,
    psa.skill_id,
    psa.skill_value_id,
    ps.skill_name,
    psv.value_name
FROM player_skill_assignments psa
LEFT JOIN player_skills ps ON psa.skill_id = ps.id
LEFT JOIN player_skill_values psv ON psa.skill_value_id = psv.id
JOIN players p ON psa.player_id = p.id
WHERE p.created_by = (SELECT id FROM users WHERE email = 'nishantarora1998@gmail.com' AND role = 'admin')
AND (ps.skill_name IS NULL OR psv.value_name IS NULL)
LIMIT 10;
