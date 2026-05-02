-- ============================================================
-- 04_rpcs.sql — RPC functions used by the dashboard
-- Run this in the Supabase SQL editor.
-- ============================================================

-- ------------------------------------------------------------
-- get_archive_periods()
-- Returns distinct archive period labels, newest first.
-- Replaces: SELECT period FROM transaction_history (full scan)
-- Usage: supabase.rpc("get_archive_periods")
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_archive_periods()
RETURNS TABLE(period TEXT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT DISTINCT period
  FROM   transaction_history
  ORDER  BY period DESC;
$$;

-- ------------------------------------------------------------
-- archive_transactions(p_period TEXT)
-- Atomically copies all current transactions to history then
-- clears the transactions table. Runs inside an implicit
-- transaction — if any step fails, nothing is committed.
--
-- Usage: supabase.rpc("archive_transactions", { p_period: "May 2025" })
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION archive_transactions(p_period TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Guard: skip if this period is already archived
  IF EXISTS (
    SELECT 1 FROM transaction_history WHERE period = p_period LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Period "%" is already archived.', p_period;
  END IF;

  -- Guard: nothing to archive
  IF NOT EXISTS (SELECT 1 FROM transactions LIMIT 1) THEN
    RAISE EXCEPTION 'No transactions to archive.';
  END IF;

  -- Copy to history (trigger will re-compute cost/gross/net)
  INSERT INTO transaction_history
    (period, card_type, card_number, owner,
     buy_rate, buy_amount, sell_rate, sell_amount,
     cost, gross_profit, net_profit, date)
  SELECT
    p_period, card_type, card_number, owner,
    buy_rate, buy_amount, sell_rate, sell_amount,
    cost, gross_profit, net_profit,
    COALESCE(date, to_char(CURRENT_DATE, 'DD/MM/YY'))
  FROM transactions;

  -- Clear current transactions (WHERE clause required by Supabase
  -- safety check, even inside a SECURITY DEFINER function).
  DELETE FROM transactions WHERE id IS NOT NULL;
END;
$$;

-- Grant execute to anon so the dashboard can call them
GRANT EXECUTE ON FUNCTION get_archive_periods()             TO anon;
GRANT EXECUTE ON FUNCTION archive_transactions(TEXT)        TO anon;
