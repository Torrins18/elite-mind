-- Phase 5: bidirectional messaging + appointment scheduling
-- Run after clinical-sessions-documents.sql

alter table public.psychologist_messages
  add column if not exists sender_role text not null default 'athlete'
    check (sender_role in ('athlete', 'psychologist'));

alter table public.appointment_requests
  add column if not exists scheduled_at timestamptz,
  add column if not exists psychologist_reply text,
  add column if not exists duration_minutes int not null default 30
    check (duration_minutes between 15 and 120);

create index if not exists psychologist_messages_thread_idx
  on public.psychologist_messages (user_id, created_at desc);

create index if not exists psychologist_messages_unread_idx
  on public.psychologist_messages (status, sender_role, created_at desc);

-- Psychologists can send replies in athlete threads
drop policy if exists "Psychologists create psychologist message replies" on public.psychologist_messages;
create policy "Psychologists create psychologist message replies"
  on public.psychologist_messages for insert
  to authenticated
  with check (
    public.auth_user_role() = 'psychologist'
    and sender_role = 'psychologist'
  );

-- Athletes can mark psychologist replies as read
drop policy if exists "Athletes update psychologist message read status" on public.psychologist_messages;
create policy "Athletes update psychologist message read status"
  on public.psychologist_messages for update
  using (auth.uid() = user_id and sender_role = 'psychologist')
  with check (auth.uid() = user_id and sender_role = 'psychologist');
