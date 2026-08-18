
REVOKE ALL ON FUNCTION public.get_checkout_settings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_checkout_settings() TO authenticated;
