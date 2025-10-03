-- Update existing users table with new profile fields
-- This script enhances the existing users table by adding new columns
-- NO separate table is created - all fields are added to the existing users table

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS firstname VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS middlename VARCHAR(100),
ADD COLUMN IF NOT EXISTS lastname VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS photo TEXT,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Update existing users with default values for required fields
UPDATE users 
SET 
  firstname = COALESCE(firstname, ''),
  lastname = COALESCE(lastname, '')
WHERE firstname IS NULL OR lastname IS NULL;

-- Add constraints
ALTER TABLE users 
ALTER COLUMN firstname SET NOT NULL,
ALTER COLUMN lastname SET NOT NULL;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Update the role constraint to include all roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('viewer', 'host', 'captain', 'admin'));

-- Create a function to generate username from email if not provided
CREATE OR REPLACE FUNCTION generate_username_from_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(SPLIT_PART(email, '@', 1));
END;
$$ LANGUAGE plpgsql;

-- Create a function to get full name
CREATE OR REPLACE FUNCTION get_user_full_name(user_record users)
RETURNS TEXT AS $$
BEGIN
  RETURN CONCAT_WS(' ', 
    user_record.firstname,
    COALESCE(user_record.middlename, ''),
    user_record.lastname
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get display name (username or full name)
CREATE OR REPLACE FUNCTION get_user_display_name(user_record users)
RETURNS TEXT AS $$
BEGIN
  IF user_record.username IS NOT NULL AND user_record.username != '' THEN
    RETURN user_record.username;
  ELSE
    RETURN get_user_full_name(user_record);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update the user sync trigger to handle new fields
CREATE OR REPLACE FUNCTION sync_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user in public.users
  INSERT INTO public.users (
    id,
    email,
    username,
    firstname,
    middlename,
    lastname,
    photo,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', generate_username_from_email(NEW.email)),
    COALESCE(NEW.raw_user_meta_data->>'firstname', ''),
    NEW.raw_user_meta_data->>'middlename',
    COALESCE(NEW.raw_user_meta_data->>'lastname', ''),
    NEW.raw_user_meta_data->>'photo',
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, users.username),
    firstname = COALESCE(EXCLUDED.firstname, users.firstname),
    middlename = COALESCE(EXCLUDED.middlename, users.middlename),
    lastname = COALESCE(EXCLUDED.lastname, users.lastname),
    photo = COALESCE(EXCLUDED.photo, users.photo),
    role = COALESCE(EXCLUDED.role, users.role),
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for new user fields
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Create updated RLS policies for new user fields
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (is_admin(auth.uid()));

-- Create a view for user profiles with computed fields
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  id,
  email,
  username,
  firstname,
  middlename,
  lastname,
  photo,
  role,
  get_user_full_name(users) as full_name,
  get_user_display_name(users) as display_name,
  created_at,
  updated_at
FROM users;

-- Grant permissions on the view
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;
