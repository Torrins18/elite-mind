-- Phase 4: clinical sessions + athlete documents (private storage)
-- Run after clubs-management.sql

create table if not exists public.psychologist_sessions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  psychologist_id uuid not null references public.profiles (id) on delete set null,
  session_date date not null default current_date,
  topic text not null default '',
  actions text not null default '',
  duration_minutes int not null default 30 check (duration_minutes between 15 and 120),
  next_session text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.athlete_documents (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  psychologist_id uuid not null references public.profiles (id) on delete set null,
  title text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text not null default 'application/octet-stream',
  file_size bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists psychologist_sessions_athlete_idx
  on public.psychologist_sessions (athlete_id, session_date desc);

create index if not exists athlete_documents_athlete_idx
  on public.athlete_documents (athlete_id, created_at desc);

alter table public.psychologist_sessions enable row level security;
alter table public.athlete_documents enable row level security;

drop policy if exists "Psychologists manage psychologist_sessions" on public.psychologist_sessions;
create policy "Psychologists manage psychologist_sessions"
  on public.psychologist_sessions for all
  to authenticated
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');

drop policy if exists "Psychologists manage athlete_documents" on public.athlete_documents;
create policy "Psychologists manage athlete_documents"
  on public.athlete_documents for all
  to authenticated
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');

insert into storage.buckets (id, name, public)
values ('athlete-documents', 'athlete-documents', false)
on conflict (id) do nothing;

drop policy if exists "Psychologists upload athlete documents" on storage.objects;
drop policy if exists "Psychologists read athlete documents" on storage.objects;
drop policy if exists "Psychologists delete athlete documents" on storage.objects;

create policy "Psychologists upload athlete documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'athlete-documents'
    and public.auth_user_role() = 'psychologist'
  );

create policy "Psychologists read athlete documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'athlete-documents'
    and public.auth_user_role() = 'psychologist'
  );

create policy "Psychologists delete athlete documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'athlete-documents'
    and public.auth_user_role() = 'psychologist'
  );

notify pgrst, 'reload schema';
