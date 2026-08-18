
update public.plans set currency='USDT', price = case name when 'Starter' then 10 when 'Business' then 20 when 'Pro' then 40 else price end;

delete from public.admin_settings where key in ('bank_name','account_name','account_number');
insert into public.admin_settings(key,value) values
  ('usdt_network','TRC20 (Tron)'),
  ('usdt_address',''),
  ('usdt_memo','')
on conflict (key) do nothing;

CREATE OR REPLACE FUNCTION public.get_checkout_settings()
 RETURNS TABLE(key text, value text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.key, s.value FROM public.admin_settings s
  WHERE auth.uid() IS NOT NULL
    AND s.key IN ('usdt_network','usdt_address','usdt_memo','telegram_url','support_url')
$function$;
