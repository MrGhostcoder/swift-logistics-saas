
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.on_status_change() from anon, authenticated;
revoke execute on function public.consume_code_quota() from anon, authenticated;
revoke execute on function public.update_updated_at_column() from anon, authenticated;
revoke execute on function public.approve_payment(uuid) from anon;
revoke execute on function public.reject_payment(uuid, text) from anon;
revoke execute on function public.has_role(uuid, public.app_role) from anon;
