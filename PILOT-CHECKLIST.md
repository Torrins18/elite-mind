# Checklist pilot — Elite Mind

## 1. Supabase (projecte pilot)

Executa **en ordre** al SQL Editor de [Supabase](https://supabase.com/dashboard) → projecte `elite-mind` (`wdibvfgvgmpgorzaraud`):

| # | Fitxer |
|---|--------|
| 1 | `supabase/schema.sql` |
| 2 | `supabase/fix-profiles.sql` |
| 3 | `supabase/privacy-onboarding.sql` |
| 4 | `supabase/initial-assessment.sql` |
| 5 | `supabase/extended-checkins.sql` |
| 6 | `supabase/coach-invites.sql` |
| 7 | `supabase/seed-categories.sql` (opcional) |

Comprova:

```powershell
node scripts/verify-supabase.mjs
```

Tots els checks han de sortir `"ok": true`.

### Auth (producció) — **OBLIGATORI abans del reset de contrasenya**

A [Supabase → Auth → URL Configuration](https://supabase.com/dashboard/project/wdibvfgvgmpgorzaraud/auth/url-configuration):

| Camp | Valor |
|------|--------|
| **Site URL** | `https://elite-mind.vercel.app` |
| **Redirect URLs** | `https://elite-mind.vercel.app/**` |

Si **Site URL** és `http://localhost:3000`, l'enllaç del correu de recuperació obrirà localhost i fallarà.

Després **Redeploy** a Vercel (si cal) i prova de nou «He olvidado la contraseña».

---

## 2. Vercel

Variables d'entorn (Settings → Environment Variables):

- `VITE_SUPABASE_URL` = `https://wdibvfgvgmpgorzaraud.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = clau **anon** de Supabase

Desplegament:

```powershell
cd "C:\Users\acer\OneDrive\Escritorio\MentalPerformanceApp"
npm run build
npx vercel --prod
```

Després del deploy: **Ctrl+Shift+R** al navegador (evita còpia en cache).

---

## 3. Prova punta a punta (3 rols)

### Esportista
- [ ] Registre / login
- [ ] Onboarding (edat, equip si cal)
- [ ] Avaluació inicial
- [ ] **1-2 autoavaluacions/setmana** (pols mental; reflexió setmanal quan toqui)
- [ ] Notes personals només visibles per psicòleg

### Entrenador/a
- [ ] Login després d'aprovació del psicòleg
- [ ] Panell només **resum agregat** (sense noms amb mètriques individuals)
- [ ] Gràfic d'equip i compliment setmanal

### Psicòleg/òloga
- [ ] Vista de tots els esportistes + lectura individual IA
- [ ] Semàfor d'alertes + notes privades
- [ ] Export CSV
- [ ] Invitació i aprovació d'entrenadors

### Menors
- [ ] Flux consentiment tutor abans d'ús complet
- [ ] Text de privacitat visible al peu de l'app

---

## 4. Pilot real (2-4 setmanes)

- 1 psicòleg + 1 entrenador + 8-15 esportistes, **un equip**
- Objectiu: **≥70%** amb almenys **1 registre/setmana** (ideal 2)
- Reunió setmanal breu per ajustar preguntes

---

## Rutina comunicada als esportistes

> «Fes la autoavaluació **1 o 2 cops per setmana** (2 minuts). Si és el primer registre de la setmana, també sortiran unes preguntes una mica més ampleres.»
