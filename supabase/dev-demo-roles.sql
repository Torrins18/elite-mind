-- TEMPORARY (development only)
-- Aquesta és una solució temporal per facilitar les proves internes durant el desenvolupament.
-- Abans del llançament s'haurà de revisar el flux definitiu d'autenticació dels esportistes.
--
-- Extén el helper de proves per crear psicòleg/entrenador demo amb email confirmat.
-- Run after supabase/dev-test-athletes.sql

-- Bypass temporal: comptes demo (is_dev_demo) poden ser coach sense invitació
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
  test_athlete boolean := false;
  is_dev_demo boolean := false;
begin
  meta_role := coalesce(new.raw_user_meta_data->>'role', 'athlete');
  is_coach := meta_role = 'coach';
  is_dev_demo := coalesce((new.raw_user_meta_data->>'is_dev_demo')::boolean, false);

  if is_coach and not is_dev_demo then
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
  elsif not is_coach then
    test_athlete := coalesce(
      (new.raw_user_meta_data->>'is_test_athlete')::boolean,
      (new.raw_user_meta_data->>'isTestAthlete')::boolean,
      false
    );
  end if;

  insert into public.profiles (id, name, role, approved, is_test_athlete)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case
      when is_coach then 'coach'
      when meta_role = 'psychologist' then 'psychologist'
      else 'athlete'
    end,
    case
      when is_coach and not is_dev_demo then false
      else true
    end,
    test_athlete
  )
  on conflict (id) do update
    set
      is_test_athlete = excluded.is_test_athlete,
      role = excluded.role,
      approved = excluded.approved,
      name = excluded.name
    where public.profiles.is_test_athlete is distinct from excluded.is_test_athlete
       or public.profiles.role is distinct from excluded.role
       or public.profiles.approved is distinct from excluded.approved
       or public.profiles.name is distinct from excluded.name;

  return new;
end;
$$;

create or replace function public.dev_ensure_demo_user(
  p_email text,
  p_password text,
  p_name text default null,
  p_role text default 'athlete'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(p_email));
  v_name text := coalesce(nullif(trim(p_name), ''), split_part(lower(trim(p_email)), '@', 1));
  v_role text := lower(trim(coalesce(p_role, 'athlete')));
  v_user_id uuid;
  v_encrypted text;
  v_is_test_athlete boolean;
  v_approved boolean;
begin
  /*
    Aquesta és una solució temporal per facilitar les proves internes durant el desenvolupament.
    Abans del llançament s'haurà de revisar el flux definitiu d'autenticació dels esportistes.

    Aquests comptes només existeixen per facilitar les proves internes i es podran
    eliminar o substituir abans del llançament oficial de la plataforma.
  */

  if v_email is null or v_email = '' then
    raise exception 'dev_ensure_demo_user: email required';
  end if;

  if p_password is null or length(p_password) < 8 then
    raise exception 'dev_ensure_demo_user: password must be at least 8 characters';
  end if;

  if v_role not in ('athlete', 'coach', 'psychologist') then
    raise exception 'dev_ensure_demo_user: role must be athlete, coach or psychologist';
  end if;

  if v_email not like '%@zonamental.app'
     and v_email not like '%.test'
     and v_email not like '%+test@%' then
    raise exception 'dev_ensure_demo_user: email must be @zonamental.app (or .test / +test@) during development';
  end if;

  v_is_test_athlete := v_role = 'athlete';
  v_approved := true;

  select id into v_user_id
  from auth.users
  where lower(email) = v_email
  limit 1;

  v_encrypted := crypt(p_password, gen_salt('bf'));

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      email_change_token_current,
      reauthentication_token,
      is_sso_user,
      is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      v_encrypted,
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object(
        'role', v_role,
        'name', v_name,
        'is_test_athlete', v_is_test_athlete,
        'isTestAthlete', v_is_test_athlete,
        'is_dev_demo', true
      ),
      now(),
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      false,
      false
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  else
    update auth.users
    set
      encrypted_password = v_encrypted,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object(
          'role', v_role,
          'name', v_name,
          'is_test_athlete', v_is_test_athlete,
          'isTestAthlete', v_is_test_athlete,
          'is_dev_demo', true
        ),
      updated_at = now()
    where id = v_user_id;

    if not exists (
      select 1 from auth.identities
      where user_id = v_user_id and provider = 'email'
    ) then
      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) values (
        gen_random_uuid(),
        v_user_id,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', v_email,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        v_user_id::text,
        now(),
        now(),
        now()
      );
    end if;
  end if;

  insert into public.profiles (id, name, role, approved, is_test_athlete)
  values (v_user_id, v_name, v_role, v_approved, v_is_test_athlete)
  on conflict (id) do update
    set
      name = excluded.name,
      role = excluded.role,
      approved = excluded.approved,
      is_test_athlete = excluded.is_test_athlete;

  return v_user_id;
end;
$$;

revoke all on function public.dev_ensure_demo_user(text, text, text, text) from public;
revoke all on function public.dev_ensure_demo_user(text, text, text, text) from anon, authenticated;
grant execute on function public.dev_ensure_demo_user(text, text, text, text) to service_role;

-- Psicòleg / entrenador demo per a l'inici de sessió ràpid
select public.dev_ensure_demo_user(
  'provapsicoleg@zonamental.app',
  'TestAthlete2026!',
  'Psicòleg Demo',
  'psychologist'
);

select public.dev_ensure_demo_user(
  'provaentrenador@zonamental.app',
  'TestAthlete2026!',
  'Entrenador Demo',
  'coach'
);

notify pgrst, 'reload schema';
