-- Update users table for custom authentication
-- Add password field and status field for admin approval workflow

-- Add password field (hashed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add status field for admin approval
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Add constraint for status values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_status_check' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Update existing users to approved status
UPDATE users SET status = 'approved' WHERE status IS NULL;

-- Add index for status for better performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add index for email for login performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Update RLS policies for custom auth
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid()::text = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid()::text = id);

-- Allow admins to view all users
CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text 
    AND role = 'admin'
  )
);

-- Allow admins to update all users
CREATE POLICY "Admins can update all users" ON users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text 
    AND role = 'admin'
  )
);

-- Allow new user registration (insert)
CREATE POLICY "Allow user registration" ON users
FOR INSERT WITH CHECK (true);
