ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'settled';
ALTER TABLE transaction_history ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'settled';
