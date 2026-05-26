# Scaletopia Leads

Internal data inventory dashboard for the Supabase central database (companies & people across all clients and campaigns).

## Setup

```bash
npm install
cp .env.local.example .env.local
# add SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Runs on http://localhost:3030

## Pages

- `/` Overview — totals, tier breakdown, source breakdown, top clients
- `/companies` Filterable list (client tag, niche tag, source, quality tier, date range, search) + CSV export
- `/companies/[id]` Detail — custom_data, tags, MX/security gateway, linked people
- `/people` Filterable list (company, client tag, email/phone status, source) + CSV export

## Tech

- Next.js 15 (App Router) · React 19 · Tailwind 4
- Supabase JS (service role, server-only — no auth layer in v1)
