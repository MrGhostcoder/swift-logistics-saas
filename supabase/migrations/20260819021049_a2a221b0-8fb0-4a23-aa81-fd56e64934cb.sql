create or replace function public.admin_set_account_status(_user_id uuid, _status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  if _status not in ('active','suspended') then raise exception 'Invalid status'; end if;
  update public.profiles set account_status = _status,
    subscription_status = case when _status = 'suspended' then 'SUSPENDED'::sub_status
      when subscription_status = 'SUSPENDED' and plan_id is not null then 'ACTIVE'::sub_status
      when subscription_status = 'SUSPENDED' then 'NO_PLAN'::sub_status
      else subscription_status end
  where id = _user_id;
  insert into public.notifications (user_id, title, body)
  values (_user_id, case when _status='suspended' then 'Account suspended' else 'Account reactivated' end,
    case when _status='suspended' then 'Your account has been suspended. Contact support for help.' else 'Your account is active again.' end);
end; $$;

create or replace function public.admin_set_admin_role(_user_id uuid, _grant boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  if _grant then
    insert into public.user_roles (user_id, role) values (_user_id, 'admin') on conflict do nothing;
  else
    if _user_id = auth.uid() then raise exception 'You cannot remove your own admin access'; end if;
    delete from public.user_roles where user_id = _user_id and role = 'admin';
  end if;
end; $$;

create or replace function public.admin_set_codes(_user_id uuid, _codes_total integer)
returns void language plpgsql security definer set search_path = public as $$
declare used int;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select codes_used into used from public.profiles where id = _user_id;
  if used is null then raise exception 'User not found'; end if;
  if _codes_total < used then raise exception 'Total cannot be less than codes already used (%)', used; end if;
  update public.profiles set codes_total = _codes_total where id = _user_id;
  insert into public.notifications (user_id, title, body)
  values (_user_id, 'Tracking code balance updated', 'An administrator set your code allowance to ' || _codes_total || '.');
end; $$;

revoke execute on function public.admin_set_account_status(uuid, text) from public, anon;
revoke execute on function public.admin_set_admin_role(uuid, boolean) from public, anon;
revoke execute on function public.admin_set_codes(uuid, integer) from public, anon;
grant execute on function public.admin_set_account_status(uuid, text) to authenticated;
grant execute on function public.admin_set_admin_role(uuid, boolean) to authenticated;
grant execute on function public.admin_set_codes(uuid, integer) to authenticated;

create or replace function public.admin_list_roles()
returns table(user_id uuid, role app_role) language sql stable security definer set search_path = public as $$
  select r.user_id, r.role from public.user_roles r where public.has_role(auth.uid(),'admin')
$$;
revoke execute on function public.admin_list_roles() from public, anon;
grant execute on function public.admin_list_roles() to authenticated;