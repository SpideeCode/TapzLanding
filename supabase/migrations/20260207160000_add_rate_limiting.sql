-- Add rate limiting table for checkout attempts
CREATE TABLE IF NOT EXISTS public.checkout_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL, -- Combined hash of IP and TableID
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast lookup by identifier and time
CREATE INDEX IF NOT EXISTS idx_checkout_attempts_identifier_created_at 
ON public.checkout_attempts(identifier, created_at);

-- Cleanup policy: automatically delete older attempts (e.g., older than 24h)
-- This can be handled by a Supabase cron job or just manually occasionally.
-- For now, we'll just keep it simple.

-- Add comment explaining the table
COMMENT ON TABLE public.checkout_attempts IS 'Logs checkout attempts per IP+Table to prevent DoS attacks.';
