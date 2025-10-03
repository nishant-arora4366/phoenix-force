-- User Sync Trigger
-- This script creates a trigger to automatically sync auth.users with public.users

-- ==============================================
-- 1. CREATE USER SYNC FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'viewer'  -- Default role for new users
  );
  RETURN NEW;
END;
$$;

-- ==============================================
-- 2. CREATE TRIGGER
-- ==============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- 3. SYNC EXISTING USERS
-- ==============================================

-- Insert existing auth users into public.users table
INSERT INTO public.users (id, email, role)
SELECT 
  id,
  email,
  'viewer' as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 4. SUCCESS MESSAGE
-- ==============================================

SELECT 'User sync trigger created successfully!' as message;
