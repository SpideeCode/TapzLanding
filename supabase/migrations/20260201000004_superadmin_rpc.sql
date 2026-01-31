-- RPC to get all restaurants with stats for SuperAdmin
CREATE OR REPLACE FUNCTION get_restaurants_with_stats()
RETURNS TABLE (
    id uuid,
    name text,
    slug text,
    stripe_connect_id text,
    subscription_status text,
    plan_type text,
    payments_enabled boolean,
    created_at timestamptz,
    total_revenue numeric,
    total_commission numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.slug,
    r.stripe_connect_id,
    r.subscription_status,
    r.plan_type,
    r.payments_enabled,
    r.created_at,
    COALESCE(s.revenue, 0) as total_revenue,
    COALESCE(s.commission, 0) as total_commission
  FROM restaurants r
  LEFT JOIN (
    SELECT 
      restaurant_id, 
      SUM(total_amount) as revenue,
      SUM(application_fee_amount) as commission
    FROM orders
    WHERE status = 'paid'
    GROUP BY restaurant_id
  ) s ON r.id = s.restaurant_id
  ORDER BY r.created_at DESC;
END;
$$;
