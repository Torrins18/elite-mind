# Email d'avís per a nous entrenadors

Quan un entrenador/a es registra, l'app crida la funció:

`notify-coach-registration`

La funció envia un email al psicòleg perquè validi el compte, l'assigni a un equip i l'aprovi des del panell.

## Secrets necessaris a Supabase

A Supabase, ves a:

`Edge Functions` -> `Secrets`

I afegeix:

```txt
RESEND_API_KEY=la_teva_clau_de_resend
PSYCHOLOGIST_EMAIL=psicologiaesportiva.aleixtorra@gmail.com
ELITE_MIND_FROM_EMAIL=Elite Mind <avisos@elteudomini.com>
APP_URL=https://la-teva-app.vercel.app
```

`PSYCHOLOGIST_EMAIL` ja queda configurat per defecte a la funció com `psicologiaesportiva.aleixtorra@gmail.com`.

`ELITE_MIND_FROM_EMAIL` i `APP_URL` són opcionals, però recomanables.

## Desplegar la funció

Amb Supabase CLI:

```bash
supabase functions deploy notify-coach-registration
```

Si fas el desplegament des del dashboard, crea una Edge Function amb el contingut de:

`supabase/functions/notify-coach-registration/index.ts`
