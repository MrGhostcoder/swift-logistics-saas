CREATE OR REPLACE FUNCTION public.settle_wallet_topup_onchain(_id uuid, _amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare t record;
begin
  select * into t from public.wallet_transactions where id = _id for update;
  if t is null or t.kind <> 'topup' then raise exception 'Top-up not found'; end if;
  if t.status <> 'pending' then return; end if;
  update public.wallet_transactions set status='approved', amount=_amount,
    admin_note='Auto-verified on-chain (TRC20 USDT)', reviewed_at=now() where id=_id;
  insert into public.notifications(user_id,title,body)
    values (t.user_id,'Wallet top-up approved', _amount || ' USDT added to your wallet.');
end; $$;
REVOKE ALL ON FUNCTION public.settle_wallet_topup_onchain(uuid,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_wallet_topup_onchain(uuid,numeric) TO service_role;