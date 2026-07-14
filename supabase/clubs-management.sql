-- Phase 3: multi-club hierarchy + director role
-- Run after intervention-plans.sql

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.teams
  add column if not exists club_id uuid references public.clubs (id) on delete set null;

alter table public.profiles
  add column if not exists club_id uuid references public.clubs (id) on delete set null;

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('athlete', 'coach', 'psychologist', 'director'));

create index if not exists teams_club_idx on public.teams (club_id) where deleted_at is null;
create index if not exists profiles_club_idx on public.profiles (club_id) where club_id is not null;

alter table public.clubs enable row level security;

drop policy if exists "Psychologists manage clubs" on public.clubs;
drop policy if exists "Directors read own club" on public.clubs;

create policy "Psychologists manage clubs"
  on public.clubs for all
  to authenticated
  using (public.auth_user_role() = 'psychologist')
  with check (public.auth_user_role() = 'psychologist');

create policy "Directors read own club"
  on public.clubs for select
  to authenticated
  using (
    public.auth_user_role() = 'director'
    and id = (select club_id from public.profiles where id = auth.uid())
  );

create or replace function public.auth_user_club_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select club_id from public.profiles where id = auth.uid();
$$;

grant execute on function public.auth_user_club_id() to authenticated;

-- Aggregated club snapshot for directors (no confidential data)
create or replace function public.get_director_club_snapshot(p_club_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_club_id uuid;
  v_club record;
  v_result jsonb;
  v_athlete_ids uuid[];
  v_team_count int;
  v_athlete_count int;
  v_checked_in int;
  v_avg_mental numeric;
  v_avg_wellbeing numeric;
  v_avg_social numeric;
  v_appointments_completed int;
  v_alerts_resolved int;
  v_check_ins_month int;
  v_teams jsonb;
  v_monthly jsonb;
begin
  select role, club_id into v_role, v_club_id
  from public.profiles where id = auth.uid();

  if v_role is distinct from 'director' or v_club_id is distinct from p_club_id then
    raise exception 'Forbidden';
  end if;

  select * into v_club from public.clubs
  where id = p_club_id and deleted_at is null;

  if not found then
    raise exception 'Club not found';
  end if;

  select coalesce(array_agg(p.id), '{}')
  into v_athlete_ids
  from public.profiles p
  join public.teams t on t.id = p.team_id
  where p.role = 'athlete'
    and t.club_id = p_club_id
    and t.deleted_at is null;

  v_athlete_count := coalesce(array_length(v_athlete_ids, 1), 0);

  select count(*) into v_team_count
  from public.teams
  where club_id = p_club_id and deleted_at is null;

  select count(distinct c.athlete_id) into v_checked_in
  from public.check_ins c
  where c.athlete_id = any(v_athlete_ids)
    and c.check_in_date >= date_trunc('week', current_date)::date;

  with latest_weekly as (
    select distinct on (c.athlete_id)
      c.athlete_id,
      c.confidence_rating,
      c.motivation_rating,
      c.pressure_management,
      c.concentration_rating,
      c.weekly_energy,
      c.weekly_rest_quality,
      c.physical_fatigue,
      c.general_recovery,
      c.group_integration,
      c.coach_communication
    from public.check_ins c
    where c.athlete_id = any(v_athlete_ids)
      and (
        c.performance_rating is not null
        or c.motivation_rating is not null
        or c.confidence_rating is not null
      )
    order by c.athlete_id, c.check_in_date desc
  )
  select
    round(avg((coalesce(confidence_rating, 0) + coalesce(motivation_rating, 0) + coalesce(pressure_management, 0) + coalesce(concentration_rating, 0)) / 4.0), 1),
    round(avg((coalesce(weekly_rest_quality, 0) + coalesce(weekly_energy, 0) + coalesce(general_recovery, 0) + (10 - coalesce(physical_fatigue, 0))) / 4.0), 1),
    round(avg((coalesce(group_integration, 0) + coalesce(coach_communication, 0)) / 2.0), 1)
  into v_avg_mental, v_avg_wellbeing, v_avg_social
  from latest_weekly;

  select count(*) into v_appointments_completed
  from public.appointment_requests ar
  where ar.user_id = any(v_athlete_ids)
    and ar.status = 'completed'
    and ar.created_at >= date_trunc('month', now());

  select count(*) into v_alerts_resolved
  from public.psychologist_alerts pa
  where pa.athlete_id = any(v_athlete_ids)
    and pa.status in ('reviewed', 'dismissed')
    and pa.updated_at >= date_trunc('month', now());

  select count(*) into v_check_ins_month
  from public.check_ins c
  where c.athlete_id = any(v_athlete_ids)
    and c.created_at >= date_trunc('month', now());

  select coalesce(jsonb_agg(row_to_json(team_row)), '[]'::jsonb)
  into v_teams
  from (
    select
      t.id,
      t.name,
      count(p.id)::int as athletes,
      case
        when count(p.id) = 0 then 0
        else round(
          100.0 * count(distinct case
            when c.check_in_date >= date_trunc('week', current_date)::date then c.athlete_id
          end)::numeric / count(p.id)::numeric
        )
      end as compliance_pct
    from public.teams t
    left join public.profiles p on p.team_id = t.id and p.role = 'athlete'
    left join public.check_ins c on c.athlete_id = p.id
    where t.club_id = p_club_id and t.deleted_at is null
    group by t.id, t.name
    order by t.name
  ) team_row;

  select coalesce(jsonb_agg(row_to_json(month_row)), '[]'::jsonb)
  into v_monthly
  from (
    select
      to_char(m.month_start, 'YYYY-MM') as month,
      case
        when v_athlete_count = 0 then 0
        else round(
          100.0 * (
            select count(distinct c.athlete_id)
            from public.check_ins c
            where c.athlete_id = any(v_athlete_ids)
              and c.check_in_date >= m.month_start
              and c.check_in_date < m.month_start + interval '1 month'
          )::numeric / v_athlete_count::numeric
        )
      end as compliance_pct
    from (
      select generate_series(
        date_trunc('month', current_date) - interval '5 months',
        date_trunc('month', current_date),
        interval '1 month'
      )::date as month_start
    ) m
    order by m.month_start
  ) month_row;

  v_result := jsonb_build_object(
    'club', jsonb_build_object('id', v_club.id, 'name', v_club.name),
    'totals', jsonb_build_object(
      'teams', v_team_count,
      'athletes', v_athlete_count,
      'compliance_pct', case when v_athlete_count = 0 then 0 else round(100.0 * v_checked_in / v_athlete_count) end,
      'avg_mental', coalesce(v_avg_mental, 0),
      'avg_wellbeing', coalesce(v_avg_wellbeing, 0),
      'avg_social', coalesce(v_avg_social, 0),
      'appointments_completed', v_appointments_completed,
      'alerts_resolved', v_alerts_resolved,
      'check_ins_this_month', v_check_ins_month
    ),
    'teams', v_teams,
    'monthly_trend', v_monthly
  );

  return v_result;
end;
$$;

grant execute on function public.get_director_club_snapshot(uuid) to authenticated;

notify pgrst, 'reload schema';
