-- Add current_period_end to restaurants for subscription tracking
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- Add application_fee_amount to orders for revenue tracking (in cents)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS application_fee_amount integer DEFAULT 0;

-- Optional: Index for faster stats aggregation
CREATE INDEX IF NOT EXISTS idx_orders_status_fee ON orders(status, application_fee_amount) WHERE status = 'paid';
