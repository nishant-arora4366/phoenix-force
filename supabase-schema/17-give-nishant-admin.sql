-- Give Nishant admin access
-- This script updates Nishant's role to admin

-- First, let's check if Nishant exists in the users table
SELECT 
    id,
    email,
    username,
    firstname,
    lastname,
    role,
    created_at
FROM users 
WHERE email LIKE '%nishant%' OR email LIKE '%nishantarora%';

-- Update Nishant's role to admin
-- Using the email pattern to find Nishant's account
UPDATE users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email LIKE '%nishant%' OR email LIKE '%nishantarora%';

-- Verify the update
SELECT 
    id,
    email,
    username,
    firstname,
    lastname,
    role,
    updated_at
FROM users 
WHERE email LIKE '%nishant%' OR email LIKE '%nishantarora%';

-- Show all admin users
SELECT 
    id,
    email,
    username,
    firstname,
    lastname,
    role,
    created_at
FROM users 
WHERE role = 'admin'
ORDER BY created_at;
