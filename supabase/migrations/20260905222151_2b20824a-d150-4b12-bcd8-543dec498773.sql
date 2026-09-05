create or replace function public.generate_tracking_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  candidate text;
  attempts int := 0;
begin
  loop
    attempts := attempts + 1;
    candidate := 'STK-' || to_char(floor(random() * 900000 + 100000), 'FM000000')
                 || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
    exit when not exists (select 1 from public.tracking_codes t where t.code = candidate);
    if attempts > 25 then
      raise exception 'Could not generate a unique tracking code';
    end if;
  end loop;
  return candidate;
end;
$$;

revoke all on function public.generate_tracking_code() from public;
revoke all on function public.generate_tracking_code() from anon;
grant execute on function public.generate_tracking_code() to authenticated, service_role;

create or replace function public.assign_tracking_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.code is null or btrim(new.code) = '' then
    new.code := public.generate_tracking_code();
  else
    new.code := upper(btrim(new.code));
    if exists (select 1 from public.tracking_codes t where t.code = new.code) then
      new.code := public.generate_tracking_code();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tc_assign_code on public.tracking_codes;
create trigger tc_assign_code
  before insert on public.tracking_codes
  for each row execute function public.assign_tracking_code();

create or replace function public.seed_first_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tracking_events (tracking_code_id, status, title, location, note, occurred_at)
  values (
    new.id,
    new.status,
    case new.status::text
      when 'pending' then 'Shipment registered'
      when 'in_transit' then 'Shipment in transit'
      when 'out_for_delivery' then 'Out for delivery'
      when 'delivered' then 'Delivered'
      else 'Shipment created'
    end,
    coalesce(nullif(new.current_location, ''), nullif(new.origin, ''), ''),
    'Tracking number ' || new.code || ' issued.',
    now()
  );
  return new;
end;
$$;

drop trigger if exists tc_seed_event on public.tracking_codes;
create trigger tc_seed_event
  after insert on public.tracking_codes
  for each row execute function public.seed_first_event();

alter table public.tracking_codes replica identity full;
alter table public.tracking_events replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.tracking_codes;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.tracking_events;
  exception when duplicate_object then null;
  end;
end $$;