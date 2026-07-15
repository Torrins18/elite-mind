-- Psychologist → coach shared recommendations (explicit share only)
-- Run in Supabase SQL Editor after teams-management.sql

create table if not exists public.coach_recommendations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  psychologist_id uuid not null references public.profiles (id) on delete cascade,
  message text not null check (char_length(trim(message)) >= 8),
  shared_at timestamptz not null default now(),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists coach_recommendations_team_idx
  on public.coach_recommendations (team_id, shared_at desc)
  where archived_at is null;

alter table public.coach_recommendations enable row level security;

drop policy if exists "Psychologists manage coach_recommendations" on public.coach_recommendations;
drop policy if exists "Coaches read team coach_recommendations" on public.coach_recommendations;

create policy "Psychologists manage coach_recommendations"
  on public.coach_recommendations for all
  to authenticated
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');

create policy "Coaches read team coach_recommendations"
  on public.coach_recommendations for select
  to authenticated
  using (
    public.auth_user_role() = 'coach'
    and team_id = (select p.team_id from public.profiles p where p.id = auth.uid())
    and archived_at is null
  );

notify pgrst, 'reload schema';
