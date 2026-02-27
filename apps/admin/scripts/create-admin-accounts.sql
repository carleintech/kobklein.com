-- ─────────────────────────────────────────────────────────────────────────────
-- KobKlein Admin Accounts — Supabase SQL Seed  (v4 — 11 accounts, idempotent)
-- Run in: Supabase Dashboard → SQL Editor
--
-- Creates 11 admin accounts with bcrypt-hashed passwords & role metadata.
-- Safe to re-run — skips any account whose email already exists.
--
--   superadmin@kobklein.com   /  KobKlein#SuperAdmin2026   →  super_admin
--   admin@kobklein.com        /  KobKlein#Admin2026        →  admin
--   regional@kobklein.com     /  KobKlein#Regional2026     →  regional_manager
--   support@kobklein.com      /  KobKlein#Support2026      →  support_agent
--   compliance@kobklein.com   /  KobKlein#Compliance2026   →  compliance_officer
--   treasury@kobklein.com     /  KobKlein#Treasury2026     →  treasury_officer
--   hr@kobklein.com           /  KobKlein#Hr2026           →  hr_manager
--   investor@kobklein.com     /  KobKlein#Investor2026     →  investor
--   auditor@kobklein.com      /  KobKlein#Auditor2026      →  auditor
--   broadcast@kobklein.com    /  KobKlein#Broadcast2026    →  broadcaster
--   training@kobklein.com     /  KobKlein#Training2026     →  support_agent
--
-- NOTE: Change all passwords after first login!
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  _id   UUID;
  _iid  UUID := '00000000-0000-0000-0000-000000000000';

  -- Helper: insert one admin user + identity, skip if email already exists.
  -- Called inline for each account below.
BEGIN

-- ── 1. SUPER ADMIN ────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@kobklein.com') THEN
  _id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_super_admin
  ) VALUES (
    _id, _iid, 'authenticated', 'authenticated',
    'superadmin@kobklein.com',
    crypt('KobKlein#SuperAdmin2026', gen_salt('bf')),
    now(),
    '{"admin_role":"super_admin","role":"super_admin","first_name":"Super","last_name":"Admin"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', '', false, false
  );
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), _id, _id::text, 'email',
    jsonb_build_object('sub', _id::text, 'email', 'superadmin@kobklein.com'),
    now(), now(), now()
  );
  RAISE NOTICE '  ✅ Created: superadmin@kobklein.com → super_admin';
ELSE
  RAISE NOTICE '  ⏭  Skipped: superadmin@kobklein.com (already exists)';
END IF;

-- ── 2. ADMIN (Operations) ─────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@kobklein.com') THEN
  _id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_super_admin
  ) VALUES (
    _id, _iid, 'authenticated', 'authenticated',
    'admin@kobklein.com',
    crypt('KobKlein#Admin2026', gen_salt('bf')),
    now(),
    '{"admin_role":"admin","role":"admin","first_name":"Platform","last_name":"Admin"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', '', false, false
  );
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), _id, _id::text, 'email',
    jsonb_build_object('sub', _id::text, 'email', 'admin@kobklein.com'),
    now(), now(), now()
  );
  RAISE NOTICE '  ✅ Created: admin@kobklein.com → admin';
ELSE
  RAISE NOTICE '  ⏭  Skipped: admin@kobklein.com (already exists)';
END IF;

-- ── 3. REGIONAL MANAGER ───────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'regional@kobklein.com') THEN
  _id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_super_admin
  ) VALUES (
    _id, _iid, 'authenticated', 'authenticated',
    'regional@kobklein.com',
    crypt('KobKlein#Regional2026', gen_salt('bf')),
    now(),
    '{"admin_role":"regional_manager","role":"regional_manager","first_name":"Regional","last_name":"Manager"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', '', false, false
  );
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), _id, _id::text, 'email',
    jsonb_build_object('sub', _id::text, 'email', 'regional@kobklein.com'),
    now(), now(), now()
  );
  RAISE NOTICE '  ✅ Created: regional@kobklein.com → regional_manager';
ELSE
  RAISE NOTICE '  ⏭  Skipped: regional@kobklein.com (already exists)';
END IF;

-- ── 4. SUPPORT AGENT ─────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'support@kobklein.com') THEN
  _id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_super_admin
  ) VALUES (
    _id, _iid, 'authenticated', 'authenticated',
    'support@kobklein.com',
    crypt('KobKlein#Support2026', gen_salt('bf')),
    now(),
    '{"admin_role":"support_agent","role":"support_agent","first_name":"Support","last_name":"Agent"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', '', false, false
  );
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), _id, _id::text, 'email',
    jsonb_build_object('sub', _id::text, 'email', 'support@kobklein.com'),
    now(), now(), now()
  );
  RAISE NOTICE '  ✅ Created: support@kobklein.com → support_agent';
ELSE
  RAISE NOTICE '  ⏭  Skipped: support@kobklein.com (already exists)';
END IF;

-- ── 5. COMPLIANCE OFFICER ────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'compliance@kobklein.com') THEN
  _id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_super_admin
  ) VALUES (
    _id, _iid, 'authenticated', 'authenticated',
    'compliance@kobklein.com',
    crypt('KobKlein#Compliance2026', gen_salt('bf')),
    now(),
    '{"admin_role":"compliance_officer","role":"compliance_officer","first_name":"Compliance","last_name":"Officer"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', '', false, false
  );
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), _id, _id::text, 'email',
    jsonb_build_object('sub', _id::text, 'email', 'compliance@kobklein.com'),
    now(), now(), now()
  );
  RAISE NOTICE '  ✅ Created: compliance@kobklein.com → compliance_officer';
ELSE
  RAISE NOTICE '  ⏭  Skipped: compliance@kobklein.com (already exists)';
END IF;

-- ── 6. TREASURY OFFICER ───────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'treasury@kobklein.com') THEN
  _id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_super_admin
  ) VALUES (
    _id, _iid, 'authenticated', 'authenticated',
    'treasury@kobklein.com',
    crypt('KobKlein#Treasury2026', gen_salt('bf')),
    now(),
    '{"admin_role":"treasury_officer","role":"treasury_officer","first_name":"Treasury","last_name":"Officer"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', '', false, false
  );
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), _id, _id::text, 'email',
    jsonb_build_object('sub', _id::text, 'email', 'treasury@kobklein.com'),
    now(), now(), now()
  );
  RAISE NOTICE '  ✅ Created: treasury@kobklein.com → treasury_officer';
ELSE
  RAISE NOTICE '  ⏭  Skipped: treasury@kobklein.com (already exists)';
END IF;

-- ── 7. HR MANAGER ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'hr@kobklein.com') THEN
  _id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_super_admin
  ) VALUES (
    _id, _iid, 'authenticated', 'authenticated',
    'hr@kobklein.com',
    crypt('KobKlein#Hr2026', gen_salt('bf')),
    now(),
    '{"admin_role":"hr_manager","role":"hr_manager","first_name":"HR","last_name":"Manager"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', '', false, false
  );
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), _id, _id::text, 'email',
    jsonb_build_object('sub', _id::text, 'email', 'hr@kobklein.com'),
    now(), now(), now()
  );
  RAISE NOTICE '  ✅ Created: hr@kobklein.com → hr_manager';
ELSE
  RAISE NOTICE '  ⏭  Skipped: hr@kobklein.com (already exists)';
END IF;

-- ── 8. INVESTOR / PARTNER ─────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'investor@kobklein.com') THEN
  _id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_super_admin
  ) VALUES (
    _id, _iid, 'authenticated', 'authenticated',
    'investor@kobklein.com',
    crypt('KobKlein#Investor2026', gen_salt('bf')),
    now(),
    '{"admin_role":"investor","role":"investor","first_name":"Partner","last_name":"Investor"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', '', false, false
  );
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), _id, _id::text, 'email',
    jsonb_build_object('sub', _id::text, 'email', 'investor@kobklein.com'),
    now(), now(), now()
  );
  RAISE NOTICE '  ✅ Created: investor@kobklein.com → investor';
ELSE
  RAISE NOTICE '  ⏭  Skipped: investor@kobklein.com (already exists)';
END IF;

-- ── 6. AUDITOR ────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'auditor@kobklein.com') THEN
  _id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_super_admin
  ) VALUES (
    _id, _iid, 'authenticated', 'authenticated',
    'auditor@kobklein.com',
    crypt('KobKlein#Auditor2026', gen_salt('bf')),
    now(),
    '{"admin_role":"auditor","role":"auditor","first_name":"Compliance","last_name":"Auditor"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', '', false, false
  );
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), _id, _id::text, 'email',
    jsonb_build_object('sub', _id::text, 'email', 'auditor@kobklein.com'),
    now(), now(), now()
  );
  RAISE NOTICE '  ✅ Created: auditor@kobklein.com → auditor';
ELSE
  RAISE NOTICE '  ⏭  Skipped: auditor@kobklein.com (already exists)';
END IF;

-- ── 10. BROADCASTER (Notifications Manager) ──────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'broadcast@kobklein.com') THEN
  _id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_super_admin
  ) VALUES (
    _id, _iid, 'authenticated', 'authenticated',
    'broadcast@kobklein.com',
    crypt('KobKlein#Broadcast2026', gen_salt('bf')),
    now(),
    '{"admin_role":"broadcaster","role":"broadcaster","first_name":"Notifications","last_name":"Manager"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', '', false, false
  );
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), _id, _id::text, 'email',
    jsonb_build_object('sub', _id::text, 'email', 'broadcast@kobklein.com'),
    now(), now(), now()
  );
  RAISE NOTICE '  ✅ Created: broadcast@kobklein.com → broadcaster';
ELSE
  RAISE NOTICE '  ⏭  Skipped: broadcast@kobklein.com (already exists)';
END IF;

-- ── 11. TRAINING MANAGER ──────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'training@kobklein.com') THEN
  _id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_super_admin
  ) VALUES (
    _id, _iid, 'authenticated', 'authenticated',
    'training@kobklein.com',
    crypt('KobKlein#Training2026', gen_salt('bf')),
    now(),
    '{"admin_role":"support_agent","role":"support_agent","first_name":"Training","last_name":"Manager"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', '', false, false
  );
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), _id, _id::text, 'email',
    jsonb_build_object('sub', _id::text, 'email', 'training@kobklein.com'),
    now(), now(), now()
  );
  RAISE NOTICE '  ✅ Created: training@kobklein.com → support_agent';
ELSE
  RAISE NOTICE '  ⏭  Skipped: training@kobklein.com (already exists)';
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
RAISE NOTICE '';
RAISE NOTICE '────────────────────────────────────────────────────────────────';
RAISE NOTICE '  KobKlein — Admin Accounts Seed Complete (v4 — 11 accounts)';
RAISE NOTICE '  ⚠  Change all passwords after first login!';
RAISE NOTICE '────────────────────────────────────────────────────────────────';
RAISE NOTICE '  superadmin@kobklein.com   /  KobKlein#SuperAdmin2026   → super_admin';
RAISE NOTICE '  admin@kobklein.com        /  KobKlein#Admin2026        → admin';
RAISE NOTICE '  regional@kobklein.com     /  KobKlein#Regional2026     → regional_manager';
RAISE NOTICE '  support@kobklein.com      /  KobKlein#Support2026      → support_agent';
RAISE NOTICE '  compliance@kobklein.com   /  KobKlein#Compliance2026   → compliance_officer';
RAISE NOTICE '  treasury@kobklein.com     /  KobKlein#Treasury2026     → treasury_officer';
RAISE NOTICE '  hr@kobklein.com           /  KobKlein#Hr2026           → hr_manager';
RAISE NOTICE '  investor@kobklein.com     /  KobKlein#Investor2026     → investor';
RAISE NOTICE '  auditor@kobklein.com      /  KobKlein#Auditor2026      → auditor';
RAISE NOTICE '  broadcast@kobklein.com    /  KobKlein#Broadcast2026    → broadcaster';
RAISE NOTICE '  training@kobklein.com     /  KobKlein#Training2026     → support_agent';
RAISE NOTICE '────────────────────────────────────────────────────────────────';

END $$;
