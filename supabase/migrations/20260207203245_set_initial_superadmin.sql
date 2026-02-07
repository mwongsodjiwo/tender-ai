-- Set initial superadmin and auto-promote on registration
-- This trigger ensures the first superadmin is set automatically on profile creation.

CREATE OR REPLACE FUNCTION set_initial_superadmin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'mwongsodjiwo1@gmail.com' THEN
    NEW.is_superadmin := TRUE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_initial_superadmin
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_initial_superadmin();

-- Also update if the profile already exists
UPDATE profiles SET is_superadmin = TRUE WHERE email = 'mwongsodjiwo1@gmail.com';
