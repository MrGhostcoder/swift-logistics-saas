create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, codes_total)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'phone',''), 1)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer') on conflict do nothing;
  insert into public.notifications (user_id, title, body)
  values (new.id, 'Welcome to SwiftTrack', 'You have 1 free tracking code to create your first shipment.');
  return new;
end; $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;