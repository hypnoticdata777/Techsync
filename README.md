# TechSync

A multi-tenant SaaS platform for field service companies to onboard their
organization, ingest work orders from multiple sources, auto-assign them to
the right technician, and track them to completion — with a React Native
mobile app for technicians and a FastAPI + Supabase backend.

This repository implements the POC scope defined in
`Techsync_SaaS_Requirements.md` (Functional/Non-Functional requirements
RF-01..RF-29, RNF-01..RNF-14). See [Spec Coverage](#spec-coverage) below for
what's implemented vs. deferred.

## Overview

TechSync ingests work orders from any source — CSV upload, an external
webhook, (PDF/email are deferred, see below) — validates and normalizes
them, and assigns them to the best-fit technician based on skills,
proximity, and current workload. Every organization (tenant) that signs up
gets its own isolated slice of data, enforced both in the application layer
and at the database layer via Postgres Row Level Security.

## Tech Stack

**Client**
- React Native (Expo-managed, RN 0.73.6)
- React Navigation

**Backend**
- FastAPI + Uvicorn
- Supabase (PostgreSQL), accessed via `supabase-py` (PostgREST) at runtime
  and via a direct Postgres connection for Alembic migrations
- Pydantic v2 for request/response validation
- Alembic for versioned migrations
- JWT (access + refresh) for auth, bcrypt for password hashing

## Project Structure

```
.
├── client/                    # React Native mobile application
│   └── src/
│       ├── context/AuthContext.js   # tokens, onboarding, invites, refresh
│       ├── screens/                 # Login, Onboarding, Invite, Password reset,
│       │                            # Work order list/details/form
│       └── config.js
└── server/                    # FastAPI backend
    ├── main.py                 # app wiring: routers, CORS, exception handlers
    ├── core/                   # config.py, security.py (JWT, hashing)
    ├── models/                 # Pydantic request/response schemas
    ├── repositories/           # Supabase data access, always org-scoped
    ├── services/               # business logic (matching, ingestion, billing...)
    ├── routers/                # HTTP endpoints, one file per resource
    ├── dependencies.py         # auth, tenant-scoping, role-check dependencies
    ├── alembic/                # versioned DB migrations (RNF-10)
    ├── schema.sql              # same schema, for pasting into Supabase SQL editor
    ├── tests/                  # pytest suite (auth, matching, tenant isolation...)
    ├── Dockerfile / .dockerignore
    └── requirements.txt
```

## Multi-Tenancy Model (RF-05, RNF-05)

Every tenant-scoped table (`users`, `technicians`, `work_orders`,
`work_order_events`, `work_order_attachments`, `invitations`,
`org_priority_rules`) carries an `organization_id` column.

Two enforcement layers:

1. **Application layer (primary for this POC)** — every function in
   `server/repositories/*.py` takes an `organization_id` and filters on it
   explicitly. `server/tests/test_tenant_isolation.py` asserts this for the
   core repositories. `server/dependencies.py::get_current_organization`
   resolves the caller's org from their JWT and every router depends on it.
2. **Row Level Security (backstop)** — every tenant table has RLS enabled
   with a policy scoping rows to `techsync_current_org_id()`, which reads an
   `organization_id` claim off the PostgREST JWT. This was manually verified
   against a local Postgres instance during development: with RLS on and no
   org claim set, queries return zero rows (fail-closed); with the claim set
   to org A, only org A's rows are visible, even though org B's rows exist
   in the same table.

**Caveat**: the backend currently talks to Supabase using the
`service_role` key (needed for cross-tenant admin operations like
onboarding), which bypasses RLS by design in Supabase. That makes the
application-layer scoping the actual enforcement path today. RLS is fully
defined and tested so that the moment any code path uses the `anon` key
with a user-scoped JWT (e.g. a future "mobile app talks to Supabase
directly" path), it's already protected — see the comment block at the top
of `server/schema.sql` for how to mint a PostgREST-compatible JWT with an
`organization_id` claim.

## Getting Started

### Prerequisites

- Node.js 16+
- Python 3.11+
- A Supabase project (or local Postgres for schema/migration testing)
- Android Studio or Xcode for mobile development

### Backend Setup

```bash
cd server
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:
```
APP_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
JWT_SECRET_KEY=$(openssl rand -hex 32)
CORS_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3000
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
STRIPE_SUCCESS_URL=http://localhost:3000/billing/success
STRIPE_CANCEL_URL=http://localhost:3000/billing/cancel
APP_BASE_URL=http://localhost:19006
EMAIL_DELIVERY_METHOD=log
EMAIL_FROM=TechSync <no-reply@yourdomain.com>
```

Apply the schema — either paste `schema.sql` into the Supabase SQL editor,
or run the equivalent migration (RNF-10):
```bash
alembic upgrade head
```

Run the server:
```bash
uvicorn main:app --reload
```
API docs: `http://localhost:8000/docs`

### Run the tests

```bash
cd server
pip install -r requirements-dev.txt
pytest -p no:cacheprovider
```
58 backend tests covering JWT/password logic, the matching engine, CSV ingestion
validation, work order status transitions, plan-limit enforcement,
tenant-isolation of the repository layer, public endpoint rate limiting, and
Stripe webhook handling. These run without a live
database (repositories are mocked); the RLS behavior described above was
additionally verified by hand against a local Postgres instance.

The GitHub Actions workflow also runs this backend suite plus the client Jest
checks on pushes to `main` / `agent/**` and pull requests into `main`.

### Docker

```bash
docker compose up --build
```
Builds `server/Dockerfile` and serves the API on port 8000, reading
`server/.env`. (Note: the container image build itself wasn't network-
reachable to pull `python:3.11-slim` in the sandboxed environment this was
developed in — the Dockerfile follows standard, well-tested patterns but
verify the build in your own environment before relying on it.)

### Mobile App Setup

```bash
cd client
npm install
npm start
# in another terminal:
npm run android   # or: npm run ios
```

Update `src/config.js` if your backend isn't on `localhost:8000` (Android
emulator needs `http://10.0.2.2:8000`; physical devices need your
machine's LAN IP).

## Onboarding a New Organization (RF-06)

There's no shared "register" endpoint anymore — a brand-new company signs
up via `POST /organizations/onboard`, which creates the organization and
its first `org_admin` user in a single call and returns tokens
immediately. Everyone else joins via an emailed invitation
(`POST /organizations/invitations` → `POST /invitations/accept`, RF-07). In
the mobile app: "Create Organization" on the login screen for the first
flow, "Accept Invitation" for the second.

## API Surface

Full interactive docs at `/docs`. Summary:

| Area | Endpoints |
|---|---|
| Auth (RF-01, RF-03) | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me` |
| Organizations (RF-05, RF-06, RF-08, RNF-13) | `POST /organizations/onboard`, `GET/PATCH /organizations/me`, `POST /organizations/me/api-key/regenerate`, `DELETE /organizations/me` |
| Invitations (RF-07) | `POST/GET /organizations/invitations`, `POST /invitations/accept` |
| Users (RF-02) | `GET /users`, `PATCH /users/{id}/role` |
| Technicians (RF-26, RF-29) | `POST/GET /technicians`, `PATCH /technicians/{id}` |
| Work Orders (RF-14, RF-15, RF-18..RF-22, RF-24) | `POST/GET /work-orders`, `GET /work-orders/mine`, `GET/PATCH /work-orders/{id}`, `PATCH /work-orders/{id}/status`, `POST /work-orders/{id}/assign`, `GET /work-orders/{id}/events`, `POST/GET /work-orders/{id}/attachments` |
| Ingestion (RF-09, RF-11, RF-12) | `POST /ingestion/csv` (multipart), `POST /ingestion/webhook` (`X-API-Key` header, per-org key) |
| Dashboard (RF-25) | `GET /dashboard/metrics` |
| Billing (RF-27, RF-28, RF-29) | `POST /billing/checkout`, `POST /billing/webhook`, `GET /billing/plan-limits` |

Access token lifetime is 15 minutes, refresh token 7 days (RF-01). Roles are
`org_admin`, `coordinator`, `technician` (RF-02), enforced per-endpoint via
`dependencies.require_roles(...)`.

Public auth-style endpoints also have configurable fixed-window rate limits
(`RATE_LIMIT_*` environment variables) for single-instance POC hosting. If the
backend is scaled horizontally, enforce equivalent limits through Redis or the
edge/reverse proxy so counters are shared across instances.

### Quick curl walkthrough

```bash
# 1. Create an organization + admin
curl -s -X POST http://localhost:8000/organizations/onboard \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Acme Field","admin_full_name":"Jane Admin","admin_email":"jane@acme.com","admin_password":"Password123"}'
# -> { "organization": {...}, "user": {...}, "tokens": {"access_token": "...", "refresh_token": "..."} }

TOKEN="paste access_token here"

# 2. Create a work order (auto-assigns a technician if one is eligible)
curl -s -X POST http://localhost:8000/work-orders \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Fix leak","service_type":"plumbing","priority":"high"}'

# 3. Bulk-ingest via CSV
curl -s -X POST http://localhost:8000/ingestion/csv \
  -H "Authorization: Bearer $TOKEN" -F "file=@work_orders.csv"
```

## Spec Coverage

Implemented for this POC pass (mapped to `Techsync_SaaS_Requirements.md`):

- **Auth & users**: RF-01 (access+refresh JWT), RF-02 (3 roles + middleware),
  RF-03 (password reset flow), RF-04 partial (see Known Gaps).
- **Multi-tenancy**: RF-05 (org_id scoping + RLS), RF-06 (self-service
  onboarding), RF-07 (invitations), RF-08 (org settings: timezone, service
  types, priorities).
- **Ingestion**: RF-09 (CSV), RF-11 (webhook, API-key auth), RF-12
  (Pydantic validation, per-row errors). RF-10 (PDF/web form extraction) and
  RF-13 (email ingestion) are deferred per the spec's own scope note
  (Should/Could, not blocking).
- **Matching**: RF-14 (skills + proximity + workload scoring engine, see
  `services/matching_service.py`), RF-15 (manual reassignment), RF-16
  (notification service — logs a structured event; no real push
  infrastructure, documented in `services/notification_service.py`), RF-17
  (per-org forced-priority rules).
- **Work orders**: RF-18 (CRUD + enforced status transitions), RF-19
  (attachment metadata endpoint — client is expected to upload the file to
  object storage and pass the URL), RF-20 (audit log), RF-21 (filtered
  search).
- **Mobile**: RF-22 (technician's assigned queue, ordered by priority),
  RF-24 (status update with notes). RF-23 (offline sync) is deferred per
  spec scope note.
- **Admin panel**: RF-26 (technician CRUD), RF-25 (dashboard metrics
  endpoint; polling from a web admin panel is not built in this pass — see
  Known Gaps).
- **Billing**: RF-27 (14-day trial default), RF-28 (Stripe Checkout in test
  mode, signed Stripe webhook handling for checkout completion/payment
  failure/subscription cancellation, or a mock URL when Stripe is not
  configured), RF-29 (technician-count plan limit, enforced server-side).
- **NFRs**: RNF-05 (RLS, verified manually — see Multi-Tenancy Model above),
  RNF-06 (bcrypt), RNF-09 (modular backend structure), RNF-10 (Alembic),
  RNF-11 (Dockerfile/compose), RNF-12 (structured JSON logging, toggle via
  `LOG_FORMAT=json`), RNF-13 (tenant deletion endpoint).

### Known gaps / deferred

- **RF-04 (secure mobile token storage)**: tokens are in AsyncStorage, not
  OS Keychain/Keystore. Switching to `react-native-keychain` or
  `expo-secure-store` is the natural next step; it was deferred here since
  it needs a native rebuild this environment couldn't verify.
- **No web admin panel** was built (RF-25/RF-26 exist as API endpoints
  only); the spec's "panel administrativo" is assumed to be a future
  separate web client consuming this same API.
- **RF-19 attachments**: the API records attachment metadata (URL,
  filename); actual binary upload to Supabase Storage or another object
  store, and the corresponding "take a photo" UI in the mobile app, is not
  wired up.
- **RF-23 (offline sync)**, **RF-10/RF-13 (PDF/email ingestion)**: deferred,
  per the spec's own "Notas de Alcance" — not blocking for a POC.
- **Client dependency audit**: `npm audit fix --package-lock-only` has been
  applied without forcing framework majors. The remaining npm findings are in
  Expo 50 / React Native 0.73 transitive tooling and require a planned Expo/RN
  upgrade before treating the client as public-showcase clean.
- Docker image build wasn't network-testable in the sandbox this was built
  in (registry pull blocked); the Alembic migration itself *was* run
  end-to-end against a real local Postgres instance and confirmed to create
  the correct schema, indexes, and RLS policies, and RLS behavior was
  hand-verified with a non-superuser role.

## License

MIT
