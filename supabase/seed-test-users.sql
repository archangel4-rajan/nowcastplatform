-- Seed test users for NowCast Platform development
-- Run this in Supabase SQL Editor AFTER the main migration
--
-- Password for all accounts: testpass123
--
-- NOTE: Supabase auth.users requires hashed passwords.
-- The easiest way to create these accounts is via the Supabase Auth API.
-- Use the Dashboard → Authentication → Users → Add User (email/password)
-- or run these API calls.

-- Step 1: Create users via Supabase Auth (run from SQL Editor)
-- These use the built-in admin functions available in SQL Editor context.

-- Admin user
SELECT auth.create_user('{
  "email": "admin@nowcastplatform.com",
  "password": "testpass123",
  "email_confirm": true,
  "user_metadata": {"full_name": "NC Admin"}
}'::jsonb);

-- Creator user
SELECT auth.create_user('{
  "email": "creator@nowcastplatform.com",
  "password": "testpass123",
  "email_confirm": true,
  "user_metadata": {"full_name": "NC Creator"}
}'::jsonb);

-- Regular user
SELECT auth.create_user('{
  "email": "user@nowcastplatform.com",
  "password": "testpass123",
  "email_confirm": true,
  "user_metadata": {"full_name": "NC User"}
}'::jsonb);

-- Step 2: Expand role constraint to include 'admin'
ALTER TABLE nc_profiles DROP CONSTRAINT IF EXISTS nc_profiles_role_check;
ALTER TABLE nc_profiles ADD CONSTRAINT nc_profiles_role_check
  CHECK (role IN ('user', 'creator', 'admin'));

-- Step 3: Update nc_profiles with correct roles
-- (The trigger auto-creates profiles with role='user', so we just update)
UPDATE nc_profiles SET role = 'admin'
WHERE email = 'admin@nowcastplatform.com';

UPDATE nc_profiles SET role = 'creator'
WHERE email = 'creator@nowcastplatform.com';

-- Regular user stays as 'user' (default)
