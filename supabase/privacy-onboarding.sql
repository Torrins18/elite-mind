-- Add athlete privacy onboarding fields.
-- Run this in Supabase SQL Editor before enabling the birth-date gate in production.

alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists is_adult boolean,
  add column if not exists guardian_full_name text,
  add column if not exists guardian_relationship text,
  add column if not exists guardian_email text,
  add column if not exists guardian_phone text,
  add column if not exists guardian_signature text,
  add column if not exists guardian_consent_text_version text,
  add column if not exists guardian_consent_user_agent text,
  add column if not exists guardian_consent_ip_address text,
  add column if not exists guardian_consent_signed_at timestamptz;

comment on column public.profiles.date_of_birth is
  'Date of birth supplied by the athlete for age-of-majority checks.';

comment on column public.profiles.is_adult is
  'Whether the athlete is at least 18 years old under Spanish age-of-majority rules at the time of onboarding.';

comment on column public.profiles.guardian_full_name is
  'Full name used by the legal guardian to sign consent for a minor athlete.';

comment on column public.profiles.guardian_relationship is
  'Relationship of the legal guardian to the minor athlete.';

comment on column public.profiles.guardian_email is
  'Contact email for the legal guardian who signs consent.';

comment on column public.profiles.guardian_phone is
  'Contact phone for the legal guardian who signs consent.';

comment on column public.profiles.guardian_signature is
  'Typed legal signature supplied by the guardian.';

comment on column public.profiles.guardian_consent_text_version is
  'Version identifier for the consent text accepted by the guardian.';

comment on column public.profiles.guardian_consent_user_agent is
  'Browser user agent captured when guardian consent is signed.';

comment on column public.profiles.guardian_consent_ip_address is
  'IP address captured when guardian consent is signed, if available.';

comment on column public.profiles.guardian_consent_signed_at is
  'Timestamp when the legal guardian consent was signed in the app.';
