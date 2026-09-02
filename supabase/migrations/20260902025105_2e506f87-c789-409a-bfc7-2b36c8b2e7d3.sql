insert into public.admin_settings (key, value) values
  ('usdt_network', 'TRC20 (Tron)'),
  ('usdt_address', 'TALCMZDwrXy9npuTG2sVZxALUgKUjSGneQ'),
  ('usdt_memo', '')
on conflict (key) do update set value = excluded.value;

alter table public.payments
  add column if not exists tx_hash text,
  add column if not exists verified_onchain boolean not null default false,
  add column if not exists verified_at timestamptz;

create unique index if not exists payments_tx_hash_unique
  on public.payments (lower(tx_hash)) where tx_hash is not null;

create or replace function public.settle_payment_onchain(
  _payment_id uuid,
  _tx_hash text,
  _amount numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare p record; pl record;
begin
  select * into p from public.payments where id = _payment_id for update;
  if p is null then raise exception 'Payment not found'; end if;
  if p.status = 'approved' then return; end if;

  select * into pl from public.plans where id = p.plan_id;

  update public.payments
     set status = 'approved',
         tx_hash = _tx_hash,
         amount = coalesce(_amount, amount),
         verified_onchain = true,
         verified_at = now(),
         admin_note = 'Auto-verified on-chain (TRC20 USDT)'
   where id = _payment_id;

  update public.profiles
     set plan_id = p.plan_id,
         subscription_status = 'ACTIVE',
         codes_total = codes_total + coalesce(pl.code_limit, 0)
   where id = p.user_id;

  insert into public.notifications (user_id, title, body)
  values (
    p.user_id,
    'Payment confirmed on-chain',
    'Your ' || coalesce(pl.name, 'plan') || ' plan is now active with ' ||
      coalesce(pl.code_limit, 0) || ' tracking codes.'
  );
end; $$;

revoke all on function public.settle_payment_onchain(uuid, text, numeric) from public, anon, authenticated;
grant execute on function public.settle_payment_onchain(uuid, text, numeric) to service_role;