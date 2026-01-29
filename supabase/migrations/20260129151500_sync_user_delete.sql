-- Trigger to delete auth.users when a public.profile is deleted
-- This ensures that if you delete a row from the 'Staff' or 'Profiles' table, the login account is also removed.

-- 1. Create the function
CREATE OR REPLACE FUNCTION public.delete_auth_user_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We attempt to delete the user from auth.users.
  -- If this trigger was fired because auth.users was deleted (Cascade),
  -- this command might find the user still visible (in transaction) or already marked.
  -- DELETE is generally safe to re-issue (it will delete 0 rows or wait).
  -- However, to prevent errors in some cases, we wrap in a block.
  BEGIN
    DELETE FROM auth.users WHERE id = OLD.id;
  EXCEPTION WHEN OTHERS THEN
    -- If any error occurs (e.g. locking usually), we ignore it to allow the transaction to complete.
    NULL;
  END;
  RETURN OLD;
END;
$$;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;

CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.delete_auth_user_v1();
