# miniou

Connect Gmail and Google Calendar, then manage mail, schedule events, and use AI chat — all from one workspace.

**Live:** [miniou.tusharcodes.tech](https://miniou.tusharcodes.tech)

## What it does

- **Mail** — read and send Gmail from `/mail`
- **Calendar** — view and create Google Calendar events from `/calendar`
- **Chat** — natural-language assistant for email and scheduling from `/chat`
- **Integrations** — connect Google at `/settings/integrations`

## Stack

| Layer | Tech |
|-------|------|
| Web | Next.js (`apps/web`) |
| API | Express + tRPC (`apps/api`) |
| Database | PostgreSQL + Drizzle (`packages/database`) |
| Integrations | Corsair — Gmail & Google Calendar (`packages/corsair`) |
| AI | OpenAI via Vercel AI SDK (`packages/services/meeting`) |

Monorepo managed with **pnpm** and **Turbo**.

## Prerequisites

- Node 18+
- pnpm 9
- Docker (for local Postgres)
- [Google Cloud OAuth client](docs/google-oauth.md) (Gmail + Calendar APIs)
- OpenAI API key

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Environment
cp .env.example .env
# Fill in JWT_SECRET, CORSAIR_KEK, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OPENAI_API_KEY

# Generate secrets
openssl rand -hex 64   # JWT_SECRET
openssl rand -hex 32   # CORSAIR_KEK

# 3. Database
pnpm db:up
pnpm db:migrate

# 4. Corsair (Gmail + Calendar integrations)
cd packages/corsair && pnpm setup && cd ../..

# 5. Run
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:8000

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web + API |
| `pnpm build` | Production build |
| `pnpm db:up` | Start Postgres (Docker, port **5433**) |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm check-types` | Typecheck all packages |
| `pnpm lint` | Lint all packages |

## Project structure

```
apps/
  web/          Next.js frontend
  api/          Express server, OAuth routes, webhooks
packages/
  database/     Drizzle models & migrations
  corsair/      Gmail + Calendar integration layer
  services/     Business logic (auth, gmail, calendar, meeting)
  trpc/         tRPC routers
```

## Deploy

Push to `main` — CI runs, then GitHub Actions deploys to the VPS via Docker.

```bash
git add .
git commit -m "Your message"
git push origin main
```

## Docs

- [Google OAuth setup](docs/google-oauth.md)
