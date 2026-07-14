# Configuració Supabase — ordre d'execució

Si la pàgina no carrega o falten funcions, executa **tot** això al **SQL Editor** de Supabase, **en aquest ordre**:

| # | Fitxer |
|---|--------|
| 1 | `schema.sql` |
| 2 | `fix-profiles.sql` |
| 3 | `seed-categories.sql` |
| 4 | `coach-invites.sql` |
| 5 | `reject-coach.sql` |
| 6 | `privacy-onboarding.sql` |
| 7 | `initial-assessment.sql` |
| 8 | `teams-management.sql` (opcional) |
| 9 | `team-join-links.sql` (enllaç d'inscripció per equip) |
| 10 | `extended-checkins.sql` (si existeix) |
| 11 | `weekly-eor-checkins.sql` (revisió setmanal EOR) |
| 12 | `check-ins-nullable-daily.sql` (EOR setmanal sense estat diari obligatori) |
| 13 | `psychologist-alerts-soft-delete.sql` (alertes persistents + soft delete equips) |
| 14 | `psychologist-notes.sql` (notes clíniques privades del psicòleg) |
| 15 | `intervention-plans.sql` (objectius, plans d'acció i biblioteca de recursos) |
| 16 | `clubs-management.sql` (clubs, director de club, informes agregats) |
| 17 | `clinical-sessions-documents.sql` (sessions clíniques + documents privats) |
| 18 | `communication-compliance.sql` (missatgeria bidireccional + cites programades) |
| 19 | `seed-demo.sql` (opcional) |

Després de cada fitxer ha de sortir **Success**.

**Rutina esportista (pilot):** 1-2 autoavaluacions per setmana (no cal diari).

## Comprovar

A **Table Editor** hauries de veure:

- `profiles` (amb columnes `approved`, `date_of_birth`, `initial_assessment_completed_at`…)
- `teams`, `check_ins`, `coach_invites`, `athlete_initial_assessments`

## Vercel

A Vercel → Settings → Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Després **Redeploy**. Guia completa de pilot: `PILOT-CHECKLIST.md` a l'arrel del projecte.

## Edge Functions (resums IA)

Per resums IA d'equip/club i esportista, desplega les funcions:

```bash
supabase functions deploy generate-athlete-insight
supabase functions deploy generate-team-insight
```

Secrets opcionals (Dashboard → Edge Functions → Secrets):

- `OPENAI_API_KEY` — activa resums IA (sense clau, usa síntesi local)
- `OPENAI_MODEL` — per defecte `gpt-4o-mini`
