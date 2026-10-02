create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('topup','purchase')),
  amount numeric not null check (amount > 0),
  plan_id uuid references public.plans(id) on delete set null,
  tx_hash text,
  status public.pay_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create unique index wallet_tx_hash_unique on public.wallet_transactions (lower(tx_hash)) where tx_hash is not null;
create index wallet_tx_user_idx on public.wallet_transactions (user_id, created_at desc);
grant select on public.wallet_transactions to authenticated;
grant all on public.wallet_transactions to service_role;
alter table public.wallet_transactions enable row level security;
create policy "wallet own read" on public.wallet_transactions for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- available balance = approved topups - approved/pending purchases
create or replace function public.wallet_balance(_user_id uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(case when kind='topup' and status='approved' then amount
                           when kind='purchase' and status in ('approved','pending') then -amount
                           else 0 end),0)
  from public.wallet_transactions where user_id = _user_id
$$;

create or replace function public.my_wallet_balance() returns numeric
language sql stable security definer set search_path = public as $$
  select public.wallet_balance(auth.uid())
$$;

create or replace function public.request_wallet_topup(_amount numeric, _tx_hash text) returns uuid
language plpgsql security definer set search_path = public as $$
declare _id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if _amount is null or _amount <= 0 or _amount > 100000 then raise exception 'Enter a valid amount'; end if;
  if _tx_hash is null or length(trim(_tx_hash)) < 20 or length(trim(_tx_hash)) > 120 then raise exception 'Enter a valid transaction ID'; end if;
  if exists (select 1 from public.wallet_transactions where lower(tx_hash) = lower(trim(_tx_hash)))
     or exists (select 1 from public.payments where lower(coalesce(tx_hash, reference)) = lower(trim(_tx_hash))) then
    raise exception 'This transaction ID was already submitted';
  end if;
  insert into public.wallet_transactions (user_id, kind, amount, tx_hash)
  values (auth.uid(), 'topup', round(_amount, 2), trim(_tx_hash)) returning id into _id;
  return _id;
end; $$;

create or replace function public.request_wallet_purchase(_plan_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare _id uuid; pl record;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select * into pl from public.plans where id = _plan_id and active;
  if pl is null then raise exception 'Plan not found'; end if;
  if public.wallet_balance(auth.uid()) < pl.price then raise exception 'Insufficient wallet balance'; end if;
  insert into public.wallet_transactions (user_id, kind, amount, plan_id)
  values (auth.uid(), 'purchase', pl.price, pl.id) returning id into _id;
  return _id;
end; $$;

create or replace function public.admin_review_wallet_tx(_id uuid, _approve boolean, _note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare t record; pl record;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into t from public.wallet_transactions where id = _id for update;
  if t is null then raise exception 'Transaction not found'; end if;
  if t.status <> 'pending' then raise exception 'Already reviewed'; end if;
  update public.wallet_transactions
    set status = case when _approve then 'approved'::pay_status else 'rejected'::pay_status end,
        admin_note = _note, reviewed_at = now()
    where id = _id;
  if _approve and t.kind = 'purchase' then
    select * into pl from public.plans where id = t.plan_id;
    update public.profiles set plan_id = t.plan_id, subscription_status = 'ACTIVE',
      codes_total = codes_total + coalesce(pl.code_limit,0) where id = t.user_id;
  end if;
  insert into public.notifications (user_id, title, body) values (t.user_id,
    case when t.kind='topup' then 'Wallet top-up ' else 'Wallet purchase ' end || case when _approve then 'approved' else 'rejected' end,
    case when t.kind='topup' and _approve then t.amount || ' USDT added to your wallet.'
         when t.kind='purchase' and _approve then 'Your ' || coalesce(pl.name,'plan') || ' plan is active with ' || coalesce(pl.code_limit,0) || ' tracking codes.'
         else coalesce(nullif(_note,''),'Please contact support.') end);
end; $$;

-- stop customers editing their own quota / plan fields directly
create or replace function public.guard_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_user = 'authenticated' and not public.has_role(auth.uid(),'admin') then
    if new.codes_total is distinct from old.codes_total or new.codes_used is distinct from old.codes_used
       or new.plan_id is distinct from old.plan_id or new.account_status is distinct from old.account_status
       or (new.subscription_status is distinct from old.subscription_status and new.subscription_status <> 'PENDING_PAYMENT') then
      raise exception 'Not allowed';
    end if;
  end if;
  return new;
end; $$;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile_fields();

revoke all on function public.wallet_balance(uuid) from public, anon, authenticated;
revoke all on function public.guard_profile_fields() from public, anon, authenticated;
revoke all on function public.my_wallet_balance() from public, anon;
revoke all on function public.request_wallet_topup(numeric, text) from public, anon;
revoke all on function public.request_wallet_purchase(uuid) from public, anon;
revoke all on function public.admin_review_wallet_tx(uuid, boolean, text) from public, anon;
grant execute on function public.my_wallet_balance() to authenticated;
grant execute on function public.request_wallet_topup(numeric, text) to authenticated;
grant execute on function public.request_wallet_purchase(uuid) to authenticated;
grant execute on function public.admin_review_wallet_tx(uuid, boolean, text) to authenticated;