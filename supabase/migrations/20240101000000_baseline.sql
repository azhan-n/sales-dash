-- ============================================================
-- 20240101000000_baseline.sql — Schema baseline
-- ============================================================
-- Consolidated baseline of the database objects that existed
-- before migration tracking was introduced. Every statement is
-- idempotent (IF EXISTS / IF NOT EXISTS / OR REPLACE / DROP +
-- CREATE), so applying this against the live database where
-- these objects already exist is a safe no-op.
--
-- Future schema changes should land in new timestamped
-- migration files in this directory, NOT in this baseline.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Performance indexes
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_owner
  ON transactions(owner);

CREATE INDEX IF NOT EXISTS idx_transactions_card_number
  ON transactions(card_number);

CREATE INDEX IF NOT EXISTS idx_transaction_history_period
  ON transaction_history(period);

CREATE INDEX IF NOT EXISTS idx_transaction_history_period_id
  ON transaction_history(period, id ASC);


-- ------------------------------------------------------------
-- 2. Optional `status` column on transactions + history
-- ------------------------------------------------------------

ALTER TABLE transactions        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'settled';
ALTER TABLE transaction_history ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'settled';


-- ------------------------------------------------------------
-- 3. Computed-fields trigger
--    cost         = buy_rate  * buy_amount
--    gross_profit = sell_rate * sell_amount
--    net_profit   = gross_profit - cost
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION compute_transaction_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cost         := NEW.buy_rate  * NEW.buy_amount;
  NEW.gross_profit := NEW.sell_rate * NEW.sell_amount;
  NEW.net_profit   := NEW.gross_profit - NEW.cost;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_fields ON transactions;
CREATE TRIGGER trg_compute_fields
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION compute_transaction_fields();

DROP TRIGGER IF EXISTS trg_compute_fields ON transaction_history;
CREATE TRIGGER trg_compute_fields
  BEFORE INSERT OR UPDATE ON transaction_history
  FOR EACH ROW EXECUTE FUNCTION compute_transaction_fields();

-- Note: the original baseline included one-time UPDATE statements
-- to back-fill any drifted rows. They are omitted here because
-- (a) they were already applied to production, and (b) they would
-- needlessly rewrite every row each time this file ran.


-- ------------------------------------------------------------
-- 4. RPCs
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_archive_periods()
RETURNS TABLE(period TEXT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT DISTINCT period
  FROM   transaction_history
  ORDER  BY period DESC;
$$;

CREATE OR REPLACE FUNCTION archive_transactions(p_period TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM transaction_history WHERE period = p_period LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Period "%" is already archived.', p_period;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM transactions LIMIT 1) THEN
    RAISE EXCEPTION 'No transactions to archive.';
  END IF;

  INSERT INTO transaction_history
    (period, card_type, card_number, owner,
     buy_rate, buy_amount, sell_rate, sell_amount,
     cost, gross_profit, net_profit, date)
  SELECT
    p_period, card_type, card_number, owner,
    buy_rate, buy_amount, sell_rate, sell_amount,
    cost, gross_profit, net_profit,
    COALESCE(date, to_char(CURRENT_DATE, 'DD/MM/YYYY'))
  FROM transactions;

  DELETE FROM transactions WHERE id IS NOT NULL;
END;
$$;

-- These are SECURITY DEFINER and bypass RLS, so they must NOT be
-- callable by the public anon role — only by authenticated users.
GRANT EXECUTE ON FUNCTION get_archive_periods()      TO authenticated;
GRANT EXECUTE ON FUNCTION archive_transactions(TEXT) TO authenticated;


-- ------------------------------------------------------------
-- 5. Row Level Security
-- ------------------------------------------------------------

ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly             ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_info          ENABLE ROW LEVEL SECURITY;

-- Drop both the legacy anon_* policies (if still present from any
-- earlier era) and the current auth_* policies before re-creating
-- them, so this file stays fully idempotent.
DROP POLICY IF EXISTS "anon_select" ON transactions;
DROP POLICY IF EXISTS "anon_insert" ON transactions;
DROP POLICY IF EXISTS "anon_update" ON transactions;
DROP POLICY IF EXISTS "anon_delete" ON transactions;
DROP POLICY IF EXISTS "auth_select" ON transactions;
DROP POLICY IF EXISTS "auth_insert" ON transactions;
DROP POLICY IF EXISTS "auth_update" ON transactions;
DROP POLICY IF EXISTS "auth_delete" ON transactions;

DROP POLICY IF EXISTS "anon_select" ON transaction_history;
DROP POLICY IF EXISTS "anon_insert" ON transaction_history;
DROP POLICY IF EXISTS "anon_update" ON transaction_history;
DROP POLICY IF EXISTS "anon_delete" ON transaction_history;
DROP POLICY IF EXISTS "auth_select" ON transaction_history;
DROP POLICY IF EXISTS "auth_insert" ON transaction_history;
DROP POLICY IF EXISTS "auth_update" ON transaction_history;
DROP POLICY IF EXISTS "auth_delete" ON transaction_history;

DROP POLICY IF EXISTS "anon_select" ON monthly;
DROP POLICY IF EXISTS "anon_insert" ON monthly;
DROP POLICY IF EXISTS "anon_update" ON monthly;
DROP POLICY IF EXISTS "anon_delete" ON monthly;
DROP POLICY IF EXISTS "auth_select" ON monthly;
DROP POLICY IF EXISTS "auth_insert" ON monthly;
DROP POLICY IF EXISTS "auth_update" ON monthly;
DROP POLICY IF EXISTS "auth_delete" ON monthly;

DROP POLICY IF EXISTS "anon_select" ON owner_info;
DROP POLICY IF EXISTS "anon_insert" ON owner_info;
DROP POLICY IF EXISTS "anon_update" ON owner_info;
DROP POLICY IF EXISTS "anon_delete" ON owner_info;
DROP POLICY IF EXISTS "auth_select" ON owner_info;
DROP POLICY IF EXISTS "auth_insert" ON owner_info;
DROP POLICY IF EXISTS "auth_update" ON owner_info;
DROP POLICY IF EXISTS "auth_delete" ON owner_info;

-- transactions
CREATE POLICY "auth_select" ON transactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON transactions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON transactions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON transactions
  FOR DELETE TO authenticated USING (true);

-- transaction_history
CREATE POLICY "auth_select" ON transaction_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON transaction_history
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON transaction_history
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON transaction_history
  FOR DELETE TO authenticated USING (true);

-- monthly
CREATE POLICY "auth_select" ON monthly
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON monthly
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON monthly
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON monthly
  FOR DELETE TO authenticated USING (true);

-- owner_info
CREATE POLICY "auth_select" ON owner_info
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON owner_info
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON owner_info
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON owner_info
  FOR DELETE TO authenticated USING (true);
