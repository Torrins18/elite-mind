-- Product Analytics — internal platform KPIs (admin only)
-- Run in Supabase SQL Editor after clubs-management.sql

alter table public.profiles
  add column if not exists is_platform_admin boolean not null default false;

create index if not exists profiles_platform_admin_idx
  on public.profiles (is_platform_admin)
  where is_platform_admin = true;

-- Anonymous product usage events (no psychological data, no user_id)
create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_category text not null,
  user_role text,
  club_id uuid references public.clubs (id) on delete set null,
  team_id uuid references public.teams (id) on delete set null,
  session_id uuid,
  properties jsonb not null default '{}'::jsonb,
  experiment_id text,
  variant text,
  created_at timestamptz not null default now()
);

create index if not exists product_events_created_idx
  on public.product_events (created_at desc);

create index if not exists product_events_name_created_idx
  on public.product_events (event_name, created_at desc);

create index if not exists product_events_category_created_idx
  on public.product_events (event_category, created_at desc);

alter table public.product_events enable row level security;

drop policy if exists "Authenticated insert product_events" on public.product_events;
create policy "Authenticated insert product_events"
  on public.product_events for insert
  to authenticated
  with check (true);

-- No direct SELECT for regular users; admins read via RPC only.

create or replace function public.auth_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_platform_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.auth_is_platform_admin() to authenticated;

create or replace function public.check_in_has_weekly_eor(p_row public.check_ins)
returns boolean
language sql
immutable
as $$
  select
    p_row.performance_rating is not null
    or p_row.involvement_rating is not null
    or p_row.effort_rating is not null
    or p_row.confidence_rating is not null
    or p_row.weekly_went_well is not null
    or p_row.weekly_main_difficulty is not null
    or p_row.next_goal is not null;
$$;

create or replace function public.week_start_sunday(p_date date)
returns date
language sql
immutable
as $$
  select p_date - extract(dow from p_date)::int;
$$;

-- Aggregated product analytics snapshot (platform admin only)
create or replace function public.get_product_analytics_snapshot(p_weeks int default 12)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_weeks int := greatest(1, least(coalesce(p_weeks, 12), 52));
  v_since date := current_date - (v_weeks * 7);
  v_result jsonb;
begin
  if not public.auth_is_platform_admin() then
    raise exception 'forbidden';
  end if;

  with athlete_base as (
    select p.id, p.team_id, t.club_id
    from public.profiles p
    left join public.teams t on t.id = p.team_id and t.deleted_at is null
    where p.role = 'athlete'
  ),
  weekly_reviews as (
    select
      ci.id,
      ci.athlete_id,
      ci.check_in_date,
      public.week_start_sunday(ci.check_in_date) as week_start,
      ab.team_id,
      ab.club_id
    from public.check_ins ci
    join athlete_base ab on ab.id = ci.athlete_id
    where public.check_in_has_weekly_eor(ci)
      and ci.check_in_date >= v_since
  ),
  week_series as (
    select generate_series(
      public.week_start_sunday(current_date) - ((v_weeks - 1) * 7),
      public.week_start_sunday(current_date),
      interval '7 days'
    )::date as week_start
  ),
  athletes_per_week as (
    select
      ws.week_start,
      (select count(*) from athlete_base ab
        where ab.id in (
          select id from public.profiles
          where role = 'athlete'
            and created_at::date <= ws.week_start + 6
        )
      ) as athlete_count
    from week_series ws
  ),
  completion_by_week as (
    select
      ws.week_start,
      coalesce(apw.athlete_count, 0) as athletes,
      count(distinct wr.athlete_id) as completed
    from week_series ws
    left join athletes_per_week apw on apw.week_start = ws.week_start
    left join weekly_reviews wr on wr.week_start = ws.week_start
    group by ws.week_start, apw.athlete_count
  ),
  completion_trend as (
    select jsonb_agg(
      jsonb_build_object(
        'week_start', week_start,
        'athletes', athletes,
        'completed', completed,
        'rate_pct', case when athletes > 0 then round((completed::numeric / athletes) * 100, 1) else 0 end
      )
      order by week_start
    ) as data
    from completion_by_week
  ),
  completion_by_club as (
    select
      c.id as club_id,
      c.name as club_name,
      count(distinct ab.id) as athletes,
      count(distinct wr.athlete_id) as completed
    from public.clubs c
    left join athlete_base ab on ab.club_id = c.id
    left join weekly_reviews wr on wr.athlete_id = ab.id
      and wr.week_start = public.week_start_sunday(current_date)
    where c.deleted_at is null
    group by c.id, c.name
  ),
  completion_by_team as (
    select
      t.id as team_id,
      t.name as team_name,
      c.name as club_name,
      count(distinct ab.id) as athletes,
      count(distinct wr.athlete_id) as completed
    from public.teams t
    left join public.clubs c on c.id = t.club_id
    left join athlete_base ab on ab.team_id = t.id
    left join weekly_reviews wr on wr.athlete_id = ab.id
      and wr.week_start = public.week_start_sunday(current_date)
    where t.deleted_at is null
    group by t.id, t.name, c.name
  ),
  platform_counts as (
    select
      (select count(*) from public.clubs where deleted_at is null) as active_clubs,
      (select count(*) from public.teams where deleted_at is null) as active_teams,
      (select count(*) from public.profiles where role = 'athlete') as total_athletes,
      (select count(*) from public.profiles where role = 'psychologist') as total_psychologists,
      (select count(*) from public.profiles where role = 'coach' and approved = true) as total_coaches
  ),
  appointments as (
    select
      count(*) filter (where status = 'pending') as pending,
      count(*) filter (where status = 'scheduled') as scheduled,
      count(*) filter (where status = 'completed') as completed,
      count(*) filter (where status = 'cancelled') as cancelled,
      count(*) as total
    from public.appointment_requests
    where created_at >= v_since::timestamptz
  ),
  messages as (
    select
      count(*) as total,
      count(*) filter (where sender_role = 'athlete') as from_athletes,
      count(*) filter (where sender_role = 'psychologist') as from_psychologists,
      count(*) filter (where status = 'unread') as unread
    from public.psychologist_messages
    where created_at >= v_since::timestamptz
  ),
  alerts as (
    select
      count(*) as generated,
      count(*) filter (where status in ('reviewed', 'dismissed')) as resolved,
      count(*) filter (where status = 'active') as active
    from public.psychologist_alerts
    where created_at >= v_since::timestamptz
  ),
  priority_reviews as (
    select count(*) as reviewed
    from public.priority_states
    where status in ('reviewed', 'resolved')
      and updated_at >= v_since::timestamptz
  ),
  notes_count as (
    select count(*) as total
    from public.psychologist_notes
    where created_at >= v_since::timestamptz
  ),
  coach_recs as (
    select count(*) as shared
    from public.coach_recommendations
    where shared_at >= v_since::timestamptz
  ),
  event_agg as (
    select
      event_name,
      event_category,
      count(*) as count
    from public.product_events
    where created_at >= v_since::timestamptz
    group by event_name, event_category
  ),
  mental_training as (
    select
      count(*) filter (where event_name = 'mental_training_shown') as shown,
      count(*) filter (where event_name = 'mental_training_read') as read,
      count(*) filter (where event_name = 'mental_training_dismissed') as dismissed
    from public.product_events
    where event_category = 'mental_training'
      and created_at >= v_since::timestamptz
  ),
  review_timing as (
    select
      percentile_cont(0.5) within group (
        order by nullif((properties->>'duration_ms')::numeric, 0)
      ) as median_ms,
      avg(nullif((properties->>'duration_ms')::numeric, 0)) as avg_ms,
      min(nullif((properties->>'duration_ms')::numeric, 0)) as min_ms,
      max(nullif((properties->>'duration_ms')::numeric, 0)) as max_ms,
      count(*) filter (where event_name = 'review_completed') as completed,
      count(*) filter (where event_name = 'review_abandoned') as abandoned
    from public.product_events
    where event_category = 'weekly_review'
      and created_at >= v_since::timestamptz
  ),
  feature_adoption as (
    select jsonb_object_agg(event_name, count) as data
    from (
      select event_name, sum(count)::int as count
      from event_agg
      where event_category in ('feature', 'navigation', 'weekly_review', 'mental_training', 'export')
      group by event_name
    ) s
  ),
  page_views as (
    select jsonb_agg(
      jsonb_build_object('page', event_name, 'views', count)
      order by count desc
    ) as data
    from event_agg
    where event_category = 'navigation'
  ),
  current_week_completion as (
    select
      case when sum(athletes) > 0
        then round((sum(completed)::numeric / sum(athletes)) * 100, 1)
        else 0
      end as rate_pct
    from completion_by_week
    where week_start = public.week_start_sunday(current_date)
  ),
  -- Activity proxies from anonymous product events + completed weekly reviews (no user ids exposed)
  athlete_activity as (
    select
      (
        select count(distinct session_id)
        from public.product_events
        where user_role = 'athlete'
          and session_id is not null
          and created_at::date = current_date
      ) as dau_sessions,
      (
        select count(distinct session_id)
        from public.product_events
        where user_role = 'athlete'
          and session_id is not null
          and created_at >= (current_date - 7)::timestamptz
      ) as wau_sessions,
      (
        select count(distinct session_id)
        from public.product_events
        where user_role = 'athlete'
          and session_id is not null
          and created_at >= (current_date - 30)::timestamptz
      ) as mau_sessions,
      (select count(*) from weekly_reviews) as completed_reviews,
      (
        select greatest(
          0,
          (select count(*) from athlete_base) * v_weeks
            - (select count(distinct (athlete_id, week_start)) from weekly_reviews)
        )
      ) as skipped_weeks_est
  ),
  weekly_retention as (
    select
      case when prev.active > 0
        then round((ret.retained::numeric / prev.active) * 100, 1)
        else 0
      end as return_next_week_pct,
      case when (select count(*) from athlete_base) > 0
        then round((miss.missed_two::numeric / (select count(*) from athlete_base)) * 100, 1)
        else 0
      end as missed_two_weeks_pct
    from (
      select count(distinct athlete_id) as active
      from weekly_reviews
      where week_start = public.week_start_sunday(current_date) - 7
    ) prev
    cross join (
      select count(distinct wr1.athlete_id) as retained
      from weekly_reviews wr1
      join weekly_reviews wr2
        on wr2.athlete_id = wr1.athlete_id
       and wr2.week_start = public.week_start_sunday(current_date)
      where wr1.week_start = public.week_start_sunday(current_date) - 7
    ) ret
    cross join (
      select count(*) as missed_two
      from athlete_base ab
      where not exists (
        select 1 from weekly_reviews wr
        where wr.athlete_id = ab.id
          and wr.week_start >= public.week_start_sunday(current_date) - 7
      )
      and exists (
        select 1 from weekly_reviews wr
        where wr.athlete_id = ab.id
          and wr.week_start < public.week_start_sunday(current_date) - 7
      )
    ) miss
  ),
  growth as (
    select
      (select count(*) from public.profiles where role = 'athlete' and created_at >= (current_date - 7)::timestamptz) as athletes_7d,
      (select count(*) from public.profiles where role = 'athlete' and created_at >= (current_date - 30)::timestamptz) as athletes_30d,
      (select count(*) from public.clubs where deleted_at is null and created_at >= (current_date - 7)::timestamptz) as clubs_7d,
      (select count(*) from public.clubs where deleted_at is null and created_at >= (current_date - 30)::timestamptz) as clubs_30d,
      (select count(*) from public.teams where deleted_at is null and created_at >= (current_date - 7)::timestamptz) as teams_7d,
      (select count(*) from public.teams where deleted_at is null and created_at >= (current_date - 30)::timestamptz) as teams_30d
  ),
  role_sessions as (
    select
      count(*) filter (where user_role = 'psychologist' and event_category = 'navigation') as psych_page_views,
      count(*) filter (where user_role = 'coach' and event_category = 'navigation') as coach_page_views,
      count(distinct session_id) filter (where user_role = 'psychologist' and created_at >= (current_date - 7)::timestamptz) as psych_wau_sessions,
      count(distinct session_id) filter (where user_role = 'coach' and created_at >= (current_date - 7)::timestamptz) as coach_wau_sessions
    from public.product_events
    where created_at >= v_since::timestamptz
  ),
  mt_topics as (
    select jsonb_agg(
      jsonb_build_object('topic', topic, 'views', views)
      order by views desc
    ) as data
    from (
      select coalesce(properties->>'topic', 'unknown') as topic, count(*) as views
      from public.product_events
      where event_name = 'mental_training_shown'
        and created_at >= v_since::timestamptz
      group by 1
      order by 2 desc
      limit 8
    ) t
  ),
  avg_abandon_step as (
    select round(avg(nullif((properties->>'step')::numeric, 0)), 1) as avg_step
    from public.product_events
    where event_name = 'review_abandoned'
      and created_at >= v_since::timestamptz
  )
  select jsonb_build_object(
    'generated_at', now(),
    'weeks', v_weeks,
    'platform', (select to_jsonb(pc.*) || jsonb_build_object(
      'growth', (select to_jsonb(g.*) from growth g)
    ) from platform_counts pc),
    'engagement', jsonb_build_object(
      'current_week_completion_pct', (select rate_pct from current_week_completion),
      'completion_trend', coalesce((select data from completion_trend), '[]'::jsonb),
      'by_club', coalesce((
        select jsonb_agg(jsonb_build_object(
          'club_id', club_id, 'club_name', club_name,
          'athletes', athletes, 'completed', completed,
          'rate_pct', case when athletes > 0 then round((completed::numeric / athletes) * 100, 1) else 0 end
        )) from completion_by_club
      ), '[]'::jsonb),
      'by_team', coalesce((
        select jsonb_agg(jsonb_build_object(
          'team_id', team_id, 'team_name', team_name, 'club_name', club_name,
          'athletes', athletes, 'completed', completed,
          'rate_pct', case when athletes > 0 then round((completed::numeric / athletes) * 100, 1) else 0 end
        )) from completion_by_team
      ), '[]'::jsonb)
    ),
    'athlete_activity', (select to_jsonb(aa.*) from athlete_activity aa),
    'retention', (select to_jsonb(wr.*) from weekly_retention wr),
    'review_completion', (
      select jsonb_build_object(
        'median_ms', median_ms,
        'avg_ms', avg_ms,
        'min_ms', min_ms,
        'max_ms', max_ms,
        'completed_events', completed,
        'abandoned_events', abandoned,
        'abandonment_rate_pct', case when (completed + abandoned) > 0
          then round((abandoned::numeric / (completed + abandoned)) * 100, 1) else 0 end,
        'avg_abandon_step', (select avg_step from avg_abandon_step)
      ) from review_timing
    ),
    'appointments', (select to_jsonb(a.*) from appointments a),
    'messages', (select to_jsonb(m.*) from messages m),
    'alerts', jsonb_build_object(
      'generated', (select generated from alerts),
      'resolved', (select resolved from alerts),
      'active', (select active from alerts),
      'priorities_reviewed', (select reviewed from priority_reviews)
    ),
    'psychologist_activity', jsonb_build_object(
      'notes_created', (select total from notes_count),
      'page_views', (select psych_page_views from role_sessions),
      'wau_sessions', (select psych_wau_sessions from role_sessions)
    ),
    'coach_activity', jsonb_build_object(
      'recommendations_shared', (select shared from coach_recs),
      'page_views', (select coach_page_views from role_sessions),
      'wau_sessions', (select coach_wau_sessions from role_sessions)
    ),
    'mental_training', (
      select to_jsonb(mt.*) || jsonb_build_object(
        'top_topics', coalesce((select data from mt_topics), '[]'::jsonb)
      ) from mental_training mt
    ),
    'feature_adoption', coalesce((select data from feature_adoption), '{}'::jsonb),
    'page_views', coalesce((select data from page_views), '[]'::jsonb),
    'event_totals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'event_name', event_name, 'category', event_category, 'count', count
      ) order by count desc)
      from event_agg
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_product_analytics_snapshot(int) to authenticated;

notify pgrst, 'reload schema';
