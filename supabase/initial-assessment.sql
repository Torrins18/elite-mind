-- Initial athlete onboarding assessment.
-- Results are inserted by athletes and readable only by psychologists.

alter table public.profiles
  add column if not exists initial_assessment_completed_at timestamptz;

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

alter table public.athlete_initial_assessments enable row level security;

drop policy if exists "Athletes insert own initial assessment" on public.athlete_initial_assessments;
drop policy if exists "Psychologists read initial assessments" on public.athlete_initial_assessments;

create policy "Athletes insert own initial assessment"
  on public.athlete_initial_assessments for insert
  with check (athlete_id = auth.uid());

create policy "Psychologists read initial assessments"
  on public.athlete_initial_assessments for select
  using (public.auth_user_role() = 'psychologist');
