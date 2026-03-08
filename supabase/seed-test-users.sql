-- Seed test users for NowCast Platform development
-- 
-- INSTRUCTIONS:
-- 1. Run this AFTER the main migration (20260308_initial_nc_schema.sql)
-- 2. This creates 3 test accounts with email/password auth
-- 3. Password for all accounts: testpass123
--
-- If users already exist, this will skip them (ON CONFLICT DO NOTHING).

-- ─── Step 1: Add admin role support ─────────────────────────────────────────
ALTER TABLE nc_profiles DROP CONSTRAINT IF EXISTS nc_profiles_role_check;
ALTER TABLE nc_profiles ADD CONSTRAINT nc_profiles_role_check
  CHECK (role IN ('user', 'creator', 'admin'));

-- ─── Step 2: Temporarily drop auto-profile trigger ──────────────────────────
-- (We'll create profiles manually after user creation, then re-add the trigger)
DROP TRIGGER IF EXISTS on_auth_user_created_nc ON auth.users;

-- ─── Step 3: Create auth users via direct insert ────────────────────────────
-- Using Supabase's internal password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
  creator_id UUID := gen_random_uuid();
  user_id UUID := gen_random_uuid();
BEGIN
  -- Admin
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at, confirmation_token, recovery_token)
  VALUES (admin_id, '00000000-0000-0000-0000-000000000000', 'admin@nowcastplatform.com', crypt('testpass123', gen_salt('bf')), now(), '{"full_name":"NC Admin"}'::jsonb, 'authenticated', 'authenticated', now(), now(), '', '')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  SELECT admin_id, admin_id, jsonb_build_object('sub', admin_id::text, 'email', 'admin@nowcastplatform.com', 'email_verified', true), 'email', admin_id::text, now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = admin_id::text AND provider = 'email');

  INSERT INTO nc_profiles (id, email, name, role) VALUES (admin_id, 'admin@nowcastplatform.com', 'NC Admin', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', name = 'NC Admin';

  -- Creator
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at, confirmation_token, recovery_token)
  VALUES (creator_id, '00000000-0000-0000-0000-000000000000', 'creator@nowcastplatform.com', crypt('testpass123', gen_salt('bf')), now(), '{"full_name":"NC Creator"}'::jsonb, 'authenticated', 'authenticated', now(), now(), '', '')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  SELECT creator_id, creator_id, jsonb_build_object('sub', creator_id::text, 'email', 'creator@nowcastplatform.com', 'email_verified', true), 'email', creator_id::text, now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = creator_id::text AND provider = 'email');

  INSERT INTO nc_profiles (id, email, name, role) VALUES (creator_id, 'creator@nowcastplatform.com', 'NC Creator', 'creator')
  ON CONFLICT (id) DO UPDATE SET role = 'creator', name = 'NC Creator';

  -- User
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at, confirmation_token, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'user@nowcastplatform.com', crypt('testpass123', gen_salt('bf')), now(), '{"full_name":"NC User"}'::jsonb, 'authenticated', 'authenticated', now(), now(), '', '')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  SELECT user_id, user_id, jsonb_build_object('sub', user_id::text, 'email', 'user@nowcastplatform.com', 'email_verified', true), 'email', user_id::text, now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = user_id::text AND provider = 'email');

  INSERT INTO nc_profiles (id, email, name, role) VALUES (user_id, 'user@nowcastplatform.com', 'NC User', 'user')
  ON CONFLICT (id) DO UPDATE SET role = 'user', name = 'NC User';
END $$;

-- ─── Step 4: Re-add the auto-profile trigger ───────────────────────────────
CREATE TRIGGER on_auth_user_created_nc
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_nc_new_user();
