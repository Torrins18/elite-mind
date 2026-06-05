-- Weekly autoevaluation fields.
-- Run in Supabase SQL Editor, then refresh the app with Ctrl+F5.

alter table public.check_ins
  add column if not exists performance_rating smallint check (performance_rating between 0 and 10),
  add column if not exists involvement_rating smallint check (involvement_rating between 0 and 10),
  add column if not exists general_mood_words text,
  add column if not exists mood_change_event text,
  add column if not exists next_goal text;

notify pgrst, 'reload schema';
