-- Phase 2: intervention plans, goals, and resource library
-- Run after psychologist-notes.sql

create table if not exists public.psychologist_resources (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  resource_type text not null default 'routine'
    check (resource_type in ('breathing', 'visualization', 'audio', 'pdf', 'video', 'routine')),
  url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.athlete_goals (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  psychologist_id uuid not null references public.profiles (id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'active'
    check (status in ('active', 'achieved', 'paused', 'cancelled')),
  outcome text not null default '',
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.athlete_goal_steps (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.athlete_goals (id) on delete cascade,
  step_kind text not null default 'action'
    check (step_kind in ('action', 'exercise', 'followup')),
  title text not null,
  description text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'done')),
  resource_id uuid references public.psychologist_resources (id) on delete set null,
  follow_up_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists athlete_goals_athlete_idx
  on public.athlete_goals (athlete_id, status, created_at desc);

create index if not exists athlete_goal_steps_goal_idx
  on public.athlete_goal_steps (goal_id, sort_order);

create index if not exists psychologist_resources_psychologist_idx
  on public.psychologist_resources (psychologist_id, created_at desc);

alter table public.psychologist_resources enable row level security;
alter table public.athlete_goals enable row level security;
alter table public.athlete_goal_steps enable row level security;

drop policy if exists "Psychologists manage psychologist_resources" on public.psychologist_resources;
create policy "Psychologists manage psychologist_resources"
  on public.psychologist_resources for all
  to authenticated
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');

drop policy if exists "Psychologists manage athlete_goals" on public.athlete_goals;
create policy "Psychologists manage athlete_goals"
  on public.athlete_goals for all
  to authenticated
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');

drop policy if exists "Psychologists manage athlete_goal_steps" on public.athlete_goal_steps;
create policy "Psychologists manage athlete_goal_steps"
  on public.athlete_goal_steps for all
  to authenticated
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');

notify pgrst, 'reload schema';
