# TechSync Ops Phase Status

Date: July 30, 2026

This file is the current project pulse. Update it after each build, QA, hosting,
or portfolio-integration slice so future sessions can resume without guessing.

## Current Position

TechSync Ops is moving from a local/public code POC into a robust,
investor-safe PMC maintenance operations POC. Current work is centered on
product maturity: every user role needs a clear lane, predictable controls,
safe visibility boundaries, and smooth handoffs across the shared work-order
system. Deployment remains a later delivery option, not a blocker to continue
hardening the tool.

Current verified repo state:

```text
Repository: https://github.com/hypnoticdata777/Techsync
Branch: main
Latest local HEAD before this v1.3 smoke-harness pass: 550d24a Refresh TechSync Ops phase handoff docs
Latest known CI evidence in this tracker: success on main for 3c3f0ac
Working clone: C:\Users\hypno\Documents\Codex\2026-07-21\he\work\Techsync
```

## Current Product Maturity Focus

Status: active

Completed in the latest lane UX pass:

- Added `ROLE_LANE_UX.md` as the source of truth for org admin, coordinator,
  technician, client, viewer, and vendor lanes.
- Added tested role-lane helpers that define each role's job, handoffs, success
  signal, allowed actions, and out-of-lane guardrails.
- Updated the work-order home queue to show lane, handoff, and success context
  before the list so users can orient quickly.
- Updated the work-order detail command panel with explicit `Can Do` and
  `Not In This Lane` boundaries so hidden controls feel intentional.
- Kept the shared work-order shape consistent: next owner, waiting state,
  visible audience, messages, proof, approval, and lifecycle all remain tied
  to role permissions.
- Added client, viewer, and vendor portal summaries so external lanes show
  purpose-built approval/read-only/vendor context before the queue.
- Added communication-lane notices to work-order detail pages so users know
  whether they are in the internal, client-visible, vendor-visible, or
  read-only channel.
- Added role-aware queue-card scan cues so every work order explains the
  active user's immediate action, proof state, scope, or visibility lane before
  they open the detail screen.
- Added role-specific detail action-path cues for approval, communication,
  proof, and lifecycle follow-through so the detail page makes the next move
  predictable after a queue card is opened.
- Made detail action-path cues tappable jump controls so users can move from
  the command panel to approval, communication, proof, or lifecycle work.
- Added role-aware readiness cues at the top of approval, communication,
  proof, and lifecycle sections so users see what is available, blocked,
  read-only, or already satisfied before interacting with controls.
- Corrected detail jump targets so approval, communication, proof, and
  lifecycle action-path cards land on the matching section.
- Added role event playbook cues on work-order detail pages so repeated SaaS
  events such as approval requested, proof needed, vendor thread active,
  escalation, pause resolution, completed closeout, and read-only snapshot
  review tell each role how to respond and who receives the handoff.
- Added post-action outcome notices on work-order detail pages so message
  sends, approval requests/decisions, proof uploads, and lifecycle transitions
  visibly confirm what changed and what the next handoff means.
- Added role event-lane cards to the work-order home queue so each user's
  recurring operating loops are visible before they choose a job.
- Added role-aware queue focus filters so users can narrow the visible queue
  by the operating loop they need to handle next.
- Added an operable role-aware next-best-action tool on the home queue that
  ranks visible work by role, priority, status, approval, assignment, blocker,
  and proof state, then lets the user open the recommended work order or focus
  the matching queue loop.
- Added a low-friction local testing harness so product walkthroughs no longer
  require manually juggling two terminals, touching Neon, or retyping
  environment variables: `LOCAL_TESTING.md`, `.local-demo.env.example`,
  `docker-compose.local.yml`, `Start-TechSync-Demo.cmd`,
  `Stop-TechSync-Demo.cmd`, `scripts/local_dev.ps1`, and
  `scripts/local_stop.ps1`.

Next product maturity targets:

- Continue role-by-role walkthrough polish against synthetic admin,
  coordinator, technician, client, viewer, and vendor accounts.
- Continue strengthening client/viewer/vendor empty and detail states so they
  feel like full user lanes, not restricted admin pages.
- Continue tightening role-specific action follow-through after queue scan,
  especially approval, vendor response, and technician proof flows.
- Continue polishing the detail action path with live role walkthrough
  observations, especially where a user expects a visible confirmation after
  taking an action.
- Continue refining direct-jump behavior on long detail pages as role
  walkthroughs reveal where users expect to land.
- Continue sharpening section-level prerequisites where roles need clearer
  next-step language after approval, proof, message, or lifecycle changes.
- Continue maturing event follow-through after the first visible response:
  success confirmation, refreshed messages/proof, and clear next-state feedback
  should feel consistent across all six roles.
- Continue checking whether role event lanes match what each user naturally
  expects to monitor at the queue level.
- Continue refining queue focus filters as live walkthroughs reveal which
  operating loops should be easier to isolate.
- Continue turning role guidance into executable tools where possible, with
  queue ranking, direct navigation, and state-changing workflows preferred over
  descriptive panels alone.
- Continue tightening action outcomes where deeper workflows need richer
  follow-through, especially closeout package review, cost review, and
  assignment changes.
- Keep improving mobile/narrow-width comfort for the lanes that work from the
  detail page most often.

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
- Selected Vercel as the hosted staging path for portfolio alignment.
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

- Finish the Vercel/Neon staged testing setup with API/web projects, Vercel
  environment variables, and GitHub reset secrets.
- Use the staged URL and seeded Neon demo tenant for role walkthroughs,
  small-width checks, manual accessibility notes, and faster UX feedback.
- Promote the portfolio/public link only after the staged walkthrough and
  hosted smoke evidence are clean.

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
- Added work-order queue/detail handoff cues for Next Owner, Waiting On, and
  Visible To so each role can understand collaboration state before acting.
- Added role-aware queue-card scan cues for admin, coordinator, technician,
  client, viewer, and vendor users before they open a work-order detail page.
- Added role-specific work-order detail action-path cues for approval,
  communication, proof, and lifecycle so admin, coordinator, technician,
  client, viewer, and vendor users can understand their next available step
  after opening a work order.
- Added role-specific event playbook rows to the work-order detail page so
  admin, coordinator, technician, client, viewer, and vendor users can handle
  repeated operating events with predictable response and handoff guidance.
- Added visible post-action outcome notices for work-order detail mutations so
  roles get immediate confirmation after messages, approvals, proof uploads,
  and lifecycle changes.
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
- Updated capture prep so stale local manual-notes files are repaired to the
  current checklist, role-note, and viewport-note shape while preserving any
  existing reviewer notes.
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
- Ran the current capture prep and evidence-pack flow locally; all 21 expected
  screenshot filenames are present and safely named, leaving manual
  checklist/role/viewport notes as the only evidence blocker before the final
  pre-hosting readiness gate.

Next:

- Use hosted staging to speed up the remaining role-by-role product maturity
  work while keeping synthetic data and demo-mode guardrails.
- Continue the final local-only role-by-role UI/UX evidence pass: use the
  repaired `local-role-ux-manual-notes.json` to finish checklist, role, and
  viewport observations, verify 390px and 320px widths, record manual
  screen-reader notes, rebuild the evidence pack with summary JSON, run
  `scripts/pre_hosting_readiness.py --strict`, and complete screenshot safety
  review.
- Continue maturing the role-specific experience through hosted staging: each account
  now lands with a role badge, scope explanation, next move, and guardrail, and
  the next polish should make detail/form interactions feel equally guided.
- In hosted staging, manually verify the true hosted email/log invitation path, run
  `scripts/smoke_v13.py` against the hosted backend, and capture
  `V13_EVIDENCE_TEMPLATE.md`. The synthetic invite accept plus accepted-client
  approval path can now be proven locally first with the optional
  `--invite-database-url` flag.
- Use Expo web on Vercel as the staged demo surface, then decide when it is
  robust enough to promote from the portfolio.

### Phase 4 - Hosted Client or Demo Surface

Status: in progress

Next:

- Deploy the Vercel API project from the repo root.
- Deploy the Vercel web project from `client`.
- Configure `EXPO_PUBLIC_API_BASE_URL` to the staged API URL.
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

Continue the hosted staging setup so TechSync Ops can be tested from a real
URL instead of manual local terminals. The 21 role screenshot filenames are
present locally, Expo web logout is fixed for role switching, role landing
locates the active user, and work-order detail/form screens explain scope,
current action, guardrails, handoff ownership, visible audiences, and
linked/manual context before mutation. Next: create the Vercel API and web
projects, configure Vercel/GitHub secrets, reset the synthetic Neon demo tenant
through GitHub Actions, run hosted smoke evidence, then use the live staged URL
for faster role UX maturity before portfolio promotion.
