-- 1. tracking_codes: remove public read
DROP POLICY IF EXISTS "tc public read" ON public.tracking_codes;
CREATE POLICY "tc owner read" ON public.tracking_codes FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.tracking_codes FROM anon;

-- 2. tracking_events: remove public read
DROP POLICY IF EXISTS "te public read" ON public.tracking_events;
CREATE POLICY "te owner read" ON public.tracking_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.tracking_codes t WHERE t.id = tracking_events.tracking_code_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
REVOKE SELECT ON public.tracking_events FROM anon;

-- 3. messages: remove public read/write
DROP POLICY IF EXISTS "msg read" ON public.messages;
DROP POLICY IF EXISTS "msg insert" ON public.messages;
CREATE POLICY "msg owner read" ON public.messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.tracking_codes t WHERE t.id = messages.tracking_code_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "msg owner insert" ON public.messages FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.tracking_codes t WHERE t.id = messages.tracking_code_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.messages FROM anon;

-- 4. admin_settings: restrict reads to admins
DROP POLICY IF EXISTS "settings public read" ON public.admin_settings;
CREATE POLICY "settings admin read" ON public.admin_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'));
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.admin_settings FROM anon;

-- Public-safe settings (support/telegram links only)
CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS TABLE(key text, value text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.key, s.value FROM public.admin_settings s
  WHERE s.key IN ('telegram_url','support_url')
$$;

-- Bank details for signed-in customers paying for a plan
CREATE OR REPLACE FUNCTION public.get_checkout_settings()
RETURNS TABLE(key text, value text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.key, s.value FROM public.admin_settings s
  WHERE auth.uid() IS NOT NULL
    AND s.key IN ('bank_name','account_name','account_number','telegram_url','support_url')
$$;

-- Public tracking lookup (safe columns only)
CREATE OR REPLACE FUNCTION public.get_public_tracking(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE t record; result jsonb;
BEGIN
  SELECT * INTO t FROM public.tracking_codes WHERE upper(code) = upper(trim(_code)) LIMIT 1;
  IF t IS NULL THEN RETURN NULL; END IF;
  result := jsonb_build_object(
    'tc', jsonb_build_object(
      'id', t.id, 'code', t.code, 'status', t.status,
      'package_name', t.package_name, 'package_category', t.package_category,
      'weight', t.weight, 'sender_name', t.sender_name, 'recipient_name', t.recipient_name,
      'origin', t.origin, 'destination', t.destination, 'pickup_address', t.pickup_address,
      'delivery_address', t.delivery_address, 'shipping_method', t.shipping_method,
      'estimated_delivery', t.estimated_delivery, 'current_location', t.current_location
    ),
    'events', coalesce((SELECT jsonb_agg(jsonb_build_object('id', e.id, 'status', e.status, 'title', e.title, 'location', e.location, 'occurred_at', e.occurred_at) ORDER BY e.occurred_at)
       FROM public.tracking_events e WHERE e.tracking_code_id = t.id), '[]'::jsonb),
    'messages', coalesce((SELECT jsonb_agg(jsonb_build_object('id', m.id, 'sender_name', m.sender_name, 'sender_type', m.sender_type, 'body', m.body, 'created_at', m.created_at) ORDER BY m.created_at)
       FROM public.messages m WHERE m.tracking_code_id = t.id), '[]'::jsonb)
  );
  RETURN result;
END; $$;

-- Public message send, validated + length limited
CREATE OR REPLACE FUNCTION public.send_public_message(_code text, _sender_name text, _body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE t record;
BEGIN
  IF _body IS NULL OR length(trim(_body)) = 0 OR length(_body) > 2000 THEN
    RAISE EXCEPTION 'Invalid message';
  END IF;
  SELECT * INTO t FROM public.tracking_codes WHERE upper(code) = upper(trim(_code)) LIMIT 1;
  IF t IS NULL THEN RAISE EXCEPTION 'Tracking code not found'; END IF;
  INSERT INTO public.messages (tracking_code_id, user_id, sender_name, sender_type, body)
  VALUES (t.id, t.user_id, left(coalesce(nullif(trim(_sender_name),''),'Recipient'), 80), 'recipient', trim(_body));
END; $$;

-- 5. Lock down SECURITY DEFINER function execution
REVOKE ALL ON FUNCTION public.approve_payment(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_payment(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_code_quota() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_status_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_payment(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_public_settings() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_checkout_settings() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_tracking(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_public_message(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_checkout_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_tracking(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_public_message(text, text, text) TO anon, authenticated;