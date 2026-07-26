-- Coach registration requires a valid invite token (backend enforcement)
-- Run after coach-invites.sql

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
  is_coach boolean;
  invite_token_text text;
  invite_token uuid;
  invite_ok boolean := false;
begin
  meta_role := coalesce(new.raw_user_meta_data->>'role', 'athlete');
  is_coach := meta_role = 'coach';

  if is_coach then
    invite_token_text := new.raw_user_meta_data->>'coach_invite_token';
    if invite_token_text is null or invite_token_text = '' then
      raise exception 'Coach registration requires a valid invitation link';
    end if;

    begin
      invite_token := invite_token_text::uuid;
    exception
      when others then
        raise exception 'Coach registration requires a valid invitation link';
    end;

    select exists (
      select 1
      from public.coach_invites
      where token = invite_token
        and used_at is null
        and expires_at > now()
    ) into invite_ok;

    if not invite_ok then
      raise exception 'Coach registration requires a valid invitation link';
    end if;
  end if;

  insert into public.profiles (id, name, role, approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when is_coach then 'coach' else 'athlete' end,
    not is_coach
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

notify pgrst, 'reload schema';
