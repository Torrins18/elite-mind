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

| Email | Contrasenya | Rol |
|-------|-------------|-----|
| `provaesportista1@zonamental.app` … `5` | `TestAthlete2026!` | athlete |
| `provapsicoleg@zonamental.app` | `TestAthlete2026!` | psychologist |
| `provaentrenador@zonamental.app` | `TestAthlete2026!` | coach |

Si ja existeixen, l'script els **reutilitza** (confirma email, marca flag i
sincronitza la contrasenya de desenvolupament).

## Inici de sessió ràpid (només `npm run dev`)

A la pantalla de login apareix **🧪 Entrar com a…** quan `import.meta.env.DEV`
és cert. En producció (`vite build` / Vercel) el menú **no es carrega** i les
credencials no entren al bundle principal.

Fitxers aïllats (fàcils d'eliminar abans del llançament):

- `src/components/dev/DevQuickLogin.jsx`
- `src/lib/devQuickLogin.js`
- `src/lib/devTestAthletes.js`

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

select public.dev_ensure_demo_user(
  'altre@zonamental.app',
  'TestAthlete2026!',
  'Coach Extra',
  'coach'
);
```

## Eliminar abans del llançament

1. Esborra usuaris de prova a Authentication (o SQL `auth.users`).
2. Elimina `dev-test-athletes.sql`, `dev-demo-roles.sql`, Edge Function
   `create-test-athlete`, `src/lib/devTestAthletes.js`, `src/lib/devQuickLogin.js`,
   `src/components/dev/` i la columna `profiles.is_test_athlete` si ja no cal.
3. Treu el bloc `DevQuickLogin` de `LoginPage.jsx`.
