-- Athlete → psychologist contact (appointments + messages)
-- Run after schema.sql

create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.psychologist_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  status text not null default 'unread'
    check (status in ('unread', 'read')),
  created_at timestamptz not null default now()
);

create index if not exists appointment_requests_status_idx
  on public.appointment_requests (status, created_at desc);

create index if not exists psychologist_messages_status_idx
  on public.psychologist_messages (status, created_at desc);

alter table public.appointment_requests enable row level security;
alter table public.psychologist_messages enable row level security;

-- appointment_requests
drop policy if exists "Athletes create appointment requests" on public.appointment_requests;
drop policy if exists "Athletes read own appointment requests" on public.appointment_requests;
drop policy if exists "Psychologists read appointment requests" on public.appointment_requests;
drop policy if exists "Psychologists update appointment requests" on public.appointment_requests;

create policy "Athletes create appointment requests"
  on public.appointment_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Athletes read own appointment requests"
  on public.appointment_requests for select
  using (auth.uid() = user_id);

create policy "Psychologists read appointment requests"
  on public.appointment_requests for select
  using (public.auth_user_role() = 'psychologist');

create policy "Psychologists update appointment requests"
  on public.appointment_requests for update
  using (public.auth_user_role() = 'psychologist');

-- psychologist_messages
drop policy if exists "Athletes create psychologist messages" on public.psychologist_messages;
drop policy if exists "Athletes read own psychologist messages" on public.psychologist_messages;
drop policy if exists "Psychologists read psychologist messages" on public.psychologist_messages;
drop policy if exists "Psychologists update psychologist messages" on public.psychologist_messages;

create policy "Athletes create psychologist messages"
  on public.psychologist_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Athletes read own psychologist messages"
  on public.psychologist_messages for select
  using (auth.uid() = user_id);

create policy "Psychologists read psychologist messages"
  on public.psychologist_messages for select
  using (public.auth_user_role() = 'psychologist');

create policy "Psychologists update psychologist messages"
  on public.psychologist_messages for update
  using (public.auth_user_role() = 'psychologist');
