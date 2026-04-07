-- ============================================================
-- 01_indexes.sql — Performance indexes
-- Run this in the Supabase SQL editor.
-- All statements are idempotent (IF NOT EXISTS).
-- ============================================================

-- transactions: main fetch is ordered by created_at DESC
CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON transactions(created_at DESC);

-- transactions: filter/group by owner name
CREATE INDEX IF NOT EXISTS idx_transactions_owner
  ON transactions(owner);

-- transactions: filter/group by card number
CREATE INDEX IF NOT EXISTS idx_transactions_card_number
  ON transactions(card_number);

-- transaction_history: nearly every query filters by period
CREATE INDEX IF NOT EXISTS idx_transaction_history_period
  ON transaction_history(period);

-- transaction_history: ordered reads within a period
CREATE INDEX IF NOT EXISTS idx_transaction_history_period_id
  ON transaction_history(period, id ASC);
