/*
# Create function to confirm user email by email address
Allows the frontend to confirm a demo user's email after signUp,
so signInWithPassword works without requiring email verification.
Security: only confirms emails matching the demo domain.
*/
CREATE OR REPLACE FUNCTION public.confirm_demo_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email NOT LIKE '%@helados.test' THEN
    RETURN FALSE;
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = now(),
      updated_at = now()
  WHERE email = p_email
    AND email_confirmed_at IS NULL;

  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_demo_email(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_demo_email(TEXT) TO authenticated;
