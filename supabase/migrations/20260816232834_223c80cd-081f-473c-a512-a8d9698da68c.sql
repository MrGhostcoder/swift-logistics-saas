
-- roles
create type public.app_role as enum ('admin','customer');
create type public.sub_status as enum ('NO_PLAN','PENDING_PAYMENT','ACTIVE','EXPIRED','SUSPENDED');
create type public.pay_status as enum ('pending','approved','rejected');
create type public.ship_status as enum ('pending','picked_up','in_transit','out_for_delivery','delivered','exception');

create or replace function public.update_updated_at_column() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql set search_path = public;

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text default '',
  account_status text not null default 'active',
  plan_id uuid,
  subscription_status public.sub_status not null default 'NO_PLAN',
  codes_total int not null default 0,
  codes_used int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create policy "profiles self read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profiles self insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- new user trigger
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'phone',''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- plans
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null default 0,
  currency text not null default 'NGN',
  code_limit int not null default 0,
  features text[] not null default '{}',
  is_popular boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.plans to anon, authenticated;
grant insert, update, delete on public.plans to authenticated;
grant all on public.plans to service_role;
alter table public.plans enable row level security;
create policy "plans public read" on public.plans for select to anon, authenticated using (true);
create policy "plans admin write" on public.plans for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

alter table public.profiles add constraint profiles_plan_fk foreign key (plan_id) references public.plans(id) on delete set null;

-- payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  amount numeric not null default 0,
  reference text not null unique,
  payment_date date,
  receipt_url text,
  status public.pay_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "payments own read" on public.payments for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "payments own insert" on public.payments for insert to authenticated with check (user_id = auth.uid());
create policy "payments admin update" on public.payments for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger payments_updated before update on public.payments for each row execute function public.update_updated_at_column();

-- tracking codes (package included)
create table public.tracking_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  code text not null unique,
  sender_name text default '', sender_phone text default '', sender_email text default '', pickup_address text default '',
  recipient_name text default '', recipient_phone text default '', recipient_email text default '', delivery_address text default '',
  package_name text not null default '', package_description text default '', package_category text default '',
  weight text default '', quantity int not null default 1, package_value text default '',
  shipping_method text default 'Standard', estimated_delivery date, current_location text default '',
  origin text default '', destination text default '',
  status public.ship_status not null default 'pending',
  special_instructions text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.tracking_codes to anon;
grant select, insert, update, delete on public.tracking_codes to authenticated;
grant all on public.tracking_codes to service_role;
alter table public.tracking_codes enable row level security;
create policy "tc public read" on public.tracking_codes for select to anon, authenticated using (true);
create policy "tc owner insert" on public.tracking_codes for insert to authenticated with check (user_id = auth.uid());
create policy "tc owner update" on public.tracking_codes for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "tc owner delete" on public.tracking_codes for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create trigger tc_updated before update on public.tracking_codes for each row execute function public.update_updated_at_column();

-- tracking events
create table public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  tracking_code_id uuid not null references public.tracking_codes(id) on delete cascade,
  status public.ship_status not null,
  title text not null,
  location text default '',
  note text default '',
  occurred_at timestamptz not null default now()
);
grant select on public.tracking_events to anon;
grant select, insert, delete on public.tracking_events to authenticated;
grant all on public.tracking_events to service_role;
alter table public.tracking_events enable row level security;
create policy "te public read" on public.tracking_events for select to anon, authenticated using (true);
create policy "te owner write" on public.tracking_events for insert to authenticated with check (
  exists (select 1 from public.tracking_codes t where t.id = tracking_code_id and (t.user_id = auth.uid() or public.has_role(auth.uid(),'admin')))
);
create policy "te owner delete" on public.tracking_events for delete to authenticated using (
  exists (select 1 from public.tracking_codes t where t.id = tracking_code_id and (t.user_id = auth.uid() or public.has_role(auth.uid(),'admin')))
);

-- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tracking_code_id uuid not null references public.tracking_codes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  sender_name text not null default '',
  sender_type text not null default 'owner',
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.messages to authenticated;
grant select, insert on public.messages to anon;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "msg read" on public.messages for select to anon, authenticated using (true);
create policy "msg insert" on public.messages for insert to anon, authenticated with check (true);
create policy "msg update" on public.messages for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (true);

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notif own" on public.notifications for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "notif insert" on public.notifications for insert to authenticated with check (true);
create policy "notif update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- outgoing emails
create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  tracking_code_id uuid references public.tracking_codes(id) on delete set null,
  to_email text not null,
  subject text not null,
  body text not null default '',
  status text not null default 'queued',
  created_at timestamptz not null default now()
);
grant select, insert on public.email_log to authenticated;
grant all on public.email_log to service_role;
alter table public.email_log enable row level security;
create policy "email own read" on public.email_log for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "email insert" on public.email_log for insert to authenticated with check (true);

-- admin settings (singleton key/value)
create table public.admin_settings (
  key text primary key,
  value text not null default ''
);
grant select on public.admin_settings to anon, authenticated;
grant insert, update on public.admin_settings to authenticated;
grant all on public.admin_settings to service_role;
alter table public.admin_settings enable row level security;
create policy "settings public read" on public.admin_settings for select to anon, authenticated using (true);
create policy "settings admin write" on public.admin_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- status change -> event + notification
create or replace function public.on_status_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.tracking_events (tracking_code_id, status, title, location)
    values (new.id, new.status, initcap(replace(new.status::text,'_',' ')), coalesce(new.current_location,''));
    if new.user_id is not null then
      insert into public.notifications (user_id, title, body)
      values (new.user_id, 'Package ' || new.code || ' is now ' || upper(replace(new.status::text,'_',' ')),
              'Status updated for ' || coalesce(new.package_name,'your package') || '.');
    end if;
    if coalesce(new.recipient_email,'') <> '' then
      insert into public.email_log (user_id, tracking_code_id, to_email, subject, body)
      values (new.user_id, new.id, new.recipient_email, 'Shipment update: ' || new.code,
              'Your package is now ' || upper(replace(new.status::text,'_',' ')) || '.');
    end if;
  end if;
  return new;
end; $$;
create trigger tc_status_change after update on public.tracking_codes for each row execute function public.on_status_change();

-- code creation consumes quota
create or replace function public.consume_code_quota() returns trigger language plpgsql security definer set search_path = public as $$
declare remaining int;
begin
  if new.user_id is null then return new; end if;
  select codes_total - codes_used into remaining from public.profiles where id = new.user_id;
  if remaining is null or remaining <= 0 then
    raise exception 'No tracking codes remaining. Please purchase a plan.';
  end if;
  update public.profiles set codes_used = codes_used + 1 where id = new.user_id;
  insert into public.tracking_events (tracking_code_id, status, title, location)
  values (new.id, new.status, 'Shipment Created', coalesce(new.current_location, new.origin, ''));
  return new;
end; $$;
create trigger tc_consume after insert on public.tracking_codes for each row execute function public.consume_code_quota();

-- approve payment
create or replace function public.approve_payment(_payment_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare p record; pl record;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into p from public.payments where id = _payment_id;
  if p is null then raise exception 'Payment not found'; end if;
  select * into pl from public.plans where id = p.plan_id;
  update public.payments set status = 'approved' where id = _payment_id;
  update public.profiles set plan_id = p.plan_id,
    subscription_status = 'ACTIVE',
    codes_total = codes_total + coalesce(pl.code_limit,0)
  where id = p.user_id;
  insert into public.notifications (user_id, title, body)
  values (p.user_id, 'Payment approved', 'Your ' || coalesce(pl.name,'plan') || ' plan is now active with ' || coalesce(pl.code_limit,0) || ' tracking codes.');
end; $$;

create or replace function public.reject_payment(_payment_id uuid, _note text) returns void language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into p from public.payments where id = _payment_id;
  update public.payments set status='rejected', admin_note=_note where id=_payment_id;
  update public.profiles set subscription_status = case when subscription_status='PENDING_PAYMENT' then 'NO_PLAN' else subscription_status end where id = p.user_id;
  insert into public.notifications (user_id, title, body) values (p.user_id, 'Payment needs attention', coalesce(_note,'Your payment could not be verified. Please contact support.'));
end; $$;

-- seed plans + settings
insert into public.plans (name, price, code_limit, features, is_popular, sort_order) values
('Starter', 15000, 5, array['5 tracking codes','Basic status updates','Public tracking links','Email support'], false, 1),
('Business', 25000, 15, array['15 tracking codes','Customer messaging & email replies','Automated status notifications','Public tracking links','Priority email support'], true, 2),
('Pro', 50000, 45, array['45 tracking codes','Customer messaging & email replies','Automated status notifications','Public tracking links','Priority email support'], false, 3);

insert into public.admin_settings (key, value) values
('bank_name','Zenith Bank'),
('account_name','SwiftTrack Logistics Ltd'),
('account_number','1023456789'),
('telegram_url','https://t.me/swifttrack'),
('support_url','https://t.me/swifttrack_support'),
('sms_enabled','false'),
('whatsapp_enabled','false');

-- demo shipments (no owner)
insert into public.tracking_codes (code, sender_name, sender_phone, sender_email, pickup_address, recipient_name, recipient_phone, recipient_email, delivery_address, package_name, package_description, package_category, weight, quantity, package_value, shipping_method, estimated_delivery, current_location, origin, destination, status)
values
('STK-839271','Ada Commerce','+2348012345678','sales@adacommerce.ng','14 Marina Rd, Lagos','John Doe','+2348098765432','john.doe@example.com','21 Aba Rd, Port Harcourt','Electronics Package','Laptop and accessories','Electronics','4.2 kg',1,'₦850,000','Express','2026-08-20','Abuja Distribution Center','Lagos, Nigeria','Port Harcourt, Nigeria','in_transit'),
('STK-729154','Bella Fashion','+2348011122233','hello@bellafashion.ng','5 Allen Ave, Ikeja','Mary Okafor','+2348055566677','mary.okafor@example.com','9 Zik Ave, Enugu','Apparel Box','Assorted clothing','Fashion','2.0 kg',3,'₦120,000','Standard','2026-08-18','Enugu Delivery Hub','Lagos, Nigeria','Enugu, Nigeria','out_for_delivery'),
('STK-451826','Kano Foods','+2348033344455','orders@kanofoods.ng','2 Zoo Rd, Kano','Ibrahim Musa','+2348077788899','ibrahim.musa@example.com','18 Ahmadu Bello Way, Abuja','Grocery Crate','Dry foods crate','Groceries','12.5 kg',1,'₦95,000','Standard','2026-08-16','Abuja, Nigeria','Kano, Nigeria','Abuja, Nigeria','delivered');

insert into public.tracking_events (tracking_code_id, status, title, location, occurred_at)
select id,'pending'::public.ship_status,'Shipment Created','Lagos, Nigeria','2026-08-16 08:30+01'::timestamptz from public.tracking_codes where code='STK-839271'
union all select id,'picked_up'::public.ship_status,'Package Picked Up','Lagos, Nigeria','2026-08-16 10:45+01'::timestamptz from public.tracking_codes where code='STK-839271'
union all select id,'in_transit'::public.ship_status,'Arrived at Distribution Center','Abuja Distribution Center','2026-08-16 18:20+01'::timestamptz from public.tracking_codes where code='STK-839271'
union all select id,'in_transit'::public.ship_status,'In Transit','Abuja Distribution Center','2026-08-17 09:15+01'::timestamptz from public.tracking_codes where code='STK-839271'
union all select id,'pending'::public.ship_status,'Shipment Created','Lagos, Nigeria','2026-08-15 09:00+01'::timestamptz from public.tracking_codes where code='STK-729154'
union all select id,'in_transit'::public.ship_status,'In Transit','Onitsha Hub','2026-08-16 12:00+01'::timestamptz from public.tracking_codes where code='STK-729154'
union all select id,'out_for_delivery'::public.ship_status,'Out for Delivery','Enugu Delivery Hub','2026-08-17 08:10+01'::timestamptz from public.tracking_codes where code='STK-729154'
union all select id,'pending'::public.ship_status,'Shipment Created','Kano, Nigeria','2026-08-12 07:40+01'::timestamptz from public.tracking_codes where code='STK-451826'
union all select id,'in_transit'::public.ship_status,'In Transit','Kaduna Hub','2026-08-13 15:30+01'::timestamptz from public.tracking_codes where code='STK-451826'
union all select id,'delivered'::public.ship_status,'Delivered','Abuja, Nigeria','2026-08-14 11:05+01'::timestamptz from public.tracking_codes where code='STK-451826';
