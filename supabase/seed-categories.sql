-- Categorías / equipos de ejemplo — ejecutar en Supabase SQL Editor

insert into public.teams (name)
select v.name
from (
  values
    ('Sènior'),
    ('Juvenil'),
    ('Cadet S16'),
    ('Cadet S15'),
    ('Infantil S14'),
    ('Infantil S13')
) as v(name)
where not exists (
  select 1 from public.teams t where t.name = v.name
);

-- Todos los usuarios autenticados pueden ver las categorías para elegir
drop policy if exists "Authenticated read all categories" on public.teams;

create policy "Authenticated read all categories"
  on public.teams for select
  to authenticated
  using (true);

-- Coaches: leer deportistas de la misma categoría (team_id)
drop policy if exists "Coaches read team athletes" on public.profiles;

create policy "Coaches read team athletes"
  on public.profiles for select
  using (
    public.auth_user_role() = 'coach'
    and profiles.team_id is not null
    and profiles.team_id = (
      select p.team_id from public.profiles p where p.id = auth.uid()
    )
    and profiles.role = 'athlete'
  );

drop policy if exists "Coaches read team check-ins" on public.check_ins;

create policy "Coaches read team check-ins"
  on public.check_ins for select
  using (
    public.auth_user_role() = 'coach'
    and exists (
      select 1 from public.profiles athlete
      where athlete.id = check_ins.athlete_id
        and athlete.role = 'athlete'
        and athlete.team_id = (
          select p.team_id from public.profiles p where p.id = auth.uid()
        )
    )
  );
