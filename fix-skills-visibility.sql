-- Fix skills visibility - make all existing skills visible to viewers
-- This will ensure that existing skills are not hidden from viewers

UPDATE player_skills 
SET viewer_can_see = true 
WHERE viewer_can_see IS NULL OR viewer_can_see = false;

-- Also ensure is_admin_managed is properly set
UPDATE player_skills 
SET is_admin_managed = false 
WHERE is_admin_managed IS NULL;

-- Show current state
SELECT 
    skill_name,
    skill_type,
    is_admin_managed,
    viewer_can_see,
    is_required,
    display_order
FROM player_skills 
ORDER BY display_order;
