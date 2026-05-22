-- Invitacions d'entrenador + aprovació per psicòleg — executar a Supabase SQL Editor

-- Columna d'aprovació (esportistes: true per defecte; entrenadors: false fins validació)
alter table public.profiles
  add column if not exists approved boolean not null default true;

alter table public.profiles
  add column if not exists is_rejected boolean not null default false;

-- Entrenadors creats abans sense validar → pendents
update public.profiles
set approved = false
where role = 'coach' and approved = true;

-- Taula d'invitacions (només el psicòleg genera enllaços)
create table if not exists public.coach_invites (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create index if not exists coach_invites_token_idx on public.coach_invites (token);

alter table public.coach_invites enable row level security;

drop policy if exists "Psychologists manage coach invites" on public.coach_invites;

create policy "Psychologists manage coach invites"
  on public.coach_invites for all
  using (
    public.auth_user_role() = 'psychologist'
    and created_by = auth.uid()
  )
  with check (
    public.auth_user_role() = 'psychologist'
    and created_by = auth.uid()
  );

-- Validar invitació (sense autenticació — per la pàgina de registre)
create or replace function public.validate_coach_invite(invite_token uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.coach_invites
    where token = invite_token
      and used_at is null
      and expires_at > now()
  );
$$;

-- Consumir invitació després del registre
create or replace function public.consume_coach_invite(invite_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.coach_invites
  set used_by = auth.uid(), used_at = now()
  where token = invite_token
    and used_at is null
    and expires_at > now();

  if not exists (
    select 1 from public.coach_invites
    where token = invite_token and used_by = auth.uid()
  ) then
    raise exception 'Invalid or expired invite';
  end if;

  update public.profiles
  set role = 'coach', approved = false
  where id = auth.uid();
end;
$$;

-- Aprovar entrenador (només psicòleg)
create or replace function public.approve_coach(coach_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.auth_user_role() <> 'psychologist' then
    raise exception 'Not authorized';
  end if;

  update public.profiles
  set approved = true
  where id = coach_profile_id and role = 'coach';
end;
$$;

grant execute on function public.validate_coach_invite(uuid) to anon, authenticated;
grant execute on function public.consume_coach_invite(uuid) to authenticated;
grant execute on function public.approve_coach(uuid) to authenticated;

-- Psicòleg pot actualitzar perfils (aprovar entrenadors)
drop policy if exists "Psychologists update profiles" on public.profiles;

create policy "Psychologists update profiles"
  on public.profiles for update
  using (public.auth_user_role() = 'psychologist');

-- Trigger: nous usuaris amb rol coach sense invitació → es queden com athlete o pending
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
  is_coach boolean;
begin
  meta_role := coalesce(new.raw_user_meta_data->>'role', 'athlete');
  is_coach := meta_role = 'coach';

  insert into public.profiles (id, name, role, approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when is_coach then 'coach' else 'athlete' end,
    not is_coach
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Només entrenadors APROVATS accedeixen a dades d'equip
create or replace function public.auth_user_is_approved_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coach' and approved = true
  );
$$;

grant execute on function public.auth_user_is_approved_coach() to authenticated;

drop policy if exists "Coaches read team athletes" on public.profiles;

create policy "Coaches read team athletes"
  on public.profiles for select
  using (
    public.auth_user_is_approved_coach()
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
    public.auth_user_is_approved_coach()
    and exists (
      select 1 from public.profiles athlete
      where athlete.id = check_ins.athlete_id
        and athlete.role = 'athlete'
        and athlete.team_id = (
          select p.team_id from public.profiles p where p.id = auth.uid()
        )
    )
  );
