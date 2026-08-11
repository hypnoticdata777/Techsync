# TechSync Ops Product Roadmap

Date: July 29, 2026

## Roadmap Principle

TechSync Ops should advance in checkpoints that are easy to demo, easy to
verify, and honest about what is production-ready versus POC-ready. The next
checkpoint is v1.2: product-foundation completion. v1.3 is the deeper PMC
operations expansion and public showcase gate.

## v1.2 - Product Foundation Completion Checkpoint

Goal:

TechSync Ops proves the tenant-safe backend, demo database, core
intake/dispatch/technician workflow, public product positioning, and durable
requirements trail without using real customer data. Hosting is prepared, but
not the checkpoint finish line.

Primary audience:

- Portfolio viewers
- Investors/advisors
- Technical reviewers
- Early PMC discovery conversations

Scope:

- Product name and documentation updated to TechSync Ops.
- Active requirements source moved to `TECHSYNC_OPS_REQUIREMENTS.md`.
- Vercel backend deployment adapter and runbook prepared.
- Neon demo Postgres used through the pooled runtime connection string.
- Synthetic organization, users, technicians, and work orders available for
  demo/evidence.
- Repeatable hosted smoke-test script and evidence template available.
- Manual GitHub Actions hosted smoke workflow available.
- Repeatable synthetic demo seed/reset tooling available for local/demo
  databases.
- Smoke-test proof for:
  - `/health`
  - organization onboarding
  - login and refresh
  - technician creation
  - work-order creation
  - assignment/manual reassignment
  - technician queue
  - status transitions
  - audit event visibility
  - CSV ingestion
  - dashboard metrics
  - attachment upload if storage is configured
- v1.3 hosted smoke harness available for:
  - client, property, and vendor records
  - linked work-order creation
  - internal versus client-visible communication
  - approval request state
  - proof-gated closeout
  - closeout package JSON and printable exports
  - operations reporting
  - dashboard CSV exports
  - tenant JSON export without credential/provider fields
- Portfolio TechSync Ops page prepared with:
  - problem statement
  - architecture summary
  - what the POC proves
  - screenshots or walkthrough
  - GitHub link
  - hosted API/demo/walkthrough link when available
  - known limitations
- Portfolio case-study source copy available in `PORTFOLIO_TECHSYNC_OPS.md`.

Deferred from v1.2:

- Real customer onboarding
- Live billing
- App-store release
- Offline sync
- Real push notifications
- Full client/homeowner portal
- Closeout PDF packages
- Deep accounting integrations
- Public Vercel/portfolio linking

v1.2 exit criteria:

- Repo is clean, pushed, and CI passes.
- Public docs consistently use TechSync Ops positioning.
- All 10 requirement batches are captured.
- Requirement coverage is mapped in `TECHSYNC_OPS_TRACEABILITY.md`.
- Neon migration is at `0001 (head)` or later.
- Hosting adapter and runbook exist, but deployment remains deferred until the
  end of v1.3.
- Demo uses synthetic data only.
- Portfolio page or case-study shell exists.
- Evidence screenshots/notes are captured.
- Known limitations are visible, not hidden.

## v1.3 - PMC Operations Expansion

Goal:

TechSync Ops moves from a strong POC foundation into a more complete PMC
operations prototype with first-class property/client/vendor context,
client-facing visibility, closeout proof, stronger operational reporting, and a
final Vercel/portfolio showcase gate.

Primary audience:

- PMC operators
- Maintenance coordinators
- Dispatch managers
- Prospective pilot users

Likely scope:

- First-class property records:
  - client records
  - vendor records
  - property name/address
  - unit/building identifiers
  - owner/client association
  - repeated issue history
  - mobile PMC directory create/edit workflow now started in v1.3
  - mobile work-order form entity linking now started in v1.3
  - mobile work-order form before-save context review now started in v1.3
- Client/homeowner access model:
  - client/viewer role
  - scoped work-order visibility
  - backend and mobile client-visible comment flow now started in v1.3
  - approval/comment actions now started in v1.3
  - client-safe status/proof view
- Communication timeline:
  - internal notes
  - client-visible messages
  - vendor-visible messages
  - status and proof events
  - audit/event separation
  - backend message visibility guardrail now started in v1.3
  - mobile communication timeline now started in v1.3
  - vendors are now scoped to linked active vendor records and vendor-visible
    messages
- Completion proof and closeout:
  - required proof rules
  - manager override reason
  - before/after photos
  - receipts
  - backend completion gate now started in v1.3
  - backend closeout package summary now started in v1.3
  - printable HTML/text closeout export now started in v1.3
  - lightweight binary PDF closeout export now started in v1.3
  - closeout attachment JSON/CSV handoff manifest now started in v1.3 for
    evidence portability without exposing private storage paths
- Dispatch improvements:
  - workload board now started in v1.3 with backend/mobile dispatch view
  - SLA-risk flags now started in v1.3 dispatch board
  - duplicate-detection warnings now started in v1.3 for manual work-order
    preflight checks
  - manual override tracking
  - pause/escalate/cancel/archive lifecycle states now started in v1.3, with
    manager-only archive guardrails
- Reporting improvements:
  - aging work orders
  - overloaded technicians
  - property hotspots
  - backend operations report now started in v1.3
  - mobile operations report view now started in v1.3
  - completion cycle-time reporting now started in v1.3
  - operations report and dispatch board CSV exports now started in v1.3
  - client/property/vendor CSV exports now started in v1.3
  - tenant JSON export now started in v1.3 for admin-controlled data
    portability evidence
  - mobile risk/capacity/hotspot chart bars now started in v1.3
  - mobile completion cycle-time chart bars and operations-report CSV evidence
    now started in v1.3
  - estimated/actual work-order cost fields, backend cost summary reporting,
    mobile cost chart/cards, and operations-report CSV cost evidence now
    started in v1.3
  - deep accounting integrations remain later polish
- Operational hardening:
  - error monitoring
  - uptime monitoring
  - backup/restore documentation
  - local/demo operations runbook now started for backup, restore, export,
    lifecycle, and monitoring evidence
  - stricter synthetic demo reset process now started with
    `scripts/seed_demo_data.py` and `DEMO_DATA_RUNBOOK.md`
  - role-by-role UX sweep now started with `ROLE_UX_SWEEP.md` and a
    role-specific mobile landing band
  - role UX evidence readiness audit now started for synthetic login coverage,
    screenshot plan uniqueness, safety guardrails, and role privacy/control
    expectations
  - manager-only in-app role evidence screen now started for readiness checks,
    role capture plan, screenshot targets, and safety checklist
  - final capture worksheet and local role UX smoke script now prepared for
    synthetic role login/scope proof before screenshots
  - local role UX evidence-pack builder now started to summarize smoke status,
    missing screenshots, manual notes, and manual safety checks without
    committing local evidence artifacts
  - local manual notes template now started for 390px/320px layout,
    screen-reader, role-scope, and screenshot safety evidence
  - local role UX capture prep helper now started to create the ignored
    screenshot folder, manual-notes copy, and capture manifest before final
    evidence collection
  - local evidence summary JSON now started so screenshot/manual blockers can
    be reviewed by a machine-readable final gate before hosting
  - local role UX smoke now verifies seeded screenshot scenarios for manager
    lifecycle depth, technician active assigned work, client pending approval,
    viewer scope, linked vendor work, and vendor-visible messages
  - demo seed status now supports strict capture-readiness checks before the
    final local screenshot pass
  - Role Evidence and the generated capture manifest now show the final
    preflight order and viewport gates for 390px, 320px, and desktop review
    before hosting
  - strict evidence-pack validation now requires checklist, role-by-role, and
    viewport manual notes before the final local gate can pass
  - pre-hosting readiness doctor now summarizes tracked readiness tooling,
    ignored local artifacts, role smoke, screenshots, manual notes, and
    evidence summary JSON before the final Vercel gate
  - role UX smoke now diagnoses stale quiet viewer/vendor empty-state seed
    failures and points to reset, strict status, and smoke rerun recovery
  - failed role UX smoke output now prints failed checks and recovery guidance
    inline before the final manual capture pass
  - capture prep and the readiness doctor now name missing screenshot
    role/screen/filename rows so the final manual pass is exact
  - role landing now locates the active user with role badge, visible scope,
    next-move guidance, and privacy/operations guardrails before queue
    interaction
  - work-order detail now gives each role scope, current-action, and guardrail
    guidance before approval, messaging, proof, or lifecycle interaction
  - work-order create/edit now gives linked/manual context guidance before save
    so open client, property, vendor, and address context is intentional
  - synthetic no-work empty-state personas now have clearer display names while
    preserving stable `quiet-*` login emails for repeatable proof
  - role-aware navigator gating now started for manager-only mobile screens
  - accessibility labels/hints now started for role dashboards, work-order
    cards, forms, dispatch chips, approval controls, and lifecycle actions
- End-of-v1.3 showcase gate:
  - Vercel backend deployed behind HTTPS
  - `APP_ENV=demo` configured in Vercel
  - CORS locked to the intended portfolio/demo origins
  - hosted smoke-test evidence captured
  - v1.3 smoke evidence captured with `scripts/smoke_v13.py` and
    `V13_EVIDENCE_TEMPLATE.md`
  - DB-assisted synthetic invite acceptance and accepted-client approval smoke
    proof available locally before hosting, without writing raw invite tokens,
    bearer tokens, passwords, or database URLs to evidence artifacts
  - portfolio sliver/showcase link connected only after the portfolio is live

v1.3 exit criteria:

- Property/client/vendor concepts exist in the data model and API.
- Org admins/coordinators can manage client/property/vendor records from the
  mobile app and link them while creating/editing work orders.
- Org admins/coordinators can review selected client, property, vendor, and
  address context before saving a work order.
- Client-visible communication is separated from internal notes at the backend
  API/data layer, with mobile communication and approval UX started; a fuller
  client portal remains later work.
- A work order cannot be closed without attachment proof unless an org
  admin/coordinator override reason is recorded.
- At least one client/homeowner demo flow is showable with synthetic data:
  scoped work-order visibility, client-visible comments, and approval/decline
  actions are now started.
- Backend and mobile reporting show stale work, overloaded technicians, and
  property hotspot evidence, with dashboard CSV export and client/property/vendor
  CSV export plus tenant JSON export and mobile
  risk/capacity/hotspot/completion cycle-time/cost-summary chart bars started,
  plus closeout attachment handoff manifests started; deep accounting
  integrations and provider-level binary storage export automation still remain
  later polish.
- Backend and mobile dispatch board show unassigned active work, technician
  lanes, workload utilization, and SLA risk.
- Manual work-order creation warns coordinators about likely duplicates before
  creating another active/recent job.
- Vercel hosting and portfolio linking are completed as the final showcase step,
  not before the product feels robust enough to show.
- Documentation explains which v1.3 features are prototype-ready versus still
  deferred.
- Role-specific UX sweep evidence is started locally, with final screenshots
  and walkthrough evidence still required before hosting; manager-only route
  gating is now covered by client tests, and primary mobile API failure states
  now expose retry actions. Backend role-scope regressions now cover
  client/viewer unrelated-work blocking, linked-vendor scope, vendor-visible
  message enforcement, and technician unassigned-work blocking.
  Compact mobile touch targets and wrapping behavior are now hardened before
  screenshot capture, role-specific empty queue panels are now tested, and a
  role walkthrough/screenshot evidence manifest is prepared with viewer/vendor
  synthetic logins plus an automated readiness audit for linked-vendor scope.
  A manager-only Role Evidence screen now exposes the readiness audit,
  screenshot targets, manual proof checks, and capture safety checklist inside
  the app. A local role UX smoke script and `ROLE_UX_CAPTURE_PASS.md` now
  prepare the final synthetic role run, small-width/mobile comfort proof, and
  manual screen-reader notes. A local evidence-pack builder now summarizes
  smoke JSON plus screenshot inventory before the public showcase gate. Role
  landing now orients each user with role, scope, next-step, and guardrail
  guidance before they interact with the queue, and work-order detail/form
  screens now carry the same role-aware guidance into approval, messaging,
  proof, lifecycle, and linked/manual intake decisions.
  Accessibility helper coverage and a manual evidence template are now prepared
  for the final screen-reader pass.
- Hosted evidence shows the v1.3 API surface passes with synthetic data. The
  client invite/accept/accepted-client approval path can now be proven locally
  with a DB-assisted synthetic invitation before hosting, while the true hosted
  email/log path remains a final deployment-gate manual check.

## Beyond v1.3

Candidate later versions:

- v1.4: background jobs, notifications, PDF/email ingestion, richer exports, and
  richer branded PDF package styling.
- v1.5: offline mobile sync, maps/routing, calendar integration, and stronger
  technician field UX.
- v2.0: paid pilots, production-grade monitoring/backups, legal docs, billing,
  and real customer onboarding controls.
