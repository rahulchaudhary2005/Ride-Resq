# MASTER PROMPT — RoadGuard: Roadside Assistance Platform

> Paste this entire document as the system/task prompt for an AI coding agent
> (Claude Code, Cursor, etc.) to generate, extend, or resume work on this project.
> It contains the full product spec, architecture, data model, API contract, and
> file structure so the agent has complete context without needing external links.

---

## 1. Product Overview

**RoadGuard** is an on-demand roadside assistance platform, similar in spirit to
Uber but for vehicle breakdowns. Three user types:

1. **Customer** — a driver whose vehicle has broken down or needs roadside help.
   Opens the app, picks a service type, shares their location, gets matched with
   a nearby mechanic, tracks them live on a map, chats with them, and pays in-app.
2. **Mechanic / Service Provider** — a verified professional who goes online,
   receives nearby job requests, accepts one, navigates to the customer, updates
   job status (arrived → in progress → completed), and gets paid out from their
   in-app wallet.
3. **Admin** — platform operator who monitors live activity, verifies mechanic
   KYC documents, manages service pricing, resolves support tickets, and views
   revenue analytics from a web dashboard.

### Supported service categories
`TOWING`, `FLAT_TIRE`, `BATTERY_JUMP`, `FUEL_DELIVERY`, `LOCKOUT`,
`MECHANICAL_REPAIR`, `WINCHING`, `EV_CHARGING`.

### Core user journeys
- **Customer**: register/login → pick a service → share location → request
  created → nearby mechanics notified → mechanic accepts → live tracking + chat
  → mechanic marks arrived/in-progress/completed → customer pays → rates mechanic.
- **Mechanic**: register/login → submit KYC docs → wait for admin approval →
  toggle online + share location → receive nearby job alerts → accept one job
  at a time → navigate, update status, chat → complete job → earnings credited
  to wallet → request payout.
- **Admin**: log in → view live dashboard (active requests, revenue, online
  mechanics) → approve/reject pending mechanic verifications → monitor/filter
  all requests → adjust service pricing → resolve support tickets.

---

## 2. Tech Stack (decided)

- **Monorepo**: pnpm workspaces + Turborepo
- **Backend**: Node.js + Express + TypeScript, Prisma ORM, PostgreSQL, Redis,
  Socket.io (real-time), Zod (validation), JWT (auth), bcrypt (password hashing)
- **Customer & Mechanic apps**: React Native via Expo, TypeScript,
  React Navigation, react-native-maps, socket.io-client, Zustand/Context for state
- **Admin panel**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Payments**: Stripe and Razorpay (dual provider support)
- **Push notifications**: Firebase Cloud Messaging
- **File storage**: AWS S3 (pre-signed upload URLs) for KYC docs, vehicle
  photos, avatars
- **Maps/geo**: Google Maps Platform (Distance Matrix / Directions / Geocoding)
- **Infra**: Docker Compose for local/staging; deployable to any container
  platform (Render/Railway/Fly.io/ECS/K8s) + Vercel for admin-web + EAS for
  mobile builds

Do not swap these choices without being asked — the schema, folder layout, and
API contract below all assume this stack.

---

## 3. Monorepo File Structure

```
roadguard/
├── README.md
├── MASTER_PROMPT.md
├── package.json                     # pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json
├── docker-compose.yml
├── .github/workflows/ci.yml
│
├── apps/
│   ├── backend/                     # Express + Prisma API + Socket.io
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── index.ts             # entrypoint (http + socket bootstrap)
│   │       ├── app.ts               # express app, middleware, route mounting
│   │       ├── config/               # env, db client, socket init
│   │       ├── modules/              # one folder per domain, each with
│   │       │                         #   *.routes.ts, *.controller.ts,
│   │       │                         #   *.service.ts, *.validation.ts
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── mechanics/
│   │       │   ├── vehicles/
│   │       │   ├── requests/         # core dispatch/matching/status logic
│   │       │   ├── payments/
│   │       │   ├── ratings/
│   │       │   ├── notifications/
│   │       │   └── admin/
│   │       ├── middlewares/          # auth, role, validate, error, notFound
│   │       ├── sockets/               # tracking, chat, request-lifecycle handlers
│   │       ├── services/              # maps/fare, notifications(FCM), payments, S3
│   │       ├── utils/                 # logger, apiResponse, errors
│   │       └── types/
│   │
│   ├── customer-mobile/              # Expo React Native app
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── navigation/            # Root/Auth/App navigators
│   │       ├── screens/
│   │       │   ├── Auth/              # Login, Register
│   │       │   ├── Home/              # service picker
│   │       │   ├── RequestService/    # create a request
│   │       │   ├── TrackMechanic/     # live map + status
│   │       │   ├── Chat/
│   │       │   ├── Payment/
│   │       │   ├── History/
│   │       │   └── Profile/
│   │       ├── components/, hooks/
│   │       ├── store/                # Zustand: authStore.ts, requestStore.ts
│   │       ├── services/             # apiClient.ts (axios + auto-refresh), socketClient.ts
│   │       └── config/constants.ts
│   │
│   ├── mechanic-mobile/              # Expo React Native app (same pattern)
│   │   └── src/
│   │       ├── screens/
│   │       │   ├── Auth/, Dashboard/ (online toggle + incoming requests),
│   │       │   ├── ActiveJob/ (status progression + live location push),
│   │       │   ├── Chat/, Earnings/, Profile/
│   │       └── ...
│   │
│   └── admin-web/                    # Next.js App Router
│       └── src/
│           ├── app/
│           │   ├── login/, dashboard/, requests/, mechanics/, pricing/, support/
│           ├── components/            # Sidebar, StatCard, etc.
│           └── lib/api.ts
│
├── packages/
│   ├── shared-types/                 # TS interfaces shared by all apps
│   ├── validation/                   # shared Zod schemas
│   └── config/                       # eslint/tsconfig presets
│
└── infra/
    ├── nginx/nginx.conf
    └── k8s/                          # manifests placeholder for cluster deploys
```

---

## 4. Data Model (Prisma / PostgreSQL)

Key entities and relationships (full schema in `apps/backend/prisma/schema.prisma`):

- **User** — id, email, phone, passwordHash, fullName, role (`CUSTOMER` |
  `MECHANIC` | `ADMIN`), avatarUrl, isActive, fcmToken. Has many Vehicles,
  ServiceRequests (as customer), Notifications, SupportTickets; has one
  MechanicProfile (if role = MECHANIC).
- **MechanicProfile** — 1:1 with User. verificationStatus (`PENDING` |
  `APPROVED` | `REJECTED`), isOnline, currentLat/currentLng, serviceCategories
  (array), license/vehicle/insurance doc URLs, rating, totalJobsCompleted,
  walletBalance.
- **Vehicle** — belongs to a customer User. make, model, year, plateNumber,
  vehicleType.
- **ServiceRequest** — the central entity. customerId, mechanicId (nullable
  until accepted), vehicleId, category, status (`PENDING` → `ACCEPTED` →
  `ARRIVED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED` / `NO_MECHANIC_FOUND`),
  pickup/drop lat-lng + address, estimatedFare, finalFare, timestamps for each
  status transition. Has many TrackingPoints and ChatMessages; has one Payment
  and one Rating.
- **TrackingPoint** — lat/lng/heading + timestamp, appended as the mechanic's
  location updates during an active job.
- **ChatMessage** — per-request in-app chat between customer and mechanic.
- **Payment** — amount, provider (`STRIPE` | `RAZORPAY` | `CASH`), status,
  platformFee, mechanicPayout.
- **Payout** — mechanic wallet withdrawal requests.
- **Rating** — 1–5 stars + comment, tied 1:1 to a completed ServiceRequest.
- **ServicePricing** — per-category baseFare, perKmRate, minFare,
  surgeMultiplier — editable by admin.
- **Notification** — in-app notification feed per user.
- **SupportTicket** — customer/mechanic support requests, worked by admin.

---

## 5. API Contract (REST, base path `/api/v1`)

All authenticated routes expect `Authorization: Bearer <accessToken>`.
Responses follow `{ success, message, data }`.

### Auth
- `POST /auth/register` — body: fullName, email, phone, password, role
- `POST /auth/login` — body: email, password
- `POST /auth/refresh` — body: refreshToken (rotates refresh token)
- `POST /auth/logout` — body: refreshToken

### Users
- `GET /users/me`
- `PATCH /users/me` — fullName, avatarUrl, fcmToken

### Vehicles
- `POST /vehicles` · `GET /vehicles/mine` · `DELETE /vehicles/:id`

### Mechanics
- `GET /mechanics/nearby?lat&lng&category` (public)
- `GET /mechanics/me` (mechanic)
- `PATCH /mechanics/me/categories` — body: categories[]
- `PATCH /mechanics/me/availability` — body: isOnline, lat, lng
- `POST /mechanics/me/verification` — body: licenseNumber, doc URLs

### Requests (the core flow)
- `POST /requests` (customer) — creates a request, triggers nearby-mechanic
  dispatch over sockets + push notifications
- `GET /requests/mine` — role-aware (customer sees their requests, mechanic
  sees assigned jobs)
- `GET /requests/:id`
- `PATCH /requests/:id/status` — body: status, cancelReason?, finalFare?
  (guarded: only the assigned mechanic/admin can progress mechanic-side states;
  first mechanic to `ACCEPTED` wins, others get a 409 conflict)

### Payments
- `POST /payments/intent` — body: requestId, provider
- `POST /payments/confirm` — body: requestId (marks paid, credits mechanic wallet)
- `POST /payments/webhook/stripe` · `POST /payments/webhook/razorpay` — provider webhooks (signature verification currently stubbed — see checklist)

### Ratings
- `POST /ratings` (customer, only for COMPLETED requests) — body: requestId, stars, comment?

### Notifications
- `GET /notifications/mine` · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all`

### Admin (role = ADMIN required)
- `GET /admin/dashboard` — counts (users, mechanics, active requests, completed today,
  pending verifications) + revenue/platform-fee totals
- `GET /admin/mechanics?status=PENDING|APPROVED|REJECTED` — list mechanics, optionally filtered
- `PATCH /admin/mechanics/:id/verification` — body: status (`APPROVED` | `REJECTED`)
- `GET /admin/requests?status=` — list/filter all requests (most recent 100)
- `GET /admin/pricing` · `PUT /admin/pricing` — body: category, baseFare, perKmRate, minFare, surgeMultiplier?
- `GET /admin/support-tickets?status=`

---

## 6. Real-time (Socket.io) Contract

Socket handshake requires `auth: { token: <accessJWT> }`. Rooms:
`user:<userId>` (personal), `request:<requestId>` (tracking + status),
`chat:<requestId>`, `admin:live`.

| Event (client→server)     | Payload                                   | Effect |
|----------------------------|--------------------------------------------|--------|
| `tracking:subscribe`       | `{ requestId }`                            | joins tracking room |
| `tracking:update`          | `{ requestId, lat, lng, heading? }`        | mechanic pushes location; persisted + broadcast |
| `chat:join`                | `{ requestId }`                            | joins chat room |
| `chat:message`             | `{ requestId, message }`                   | persisted + broadcast to room |
| `mechanic:availability`    | `{ isOnline }`                             | broadcast to `admin:live` |

| Event (server→client)      | Payload | When |
|------------------------------|---------|------|
| `request:new`                | ServiceRequest | sent to each nearby eligible mechanic on creation |
| `request:status`             | ServiceRequest | sent to `request:<id>` and `user:<customerId>` on any status change |
| `tracking:position`          | `{ requestId, lat, lng, heading, timestamp }` | broadcast to `request:<id>` |
| `chat:message`                | ChatMessage | broadcast to `chat:<id>` |

---

## 7. Non-functional requirements / production checklist

- Validate all input with Zod at the route boundary (pattern already established).
- Never trust client-provided fare — server computes `estimatedFare` from
  `ServicePricing`; `finalFare` set by mechanic/admin only.
- Rate-limit auth endpoints more aggressively than the global limiter.
- Verify Stripe/Razorpay webhook signatures before trusting payloads.
- Swap the haversine-loop mechanic matching for PostGIS or Redis GEO at scale.
- Add the Socket.io Redis adapter before running more than one backend instance.
- Use pre-signed S3 URLs for all file uploads (KYC docs, avatars) — never proxy
  large files through the API.
- Structured logging (winston) + error monitoring (Sentry) in production.
- HTTPS everywhere; secure/httpOnly cookies for the admin panel session.
- Background-check / license validation step before approving mechanics.

---

## 8. How to extend this project (instructions for the coding agent)

When asked to add a feature:
1. **Backend**: add/extend a module under `apps/backend/src/modules/<name>/`
   following the existing pattern (`*.validation.ts` → `*.service.ts` →
   `*.controller.ts` → `*.routes.ts`), mount the router in `app.ts`, and add
   any new Prisma models/fields to `schema.prisma` + a migration.
2. **Real-time**: if the feature needs live updates, add a handler in
   `apps/backend/src/sockets/` and emit from the relevant service via `getIO()`.
3. **Shared types**: add/update the corresponding interface in
   `packages/shared-types/src/index.ts` so both mobile apps and admin-web stay
   in sync.
4. **Mobile apps**: add a screen under `screens/<Area>/`, register it in the
   relevant navigator, and call the backend via the app's REST client
   (`services/apiClient.ts` in customer-mobile, `services/api.ts` in
   mechanic-mobile) or its socket client (`socketClient.ts` / `socket.ts`).
   Note the two apps intentionally use different state patterns — Zustand in
   customer-mobile, React Context in mechanic-mobile — match whichever app
   you're extending rather than mixing the two within one app.
5. **Admin web**: add a route under `src/app/<name>/page.tsx`, fetch via
   `lib/api.ts`, and add a Sidebar link in `components/Sidebar.tsx`.
6. Keep the response envelope (`{ success, message, data }`) and error handling
   (`ApiError` + `errorMiddleware`) consistent across all new endpoints.
7. Write migrations, never hand-edit the database schema outside Prisma.

This document plus the existing codebase should give a coding agent everything
needed to resume work without additional context.
