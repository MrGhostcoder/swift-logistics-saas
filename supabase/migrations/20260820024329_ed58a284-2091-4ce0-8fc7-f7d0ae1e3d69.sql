
-- email_log: only own rows, tied to a shipment the user owns (or admin)
DROP POLICY IF EXISTS "email insert" ON public.email_log;
CREATE POLICY "email owner insert" ON public.email_log FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    tracking_code_id IS NULL
    OR EXISTS (SELECT 1 FROM public.tracking_codes t WHERE t.id = tracking_code_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  )
);

-- notifications: only for yourself
DROP POLICY IF EXISTS "notif insert" ON public.notifications;
CREATE POLICY "notif self insert" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- messages: cannot repoint to other users/threads
DROP POLICY IF EXISTS "msg update" ON public.messages;
CREATE POLICY "msg update" ON public.messages FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.tracking_codes t WHERE t.id = messages.tracking_code_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.tracking_codes t WHERE t.id = messages.tracking_code_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);

-- Lock down SECURITY DEFINER functions that must never be called via the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_code_quota() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- Admin-only functions: signed-in only, never anon
REVOKE ALL ON FUNCTION public.admin_list_roles() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_account_status(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_admin_role(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_codes(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_payment(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_payment(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_checkout_settings() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_admin_role(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_codes(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_payment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_checkout_settings() TO authenticated;

-- Intentionally public endpoints (hardened inside the function bodies)
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_tracking(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_public_message(text, text, text) TO anon, authenticated;
