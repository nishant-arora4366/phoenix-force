-- Check current Base Price skill values
-- This script verifies that the required base price values exist

-- Check what Base Price values currently exist
SELECT 
    'Current Base Price Values' as info,
    psv.value_name,
    psv.display_order
FROM player_skills ps
JOIN player_skill_values psv ON ps.id = psv.skill_id
WHERE ps.skill_name = 'Base Price'
ORDER BY psv.display_order;

-- Verify that the required values (40, 60, 100) exist
SELECT 
    'Required Base Price Values Check' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM player_skills ps JOIN player_skill_values psv ON ps.id = psv.skill_id WHERE ps.skill_name = 'Base Price' AND psv.value_name = '40') THEN '40 - EXISTS'
        ELSE '40 - MISSING'
    END as value_40,
    CASE 
        WHEN EXISTS (SELECT 1 FROM player_skills ps JOIN player_skill_values psv ON ps.id = psv.skill_id WHERE ps.skill_name = 'Base Price' AND psv.value_name = '60') THEN '60 - EXISTS'
        ELSE '60 - MISSING'
    END as value_60,
    CASE 
        WHEN EXISTS (SELECT 1 FROM player_skills ps JOIN player_skill_values psv ON ps.id = psv.skill_id WHERE ps.skill_name = 'Base Price' AND psv.value_name = '100') THEN '100 - EXISTS'
        ELSE '100 - MISSING'
    END as value_100;
