-- RPC to get simple stats for a restaurant
CREATE OR REPLACE FUNCTION get_restaurant_stats(target_restaurant_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_revenue numeric;
  total_commission numeric;
BEGIN
  -- Verify access (RLS-like check or rely on calling context if not security definer)
  -- Here simplified for SuperAdmin/Admin usage
  
  SELECT 
    COALESCE(SUM(total_amount), 0),
    COALESCE(SUM(application_fee_amount), 0)
  INTO total_revenue, total_commission
  FROM orders
  WHERE restaurant_id = target_restaurant_id
  AND status = 'paid';

  RETURN json_build_object(
    'total_revenue', total_revenue,
    'total_commission', total_commission
  );
END;
$$;
