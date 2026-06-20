-- Revisió Setmanal EOR (Entorn, Organització, Rendiment)
-- Executar a Supabase SQL Editor després de extended-checkins.sql

alter table public.check_ins
  add column if not exists effort_rating smallint check (effort_rating between 0 and 10),
  add column if not exists weekly_rest_quality smallint check (weekly_rest_quality between 0 and 10),
  add column if not exists weekly_energy smallint check (weekly_energy between 0 and 10),
  add column if not exists physical_fatigue smallint check (physical_fatigue between 0 and 10),
  add column if not exists general_recovery smallint check (general_recovery between 0 and 10),
  add column if not exists confidence_rating smallint check (confidence_rating between 0 and 10),
  add column if not exists concentration_rating smallint check (concentration_rating between 0 and 10),
  add column if not exists motivation_rating smallint check (motivation_rating between 0 and 10),
  add column if not exists pressure_management smallint check (pressure_management between 0 and 10),
  add column if not exists teammate_communication smallint check (teammate_communication between 0 and 10),
  add column if not exists coach_communication smallint check (coach_communication between 0 and 10),
  add column if not exists group_integration smallint check (group_integration between 0 and 10),
  add column if not exists role_clarity smallint check (role_clarity between 0 and 10),
  add column if not exists sport_life_balance smallint check (sport_life_balance between 0 and 10),
  add column if not exists life_outside_sport smallint check (life_outside_sport between 0 and 10),
  add column if not exists personal_time_management smallint check (personal_time_management between 0 and 10),
  add column if not exists weekly_went_well text,
  add column if not exists weekly_main_difficulty text,
  add column if not exists psychologist_contact text check (psychologist_contact in ('no', 'maybe', 'yes'));

notify pgrst, 'reload schema';
