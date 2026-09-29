# RoadGuard — Roadside Assistance Platform

A production-ready monorepo for an on-demand roadside assistance platform:
customers request help (towing, flat tire, battery jump, fuel delivery, lockout,
mechanical repair, winching, EV charging), nearby mechanics accept and complete
the job with live GPS tracking and in-app chat, and admins run the whole
operation from a web dashboard.

## Apps

| App                | Path                   | Stack                                      |
|---------------------|------------------------|---------------------------------------------|
| Customer mobile app | `apps/customer-mobile` | React Native (Expo) + TypeScript             |
| Mechanic mobile app | `apps/mechanic-mobile` | React Native (Expo) + TypeScript             |
| Admin web panel     | `apps/admin-web`       | Next.js 14 (App Router) + Tailwind           |
| Backend API         | `apps/backend`         | Node.js + Express + TypeScript + Prisma      |

Shared code lives in `packages/` (`shared-types`, `validation`, `config`).

## Core features

- **Auth**: JWT access + refresh tokens, role-based (`CUSTOMER` / `MECHANIC` / `ADMIN`)
- **Dispatch**: nearest-mechanic matching by live location + service category
- **Real-time**: Socket.io for live GPS tracking, in-request chat, and status broadcasts
- **Payments**: Stripe + Razorpay integration, platform fee split, mechanic wallet/payouts
- **Mechanic verification (KYC)**: document upload via pre-signed S3 URLs, admin approve/reject
- **Push notifications**: Firebase Cloud Messaging
- **Admin panel**: live stats, request monitoring, mechanic verification queue, pricing control, support tickets

## Getting started (local development)

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres + Redis
docker compose up -d postgres redis

# 3. Configure env vars
cp apps/backend/.env.example apps/backend/.env
cp apps/admin-web/.env.example apps/admin-web/.env
# fill in JWT secrets, Google Maps key, Stripe/Razorpay keys, Firebase creds, AWS creds

# 4. Run database migrations + seed
pnpm backend:migrate
pnpm --filter @roadguard/backend prisma:seed

# 5. Start everything
pnpm dev
```

// start terminal 1 

pnpm install
pnpm backend:dev

// Terminal 2

 pnpm admin:dev

 // Terminal 3

  pnpm customer:start

// Terminal 4
  pnpm mechanic:start

// Terminal 5 
pnpm mechanic:start
TERMINAL 1
Backend
pnpm dev
       │
       ▼
localhost:4000


TERMINAL 2
Customer Mobile
pnpm start
       │
       ▼
Expo


TERMINAL 3
Mechanic Mobile
pnpm start
       │
       ▼
Expo


TERMINAL 4
Admin Web
pnpm dev
       │
       ▼
localhost:3000


POSTGRESQL
Windows Service
       │
       ▼
Database

- Backend API: http://localhost:4000
- Admin panel: http://localhost:3000 (seeded login: `admin@roadguard.app` / `Admin@12345`)
- Customer/mechanic apps: `pnpm customer:start` / `pnpm mechanic:start` (opens Expo dev tools —
  scan the QR code with Expo Go, or run an emulator)

## Architecture notes

- **Monorepo**: pnpm workspaces + Turborepo for shared caching/build orchestration.
- **Database**: PostgreSQL via Prisma ORM. Schema in `apps/backend/prisma/schema.prisma`
  covers users, mechanic profiles, vehicles, service requests, tracking points, chat,
  payments, payouts, ratings, pricing, notifications, and support tickets.
- **Real-time layer**: a single Socket.io server attached to the Express HTTP server,
  authenticated via JWT on connection. Rooms: `user:<id>` (personal notifications),
  `request:<id>` (tracking + status for a specific job), `chat:<id>` (per-job chat),
  `admin:live` (live ops view). For multi-instance scaling, add the Redis adapter
  (`@socket.io/redis-adapter`) so rooms work across horizontally scaled backend pods.
- **Matching**: naive haversine-distance nearest-mechanic search in `requests.service.ts`.
  Swap this for a PostGIS radius query or a Redis geo index (`GEOADD`/`GEORADIUS`) at scale.
- **Payments**: platform takes a configurable commission (`PLATFORM_FEE_PERCENT` in
  `payment.service.ts`); the remainder accrues to the mechanic's wallet for payout.
- **File uploads**: clients upload directly to S3 via pre-signed URLs
  (`storage.service.ts`) rather than proxying files through the API.

## Deployment

- `docker-compose.yml` covers local/staging (Postgres, Redis, backend, admin-web).
- For production: managed Postgres (RDS/Cloud SQL/Supabase) + managed Redis
  (ElastiCache/Upstash), backend on Render/Railway/Fly.io/ECS/K8s (see `infra/k8s`),
  admin-web on Vercel or the same container platform, mobile apps built with EAS
  (`eas build`) and shipped to the App Store / Play Store.
- GitHub Actions CI (`.github/workflows/ci.yml`) builds, lints, and tests the backend
  and admin-web on every push/PR.

## Security checklist before going live

- [ ] Rotate all secrets in `.env` — never commit real keys
- [ ] Verify Stripe/Razorpay webhook signatures (stubbed in `payments.controller.ts`)
- [ ] Add rate limiting per-route (auth endpoints especially) beyond the global limiter
- [ ] Enforce HTTPS everywhere; set `secure`/`httpOnly` cookies in production
- [ ] Add background-check / license verification step to mechanic onboarding
- [ ] Set up error monitoring (Sentry) and structured log shipping
- [ ] Load-test the dispatch/matching path before scaling mechanic supply
