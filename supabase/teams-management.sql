-- Teams setup and psychologist team management.
-- Run in Supabase SQL Editor.

insert into public.teams (name)
select v.name
from (
  values
    ('Equip 1'),
    ('Equip 2'),
    ('Equip 3'),
    ('Equip 4')
) as v(name)
where not exists (
  select 1 from public.teams t where t.name = v.name
);

drop policy if exists "Authenticated read all teams" on public.teams;
drop policy if exists "Authenticated read all categories" on public.teams;
drop policy if exists "Psychologists manage teams" on public.teams;

create policy "Authenticated read all teams"
  on public.teams for select
  to authenticated
  using (true);

create policy "Psychologists manage teams"
  on public.teams for all
  to authenticated
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');

drop policy if exists "Psychologists update profiles" on public.profiles;

create policy "Psychologists update profiles"
  on public.profiles for update
  to authenticated
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');

notify pgrst, 'reload schema';
