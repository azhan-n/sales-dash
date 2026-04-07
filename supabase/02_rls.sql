-- ============================================================
-- 02_rls.sql — Row Level Security
-- Run this in the Supabase SQL editor.
--
-- This dashboard uses the anon key directly (no user login).
-- RLS is enabled on all tables and the anon role is granted
-- full access — this prevents any other role or future table
-- from being accidentally exposed, while keeping the current
-- app working without changes.
--
-- To lock it down further later (e.g. require a login):
--   1. Set up Supabase Auth in the app
--   2. Replace the anon policies below with:
--      USING (auth.role() = 'authenticated')
-- ============================================================

-- Enable RLS on every table
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly             ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_info          ENABLE ROW LEVEL SECURITY;

-- ---- transactions ----------------------------------------
CREATE POLICY "anon_select" ON transactions
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON transactions
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON transactions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete" ON transactions
  FOR DELETE TO anon USING (true);

-- ---- transaction_history ---------------------------------
CREATE POLICY "anon_select" ON transaction_history
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON transaction_history
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON transaction_history
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete" ON transaction_history
  FOR DELETE TO anon USING (true);

-- ---- monthly ---------------------------------------------
CREATE POLICY "anon_select" ON monthly
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON monthly
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON monthly
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete" ON monthly
  FOR DELETE TO anon USING (true);

-- ---- owner_info ------------------------------------------
CREATE POLICY "anon_select" ON owner_info
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON owner_info
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON owner_info
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete" ON owner_info
  FOR DELETE TO anon USING (true);
