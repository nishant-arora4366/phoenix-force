-- Update the role constraint to include 'admin'
-- First, drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint that includes 'admin'
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('viewer', 'host', 'captain', 'admin'));

-- Update the role enum if it exists (PostgreSQL 12+)
-- This is optional but good practice
DO $$ 
BEGIN
    -- Check if the constraint exists and update it
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name = 'users_role_check' 
               AND table_name = 'users') THEN
        -- Constraint already updated above
        NULL;
    END IF;
END $$;
