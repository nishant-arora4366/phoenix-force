-- Verification script to ensure users table has all profile fields
-- and no separate profile table exists

-- 1. Check if any separate profile tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%profile%'
    AND table_name != 'users';

-- 2. Show the current structure of the users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if the users table has all required profile fields
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') 
        THEN '✓ username column exists'
        ELSE '✗ username column missing'
    END as username_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'firstname') 
        THEN '✓ firstname column exists'
        ELSE '✗ firstname column missing'
    END as firstname_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'lastname') 
        THEN '✓ lastname column exists'
        ELSE '✗ lastname column missing'
    END as lastname_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'photo') 
        THEN '✓ photo column exists'
        ELSE '✗ photo column missing'
    END as photo_check;

-- 4. Show sample user data to verify structure
SELECT 
    id,
    email,
    username,
    firstname,
    middlename,
    lastname,
    photo,
    role,
    created_at
FROM users 
LIMIT 3;
