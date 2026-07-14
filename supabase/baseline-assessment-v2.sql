-- Baseline Assessment v2: mental profile, objectives, summary, psychologist edit
-- Run after initial-assessment.sql

alter table public.athlete_initial_assessments
  add column if not exists mental_profile jsonb not null default '{}'::jsonb,
  add column if not exists objectives jsonb not null default '{}'::jsonb,
  add column if not exists baseline_summary text not null default '';

drop policy if exists "Psychologists update initial assessments" on public.athlete_initial_assessments;
create policy "Psychologists update initial assessments"
  on public.athlete_initial_assessments for update
  to authenticated
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');
