-- Optional: custom season start per team for Entrenament Mental™ week alignment
-- alter table public.teams
--   add column if not exists season_start_date date;

-- Future content packs per team (football, academy, injured, etc.)
-- alter table public.teams
--   add column if not exists mental_training_pack text not null default 'default';
