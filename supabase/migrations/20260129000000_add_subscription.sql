-- Add subscription fields to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');

-- Check constraint for status
ALTER TABLE public.restaurants DROP CONSTRAINT IF EXISTS restaurants_sub_status_check;
ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_sub_status_check 
CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled'));
