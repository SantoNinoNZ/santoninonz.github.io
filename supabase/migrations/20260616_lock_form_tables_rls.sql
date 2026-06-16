-- Migration: Lock down form tables so only the service role can insert
-- This prevents bots from POSTing directly to Supabase using the anon key.
-- All legitimate form submissions must go through the submit-form Edge Function,
-- which verifies Cloudflare Turnstile CAPTCHA before inserting with service role.

-- ============================================================
-- contact_messages
-- ============================================================

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop any existing insert policy that allowed anon inserts
DROP POLICY IF EXISTS "Allow anon inserts" ON contact_messages;
DROP POLICY IF EXISTS "anon_insert" ON contact_messages;
DROP POLICY IF EXISTS "public_insert" ON contact_messages;

-- Only service_role (used by the edge function) can insert — no anon inserts
-- (service_role bypasses RLS by default in Supabase, so no explicit policy needed)

-- Allow admins (authenticated users) to read all contact messages
DROP POLICY IF EXISTS "Allow authenticated read" ON contact_messages;
CREATE POLICY "Allow authenticated read"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- prayer_requests
-- ============================================================

ALTER TABLE IF EXISTS prayer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon inserts" ON prayer_requests;
DROP POLICY IF EXISTS "anon_insert" ON prayer_requests;
DROP POLICY IF EXISTS "public_insert" ON prayer_requests;

DROP POLICY IF EXISTS "Allow authenticated read" ON prayer_requests;
CREATE POLICY "Allow authenticated read"
  ON prayer_requests FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- home_visit_requests
-- ============================================================

ALTER TABLE IF EXISTS home_visit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon inserts" ON home_visit_requests;
DROP POLICY IF EXISTS "anon_insert" ON home_visit_requests;
DROP POLICY IF EXISTS "public_insert" ON home_visit_requests;

DROP POLICY IF EXISTS "Allow authenticated read" ON home_visit_requests;
CREATE POLICY "Allow authenticated read"
  ON home_visit_requests FOR SELECT
  TO authenticated
  USING (true);
