# Desplegar Elite Mind en Vercel

## Antes de empezar

1. El build funciona: `npm run build`
2. Tienes cuenta en [vercel.com](https://vercel.com) (puedes entrar con GitHub)
3. Tienes la URL y la clave de Supabase (Dashboard → Settings → API)

---

## Opción A — Desde la web (recomendada)

### 1. Subir el código a GitHub

Si no tienes Git instalado, instálalo desde [git-scm.com](https://git-scm.com) o sube la carpeta manualmente:

1. [github.com/new](https://github.com/new) → crea un repositorio vacío (ej. `elite-mind`)
2. En GitHub: **Add file → Upload files** y arrastra la carpeta del proyecto  
   (no subas `node_modules` ni `.env`)

O con Git en terminal:

```powershell
cd "C:\Users\acer\OneDrive\Escritorio\MentalPerformanceApp"
git init
git add .
git commit -m "Initial commit - Elite Mind"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/elite-mind.git
git push -u origin main
```

### 2. Importar en Vercel

1. Entra en [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → elige tu repo
3. Framework: **Vite** (se detecta solo)
4. **Environment Variables** → añade:

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://wdibvfgvgmpgorzaraud.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | tu clave anon de Supabase |

5. Clic en **Deploy**

En 1–2 minutos tendrás una URL tipo: `https://elite-mind-xxx.vercel.app`

---

## Opción B — CLI (sin GitHub)

```powershell
cd "C:\Users\acer\OneDrive\Escritorio\MentalPerformanceApp"
npx vercel login
npx vercel
```

Cuando pregunte las variables de entorno, añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

Para producción:

```powershell
npx vercel --prod
```

---

## Después del deploy — Supabase (importante)

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL**: tu URL de Vercel (ej. `https://elite-mind-xxx.vercel.app`)
3. **Redirect URLs**: añade la misma URL y `https://tu-dominio.vercel.app/**`

Así el login y los enlaces de invitación de entrenador funcionarán en producción.

---

## Enlaces de invitación coach

Los enlaces deben usar tu dominio Vercel:

`https://TU-APP.vercel.app/?invite=TOKEN`

Genera el enlace desde el panel del psicólogo (ya usa `window.location.origin` automáticamente).

---

## Problemas frecuentes

| Problema | Solución |
|----------|----------|
| Pantalla en blanco | Revisa que las variables `VITE_*` estén en Vercel y redeploy |
| Login no funciona | Añade la URL de Vercel en Supabase Auth |
| Build falla | Ejecuta `npm run build` en local y corrige errores |
