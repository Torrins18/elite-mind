-- =============================================================================
-- FIX: Perfil no encontrado — ejecuta TODO este archivo en Supabase SQL Editor
-- =============================================================================

-- 1) Función para leer el rol sin recursión RLS
create or replace function public.auth_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 2) Función: obtener o crear el perfil del usuario conectado (la usa la app)
create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
  user_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into result from public.profiles where id = auth.uid();
  if found then
    return result;
  end if;

  select email into user_email from auth.users where id = auth.uid();

  insert into public.profiles (id, name, role, approved)
  values (
    auth.uid(),
    coalesce(split_part(user_email, '@', 1), 'Athlete'),
    coalesce(
      (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()),
      'athlete'
    ),
    coalesce(
      (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()),
      'athlete'
    ) <> 'coach'
  )
  returning * into result;

  return result;
end;
$$;

grant execute on function public.ensure_my_profile() to authenticated;
grant execute on function public.auth_user_role() to authenticated;

-- 3) Reparar usuarios existentes sin perfil
insert into public.profiles (id, name, role)
select
  u.id,
  split_part(u.email, '@', 1),
  'athlete'
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- 4) Trigger para nuevos registros
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'athlete')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Corregir políticas RLS (evitan recursión infinita al leer profiles)
drop policy if exists "Psychologists read all profiles" on public.profiles;
drop policy if exists "Coaches read team athletes" on public.profiles;

create policy "Psychologists read all profiles"
  on public.profiles for select
  using (public.auth_user_role() = 'psychologist');

create policy "Coaches read team athletes"
  on public.profiles for select
  using (
    public.auth_user_role() = 'coach'
    and exists (
      select 1 from public.teams t
      where t.coach_id = auth.uid()
        and profiles.team_id = t.id
    )
  );

-- Políticas de check_ins que también usaban subquery recursiva en profiles
drop policy if exists "Psychologists read all check-ins" on public.check_ins;
drop policy if exists "Coaches read team check-ins" on public.check_ins;

create policy "Psychologists read all check-ins"
  on public.check_ins for select
  using (public.auth_user_role() = 'psychologist');

create policy "Coaches read team check-ins"
  on public.check_ins for select
  using (
    public.auth_user_role() = 'coach'
    and exists (
      select 1 from public.profiles athlete
      join public.teams t on t.id = athlete.team_id and t.coach_id = auth.uid()
      where athlete.id = check_ins.athlete_id
    )
  );

drop policy if exists "Psychologists read all teams" on public.teams;

create policy "Psychologists read all teams"
  on public.teams for select
  using (public.auth_user_role() = 'psychologist');
