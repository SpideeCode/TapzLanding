-- Secure function to update staff access code
-- Bypasses RLS by using SECURITY DEFINER, but verifies auth via profiles table
CREATE OR REPLACE FUNCTION update_staff_access_code(new_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant_id uuid;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Get user's restaurant_id from profiles
  SELECT restaurant_id INTO v_restaurant_id
  FROM profiles
  WHERE id = v_user_id;

  IF v_restaurant_id IS NULL THEN
     RETURN json_build_object('success', false, 'message', 'Utilisateur non lié à un restaurant');
  END IF;

  -- Update the restaurant
  UPDATE restaurants
  SET staff_access_code = new_code
  WHERE id = v_restaurant_id;

  RETURN json_build_object(
    'success', true, 
    'message', 'Code PIN mis à jour',
    'code', new_code 
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_staff_access_code(text) TO authenticated;
