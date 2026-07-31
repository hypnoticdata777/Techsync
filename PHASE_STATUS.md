# TechSync Ops Phase Status

Date: July 30, 2026

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
- Ran the current v1.3 migration path against the Neon demo database and
  confirmed `alembic current` reports `0008 (head)`.
- Seeded the synthetic TechSync Ops demo tenant against the Neon demo database
  with 8 users, 3 technicians, 2 clients, 3 properties, 2 vendors,
  8 work orders, 4 messages, 1 attachment, and 13 events during the first live
  role smoke. The next clean seed now expands this to 10 users, 3 clients, and
  3 vendors by adding no-work viewer/vendor evidence personas.
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

- Keep Vercel secrets/deployment work parked until the end-of-v1.3 showcase
  gate.
- Use the seeded Neon demo tenant for final role screenshots, small-width
  checks, and manual accessibility notes before public hosting.
- Run the hosted-style smoke scripts only after the final Vercel deployment
  gate is intentionally opened.

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
- Added backend dispatch board under `/dashboard/dispatch-board` for unassigned
  active work, technician lanes, workload utilization, and SLA risk.
- Added backend duplicate-warning preflight under
  `/work-orders/duplicate-warnings` for likely repeated work at the same
  property/address and service type.
- Added backend closeout package summary under
  `/work-orders/{work_order_id}/closeout-package`.
- Added mobile operations report screen for org admins/coordinators, showing
  stale work, overloaded technicians, and property hotspots from the backend
  report endpoint.
- Added mobile dispatch board screen for org admins/coordinators, showing
  unassigned work, technician load, active lane work, and SLA risk.
- Added mobile duplicate-warning confirmation before manual work-order
  creation.
- Added mobile PMC directory workflow for org admins/coordinators to create and
  edit clients, properties, and vendors.
- Added client/property/vendor selectors to the mobile work-order form so
  manual work can be linked to PMC records.
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
- Added lightweight binary PDF closeout export support under the same endpoint
  with `format=pdf`, plus hosted v1.3 smoke coverage.
- Added hosted v1.3 smoke coverage for client/property/vendor creation,
  work-order entity links, internal/client-visible messages, staff approval
  request state, proof-gated completion, closeout package JSON, HTML/text
  exports, and operations reporting.
- Added optional DB-assisted v1.3 smoke coverage that inserts a hashed
  synthetic client invitation, accepts it through the public invitation API, and
  approves pending work with the accepted client token while omitting raw
  invite tokens, bearer tokens, passwords, and database URLs from evidence.
- Added hosted v1.3 smoke coverage for the dispatch board shape and summary.
- Added hosted v1.3 smoke coverage for duplicate-warning preflight.
- Added CSV export endpoints for the operations report and dispatch board.
- Added hosted v1.3 smoke coverage for both dashboard CSV exports.
- Added CSV export endpoints for clients, properties, and vendors.
- Added hosted v1.3 smoke coverage for client/property/vendor CSV exports.
- Added admin tenant JSON export under `/organizations/me/export` with
  organization, user, technician, client, property, vendor, work-order,
  message, audit-event, and attachment-metadata sections while omitting
  credential/provider fields.
- Added hosted v1.3 smoke coverage for tenant JSON export shape and sensitive
  field omission.
- Added mobile operations report chart bars for risk mix, technician capacity
  pressure, and property hotspot activity.
- Added completion cycle-time reporting by service type to the backend
  operations report, operations-report CSV export, hosted v1.3 smoke harness,
  and mobile operations report chart/detail view.
- Added role-specific mobile work-order landing band and `ROLE_UX_SWEEP.md` to
  start the exhaustive pre-hosting UX sweep.
- Added role-aware work-order detail command panel for status, approval, proof,
  and message summary.
- Added mobile work-order form before-save context review for linked/manual/open
  client, property, vendor, and address state.
- Added tested mobile navigator gating so manager-only screens are mounted only
  for org admin/coordinator roles.
- Added reusable mobile retry/error states for primary API failures and
  work-order detail message/attachment subloads.
- Added backend role-scope regression evidence for client/viewer unrelated-work
  blocking, viewer client-visible message enforcement, and technician
  unassigned work/subresource blocking.
- Added compact mobile touch target and wrapping polish across primary role
  workflow controls before screenshot capture.
- Added tested role-specific empty queue panels with manager-only create-work
  actions.
- Added tested role UX walkthrough manifest, screenshot evidence template, and
  viewer/vendor demo users for final role capture.
- Added secondary no-work viewer/vendor seed personas so empty-state captures
  are deterministic after each clean seed reset.
- Added tested role UX evidence readiness audit for synthetic login coverage,
  screenshot-plan uniqueness, safety checks, manager/non-manager controls,
  technician assigned routing, client/viewer privacy, and linked-vendor scope.
- Added local role UX evidence-pack builder so sanitized smoke JSON, the
  screenshot folder, and local manual notes can be summarized into a
  missing-screenshot/manual-check Markdown report before any public sharing.
- Added `ROLE_UX_MANUAL_NOTES_TEMPLATE.json` so 390px/320px layout,
  screen-reader, role-scope, and screenshot safety observations can be filled
  locally and checked by the evidence-pack report without committing notes.
- Added `scripts/prepare_role_ux_capture.py` so the local screenshot folder,
  manual-notes copy, and missing-screenshot capture manifest can be prepared
  repeatably before the final evidence pass.
- Added evidence-pack blocker printing and optional sanitized
  `role-ux-evidence-summary.json` output so remaining screenshot/manual gaps
  are exact and machine-readable before hosting.
- Added seeded scenario checks to `scripts/smoke_role_ux.py` so the final
  screenshot pass fails early if manager lifecycle depth, technician assigned
  work, client pending approval, viewer scope, linked vendor work, or
  vendor-visible messages are missing.
- Added strict demo-seed status readiness checks so
  `scripts/seed_demo_data.py status --strict` fails before final screenshots
  when the demo database is stale or missing synthetic users/scenarios.
- Added final capture preflight and viewport gates to the Role Evidence screen
  and generated capture manifest so the manual screenshot pass follows the
  same strict seed, smoke, manifest, role walkthrough, evidence-pack, and
  safety-review order.
- Tightened strict evidence-pack validation so final manual notes must include
  non-empty checklist, role-by-role, and viewport evidence before hosting.
- Added `scripts/pre_hosting_readiness.py` so the last local gate can summarize
  tracked readiness tooling, ignored local artifacts, role smoke, screenshot
  inventory, manual notes, and evidence summary JSON before any hosting work.
- Added stale-seed diagnostics to the role UX smoke/readiness flow so blocked
  quiet viewer/vendor empty-state evidence gives the exact reseed recovery path
  before the final local capture pass.
- Added inline failed-check and stale-seed recovery output to the role UX smoke
  CLI so the live local smoke run explains its own next step.
- Added named missing-screenshot output to capture prep and the readiness
  doctor so the remaining local evidence blocker identifies the exact
  role/screen/filename rows to capture.
- Added Alembic migration `0006` for paused, escalated, and archived work-order
  lifecycle states.
- Added backend/mobile lifecycle handling for pause, escalate, cancel, and
  manager-only archive actions.
- Expanded the synthetic demo seed to include paused, escalated, and archived
  work orders.
- Added `OPERATIONS_RUNBOOK.md` for local/demo backup, restore, export,
  lifecycle, and monitoring evidence.
- Added tested accessibility helpers and primary mobile accessibility labels
  for role dashboards, work-order cards, form inputs, dispatch chips, approval
  controls, attachments, messages, and lifecycle actions.
- Added `ACCESSIBILITY_EVIDENCE.md` for the final manual screen-reader and
  small-width proof pass.
- Added `scripts/seed_demo_data.py` for repeatable synthetic demo tenant
  seed/reset.
- Added `DEMO_DATA_RUNBOOK.md` with direct-database seed/reset commands and
  safety guardrails.
- Added tested closeout attachment JSON/CSV handoff manifests so binary
  evidence portability is documented without embedding files or exposing
  private storage paths/credentials.
- Added Alembic migration `0007` for estimated/actual work-order cost fields
  and invoice references.
- Added backend cost summary reporting, operations-report CSV cost evidence,
  synthetic demo cost data, and mobile operations-report cost chart/cards.
- Added Alembic migration `0008` for vendor-visible work-order messages.
- Added linked-vendor work-order scoping by active vendor email, so vendor
  users only list/view work orders linked to their vendor record.
- Added vendor-visible message enforcement in the backend and mobile
  communication timeline, while keeping internal/client messages hidden from
  vendors and keeping viewers read-only.
- Added backend guardrails so vendor/viewer roles cannot add or upload
  attachments.
- Added synthetic vendor-visible seed data for the Apex vendor walkthrough.
- Added a manager-only mobile Role Evidence screen for automated readiness
  checks, role capture plan, screenshot targets, and safety checklist before
  hosting.
- Added manual UX proof checks to the Role Evidence screen for synthetic role
  execution, 390px/320px width comfort, screen-reader notes, and screenshot
  safety.
- Added `ROLE_UX_CAPTURE_PASS.md` and `scripts/smoke_role_ux.py` to prepare the
  final role-by-role local capture pass without hosting.
- Updated Expo web startup to use Expo's root registration helper so the app
  mounts cleanly in web preview.
- Updated synthetic demo login emails away from a reserved `.local` suffix so
  FastAPI/Pydantic email validation accepts every role login.
- Ran the local role UX smoke script against the live local API and seeded
  Neon demo tenant; all primary sanitized role/API checks passed. The next
  clean seed adds secondary empty-state role checks.
- Manually observed admin login, admin workspace, and admin work-order detail
  in Expo web.

Next:

- Keep hosting deferred until every non-hosting requirement bucket is locally
  as complete as practical.
- Continue the final local-only role-by-role UI/UX evidence pass: open Role
  Evidence, walk admin/coordinator/technician/client/viewer/vendor, verify the
  21 captured screenshot filenames with primary and empty-state personas using
  `local-role-ux-capture-manifest.md`, verify 390px and 320px widths, fill
  `local-role-ux-manual-notes.json` with checklist, role, and viewport notes,
  record manual screen-reader notes, build the evidence pack, run
  `scripts/pre_hosting_readiness.py --strict`, and complete screenshot safety
  review.
- Later, after the local product surface is complete, deploy only as the final
  gate, manually verify the true hosted email/log invitation path, run
  `scripts/smoke_v13.py` against the hosted backend, and capture
  `V13_EVIDENCE_TEMPLATE.md`. The synthetic invite accept plus accepted-client
  approval path can now be proven locally first with the optional
  `--invite-database-url` flag.
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

Continue the local-only v1.3 evidence pass and leave hosting as the absolute
final gate. The 21 role screenshot filenames are now present locally, and Expo
web logout is fixed for role switching. The best next move is to finish
`local-role-ux-manual-notes.json`, check 390px/320px layout comfort, record
manual screen-reader notes, build the evidence pack, and run the strict
pre-hosting readiness doctor. Only after those non-hosting requirements are
complete should the Vercel/portfolio showcase sequence resume.
