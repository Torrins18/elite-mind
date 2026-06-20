-- Enllaç d'inscripció per equip (un enllaç per a tots els esportistes del grup)
-- Executar a Supabase SQL Editor (substitueix la lògica d'athlete-invites.sql)

alter table public.teams
  add column if not exists join_token uuid not null default gen_random_uuid();

create unique index if not exists teams_join_token_idx on public.teams (join_token);

update public.teams
set join_token = gen_random_uuid()
where join_token is null;

-- Validar enllaç d'equip (sense autenticació)
create or replace function public.validate_athlete_invite(invite_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'valid', true,
        'team_id', t.id,
        'team_name', t.name
      )
      from public.teams t
      where t.join_token = invite_token
    ),
    jsonb_build_object('valid', false)
  );
$$;

-- Assignar equip a l'esportista després del registre
create or replace function public.consume_athlete_invite(invite_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  team_row public.teams%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into team_row
  from public.teams
  where join_token = invite_token;

  if not found then
    raise exception 'Invalid team join link';
  end if;

  update public.profiles
  set
    role = 'athlete',
    approved = true,
    team_id = team_row.id
  where id = auth.uid();
end;
$$;

grant execute on function public.validate_athlete_invite(uuid) to anon, authenticated;
grant execute on function public.consume_athlete_invite(uuid) to authenticated;
