-- The previous attempt failed because stripe_account_id did not exist.
-- We only need to ensure the column is dropped if it somehow exists (idempotent).
-- We assume stripe_connect_id is already correctly populated or was used from the start.

ALTER TABLE restaurants 
DROP COLUMN IF EXISTS stripe_account_id;
