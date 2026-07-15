-- Priority review/dismissal state for psychologist dashboard inbox
-- Run in Supabase SQL Editor after psychologist-alerts-soft-delete.sql

create table if not exists public.priority_states (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.profiles (id) on delete cascade,
  priority_key text not null,
  status text not null check (status in ('reviewed', 'dismissed', 'resolved')),
  metadata jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  dismissed_at timestamptz,
  dismissed_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (psychologist_id, priority_key)
);

create index if not exists priority_states_psychologist_idx
  on public.priority_states (psychologist_id, updated_at desc);

alter table public.priority_states enable row level security;

drop policy if exists "Psychologists manage own priority_states" on public.priority_states;

create policy "Psychologists manage own priority_states"
  on public.priority_states for all
  to authenticated
  using (
    public.auth_user_role() = 'psychologist'
    and psychologist_id = auth.uid()
  )
  with check (
    public.auth_user_role() = 'psychologist'
    and psychologist_id = auth.uid()
  );

notify pgrst, 'reload schema';
