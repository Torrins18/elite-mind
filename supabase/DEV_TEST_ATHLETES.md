# TEMPORARY — Esportistes de prova (desenvolupament)

Aquesta és una solució temporal per facilitar les proves internes durant el
desenvolupament. Abans del llançament s'haurà de revisar el flux definitiu
d'autenticació dels esportistes.

Aquests comptes només existeixen per facilitar les proves internes i es podran
eliminar o substituir abans del llançament oficial de la plataforma.

## Com funciona

- Els usuaris **reals** continuen passant per `auth.signUp` + verificació d'email
  (si està activada al projecte).
- Els esportistes de prova es creen amb **Admin API / SQL** amb `email_confirm`
  / `email_confirmed_at`, **sense** enviar correu.
- Queden marcats amb `profiles.is_test_athlete = true`.

## Activar

1. Executa `supabase/dev-test-athletes.sql` al SQL Editor (o aplica la migració).
2. (Opcional) Desplega l'Edge Function `create-test-athlete` per crear-ne més
   des de l'app (psicòleg / platform admin).

## Comptes de prova

| Email | Contrasenya |
|-------|-------------|
| `provaesportista1@zonamental.app` | `TestAthlete2026!` |
| `provaesportista2@zonamental.app` | `TestAthlete2026!` |
| `provaesportista3@zonamental.app` | `TestAthlete2026!` |
| `provaesportista4@zonamental.app` | `TestAthlete2026!` |
| `provaesportista5@zonamental.app` | `TestAthlete2026!` |

Si ja existeixen, l'script els **reutilitza** (confirma email, marca flag i
sincronitza la contrasenya de desenvolupament).

## Crear-ne més

```js
import { createTestAthlete } from "./lib/devTestAthletes"

await createTestAthlete({
  email: "nou+test@zonamental.app",
  name: "Prova Extra",
  // isTestAthlete s'envia sempre com a true
})
```

O via SQL (service_role / SQL Editor):

```sql
select public.dev_ensure_test_athlete(
  'extra@zonamental.app',
  'TestAthlete2026!',
  'Prova Extra'
);
```

## Eliminar abans del llançament

1. Esborra usuaris de prova a Authentication (o SQL `auth.users`).
2. Elimina `dev-test-athletes.sql`, Edge Function `create-test-athlete`,
   `src/lib/devTestAthletes.js` i la columna `profiles.is_test_athlete` si ja
   no cal.
