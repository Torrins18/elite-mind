-- Fix recursive RLS policies on profiles/check_ins.
-- Run this in Supabase SQL Editor if updates to profiles fail with:
-- "infinite recursion detected in policy for relation profiles".

create or replace function public.auth_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_user_team_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select team_id from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_user_is_approved_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'coach'
      and approved = true
  );
$$;

create or replace function public.coach_can_read_athlete(athlete_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles athlete
    where athlete.id = athlete_profile_id
      and athlete.role = 'athlete'
      and athlete.team_id = public.auth_user_team_id()
      and public.auth_user_is_approved_coach()
  );
$$;

grant execute on function public.auth_user_role() to authenticated;
grant execute on function public.auth_user_team_id() to authenticated;
grant execute on function public.auth_user_is_approved_coach() to authenticated;
grant execute on function public.coach_can_read_athlete(uuid) to authenticated;

drop policy if exists "Psychologists read all profiles" on public.profiles;
drop policy if exists "Coaches read team athletes" on public.profiles;
drop policy if exists "Psychologists update profiles" on public.profiles;

create policy "Psychologists read all profiles"
  on public.profiles for select
  using (public.auth_user_role() = 'psychologist');

create policy "Coaches read team athletes"
  on public.profiles for select
  using (
    public.auth_user_is_approved_coach()
    and profiles.role = 'athlete'
    and profiles.team_id is not null
    and profiles.team_id = public.auth_user_team_id()
  );

create policy "Psychologists update profiles"
  on public.profiles for update
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');

drop policy if exists "Psychologists read all check-ins" on public.check_ins;
drop policy if exists "Coaches read team check-ins" on public.check_ins;

create policy "Psychologists read all check-ins"
  on public.check_ins for select
  using (public.auth_user_role() = 'psychologist');

create policy "Coaches read team check-ins"
  on public.check_ins for select
  using (public.coach_can_read_athlete(check_ins.athlete_id));
