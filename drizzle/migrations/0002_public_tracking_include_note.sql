CREATE OR REPLACE FUNCTION public.get_public_tracking(_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    'events', coalesce((SELECT jsonb_agg(jsonb_build_object('id', e.id, 'status', e.status, 'title', e.title, 'location', e.location, 'note', e.note, 'occurred_at', e.occurred_at) ORDER BY e.occurred_at)
       FROM public.tracking_events e WHERE e.tracking_code_id = t.id), '[]'::jsonb),
    'messages', coalesce((SELECT jsonb_agg(jsonb_build_object('id', m.id, 'sender_name', m.sender_name, 'sender_type', m.sender_type, 'body', m.body, 'created_at', m.created_at) ORDER BY m.created_at)
       FROM public.messages m WHERE m.tracking_code_id = t.id), '[]'::jsonb)
  );
  RETURN result;
END; $function$;