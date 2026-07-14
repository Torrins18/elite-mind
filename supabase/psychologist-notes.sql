-- Private psychologist clinical notes (Phase 1 athlete file)
-- Run after psychologist-alerts-soft-delete.sql

create table if not exists public.psychologist_notes (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  psychologist_id uuid not null references public.profiles (id) on delete set null,
  note_date date not null default current_date,
  topic text not null default '',
  actions text not null default '',
  next_session text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists psychologist_notes_athlete_idx
  on public.psychologist_notes (athlete_id, note_date desc);

alter table public.psychologist_notes enable row level security;

drop policy if exists "Psychologists manage psychologist_notes" on public.psychologist_notes;

create policy "Psychologists manage psychologist_notes"
  on public.psychologist_notes for all
  to authenticated
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');

notify pgrst, 'reload schema';
