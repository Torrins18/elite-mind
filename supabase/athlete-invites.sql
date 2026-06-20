-- Invitacions d'esportista: importació de roster + activació de compte per enllaç
-- Executar a Supabase SQL Editor després de coach-invites.sql i teams-management.sql

create table if not exists public.athlete_invites (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  full_name text not null,
  email text,
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  constraint athlete_invites_email_lowercase check (email is null or email = lower(trim(email)))
);

create index if not exists athlete_invites_token_idx on public.athlete_invites (token);
create index if not exists athlete_invites_team_idx on public.athlete_invites (team_id);
create index if not exists athlete_invites_created_by_idx on public.athlete_invites (created_by);

alter table public.athlete_invites enable row level security;

drop policy if exists "Psychologists manage athlete invites" on public.athlete_invites;

create policy "Psychologists manage athlete invites"
  on public.athlete_invites for all
  using (
    public.auth_user_role() = 'psychologist'
    and created_by = auth.uid()
  )
  with check (
    public.auth_user_role() = 'psychologist'
    and created_by = auth.uid()
  );

drop policy if exists "Coaches read team athlete invites" on public.athlete_invites;

create policy "Coaches read team athlete invites"
  on public.athlete_invites for select
  using (
    public.auth_user_is_approved_coach()
    and team_id = public.auth_user_team_id()
  );

-- Validar invitació (sense autenticació — pàgina d'activació)
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
        'team_id', ai.team_id,
        'team_name', t.name,
        'full_name', ai.full_name,
        'email', ai.email
      )
      from public.athlete_invites ai
      join public.teams t on t.id = ai.team_id
      where ai.token = invite_token
        and ai.used_at is null
        and ai.expires_at > now()
    ),
    jsonb_build_object('valid', false)
  );
$$;

-- Consumir invitació després del registre / confirmació d'email
create or replace function public.consume_athlete_invite(invite_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.athlete_invites%rowtype;
  user_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv
  from public.athlete_invites
  where token = invite_token
    and used_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invalid or expired invite';
  end if;

  select lower(trim(email)) into user_email
  from auth.users
  where id = auth.uid();

  if inv.email is not null and user_email is not null and inv.email <> user_email then
    raise exception 'Email does not match invitation';
  end if;

  update public.athlete_invites
  set used_by = auth.uid(), used_at = now()
  where id = inv.id;

  update public.profiles
  set
    role = 'athlete',
    approved = true,
    team_id = inv.team_id,
    name = coalesce(nullif(trim(inv.full_name), ''), name)
  where id = auth.uid();
end;
$$;

grant execute on function public.validate_athlete_invite(uuid) to anon, authenticated;
grant execute on function public.consume_athlete_invite(uuid) to authenticated;
