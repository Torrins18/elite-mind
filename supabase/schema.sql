-- Mental Performance Platform — Supabase schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

-- ---------------------------------------------------------------------------
-- Teams (created before profiles.team_id FK)
-- ---------------------------------------------------------------------------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  coach_id uuid,
  created_at timestamptz not null default now()
);

-- Si teams ya existía sin coach_id (ejecución anterior), añadir la columna
alter table public.teams
  add column if not exists coach_id uuid;

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null check (role in ('athlete', 'coach', 'psychologist')),
  team_id uuid references public.teams (id) on delete set null,
  date_of_birth date,
  is_adult boolean,
  guardian_full_name text,
  guardian_relationship text,
  guardian_email text,
  guardian_phone text,
  guardian_signature text,
  guardian_consent_text_version text,
  guardian_consent_user_agent text,
  guardian_consent_ip_address text,
  guardian_consent_signed_at timestamptz,
  initial_assessment_completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- FK coach_id → profiles (después de que existan ambas tablas)
alter table public.teams
  drop constraint if exists teams_coach_id_fkey;

alter table public.teams
  add constraint teams_coach_id_fkey
  foreign key (coach_id) references public.profiles (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Daily mental check-ins
-- ---------------------------------------------------------------------------
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  check_in_date date not null default (current_date),
  mood smallint check (mood between 1 and 10),
  stress smallint check (stress between 1 and 10),
  sleep_quality smallint check (sleep_quality between 1 and 10),
  energy smallint check (energy between 1 and 10),
  focus smallint check (focus between 1 and 10),
  personal_notes text,
  performance_rating smallint check (performance_rating between 0 and 10),
  involvement_rating smallint check (involvement_rating between 0 and 10),
  general_mood_words text,
  mood_change_event text,
  next_goal text,
  created_at timestamptz not null default now(),
  unique (athlete_id, check_in_date)
);

create index if not exists check_ins_athlete_date_idx
  on public.check_ins (athlete_id, check_in_date desc);

create index if not exists profiles_team_idx on public.profiles (team_id);

-- ---------------------------------------------------------------------------
-- Initial athlete assessment (private to psychologists)
-- ---------------------------------------------------------------------------
create table if not exists public.athlete_initial_assessments (
  athlete_id uuid primary key references public.profiles (id) on delete cascade,
  personal_info jsonb not null default '{}'::jsonb,
  sleep_habits jsonb not null default '{}'::jsonb,
  nutrition_habits jsonb not null default '{}'::jsonb,
  sports_background jsonb not null default '{}'::jsonb,
  family_social_support jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists athlete_initial_assessments_submitted_idx
  on public.athlete_initial_assessments (submitted_at desc);

-- ---------------------------------------------------------------------------
-- Coach-safe view (no personal_notes)
-- ---------------------------------------------------------------------------
create or replace view public.check_ins_coach as
select
  id,
  athlete_id,
  check_in_date,
  mood,
  stress,
  sleep_quality,
  energy,
  focus,
  created_at
from public.check_ins;

-- ---------------------------------------------------------------------------
-- Helpers (evitan recursión RLS al leer profiles)
-- ---------------------------------------------------------------------------
create or replace function public.auth_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

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

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.check_ins enable row level security;
alter table public.athlete_initial_assessments enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Psychologists read all profiles" on public.profiles;
drop policy if exists "Coaches read team athletes" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

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

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Coaches manage own teams" on public.teams;
drop policy if exists "Team members read their team" on public.teams;
drop policy if exists "Psychologists read all teams" on public.teams;

create policy "Coaches manage own teams"
  on public.teams for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "Team members read their team"
  on public.teams for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.team_id = teams.id
    )
  );

create policy "Psychologists read all teams"
  on public.teams for select
  using (public.auth_user_role() = 'psychologist');

drop policy if exists "Athletes manage own check-ins" on public.check_ins;
drop policy if exists "Psychologists read all check-ins" on public.check_ins;
drop policy if exists "Coaches read team check-ins" on public.check_ins;

create policy "Athletes manage own check-ins"
  on public.check_ins for all
  using (athlete_id = auth.uid())
  with check (athlete_id = auth.uid());

drop policy if exists "Athletes insert own initial assessment" on public.athlete_initial_assessments;
drop policy if exists "Psychologists read initial assessments" on public.athlete_initial_assessments;

create policy "Athletes insert own initial assessment"
  on public.athlete_initial_assessments for insert
  with check (athlete_id = auth.uid());

create policy "Psychologists read initial assessments"
  on public.athlete_initial_assessments for select
  using (public.auth_user_role() = 'psychologist');

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

grant select on public.check_ins_coach to authenticated;

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup (see also fix-profiles.sql)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Seed example team (optional — run after creating coach + athletes in Auth)
-- ---------------------------------------------------------------------------
-- insert into public.teams (name, coach_id) values ('Elite Squad', '<coach-uuid>');
