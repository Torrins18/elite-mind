-- Psychologist alert states + soft-delete teams
-- Run in Supabase SQL Editor after weekly-eor-checkins.sql

alter table public.teams
  add column if not exists deleted_at timestamptz;

create table if not exists public.psychologist_alerts (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  alert_type text not null,
  severity text not null check (severity in ('high', 'medium', 'low')),
  status text not null default 'active' check (status in ('active', 'reviewed', 'dismissed')),
  context jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  dismissed_at timestamptz,
  dismissed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists psychologist_alerts_athlete_status_idx
  on public.psychologist_alerts (athlete_id, status);

create index if not exists psychologist_alerts_status_idx
  on public.psychologist_alerts (status)
  where status in ('active', 'reviewed');

create unique index if not exists psychologist_alerts_open_unique
  on public.psychologist_alerts (athlete_id, alert_type)
  where status in ('active', 'reviewed');

alter table public.psychologist_alerts enable row level security;

drop policy if exists "Psychologists manage psychologist_alerts" on public.psychologist_alerts;

create policy "Psychologists manage psychologist_alerts"
  on public.psychologist_alerts for all
  to authenticated
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');

drop policy if exists "Authenticated read all teams" on public.teams;

create policy "Authenticated read active teams"
  on public.teams for select
  to authenticated
  using (deleted_at is null or public.auth_user_role() = 'psychologist');

notify pgrst, 'reload schema';
