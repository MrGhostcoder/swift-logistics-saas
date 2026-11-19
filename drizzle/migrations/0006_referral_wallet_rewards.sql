CREATE TABLE public.referral_codes (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 code text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-','')
);
GRANT SELECT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own invite code" ON public.referral_codes FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.referrals (
 invitee_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 inviter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT no_self_referral CHECK(invitee_id<>inviter_id)
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own referrals" ON public.referrals FOR SELECT TO authenticated USING(inviter_id=auth.uid() OR invitee_id=auth.uid());
CREATE TABLE public.referral_rewards (
 topup_id uuid PRIMARY KEY REFERENCES public.wallet_transactions(id) ON DELETE CASCADE,
 inviter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 invitee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 amount numeric NOT NULL CHECK(amount>0),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT no_self_reward CHECK(invitee_id<>inviter_id)
);
GRANT SELECT ON public.referral_rewards TO authenticated;
GRANT ALL ON public.referral_rewards TO service_role;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own referral rewards" ON public.referral_rewards FOR SELECT TO authenticated USING(inviter_id=auth.uid());
CREATE INDEX referral_inviter_idx ON public.referrals(inviter_id);
CREATE INDEX referral_reward_inviter_idx ON public.referral_rewards(inviter_id);
CREATE FUNCTION public.my_referral_code() RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 INSERT INTO public.referral_codes(user_id) VALUES(auth.uid()) ON CONFLICT(user_id) DO NOTHING;
 SELECT code INTO result FROM public.referral_codes WHERE user_id=auth.uid();
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.my_referral_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_referral_code() TO authenticated;
CREATE FUNCTION public.claim_referral(_code text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE inviter uuid; joined timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT created_at INTO joined FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 IF joined IS NULL OR joined < now()-interval '24 hours' OR EXISTS(SELECT 1 FROM public.wallet_transactions WHERE user_id=auth.uid()) THEN RETURN false; END IF;
 SELECT c.user_id INTO inviter FROM public.referral_codes c JOIN public.profiles p ON p.id=c.user_id WHERE c.code=lower(trim(_code)) AND p.created_at<joined AND p.account_status='active';
 IF inviter IS NULL OR inviter=auth.uid() THEN RETURN false; END IF;
 INSERT INTO public.referrals(invitee_id,inviter_id) VALUES(auth.uid(),inviter) ON CONFLICT(invitee_id) DO NOTHING;
 RETURN EXISTS(SELECT 1 FROM public.referrals WHERE invitee_id=auth.uid() AND inviter_id=inviter);
END; $$;
REVOKE ALL ON FUNCTION public.claim_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE inviter uuid;
BEGIN
 INSERT INTO public.profiles(id,full_name,email,phone,codes_total) VALUES(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'phone',''),1) ON CONFLICT(id) DO NOTHING;
 INSERT INTO public.user_roles(user_id,role) VALUES(new.id,'customer') ON CONFLICT DO NOTHING;
 SELECT c.user_id INTO inviter FROM public.referral_codes c JOIN public.profiles p ON p.id=c.user_id WHERE c.code=lower(trim(new.raw_user_meta_data->>'referral_code')) AND c.user_id<>new.id AND p.created_at<new.created_at AND p.account_status='active';
 IF inviter IS NOT NULL THEN INSERT INTO public.referrals(invitee_id,inviter_id) VALUES(new.id,inviter) ON CONFLICT DO NOTHING; END IF;
 INSERT INTO public.notifications(user_id,title,body) VALUES(new.id,'Welcome to SwiftTrack','You have 1 free tracking code to create your first shipment.');
 RETURN new;
END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.credit_referral_reward() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE inviter uuid; bonus numeric;
BEGIN
 IF NEW.kind<>'topup' OR NEW.status<>'approved' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN IF OLD.status='approved' THEN RETURN NEW; END IF; END IF;
 SELECT inviter_id INTO inviter FROM public.referrals WHERE invitee_id=NEW.user_id;
 IF inviter IS NULL OR inviter=NEW.user_id THEN RETURN NEW; END IF;
 bonus := round(NEW.amount*0.10,6);
 IF bonus<=0 THEN RETURN NEW; END IF;
 INSERT INTO public.referral_rewards(topup_id,inviter_id,invitee_id,amount) VALUES(NEW.id,inviter,NEW.user_id,bonus) ON CONFLICT(topup_id) DO NOTHING;
 IF FOUND THEN INSERT INTO public.notifications(user_id,title,body,link) VALUES(inviter,'Referral bonus credited',bonus || ' wallet coins earned from an invited user’s approved USDT top-up.','/dashboard/referrals'); END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.credit_referral_reward() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER wallet_referral_credit AFTER INSERT OR UPDATE OF status ON public.wallet_transactions FOR EACH ROW EXECUTE FUNCTION public.credit_referral_reward();
CREATE OR REPLACE FUNCTION public.wallet_balance(_user_id uuid) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT coalesce((SELECT sum(CASE WHEN kind='topup' AND status='approved' THEN amount WHEN kind='purchase' AND status IN ('approved','pending') THEN -amount ELSE 0 END) FROM public.wallet_transactions WHERE user_id=_user_id),0) + coalesce((SELECT sum(amount) FROM public.referral_rewards WHERE inviter_id=_user_id),0)
$$;
REVOKE ALL ON FUNCTION public.wallet_balance(uuid) FROM PUBLIC, anon, authenticated;
COMMENT ON TABLE public.referral_rewards IS 'Immutable reward ledger: 10% of each approved referred USDT top-up, one reward per transaction; wallet coin equals one USDT of purchasing balance.';