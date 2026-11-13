/*
# Grant anon access to confirm_demo_email so it works before login
*/
REVOKE EXECUTE ON FUNCTION public.confirm_demo_email(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_demo_email(TEXT) TO anon, authenticated;
