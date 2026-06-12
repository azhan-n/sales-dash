# Supabase migrations

This directory is the source of truth for database schema changes.

## Adding a new migration

1. Create a new file here named `YYYYMMDDHHMMSS_short_description.sql` (14-digit timestamp prefix, UTC).
2. Make the SQL idempotent where reasonable (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS` before `CREATE`). This keeps the migration safe to re-run and easier to recover from partial failures.
3. Open a PR. The Supabase GitHub integration (if enabled for this project) will preview the change and, on merge to `main`, apply it to the production database.

## About the baseline

`20240101000000_baseline.sql` consolidates the schema as it existed before migration tracking was introduced (the loose `01_…` – `05_…` files that used to live one level up). The whole file is idempotent, so it's a safe no-op against the existing production database. Do **not** edit the baseline to introduce new changes — add a new timestamped migration instead.
