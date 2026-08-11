# TechSync Ops

TechSync Ops is a multi-tenant maintenance command platform for property
management companies (PMCs) and field-service teams that need intake,
dispatch, technician proof, client communication, reporting, and operational
accountability in one place.

This repository implements the POC scope defined in
`TECHSYNC_OPS_REQUIREMENTS.md` and the v1.2/v1.3 path in
`PRODUCT_ROADMAP.md`. See [Spec Coverage](#spec-coverage) below for what's
implemented vs. deferred.

Role-by-role UX sweep notes are tracked in `ROLE_UX_SWEEP.md`, and the current
role-lane contract lives in `ROLE_LANE_UX.md`. Client, viewer, and vendor lanes
now have purpose-built portal summaries and communication-channel notices so
external users can tell what they can see, where replies go, and which controls
are intentionally unavailable. Work-order queue cards now add role-specific
scan cues so admin, coordinator, technician, client, viewer, and vendor users
can tell why a visible job matters before opening it. The walkthrough manifest now has a tested
readiness audit for synthetic logins, screenshot targets, role controls,
privacy expectations, and screenshot safety checks. The final capture workflow
is prepared in `ROLE_UX_CAPTURE_PASS.md`, and
`scripts/smoke_role_ux.py` can produce sanitized role-scope API evidence once a
local/demo API is running. The Role Evidence screen and capture manifest show
the strict preflight order plus 390px, 320px, and desktop viewport gates.
The strict evidence pack requires checklist, role-by-role, and viewport notes
before a public screenshot set is considered clean. `scripts/pre_hosting_readiness.py`
now summarizes the final local blockers across tracked tooling, ignored
evidence artifacts, role smoke, screenshots, manual notes, and evidence summary
JSON; screenshot blockers now name the exact role/screen/filename rows still
needed. The role smoke helper can also diagnose stale empty-state seed evidence
before a reseed. The latest local capture-prep run proved the Neon-backed API
through all six synthetic roles with 67 passing smoke checks; the remaining
evidence work is the manual 21-screenshot, small-width, and screen-reader pass.

## Overview

TechSync Ops ingests maintenance work orders from CSV and webhook sources,
validates and normalizes them, assigns them to the best-fit technician based
on skills, proximity, priority, and workload, then tracks status, proof, and
audit history through completion. Every organization (tenant) gets its own
isolated slice of data, enforced in the application layer and backed by
Postgres Row Level Security policies.

## Tech Stack

**Client**
- React Native (Expo-managed, RN 0.73.6)
- React Navigation

**Backend**
- FastAPI + Uvicorn
- Managed PostgreSQL, accessed directly through SQLAlchemy/psycopg2 repositories
- S3-compatible object storage for work order attachments (Cloudflare R2, AWS S3, etc.)
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
    ├── repositories/           # direct Postgres data access, always org-scoped
    ├── services/               # business logic (matching, ingestion, billing...)
    ├── routers/                # HTTP endpoints, one file per resource
    ├── dependencies.py         # auth, tenant-scoping, role-check dependencies
    ├── alembic/                # versioned DB migrations (RNF-10)
    ├── schema.sql              # same schema, for managed Postgres setup
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
   with a policy scoping rows to `techsync_current_org_id()`, which reads an `organization_id` claim from the database session. This was manually verified
   against a local Postgres instance during development: with RLS on and no
   org claim set, queries return zero rows (fail-closed); with the claim set
   to org A, only org A's rows are visible, even though org B's rows exist
   in the same table.

**Direct runtime model**: the FastAPI backend now talks directly to Postgres with `DATABASE_URL`; there is no Supabase service-role runtime dependency. Application-layer `organization_id` scoping is the primary tenant boundary and is covered by repository regression tests. RLS policies remain in the schema as a database backstop for deployments that intentionally set a per-request `organization_id` claim in the database session.

## Getting Started

### Prerequisites

- Node.js 16+
- Python 3.11+
- A managed Postgres database (Neon, Render, Railway, Fly, local Postgres, etc.)
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
DATABASE_URL=postgresql://user:password@host:5432/techsync
JWT_SECRET_KEY=$(openssl rand -hex 32)
CORS_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3000
STORAGE_BUCKET=work-order-attachments
STORAGE_REGION=auto
STORAGE_ENDPOINT_URL=https://your-account-id.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=your-storage-access-key
STORAGE_SECRET_ACCESS_KEY=your-storage-secret-key
STORAGE_PUBLIC_BASE_URL=https://files.yourdomain.com/work-order-attachments
ATTACHMENT_MAX_BYTES=10485760
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
STRIPE_SUCCESS_URL=http://localhost:3000/billing/success
STRIPE_CANCEL_URL=http://localhost:3000/billing/cancel
APP_BASE_URL=http://localhost:19006
EMAIL_DELIVERY_METHOD=log
EMAIL_FROM=TechSync <no-reply@yourdomain.com>
```

For the first hosted investor POC, start from `server/.env.demo.example`
instead. `APP_ENV=demo` still requires hosted HTTPS URLs, a real `DATABASE_URL`,
`JWT_SECRET_KEY`, and locked-down `CORS_ORIGINS`, but it intentionally permits
SMTP email, Cloudflare R2/S3 attachment storage, and Stripe keys to stay empty.
Use `APP_ENV=production` only after SMTP and object storage are configured.

Apply the schema with Alembic (recommended), or run `schema.sql` in your managed Postgres SQL console (RNF-10):
```bash
alembic upgrade head
```

Optional synthetic demo seed/reset path:

```bash
cd ..
python scripts/seed_demo_data.py seed --reset-existing
python scripts/seed_demo_data.py status
```

See `DEMO_DATA_RUNBOOK.md` before seeding a shared demo database. The seed
targets only the synthetic `techsync-ops-demo-pmc` organization and is not for
real customer tenants.

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
The backend test suite covers JWT/password logic, configuration validation, the
matching engine, CSV ingestion validation, work order status transitions,
plan-limit enforcement, tenant-isolation of the repository layer, public
endpoint rate limiting, Stripe webhook handling, attachment upload validation,
v1.3 communication/approval guardrails, operations reporting, and closeout
package/export behavior, dispatch-board composition, and dashboard CSV export
behavior including completion cycle-time export evidence, plus tenant JSON
export scoping and sensitive-field omission, plus the DB-assisted v1.3 smoke
helper that proves invite acceptance without persisting raw invite tokens.
These run without a live database (repositories are mocked); the RLS
behavior described above was additionally verified by hand against a local
Postgres instance.

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
machine's LAN IP). Native builds persist auth tokens with `expo-secure-store`
(OS Keychain/Keystore-backed storage); Expo web preview uses browser session
storage or memory because browsers do not expose the same secure store.

## Onboarding a New Organization (RF-06)

There's no shared "register" endpoint anymore — a brand-new company signs
up via `POST /organizations/onboard`, which creates the organization and
its first `org_admin` user in a single call and returns tokens
immediately. Everyone else joins via an emailed invitation
(`POST /organizations/invitations` → `POST /invitations/accept`, RF-07). In
the mobile app: "Create Organization" on the login screen for the first
flow, "Accept Invitation" for the second.

For local/demo v1.3 evidence, `scripts/smoke_v13.py --invite-database-url`
can insert a known synthetic invitation directly into the demo database, accept
it through `POST /invitations/accept`, and use the returned client token to
approve a pending work order. Use it only with synthetic data; the generated
evidence omits database URLs, raw invitation tokens, bearer tokens, and
passwords.

## API Surface

Full interactive docs at `/docs`. Summary:

| Area | Endpoints |
|---|---|
| Auth (RF-01, RF-03) | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me` |
| Organizations (RF-05, RF-06, RF-08, RNF-13) | `POST /organizations/onboard`, `GET/PATCH /organizations/me`, `GET /organizations/me/export`, `POST /organizations/me/api-key/regenerate`, `DELETE /organizations/me` |
| Invitations (RF-07) | `POST/GET /organizations/invitations`, `POST /invitations/accept` |
| Users (RF-02) | `GET /users`, `PATCH /users/{id}/role` |
| Technicians (RF-26, RF-29) | `POST/GET /technicians`, `PATCH /technicians/{id}` |
| Clients / Properties / Vendors (v1.3 PMC context) | `POST/GET/PATCH /clients`, `GET /clients/export`, `POST/GET/PATCH /properties`, `GET /properties/export`, `POST/GET/PATCH /vendors`, `GET /vendors/export` |
| Work Orders (RF-14, RF-15, RF-18..RF-22, RF-24) | `POST/GET /work-orders`, `GET /work-orders/mine`, `POST /work-orders/duplicate-warnings`, `GET/PATCH /work-orders/{id}`, `PATCH /work-orders/{id}/status`, `POST /work-orders/{id}/assign`, `POST /work-orders/{id}/approval-request`, `PATCH /work-orders/{id}/approval`, `POST/GET /work-orders/{id}/messages`, `GET /work-orders/{id}/events`, `GET /work-orders/{id}/closeout-package`, `GET /work-orders/{id}/closeout-package/export`, `GET /work-orders/{id}/closeout-package/attachments/export`, `POST /work-orders/{id}/attachments/upload`, `POST/GET /work-orders/{id}/attachments` |
| Ingestion (RF-09, RF-11, RF-12) | `POST /ingestion/csv` (multipart), `POST /ingestion/webhook` (`X-API-Key` header, per-org key) |
| Dashboard (RF-25) | `GET /dashboard/metrics`, `GET /dashboard/operations-report` including cost summary buckets, `GET /dashboard/operations-report/export`, `GET /dashboard/dispatch-board`, `GET /dashboard/dispatch-board/export` |
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
  -d '{"company_name":"Acme Field","admin_full_name":"Jane Admin","admin_email":"jane@acme.com","admin_password":"DemoPass123"}'
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

Implemented for this POC pass (mapped to `TECHSYNC_OPS_REQUIREMENTS.md`):

- **Auth & users**: RF-01 (access+refresh JWT), RF-02 (3 roles + middleware),
  RF-03 (password reset flow), RF-04 (native token storage via Expo SecureStore).
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
  (attachment metadata plus backend upload endpoint for S3-compatible object
  storage when configured), RF-20 (audit log), RF-21 (filtered search).
- **v1.3 PMC operations**: client/property/vendor records, work-order links,
  client-visible, vendor-visible, and internal messages, client approval requests/decisions,
  proof-gated closeout, closeout package summary, HTML/text/PDF closeout
  exports, closeout attachment handoff manifests for JSON/CSV evidence
  portability, operations reporting for stale work, overload, property hotspots,
  completion cycle time, and estimated-versus-actual cost summaries, CSV
  exports for the operations report, dispatch
  board, clients, properties, and vendors, tenant JSON export for
  admin-controlled data portability, and a dispatch board for unassigned
  work, technician lanes, utilization, SLA risk, pause/escalate/archive
  lifecycle states, duplicate-warning preflight
  checks, mobile PMC directory management, mobile report chart bars, and
  work-order entity linking, with manager-only mobile screens gated by role and
  primary mobile API failures showing visible retry states. Vendor users are
  scoped to active vendor records by email and limited to linked work orders and
  vendor-visible messages. Backend regression
  tests cover client/viewer, vendor, and technician work-order visibility boundaries, and
  compact mobile workflow controls have hardened touch targets before screenshot
  capture. Role-specific empty queue panels and the role walkthrough/screenshot
  manifest are implemented and tested, including a role evidence readiness
  audit and manager-only in-app Role Evidence screen for the final manual
  screenshot pass. The Role Evidence screen now includes final manual proof
  checks for each synthetic role, small-width comfort, screen-reader notes, and
  screenshot safety, plus the strict preflight order and viewport gates used by
  the generated local capture manifest. The local evidence pack now requires
  checklist, role-by-role, and viewport notes before strict mode can pass.
  Work-order cards now add role-specific scan cues for immediate action,
  proof state, scope, or visibility lane before a user opens the detail page. The
  pre-hosting readiness doctor can be run locally to confirm no smoke,
  screenshot, manual-note, or evidence-summary blockers remain before Vercel.
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
- **NFRs**: RNF-05 (application-layer tenant isolation with repository regression tests; RLS policies remain as an optional DB backstop),
  RNF-06 (bcrypt), RNF-09 (modular backend structure), RNF-10 (Alembic),
  RNF-11 (Dockerfile/compose), RNF-12 (structured JSON logging, toggle via
  `LOG_FORMAT=json`), RNF-13 (tenant deletion endpoint).

### Known gaps / deferred

- **No web admin panel** was built (RF-25/RF-26 exist as API endpoints
  only); the spec's "panel administrativo" is assumed to be a future
  separate web client consuming this same API.
- **PMC operations expansion still remaining**: calendar/maps, deep accounting
  integrations, richer branded PDF package styling, deeper client/vendor
  portals, provider-level binary storage export automation, and final UI/UX
  screenshot testing are tracked for v1.3+ / later in `PRODUCT_ROADMAP.md`.

- **RF-23 (offline sync)**, **RF-10/RF-13 (PDF/email ingestion)**: deferred,
  per the spec's own "Notas de Alcance" — not blocking for a POC.
- **Client dependency audit**: `npm audit fix --package-lock-only` has been
  applied without forcing framework majors. The remaining npm findings are in
  Expo 50 / React Native 0.73 transitive tooling and require a planned Expo/RN
  upgrade before treating the client as public-showcase clean.
- Docker image build was not network-testable in the sandbox this was built in (registry pull blocked); verify the image build in your deployment environment before relying on it.
- Synthetic demo seed/reset tooling now exists in `scripts/seed_demo_data.py`
  and `DEMO_DATA_RUNBOOK.md`; run it only against local or demo databases.
- Local/demo operational backup, restore, export, lifecycle, and monitoring
  evidence is tracked in `OPERATIONS_RUNBOOK.md`.
- Tenant JSON export is available at `GET /organizations/me/export` for org
  admins and omits password hashes, API keys, Stripe provider IDs, token hashes,
  and attachment storage paths.
- Local/mobile accessibility evidence is tracked in `ACCESSIBILITY_EVIDENCE.md`;
  helper coverage now labels primary role dashboard, form, dispatch, approval,
  attachment, message, and lifecycle controls before the final manual
  screen-reader pass. `ROLE_UX_CAPTURE_PASS.md` is the local worksheet for the
  final role screenshots, 390px/320px layout comfort check, and manual
  accessibility notes. The role UX smoke also verifies screenshot-ready seeded
  scenarios before capture: manager lifecycle depth, technician active assigned
  work, client pending approval, viewer scope, linked vendor work, and vendor-
  visible messages. Before final captures, run
  `scripts\seed_demo_data.py status --strict` against the local/demo database
  to confirm the seed is current. If old smoke evidence reports blocked quiet
  viewer/vendor logins, run
  `scripts\smoke_role_ux.py --diagnose role-ux-smoke-evidence.json` before
  reseeding. The local evidence-pack strict gate also
  requires completed checklist, role-by-role, and viewport notes before any
  public screenshot set is considered ready.
- Run `scripts\pre_hosting_readiness.py --strict` after the final evidence pack
  is built; it should pass only when the local evidence gate is actually
  complete. When screenshots are missing, the readiness doctor and capture prep
  helper now name the exact role/screen/filename rows to capture.
- Local Expo web note: Expo 50 on Node 24 can hit a Windows Metro external path
  issue involving `node:sea`; use Node 20 LTS for the durable local-web setup
  until Expo is upgraded.

## License

MIT
