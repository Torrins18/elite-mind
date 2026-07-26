-- Alert history: professional actions + expanded statuses
-- Run after psychologist-alerts-soft-delete.sql

alter table public.psychologist_alerts
  add column if not exists action_taken text,
  add column if not exists professional_note text,
  add column if not exists resolved_at timestamptz;

-- Expand status CHECK: active | reviewed | monitoring | resolved | dismissed
alter table public.psychologist_alerts drop constraint if exists psychologist_alerts_status_check;

alter table public.psychologist_alerts
  add constraint psychologist_alerts_status_check
  check (status in ('active', 'reviewed', 'monitoring', 'resolved', 'dismissed'));

-- Panel-visible / unique-open statuses
drop index if exists psychologist_alerts_status_idx;
create index if not exists psychologist_alerts_status_idx
  on public.psychologist_alerts (status)
  where status in ('active', 'monitoring');

drop index if exists psychologist_alerts_open_unique;
create unique index if not exists psychologist_alerts_open_unique
  on public.psychologist_alerts (athlete_id, alert_type)
  where status in ('active', 'monitoring');

notify pgrst, 'reload schema';
