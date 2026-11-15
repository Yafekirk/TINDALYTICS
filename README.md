# Tindalytics

**Smarter Tindahan. Better Business.**

A full-stack Sari-Sari Store POS and Inventory Management System for Filipino small retail businesses.

## Status

Phases 1–13 are implemented:

- Auth, stores, RLS, dashboard, POS, products, inventory
- Sales, suppliers, purchase orders, reports
- Expenses, customers, utang/credit, AI insights
- Unit tests for checkout/inventory/credit money logic
- Ready for Vercel + GitHub deployment

## Tech stack

- Next.js (App Router) + React + TypeScript + Tailwind CSS
- Supabase (Postgres, Auth, RLS)
- OpenAI (server-side AI Insights)
- Recharts, Lucide, React Hook Form, Zod, date-fns

## Getting started

```bash
npm install
cp .env.example .env.local
# fill Supabase + optional OPENAI_API_KEY values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript checks |
| `npm test` | Critical money/inventory/credit unit tests |

## Environment variables

Copy `.env.example` to `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `NEXT_PUBLIC_SITE_URL` (local: `http://localhost:3000`, production: your Vercel URL)
- `OPENAI_API_KEY` (optional, for AI Insights)
- `OPENAI_MODEL` (optional, default `gpt-4o-mini`)

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` to the client.

## Supabase

Apply migrations from `supabase/migrations/` (already applied to the linked Tindalytics project during development).

In Supabase Auth → URL Configuration, add:

- Site URL: your production domain
- Redirect URLs: `https://YOUR_DOMAIN/auth/callback` and `http://localhost:3000/auth/callback`

## Deploy

1. Push this repo to GitHub
2. Import the repo in Vercel
3. Set the environment variables above for Production + Preview
4. Deploy

Production builds use Next.js on Vercel Fluid Compute (Node.js runtime).
