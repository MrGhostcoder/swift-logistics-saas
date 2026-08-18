
insert into public.user_roles (user_id, role)
values ('0698e9f5-7ce6-41cc-b1c9-29dd248a6368', 'admin')
on conflict (user_id, role) do nothing;
