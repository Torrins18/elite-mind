-- Dades de demo: check-ins dels últims 7 dies per a esportistes amb categoria assignada
-- Prerequisits: executar seed-categories.sql i tenir esportistes registrats amb team_id

insert into public.check_ins (
  athlete_id,
  check_in_date,
  mood,
  stress,
  sleep_quality,
  energy,
  focus,
  personal_notes
)
select
  p.id,
  (current_date - offs.day_offset)::date,
  greatest(1, least(10, 5 + (random() * 5)::int)),
  greatest(1, least(10, 3 + (random() * 6)::int)),
  greatest(1, least(10, 5 + (random() * 4)::int)),
  greatest(1, least(10, 5 + (random() * 5)::int)),
  greatest(1, least(10, 5 + (random() * 4)::int)),
  case
    when random() > 0.7 then 'Nota de demo: sensació de pressió abans de competir.'
    else null
  end
from public.profiles p
cross join generate_series(0, 6) as offs(day_offset)
where p.role = 'athlete'
  and p.team_id is not null
on conflict (athlete_id, check_in_date) do nothing;
