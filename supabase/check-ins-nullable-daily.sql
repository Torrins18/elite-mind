-- Permetre revisió EOR setmanal sense haver completat l'estat diari el mateix dia.
-- Executar a Supabase SQL Editor.

alter table public.check_ins
  alter column mood drop not null,
  alter column stress drop not null,
  alter column sleep_quality drop not null,
  alter column energy drop not null,
  alter column focus drop not null;

notify pgrst, 'reload schema';
