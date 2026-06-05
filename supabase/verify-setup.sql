-- Executa això al SQL Editor per comprovar que tot està bé
-- Cada consulta ha de retornar resultats sense error

-- 1) Taules principals
select 'profiles' as item, count(*)::text as detail from public.profiles
union all
select 'teams', count(*)::text from public.teams
union all
select 'check_ins', count(*)::text from public.check_ins
union all
select 'coach_invites', count(*)::text from public.coach_invites
union all
select 'athlete_initial_assessments', count(*)::text from public.athlete_initial_assessments;

-- 2) Columnes crítiques a profiles (ha de retornar 1 fila sense error)
select
  column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in (
    'approved',
    'is_rejected',
    'date_of_birth',
    'initial_assessment_completed_at',
    'team_id',
    'role'
  )
order by column_name;

-- 3) Funcions RPC
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'ensure_my_profile',
    'validate_coach_invite',
    'consume_coach_invite',
    'approve_coach',
    'reject_coach',
    'auth_user_role',
    'auth_user_is_approved_coach'
  )
order by routine_name;

-- 4) RLS activat
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'teams', 'check_ins', 'coach_invites', 'athlete_initial_assessments');

-- 5) Usuaris per rol
select role, approved, count(*) as total
from public.profiles
group by role, approved
order by role, approved;

-- 6) Categories / equips
select name from public.teams order by name;
