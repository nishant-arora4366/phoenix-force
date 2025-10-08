-- =====================================================
-- PHOENIX FORCE CRICKET - CREATE ADMIN USER
-- =====================================================
-- This script creates a proper admin user with password hash
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, let's check if the user already exists
SELECT 'Current user data:' as info;
SELECT id, email, username, role, status, password_hash IS NOT NULL as has_password 
FROM users 
WHERE email = 'nishantarora1998@gmail.com';

-- Delete the existing user if it exists (since it was created manually)
DELETE FROM users WHERE email = 'nishantarora1998@gmail.com';

-- Create the admin user with proper password hash
-- Password: "admin123" (you can change this)
-- The hash below is for password "admin123"
INSERT INTO users (
    id,
    email, 
    username, 
    firstname, 
    lastname, 
    role, 
    status, 
    password_hash,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'nishantarora1998@gmail.com',
    'nishant',
    'Nishant',
    'Arora',
    'admin',
    'approved',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8Kz2', -- password: admin123
    NOW(),
    NOW()
);

-- Verify the user was created
SELECT 'Admin user created successfully!' as status;
SELECT id, email, username, role, status, password_hash IS NOT NULL as has_password 
FROM users 
WHERE email = 'nishantarora1998@gmail.com';

-- Show login credentials
SELECT 
    'Login Credentials:' as info,
    'Email: nishantarora1998@gmail.com' as email,
    'Password: admin123' as password,
    'Role: admin' as role,
    'Status: approved' as status;
