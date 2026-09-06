revoke all on function public.assign_tracking_code() from public, anon, authenticated;
revoke all on function public.seed_first_event() from public, anon, authenticated;
revoke all on function public.generate_tracking_code() from public, anon, authenticated;
grant execute on function public.generate_tracking_code() to service_role;