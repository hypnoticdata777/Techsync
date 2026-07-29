# TechSync Ops Phase Status

Date: July 29, 2026

This file is the current project pulse. Update it after each build, QA, hosting,
or portfolio-integration slice so future sessions can resume without guessing.

## Current Position

TechSync Ops is moving from a local/public code POC into a robust,
investor-safe PMC maintenance operations POC. Vercel and portfolio linking are
now intentionally held until the end of v1.3 so the product is stronger before
it is promoted publicly.

Current verified repo state:

```text
Repository: https://github.com/hypnoticdata777/Techsync
Branch: main
Latest local HEAD before this v1.3 smoke-harness pass: 550d24a Refresh TechSync Ops phase handoff docs
Latest known CI evidence in this tracker: success on main for 3c3f0ac
Working clone: C:\Users\hypno\Documents\Codex\2026-07-21\he\work\Techsync
```

## Phase Map

### Phase 0 - Rehydrate the Repo Correctly

Status: complete

Completed:

- Cloned the real GitHub repo with full `.git` history.
- Confirmed `main` is aligned with `origin/main`.
- Confirmed `HEAD` is `3c3f0ac Document secret history scan`.
- Confirmed GitHub Actions CI succeeded on `main` for `3c3f0ac`.
- Confirmed the Desktop `Techsync-main` folder was a zip/download style folder,
  not the active development checkout.

### Phase 1 - Public POC Safety Sweep

Status: in progress

Completed:

- Added `PUBLIC_POC_READINESS.md`.
- Confirmed `.gitignore` excludes `.env`, `*.env`, generated packages, build
  folders, logs, caches, and native signing artifacts.
- Confirmed only `server/.env.example` appeared in the env-file scan.
- Ran high-signal secret-pattern scan across tracked files.
- Confirmed scan hits were placeholder/docs/test values, not live secrets.
- Confirmed no tracked `.env`, database dump, SQLite file, PDF, CSV, zip, APK,
  AAB, private key, or production key file appeared in the local file scan.
- Removed tracked Python bytecode files from `server/__pycache__`.
- Added execution tracker docs: `PHASE_STATUS.md`, `COMMAND_LOG.md`,
  `QA_CHECKLIST.md`, and `HOSTING_PORTFOLIO_ROADMAP.md`.
- Added `.gitleaks.toml`.
- Rewrote the Quick Start authenticated curl example to use a local `TOKEN`
  variable instead of a bearer-token placeholder.
- Ran Gitleaks `8.30.1` against the current tree with no leaks found.
- Ran Gitleaks `8.30.1` against full Git history with no leaks found.
- Reviewed stale public-facing docs for Supabase, single-tenant, and Android
  build-history language.
- Marked historical appendix and Android troubleshooting docs as historical.
- Updated the SaaS requirements reference stack to managed Postgres,
  S3-compatible storage, React Native/Expo, and CSV/webhook ingestion.
- Added current setup note to the VS Code setup guide.
- Added `APP_ENV=demo` hosted POC config validation so storage, SMTP, and
  Stripe can be deferred without weakening full production settings.
- Added `server/.env.demo.example`.
- Replaced the older SaaS requirements file with `TECHSYNC_OPS_REQUIREMENTS.md`
  and captured all 10 PMC operations requirement batches.
- Added `TECHSYNC_OPS_TRACEABILITY.md` to map captured requirements to v1.2,
  v1.3, and later work.
- Added `PRODUCT_ROADMAP.md` with v1.2 product-foundation completion and v1.3
  PMC operations expansion scope.

Remaining:

- Confirm no generated mobile build artifacts appear after the next local build.
- Keep public-facing docs aligned as hosted backend/demo work changes.

### Phase 2 - Demo Database and Hosted-Readiness Foundation

Status: in progress

Completed:

- Confirmed Neon project `techsync-poc` exists in AWS US East 1 (N. Virginia).
- Confirmed Neon branch `production` and database `neondb` are the current demo
  database target.
- Copied and distinguished the direct Neon URL for migrations from the pooled
  Neon URL for hosted app runtime.
- Reset the Neon database password after a connection string was visible during
  setup, then continued with the rotated credentials.
- Ran `alembic upgrade head` against the Neon demo database using the direct
  connection string during the initial hosted-readiness pass.
- Confirmed `alembic current` reports `0001 (head)`.
- Cleared `DATABASE_URL` from the local PowerShell session after migration.
- Selected Vercel as the eventual backend host for portfolio alignment, now
  deferred to the end of v1.3.
- Added Vercel deployment prep files: `api/index.py`, root `requirements.txt`,
  `.python-version`, `vercel.json`, and `VERCEL_DEPLOYMENT.md`.
- Updated the FastAPI metadata and health service name to TechSync Ops.
- Added `scripts/smoke_v12.py` and `V12_EVIDENCE_TEMPLATE.md` so hosted
  evidence can be collected repeatably with synthetic data.
- Added manual GitHub Actions workflow `Hosted v1.2 smoke test` for hosted
  evidence collection after Vercel deploy.
- Added `PORTFOLIO_TECHSYNC_OPS.md` as the portfolio case-study source for the
  v1.2 public POC.
- Added `scripts/smoke_v13.py`, `V13_EVIDENCE_TEMPLATE.md`, and updated the
  manual hosted-smoke workflow so the v1.3 API surface can be tested
  repeatably after deployment.
- Updated `scripts/smoke_v12.py` so proof metadata is attached before a
  completed status transition, keeping the older smoke path compatible with the
  v1.3 proof gate.

Next:

- Apply and smoke-test the newer v1.3 migrations on the Neon demo database:
  `0002` PMC entities, `0003` messages, `0004` proof gate, and `0005` client
  approvals.
- Keep Vercel secrets/deployment work parked until the end-of-v1.3 showcase
  gate.
- Smoke-test auth, onboarding, work-order lifecycle, ingestion, dashboard
  metrics, and the new PMC entity APIs locally/CI before public hosting.

### Phase 3 - v1.3 PMC Operations Foundation

Status: in progress

Completed:

- Added Alembic migration `0002` for clients, properties, vendors, expanded
  roles, and work-order links.
- Started tenant-scoped API/repository/model work for client, property, and
  vendor records.
- Added Alembic migration `0003` for work-order messages with `internal` versus
  `client` visibility.
- Added backend message endpoints under work orders so internal notes and
  client-visible messages are separated structurally.
- Added Alembic migration `0004` for completion proof metadata and manager
  override reason.
- Added backend proof-gated closeout: completed status requires attachment proof
  or an org admin/coordinator override reason.
- Added backend operations report under `/dashboard/operations-report` for stale
  work, overloaded technicians, and property hotspots.
- Added backend closeout package summary under
  `/work-orders/{work_order_id}/closeout-package`.
- Added mobile operations report screen for org admins/coordinators, showing
  stale work, overloaded technicians, and property hotspots from the backend
  report endpoint.
- Added client/viewer work-order scoping by active client email, so client
  users only list/view their own work orders.
- Added mobile work-order communication timeline with internal versus
  client-visible messages, and kept client/viewer users on client-visible
  comments only.
- Added Alembic migration `0005` for client approval state on work orders.
- Added staff approval requests and client approve/decline actions, with audit
  events and client-visible timeline messages.
- Added mobile approval UI inside work-order details.
- Added printable HTML/text closeout export endpoint under
  `/work-orders/{work_order_id}/closeout-package/export`.
- Added hosted v1.3 smoke coverage for client/property/vendor creation,
  work-order entity links, internal/client-visible messages, staff approval
  request state, proof-gated completion, closeout package JSON, HTML/text
  exports, and operations reporting.

Next:

- Migrate/smoke-test the demo database through the latest v1.3 migrations, then
- run `scripts/smoke_v13.py` against the hosted API and capture
  `V13_EVIDENCE_TEMPLATE.md`.
- Manually verify a synthetic client invite/accept/approval decision from the
  hosted email/log path because invite tokens are intentionally not echoed by
  the API response.
- Decide whether binary PDF rendering is needed before the portfolio showcase.
- Decide the demo surface only after the v1.3 product workflows are robust
  enough to show.

### Phase 4 - Hosted Client or Demo Surface

Status: not started

Next:

- Decide whether public demo is Expo web, hosted app preview, screenshots,
  recorded walkthrough, or a lightweight portfolio wrapper.
- Configure `EXPO_PUBLIC_API_BASE_URL`.
- Validate synthetic demo flow against hosted backend.

### Phase 5 - Portfolio Integration

Status: not started

Next:

- Add TechSync Ops to the portfolio as a PMC maintenance operations POC.
- Use synthetic screenshots only.
- Link the GitHub repo and hosted demo/walkthrough.
- Label production limitations honestly.

### Phase 6 - Demo QA and Evidence Pack

Status: not started

Next:

- Run backend tests.
- Run client tests.
- Run hosted smoke tests.
- Capture screenshots and evidence notes.
- Document known limitations.

### Phase 7 - Investor-Safe Stop Point

Status: not started

Stop when:

- Repo is clean and safe.
- Hosted backend works over HTTPS.
- Synthetic demo surface is linked from portfolio.
- CI passes.
- Core user journey has smoke-test evidence.
- Production limitations are documented.

## Current Recommended Next Move

Continue toward the end-of-v1.3 showcase gate: apply the latest migrations to
the Neon demo database, deploy to the selected Vercel backend when ready, run
`scripts/smoke_v13.py`, capture `V13_EVIDENCE_TEMPLATE.md`, then decide whether
binary PDF rendering or a screenshot/walkthrough demo surface is the better
final portfolio proof.
