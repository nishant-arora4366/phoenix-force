-- Add support for array values in player_skill_assignments
-- This allows skills like "Role" to have multiple values (e.g., ["Batsman", "Wicket-Keeper"])

-- Add a new column to store array values
ALTER TABLE public.player_skill_assignments 
ADD COLUMN IF NOT EXISTS value_array TEXT[];

-- Add a new column to store multiple skill_value_ids for multi-select skills
ALTER TABLE public.player_skill_assignments 
ADD COLUMN IF NOT EXISTS skill_value_ids UUID[];

-- Add a check constraint to ensure at least one of skill_value_id or skill_value_ids is set
-- First drop the constraint if it exists, then add it
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'player_skill_assignments_value_check' 
               AND table_name = 'player_skill_assignments') THEN
        ALTER TABLE public.player_skill_assignments DROP CONSTRAINT player_skill_assignments_value_check;
    END IF;
END $$;

ALTER TABLE public.player_skill_assignments 
ADD CONSTRAINT player_skill_assignments_value_check 
CHECK (skill_value_id IS NOT NULL OR skill_value_ids IS NOT NULL);

-- Update the Role skill to support multiple selections
-- First, let's add a new skill type for multi-select
UPDATE public.player_skills 
SET skill_type = 'multiselect' 
WHERE skill_name = 'Role';

-- Add some additional role combinations as values
INSERT INTO public.player_skill_values (skill_id, value_name, display_order, is_active)
SELECT id, 'Batsman + Wicket-Keeper', 5, true 
FROM public.player_skills WHERE skill_name = 'Role' 
ON CONFLICT (skill_id, value_name) DO NOTHING;

INSERT INTO public.player_skill_values (skill_id, value_name, display_order, is_active)
SELECT id, 'Bowler + Wicket-Keeper', 6, true 
FROM public.player_skills WHERE skill_name = 'Role' 
ON CONFLICT (skill_id, value_name) DO NOTHING;

INSERT INTO public.player_skill_values (skill_id, value_name, display_order, is_active)
SELECT id, 'All-Rounder + Wicket-Keeper', 7, true 
FROM public.player_skills WHERE skill_name = 'Role' 
ON CONFLICT (skill_id, value_name) DO NOTHING;
