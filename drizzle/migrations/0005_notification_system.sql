-- 1. Richer notifications (additive)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'account';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS tracking_code_id uuid REFERENCES public.tracking_codes(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS push_claimed_at timestamptz;
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications (user_id) WHERE read = false;

-- Users may only flip the read flag on their own rows, never rewrite content.
DROP POLICY IF EXISTS "notif self insert" ON public.notifications;
REVOKE INSERT, UPDATE ON public.notifications FROM authenticated;
GRANT SELECT, DELETE ON public.notifications TO authenticated;
GRANT UPDATE (read) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
DROP POLICY IF EXISTS "notif own delete" ON public.notifications;
CREATE POLICY "notif own delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 2. Preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY,
  push_enabled boolean NOT NULL DEFAULT true,
  push_shipment boolean NOT NULL DEFAULT true,
  push_account boolean NOT NULL DEFAULT true,
  in_app_popups boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs own read" ON public.notification_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "prefs own insert" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "prefs own update" ON public.notification_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. Browser push devices
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  device_label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON public.push_tokens (user_id);
GRANT SELECT, DELETE ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push own read" ON public.push_tokens FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "push own delete" ON public.push_tokens FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Register a device for the caller; a token moves to whoever signed in on that browser last.
CREATE OR REPLACE FUNCTION public.register_push_token(_token text, _label text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _token IS NULL OR length(_token) < 20 OR length(_token) > 4096 THEN RAISE EXCEPTION 'Invalid token'; END IF;
  INSERT INTO public.push_tokens (user_id, token, device_label)
  VALUES (auth.uid(), _token, left(coalesce(_label, ''), 120))
  ON CONFLICT (token) DO UPDATE SET user_id = auth.uid(), device_label = excluded.device_label, last_seen_at = now();
  INSERT INTO public.notification_preferences (user_id, push_enabled) VALUES (auth.uid(), true)
  ON CONFLICT (user_id) DO UPDATE SET push_enabled = true, updated_at = now();
END; $$;
REVOKE ALL ON FUNCTION public.register_push_token(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.register_push_token(text, text) TO authenticated;

-- 4. Rate-limited self test notification (goes through the normal pipeline)
CREATE OR REPLACE FUNCTION public.send_test_notification()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM public.notifications WHERE user_id = auth.uid() AND kind = 'test' AND created_at > now() - interval '20 seconds') THEN
    RAISE EXCEPTION 'Please wait a few seconds before sending another test.';
  END IF;
  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES (auth.uid(), 'Test notification', 'Notifications are working on this account.', 'test', '/dashboard/notifications')
  RETURNING id INTO _id;
  RETURN _id;
END; $$;
REVOKE ALL ON FUNCTION public.send_test_notification() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.send_test_notification() TO authenticated;

-- 5. Shipment status notifications carry a link + kind
CREATE OR REPLACE FUNCTION public.on_status_change()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare _label text := initcap(replace(new.status::text,'_',' '));
begin
  if new.status is distinct from old.status then
    insert into public.tracking_events (tracking_code_id, status, title, location)
    values (new.id, new.status, _label, coalesce(new.current_location,''));
    if new.user_id is not null then
      insert into public.notifications (user_id, title, body, kind, link, tracking_code_id)
      values (new.user_id,
              new.code || ' is now ' || _label,
              coalesce(nullif(new.package_name,''),'Your package')
                || case when coalesce(new.current_location,'') <> '' then ' · ' || new.current_location else '' end,
              'shipment', '/dashboard/tracking/' || new.id, new.id);
    end if;
    if coalesce(new.recipient_email,'') <> '' then
      insert into public.email_log (user_id, tracking_code_id, to_email, subject, body)
      values (new.user_id, new.id, new.recipient_email, 'Shipment update: ' || new.code,
              'Your package is now ' || upper(replace(new.status::text,'_',' ')) || '.');
    end if;
  end if;
  return new;
end; $function$;

-- 6. Backend push dispatch: every new notification pings the app's push sender.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.dispatch_push_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _url text;
BEGIN
  SELECT nullif(value, '') INTO _url FROM public.admin_settings WHERE key = 'push_dispatch_url';
  _url := coalesce(_url, 'https://swifttracking-logistics.lovable.app/api/public/push/dispatch');
  BEGIN
    PERFORM net.http_post(
      url := _url,
      body := jsonb_build_object('id', new.id),
      headers := '{"Content-Type":"application/json"}'::jsonb,
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN others THEN
    RAISE WARNING 'push dispatch skipped: %', sqlerrm;
  END;
  RETURN new;
END; $$;
REVOKE ALL ON FUNCTION public.dispatch_push_notification() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS notifications_dispatch_push ON public.notifications;
CREATE TRIGGER notifications_dispatch_push AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_notification();
