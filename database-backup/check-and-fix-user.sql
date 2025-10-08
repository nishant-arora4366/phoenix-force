-- =====================================================
-- PHOENIX FORCE CRICKET - CHECK AND FIX USER
-- =====================================================
-- This script checks your user status and fixes the role/status
-- Run this in Supabase SQL Editor
-- =====================================================

-- Check current user data
SELECT 'Current user data:' as info;
SELECT 
    id, 
    email, 
    username, 
    firstname, 
    lastname, 
    role, 
    status, 
    password_hash IS NOT NULL as has_password,
    created_at,
    updated_at
FROM users 
WHERE email = 'nishantarora1998@gmail.com';

-- Update the user to admin role and approved status
UPDATE users 
SET 
    role = 'admin',
    status = 'approved',
    updated_at = NOW()
WHERE email = 'nishantarora1998@gmail.com';

-- Verify the update
SELECT 'User updated successfully!' as status;
SELECT 
    id, 
    email, 
    username, 
    firstname, 
    lastname, 
    role, 
    status, 
    password_hash IS NOT NULL as has_password,
    created_at,
    updated_at
FROM users 
WHERE email = 'nishantarora1998@gmail.com';

-- Show login instructions
SELECT 
    'Login Instructions:' as info,
    '1. Go to the sign-in page' as step1,
    '2. Use your email: nishantarora1998@gmail.com' as step2,
    '3. Use the password you set during sign-up' as step3,
    '4. You should now have admin access!' as step4;
