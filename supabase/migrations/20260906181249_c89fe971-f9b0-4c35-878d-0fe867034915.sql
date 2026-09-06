create or replace function public.consume_code_quota()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare remaining int;
begin
  if new.user_id is null then return new; end if;
  select codes_total - codes_used into remaining from public.profiles where id = new.user_id;
  if remaining is null or remaining <= 0 then
    raise exception 'No tracking codes remaining. Please purchase a plan.';
  end if;
  update public.profiles set codes_used = codes_used + 1 where id = new.user_id;
  return new;
end; $$;

revoke all on function public.consume_code_quota() from public, anon, authenticated;