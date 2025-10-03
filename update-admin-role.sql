-- Update role constraint to include 'admin'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('viewer', 'host', 'captain', 'admin'));

-- Update nishantarora's role to admin
UPDATE users 
SET role = 'admin', updated_at = NOW()
WHERE id = 'b8c70683-6c9b-4278-a2a3-0edc91b1f8e1';

-- Verify the update
SELECT id, email, role, updated_at FROM users WHERE id = 'b8c70683-6c9b-4278-a2a3-0edc91b1f8e1';
