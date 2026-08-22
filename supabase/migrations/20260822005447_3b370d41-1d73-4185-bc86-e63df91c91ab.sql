-- Defense in depth: no implicit PUBLIC execute on any public function
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f.sig);
  END LOOP;
END $$;

-- Internal trigger functions: no direct API access at all
REVOKE ALL ON FUNCTION public.consume_code_quota() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.on_status_change() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- Admin-only routines: signed-in only (each re-checks admin role internally)
REVOKE ALL ON FUNCTION public.admin_list_roles() FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_account_status(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_admin_role(uuid, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_codes(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.approve_payment(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.reject_payment(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.get_checkout_settings() FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

GRANT EXECUTE ON FUNCTION public.admin_list_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_admin_role(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_codes(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_payment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_checkout_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Intentionally public, safe read-only / validated endpoints
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_tracking(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_public_message(text, text, text) TO anon, authenticated;
