# TechSync Ops

TechSync Ops is a multi-tenant maintenance command center for property
management companies and field-service teams. It turns scattered maintenance
requests into role-specific work queues, dispatch decisions, client/vendor
updates, proof capture, closeout records, and operational reporting.

The current repository is a public POC and product-maturity build. It is built
with synthetic demo data, a hosted staging loop, and an evidence trail so the
tool can be reviewed honestly before any real customer rollout.

## What It Solves

Maintenance operations often break down in the handoffs:

- A request comes in, but ownership is unclear.
- A technician is assigned, but proof and status updates are inconsistent.
- A client wants visibility, but internal notes and vendor context must stay
  scoped.
- A vendor needs enough context to respond, without seeing unrelated tenant
  data.
- A manager needs proof, risk, cost, and closeout evidence without rebuilding
  the story from messages, photos, spreadsheets, and memory.

TechSync Ops is designed around those handoffs. Each user gets a lane, each
work order keeps its operating story, and the tenant boundary stays explicit.

## Current Status

TechSync Ops is ready for staged synthetic-data testing and public product
review. It is not yet labeled as customer-production software.

Ready now:

- Hosted Vercel web staging app for live product walkthroughs.
- Hosted Vercel FastAPI staging API connected to Neon Postgres demo data.
- Role-aware workspaces for org admin, coordinator, technician, client, viewer,
  and vendor users.
- Multi-tenant auth, organization onboarding, invitations, user roles, and
  tenant-scoped data access.
- Work order intake, assignment, status transitions, messages, approvals,
  proof, closeout packages, exports, and operations reports.
- Synthetic seed/reset tooling for repeatable demos.
- Backend pytest suite, client Jest checks, GitHub Actions CI, Gitleaks config,
  and documented QA/evidence workflows.

Still intentionally not customer-production:

- Real billing, SMTP, object storage, and customer onboarding are not active in
  the staged demo.
- Offline mobile sync and app-store release remain deferred.
- Public portfolio promotion should wait until the role walkthrough, screenshot
  evidence, accessibility notes, and visual polish pass are clean.

## Product Lanes

TechSync Ops is shaped around six user lanes:

| Role | Primary job |
| --- | --- |
| Org Admin | Own tenant command, risk, reporting, users, and audit context. |
| Coordinator | Triage intake, assign work, watch blockers, and keep handoffs moving. |
| Technician | See assigned work, update lifecycle state, send notes, and attach proof. |
| Client | Review linked requests, approvals, visible updates, and closeout proof. |
| Viewer | Read scoped client work without operational controls. |
| Vendor | See linked vendor work and vendor-visible communication only. |

The UX direction is a calmer SaaS console: a persistent left Work Views rail,
a center work queue or detail record, and a right next-actions rail. Explanatory
copy is being moved into compact help bubbles so the visible interface can focus
on work, status, and action.

## Live Staging Loop

The staged demo is meant to reduce local testing friction while product maturity
continues.

- Web app: `https://techsync-ops-web.vercel.app`
- API root: `https://techsync-ops-api-lyart.vercel.app`
- API health: `https://techsync-ops-api-lyart.vercel.app/health`
- API docs: `https://techsync-ops-api-lyart.vercel.app/docs`

See `HOSTED_TESTING.md` for the Vercel/Neon setup, required environment
variables, and hosted smoke-test loop. The hosted environment should use only
synthetic data.

## Architecture

**Client**

- Expo / React Native web client
- React Navigation
- Role-aware screens for onboarding, login, work queues, work order details,
  PMC directory management, reports, dispatch, and evidence capture

**Backend**

- FastAPI + Uvicorn
- SQLAlchemy repositories with explicit organization scoping
- Neon/Postgres runtime database
- Alembic migrations
- Pydantic v2 validation
- JWT access/refresh auth and bcrypt password hashing
- S3-compatible attachment storage hooks
- Stripe checkout/webhook hooks, deferred for the staged demo unless configured

**Deployment**

- Vercel FastAPI adapter in `api/index.py`
- Vercel static Expo web deployment from `client/dist`
- GitHub Actions for backend/client checks and hosted demo reset workflows

## Repository Map

```text
.
|-- api/                         # Vercel FastAPI entrypoint
|-- client/                      # Expo / React Native web client
|   |-- src/context/             # Auth/session state
|   |-- src/screens/             # Role workspaces and workflows
|   `-- src/utils/               # Client helpers and tests
|-- server/                      # FastAPI backend
|   |-- alembic/                 # Versioned database migrations
|   |-- core/                    # Config, security, logging
|   |-- models/                  # Pydantic schemas
|   |-- repositories/            # Tenant-scoped data access
|   |-- routers/                 # HTTP routes
|   |-- services/                # Business logic
|   `-- tests/                   # Pytest suite
|-- scripts/                     # Demo seed, smoke, readiness, and capture tools
`-- *.md                         # Requirements, roadmap, QA, runbooks, evidence
```

## Local Development

For the easiest local walkthrough, start with the helper:

```powershell
.\Start-TechSync-Demo.cmd
```

That path is documented in `LOCAL_TESTING.md`. It is intended to avoid repeated
manual terminal setup.

Manual backend setup:

```powershell
cd server
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m alembic upgrade head
python ..\scripts\seed_demo_data.py seed --reset-existing
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Manual web setup:

```powershell
cd client
npm ci
npm start -- --web --port 19006
```

Native builds use `expo-secure-store` for token persistence. Expo web preview
uses browser storage because browsers do not expose the same secure store.

## Testing

Backend:

```powershell
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
```

Client:

```powershell
cd client
npm.cmd run test:ci
npm.cmd run build:web
```

Readiness and role evidence helpers:

```powershell
server\venv\Scripts\python.exe scripts\smoke_role_ux.py --base-url "http://127.0.0.1:8000" --output role-ux-smoke-evidence.json
server\venv\Scripts\python.exe scripts\pre_hosting_readiness.py --summary-json pre-hosting-readiness-summary.json
```

## API Summary

Interactive API docs are available at `/docs`.

Major endpoint groups:

- Auth: login, refresh, password reset, current user
- Organizations: onboarding, settings, export, deletion, API key regeneration
- Invitations and users
- Technicians
- Clients, properties, and vendors
- Work orders, assignment, status, approvals, messages, events, attachments,
  closeout package exports
- Ingestion through CSV and API-key webhook
- Dashboard metrics, dispatch board, operations report, and CSV exports
- Billing checkout/webhook/plan limits

Access tokens expire after 15 minutes. Refresh tokens expire after 7 days.
Role gates are enforced in the FastAPI dependency layer.

## Security And Data Boundaries

- Tenant-scoped tables carry `organization_id`.
- Repository functions require organization scoping.
- Postgres RLS policies remain in the schema as a database backstop.
- Public/demo data should remain synthetic.
- Secrets are not committed; local scanner artifacts are ignored.
- Hosted web variables may expose only `EXPO_PUBLIC_*` browser-safe values.

## Roadmap

Current direction:

- Finish the public UX polish pass across all role lanes.
- Complete role walkthrough screenshots, small-width checks, and accessibility
  notes.
- Keep tightening client/vendor/technician interactions around real actions,
  not labels.
- Keep staged Vercel/Neon testing separate from real customer onboarding.
- Promote from portfolio only when the staged demo evidence is clean and the
  limitations are clearly labeled.

See `PRODUCT_ROADMAP.md`, `TECHSYNC_OPS_REQUIREMENTS.md`, and
`TECHSYNC_OPS_TRACEABILITY.md` for the detailed requirement map.

## Documentation Index

- `HOSTED_TESTING.md` - Vercel/Neon staged demo loop.
- `LOCAL_TESTING.md` - lower-friction local demo setup.
- `TECHSYNC_OPS_REQUIREMENTS.md` - active requirements source.
- `TECHSYNC_OPS_TRACEABILITY.md` - requirement coverage map.
- `PRODUCT_ROADMAP.md` - v1.2/v1.3 and later roadmap.
- `ROLE_LANE_UX.md` - user lane definitions.
- `ROLE_WORKSPACE_LAYOUT.md` - shared workspace layout contract.
- `ROLE_UX_SWEEP.md` - role-by-role UX pass notes.
- `ROLE_UX_CAPTURE_PASS.md` - final screenshot and manual evidence worksheet.
- `QA_CHECKLIST.md` - QA checklist and current validation state.
- `DEMO_DATA_RUNBOOK.md` - synthetic demo seed/reset operations.
- `OPERATIONS_RUNBOOK.md` - backup, restore, export, lifecycle, and monitoring.
- `PORTFOLIO_TECHSYNC_OPS.md` - portfolio/case-study source copy.

## License

MIT
