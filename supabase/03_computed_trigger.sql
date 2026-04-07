-- ============================================================
-- 03_computed_trigger.sql — Enforce computed column consistency
-- Run this in the Supabase SQL editor.
--
-- cost         = buy_rate  * buy_amount
-- gross_profit = sell_rate * sell_amount
-- net_profit   = gross_profit - cost
--
-- The trigger fires on every INSERT and UPDATE, so even if the
-- app sends incorrect computed values they are silently corrected.
-- Existing rows are NOT back-filled; run the UPDATE below to fix
-- any historical drift.
-- ============================================================

CREATE OR REPLACE FUNCTION compute_transaction_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cost         := NEW.buy_rate  * NEW.buy_amount;
  NEW.gross_profit := NEW.sell_rate * NEW.sell_amount;
  NEW.net_profit   := NEW.gross_profit - NEW.cost;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to transactions
DROP TRIGGER IF EXISTS trg_compute_fields ON transactions;
CREATE TRIGGER trg_compute_fields
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION compute_transaction_fields();

-- Apply to transaction_history (so archived snapshots are also consistent)
DROP TRIGGER IF EXISTS trg_compute_fields ON transaction_history;
CREATE TRIGGER trg_compute_fields
  BEFORE INSERT OR UPDATE ON transaction_history
  FOR EACH ROW EXECUTE FUNCTION compute_transaction_fields();

-- Back-fill any existing rows that have drifted
UPDATE transactions
SET cost         = buy_rate  * buy_amount,
    gross_profit = sell_rate * sell_amount,
    net_profit   = (sell_rate * sell_amount) - (buy_rate * buy_amount);

UPDATE transaction_history
SET cost         = buy_rate  * buy_amount,
    gross_profit = sell_rate * sell_amount,
    net_profit   = (sell_rate * sell_amount) - (buy_rate * buy_amount);
