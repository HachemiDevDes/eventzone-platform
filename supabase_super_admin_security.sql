-- ==============================================================================
-- EVENTZONE PLATFORM - SUPER ADMIN SECURITY HARDENING
-- Restricts super admin role assignment to direct database administration only.
-- Prevents any unauthorized user from self-assigning role: 'super_admin' or is_admin: true.
-- Project: https://supabase.com/dashboard/project/gknglowozpewwrtjumuc/sql/new
-- ==============================================================================

-- 1. Create protective trigger function
CREATE OR REPLACE FUNCTION public.enforce_super_admin_security()
RETURNS TRIGGER AS $$
DECLARE
  is_service_role BOOLEAN := FALSE;
  caller_email TEXT := '';
  jwt_role TEXT := '';
BEGIN
  BEGIN
    jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL;
  END;

  is_service_role := (coalesce(jwt_role, '') = 'service_role');

  BEGIN
    caller_email := lower(coalesce(current_setting('request.jwt.claim.email', true), ''));
  EXCEPTION WHEN OTHERS THEN
    caller_email := '';
  END;

  -- Intercept privilege escalation: setting role to super_admin or is_admin to true
  IF (NEW.role = 'super_admin' OR NEW.is_admin = TRUE) THEN
    -- If inserting new row with super_admin or updating row from non-super_admin
    IF (TG_OP = 'INSERT' OR (OLD.role IS DISTINCT FROM 'super_admin' AND (OLD.is_admin IS NULL OR OLD.is_admin = FALSE))) THEN
      -- Allow only if executed via service_role or authenticated with verified platform owner emails
      IF NOT is_service_role AND caller_email NOT IN ('eventzone114@gmail.com', 'contact@eventzone.pro') AND lower(coalesce(NEW.email, '')) NOT IN ('eventzone114@gmail.com', 'contact@eventzone.pro') THEN
        RAISE EXCEPTION 'Access Denied: The super admin role cannot be self-assigned via client API. It can only be provisioned directly in the database by platform owners.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind trigger to public.profiles table for INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_enforce_super_admin_security ON public.profiles;
CREATE TRIGGER trg_enforce_super_admin_security
BEFORE INSERT OR UPDATE OF role, is_admin ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_super_admin_security();
