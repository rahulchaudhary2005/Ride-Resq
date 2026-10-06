# 🚨 RideResQ
## Real-Time Roadside Assistance & Vehicle Emergency Response Platform

> **RideResQ is a multi-sided roadside assistance platform that connects stranded vehicle owners with verified mechanics through location-aware dispatch, real-time communication, live mechanic tracking, configurable pricing, fare negotiation, secure authentication, service management, payments, ratings, and centralized administration.**

---

<p align="center">

**Customer Mobile App** • **Mechanic Mobile App** • **Admin Web Dashboard** • **Real-Time Backend**

</p>

<p align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-API-000000?logo=express&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB?logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK%2051-000020?logo=expo&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1)
![pnpm](https://img.shields.io/badge/pnpm-Workspace-F69220?logo=pnpm&logoColor=white)

</p>

---

# 📑 Table of Contents

- [1. Product Overview](#1-product-overview)
- [2. Problem Statement](#2-problem-statement)
- [3. Product Vision](#3-product-vision)
- [4. Solution](#4-solution)
- [5. Product Architecture](#5-product-architecture)
- [6. Three-Sided Platform](#6-three-sided-platform)
- [7. Customer Application](#7-customer-application)
- [8. Mechanic Application](#8-mechanic-application)
- [9. Admin Platform](#9-admin-platform)
- [10. End-to-End Business Flow](#10-end-to-end-business-flow)
- [11. Service Request State Machine](#11-service-request-state-machine)
- [12. Fare & Pricing Engine](#12-fare--pricing-engine)
- [13. Fare Negotiation](#13-fare-negotiation)
- [14. Location & Dispatch Engine](#14-location--dispatch-engine)
- [15. Real-Time Architecture](#15-real-time-architecture)
- [16. Notification Architecture](#16-notification-architecture)
- [17. Payment Architecture](#17-payment-architecture)
- [18. Authentication & Authorization](#18-authentication--authorization)
- [19. Database Architecture](#19-database-architecture)
- [20. Backend Architecture](#20-backend-architecture)
- [21. API Architecture](#21-api-architecture)
- [22. Monorepo Architecture](#22-monorepo-architecture)
- [23. Technology Stack](#23-technology-stack)
- [24. Project Structure](#24-project-structure)
- [25. Security Architecture](#25-security-architecture)
- [26. Reliability & Consistency](#26-reliability--consistency)
- [27. Scalability Strategy](#27-scalability-strategy)
- [28. Observability](#28-observability)
- [29. Engineering Decisions](#29-engineering-decisions)
- [30. Architecture Trade-offs](#30-architecture-trade-offs)
- [31. Business Impact](#31-business-impact)
- [32. Example Real-World Scenario](#32-example-real-world-scenario)
- [33. API Reference](#33-api-reference)
- [34. Local Development](#34-local-development)
- [35. Environment Configuration](#35-environment-configuration)
- [36. Running the Applications](#36-running-the-applications)
- [37. End-to-End Testing](#37-end-to-end-testing)
- [38. Production Deployment Architecture](#38-production-deployment-architecture)
- [39. Current Development Status](#39-current-development-status)
- [40. Future Roadmap](#40-future-roadmap)
- [41. Engineering Outcomes](#41-engineering-outcomes)
- [42. Author](#42-author)

---

# 1. Product Overview

Roadside vehicle breakdowns are inherently time-sensitive.

A vehicle can fail:

- On a highway
- In an unfamiliar city
- During the night
- In a remote location
- During long-distance travel
- In areas where the driver has no trusted mechanic

The traditional solution usually depends on manually searching for mechanics, making phone calls, explaining the location, negotiating prices, and waiting without knowing exactly who is coming.

**RideResQ digitizes this entire workflow.**

The platform consists of three primary applications:

```text
                         RideResQ Platform
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        CUSTOMER APP     MECHANIC APP      ADMIN WEB
        React Native     React Native      Next.js
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                     BACKEND PLATFORM
                    Node.js + Express
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        PostgreSQL         Socket.IO        External APIs
          Prisma                              Maps
                                              Payments
2. Problem Statement
The real-world problem

When a vehicle breaks down, the customer typically has to solve multiple problems simultaneously:

Vehicle Breakdown
       │
       ▼
Find a mechanic
       │
       ▼
Determine whether mechanic is available
       │
       ▼
Explain exact location
       │
       ▼
Discuss service
       │
       ▼
Negotiate price
       │
       ▼
Wait
       │
       ▼
Determine arrival status
       │
       ▼
Complete service
       │
       ▼
Handle payment

This creates several pain points.

Customer pain points
Slow discovery of assistance
Difficulty communicating exact location
Unknown mechanic availability
Lack of mechanic verification
Uncertain pricing
No live arrival visibility
Fragmented communication
Manual payment processes
Poor service history
Mechanic pain points
Difficulty discovering nearby customers
Dependency on calls and personal networks
Poor visibility into service demand
Manual coordination
No centralized service workflow
Platform/operator pain points
Manual mechanic onboarding
Difficulty managing pricing
Lack of centralized service monitoring
Difficult request tracking
Limited operational visibility
3. Product Vision

The vision of RideResQ is:

Make roadside assistance as simple and trackable as requesting a modern on-demand service.

The desired experience is:

Breakdown
   ↓
Open App
   ↓
Share Location
   ↓
Select Problem
   ↓
Request Help
   ↓
Nearby Verified Mechanic
   ↓
Accept
   ↓
Live Tracking
   ↓
Arrival
   ↓
Service
   ↓
Payment
   ↓
Rating
4. Solution

RideResQ introduces a centralized digital workflow that combines:

Location services
Real-time dispatch
Verified mechanics
Service categorization
Dynamic pricing
Fare negotiation
Live tracking
Chat
Notifications
Payments
Ratings
Service history
Administrative controls

The platform separates responsibilities between the three actors.

CUSTOMER
    │
    │ requests assistance
    ▼
PLATFORM
    │
    │ identifies eligible mechanics
    ▼
MECHANIC
    │
    │ accepts request
    ▼
PLATFORM
    │
    │ synchronizes state
    ▼
CUSTOMER
    │
    │ tracks service
    ▼
COMPLETION
5. Product Architecture

RideResQ follows a multi-client, centralized backend architecture.

                         ┌───────────────────────┐
                         │       CUSTOMER        │
                         │    React Native       │
                         │       + Expo          │
                         └───────────┬───────────┘
                                     │
                                     │ REST
                                     │ WebSocket
                                     │
                                     ▼
┌──────────────────────┐    ┌───────────────────────┐    ┌──────────────────────┐
│                      │    │                       │    │                      │
│      ADMIN WEB       │───▶│     API PLATFORM      │◀───│   MECHANIC MOBILE    │
│      Next.js         │    │       Express         │    │    React Native      │
│                      │    │      TypeScript       │    │       + Expo         │
└──────────────────────┘    │                       │    └──────────────────────┘
                            │ Authentication        │
                            │ Authorization         │
                            │ Requests             │
                            │ Dispatch             │
                            │ Pricing              │
                            │ Payments             │
                            │ Notifications        │
                            │ Ratings              │
                            └───────────┬───────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
              ┌───────────┐       ┌───────────┐      ┌──────────────┐
              │ PostgreSQL│       │ Socket.IO │      │ External APIs│
              │  Prisma   │       │ Realtime  │      │ Maps/Payment │
              └───────────┘       └───────────┘      └──────────────┘

roadguard/
│
├── apps/
│   │
│   ├── backend/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   │
│   │   └── src/
│   │       ├── config/
│   │       ├── middlewares/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── mechanics/
│   │       │   ├── vehicles/
│   │       │   ├── requests/
│   │       │   ├── payments/
│   │       │   ├── ratings/
│   │       │   ├── notifications/
│   │       │   └── admin/
│   │       └── app.ts
│   │
│   ├── admin-web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   └── package.json
│   │
│   ├── customer-mobile/
│   │   ├── src/
│   │   │   ├── navigation/
│   │   │   ├── screens/
│   │   │   ├── services/
│   │   │   └── store/
│   │   ├── App.tsx
│   │   └── package.json
│   │
│   └── mechanic-mobile/
│       ├── src/
│       ├── App.tsx
│       └── package.json
│
├── packages/
│   ├── shared-types/
│   ├── theme/
│   ├── validation/
│   └── config/
│
├── package.json
└── pnpm-workspace.yaml

36. Running the Applications

RideResQ is intentionally run as separate applications during development.

Terminal 1 — Backend
cd "D:\Projects 2026\roadguard\apps\backend"

pnpm dev

Backend:

http://localhost:4000

Health check:

http://localhost:4000/health
Terminal 2 — Admin Web
cd "D:\Projects 2026\roadguard\apps\admin-web"

pnpm dev

Admin:

http://localhost:3000
Terminal 3 — Customer Mobile
cd "D:\Projects 2026\roadguard\apps\customer-mobile"

pnpm exec expo start --localhost
Terminal 4 — Mechanic Mobile
cd "D:\Projects 2026\roadguard\apps\mechanic-mobile"

pnpm exec expo start
37. End-to-End Testing

A complete test requires three roles.

CUSTOMER
MECHANIC
ADMIN
Test Flow
1. Admin

Login as Admin.

2. Mechanic verification

Approve a mechanic.

PENDING
   ↓
APPROVED
3. Mechanic

Login as mechanic.

Set:

Online
Available
Location
4. Customer

Login as customer.

Create:

Service Request
5. Dispatch

Verify that the eligible mechanic receives the request.

6. Mechanic

Accept the request.

7. Customer

Verify the updated status.

8. Mechanic

Progress:

ACCEPTED
ARRIVED
IN_PROGRESS
COMPLETED
9. Payment

Execute the payment workflow.

10. Rating

Customer submits rating.

38. Production Deployment Architecture

A production deployment can evolve toward:

                         INTERNET
                            │
                            ▼
                    ┌───────────────┐
                    │ CDN / WAF     │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Load Balancer │
                    └───────┬───────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
          API #1          API #2          API #3
             │              │              │
             └──────────────┼──────────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
             PostgreSQL              Redis
                 │                     │
                 │                     │
                 ▼                     ▼
             Persistent          Realtime Scaling
               Data

External services:

Google Routes API
       │
       ▼
Distance / Routing

Razorpay
       │
       ▼
Payments

Push Notification Provider
       │
       ▼
Mobile Notifications
39. Current Development Status
Core platform
 Monorepo
 Backend application
 Customer mobile application foundation
 Mechanic mobile application foundation
 Admin web application
 PostgreSQL
 Prisma
 TypeScript
Authentication
 Registration
 Login
 Logout
 JWT architecture
 Role-based authorization
 Secure mobile token storage
Service Requests
 Service categories
 Vehicle association
 Pickup location
 Destination support
 Request creation
 Request lifecycle
 Customer history
 Mechanic request workflow
Dispatch
 Mechanic availability
 Mechanic verification
 Service category matching
 Geographic filtering
 Location freshness consideration
 Real-time event architecture
Pricing
 Automatic pricing
 Base fare
 Distance pricing
 Minimum fare
 Surge multiplier
 Pricing configuration
 Pricing versioning
 Pricing snapshots
 Customer offer architecture
Communication
 Socket.IO foundation
 Notification architecture
 Chat architecture
 Full production realtime workflow
Payments
 Payment intent architecture
 Payment confirmation architecture
 Production Razorpay checkout
 Webhook signature verification
 Idempotent payment processing
 Refund workflow
40. Future Roadmap
Phase 1 — Core Reliability
Complete request lifecycle testing
Stronger validation
Automated unit tests
Integration tests
E2E tests
Error monitoring
Phase 2 — Real-Time Experience
Production Socket.IO architecture
Live mechanic tracking
Push notifications
Real-time chat
Connection recovery
Offline handling
Phase 3 — Payments
Razorpay checkout
Webhook verification
Idempotency
Refunds
Payment reconciliation
Transaction ledger
Phase 4 — Intelligent Dispatch

Future dispatch ranking can consider:

Distance
+
ETA
+
Service Compatibility
+
Rating
+
Response Rate
+
Completion Rate
+
Availability

This can improve mechanic selection beyond simple geographic proximity.

Phase 5 — Analytics

Admin analytics can include:

Requests per day
Requests by service
Average response time
Average arrival time
Completion rate
Cancellation rate
Revenue
Mechanic performance
Geographic demand
Phase 6 — Platform Expansion

Potential future services:

Roadside Assistance
        +
Towing
        +
EV Charging
        +
Battery Assistance
        +
Fuel Delivery
        +
Vehicle Maintenance
        +
Insurance Integration
        +
Fleet Assistance
41. Engineering Outcomes

RideResQ is intentionally designed to demonstrate real-world software engineering rather than simple CRUD implementation.

The project combines:

                    FULL-STACK ENGINEERING
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
     MOBILE                WEB                 BACKEND
 React Native             Next.js             Express
     │                      │                    │
     └──────────────────────┼────────────────────┘
                            │
                            ▼
                       DOMAIN LOGIC
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
     Dispatch            Pricing            Payments
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                       REAL-TIME
                            │
                            ▼
                       Socket.IO
                            │
                            ▼
                       PostgreSQL

The project demonstrates practical understanding of:

Full-stack application architecture
Mobile application development
Web application development
REST API design
WebSocket communication
Authentication
Authorization
Database modeling
State machines
Location-based systems
Pricing engines
Negotiation workflows
Payment architecture
Admin systems
Monorepo architecture
Type-safe development
Security
Scalability
🧠 Key Engineering Principles

RideResQ follows several engineering principles.

Backend is the source of truth

Clients do not decide business-critical state.

Domain logic is separated

Pricing, dispatch, requests, payments, and authentication have distinct responsibilities.

Real-time where it matters

WebSockets are used for events that require immediate synchronization.

REST where it fits

Standard API operations remain RESTful.

Historical data remains explainable

Pricing snapshots and versioning preserve the context of previous requests.

Security is enforced server-side

Authentication, authorization, validation, and business rules are not trusted to the client.

Scale without premature complexity

The system begins as a modular monolith and can evolve into distributed services when actual scale requires it.

🏁 Final Product Vision

RideResQ aims to transform roadside emergencies from:

Uncertainty
    ↓
Manual Calls
    ↓
Location Confusion
    ↓
Price Negotiation
    ↓
Waiting

into:

One Platform
    ↓
Verified Assistance
    ↓
Location-Aware Dispatch
    ↓
Transparent Pricing
    ↓
Real-Time Tracking
    ↓
Digital Communication
    ↓
Secure Payment
    ↓
Service History

The ultimate goal is to create a reliable digital infrastructure for roadside assistance, where customers can request help quickly, mechanics can efficiently discover nearby service opportunities, and platform operators can manage the entire ecosystem from a centralized control plane.

👨‍💻 Author
Rahul Kumar Chaudhary

Full-Stack Developer focused on building practical software systems and solving real-world problems through technology.

Technical Interests
Full-Stack Development
Backend Engineering
TypeScript
Node.js
React
React Native
Next.js
PostgreSQL
Prisma
REST APIs
Real-Time Systems
System Design
Distributed Systems
Database Architecture
⭐ Repository

If you find the project useful or interesting:

⭐ Star the repository
🍴 Fork the project
🐛 Report issues
💡 Suggest improvements
🤝 Contribute

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
