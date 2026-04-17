-- ============================================================
-- 02_rls.sql — Row Level Security
-- Run this in the Supabase SQL editor.
--
-- Access is restricted to authenticated users. The app gates
-- every request behind Supabase Auth (see src/AuthGate.jsx),
-- so the anon role has no read/write access to any table.
--
-- Deployment order matters: deploy the client with AuthGate
-- FIRST, then apply this SQL. Running this file while the
-- client still uses the anon key with no session will lock the
-- live app out of its data.
-- ============================================================

-- Enable RLS on every table
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly             ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_info          ENABLE ROW LEVEL SECURITY;

-- Drop the previous anon-role policies if they exist (idempotent re-run).
DROP POLICY IF EXISTS "anon_select" ON transactions;
DROP POLICY IF EXISTS "anon_insert" ON transactions;
DROP POLICY IF EXISTS "anon_update" ON transactions;
DROP POLICY IF EXISTS "anon_delete" ON transactions;

DROP POLICY IF EXISTS "anon_select" ON transaction_history;
DROP POLICY IF EXISTS "anon_insert" ON transaction_history;
DROP POLICY IF EXISTS "anon_update" ON transaction_history;
DROP POLICY IF EXISTS "anon_delete" ON transaction_history;

DROP POLICY IF EXISTS "anon_select" ON monthly;
DROP POLICY IF EXISTS "anon_insert" ON monthly;
DROP POLICY IF EXISTS "anon_update" ON monthly;
DROP POLICY IF EXISTS "anon_delete" ON monthly;

DROP POLICY IF EXISTS "anon_select" ON owner_info;
DROP POLICY IF EXISTS "anon_insert" ON owner_info;
DROP POLICY IF EXISTS "anon_update" ON owner_info;
DROP POLICY IF EXISTS "anon_delete" ON owner_info;

-- ---- transactions ----------------------------------------
CREATE POLICY "auth_select" ON transactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON transactions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON transactions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON transactions
  FOR DELETE TO authenticated USING (true);

-- ---- transaction_history ---------------------------------
CREATE POLICY "auth_select" ON transaction_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON transaction_history
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON transaction_history
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON transaction_history
  FOR DELETE TO authenticated USING (true);

-- ---- monthly ---------------------------------------------
CREATE POLICY "auth_select" ON monthly
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON monthly
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON monthly
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON monthly
  FOR DELETE TO authenticated USING (true);

-- ---- owner_info ------------------------------------------
CREATE POLICY "auth_select" ON owner_info
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON owner_info
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON owner_info
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON owner_info
  FOR DELETE TO authenticated USING (true);
