-- Notice system: kind (notice|reminder), living notice counters, postpone
-- Run after alert-history-actions.sql

alter table public.psychologist_alerts
  add column if not exists kind text not null default 'notice',
  add column if not exists last_event_at timestamptz,
  add column if not exists event_count integer not null default 1,
  add column if not exists postponed_until timestamptz;

-- Ensure kind constraint (drop/recreate if needed)
alter table public.psychologist_alerts drop constraint if exists psychologist_alerts_kind_check;
alter table public.psychologist_alerts
  add constraint psychologist_alerts_kind_check
  check (kind in ('notice', 'reminder'));

update public.psychologist_alerts
set last_event_at = coalesce(last_event_at, updated_at, created_at)
where last_event_at is null;

-- Legacy reminder-like types stored as notices → reclassify for panel filtering
update public.psychologist_alerts
set kind = 'reminder'
where alert_type in ('no_data', 'weekly_overdue')
  and kind = 'notice';

update public.psychologist_alerts
set kind = 'reminder'
where alert_type = 'inactive'
  and kind = 'notice'
  and coalesce((context->>'days')::int, 0) < 14
  and severity <> 'high';

-- Resolve old open reminders so they leave the actionable panel
update public.psychologist_alerts
set
  status = 'resolved',
  resolved_at = coalesce(resolved_at, now()),
  updated_at = now(),
  context = coalesce(context, '{}'::jsonb) || jsonb_build_object('migratedToReminder', true)
where kind = 'reminder'
  and status in ('active', 'monitoring', 'reviewed');

create index if not exists psychologist_alerts_kind_status_idx
  on public.psychologist_alerts (kind, status, postponed_until);

notify pgrst, 'reload schema';
