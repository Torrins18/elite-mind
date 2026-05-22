# Elite Mind — Mental Performance Platform

Sports psychology SaaS for athletes, coaches, and psychologists. Built with **React**, **Vite**, and **Supabase**.

## Roles

| Role | Access |
|------|--------|
| **Athlete** | Daily check-ins, personal trends, private notes |
| **Coach** | Team summaries and risk alerts (invite + psychologist approval required) |
| **Psychologist** | Full access, coach invites, approvals, CSV export |

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

### Environment variables

Copy `.env.example` to `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase setup (run in order)

1. `supabase/schema.sql` — tables and RLS  
2. `supabase/fix-profiles.sql` — profile helpers  
3. `supabase/seed-categories.sql` — categories (Sènior, Juvenil, Cadet…)  
4. `supabase/coach-invites.sql` — coach invites and approval  
5. `supabase/reject-coach.sql` — reject coach requests  
6. `supabase/seed-demo.sql` — optional demo check-ins (after athletes exist)

### Psychologist account

Create user in **Authentication → Users**, then:

```sql
insert into public.profiles (id, name, role, approved)
values ('<uuid>', 'Dr. Garcia', 'psychologist', true);
```

## Coach onboarding

1. Psychologist clicks **Generate link** in the dashboard  
2. Coach opens the link and registers  
3. Psychologist **Approves** or **Rejects**  
4. Approved coach selects a category and accesses the panel  

## Deploy to Vercel

1. Push the project to GitHub  
2. Import in [vercel.com](https://vercel.com)  
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy  

`vercel.json` is included for SPA routing.

### Supabase after deploy

In **Authentication → URL Configuration**, add your Vercel URL to **Redirect URLs** and **Site URL**.

## Languages

Spanish and Catalan — switch in the top bar.

## Stack

- React 19 + Vite  
- Supabase Auth & Postgres  
- Recharts  
