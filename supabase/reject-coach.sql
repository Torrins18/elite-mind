-- Rebutjar sol·licituds d'entrenador — executar després de coach-invites.sql

alter table public.profiles
  add column if not exists is_rejected boolean not null default false;

create or replace function public.reject_coach(coach_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.auth_user_role() <> 'psychologist' then
    raise exception 'Not authorized';
  end if;

  update public.profiles
  set is_rejected = true, approved = false
  where id = coach_profile_id
    and role = 'coach'
    and approved = false
    and is_rejected = false;
end;
$$;

grant execute on function public.reject_coach(uuid) to authenticated;
