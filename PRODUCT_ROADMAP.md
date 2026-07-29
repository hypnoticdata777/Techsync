# TechSync Ops Product Roadmap

Date: July 28, 2026

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
- Client/homeowner access model:
  - client/viewer role
  - scoped work-order visibility
  - approval/comment actions
  - client-safe status/proof view
- Communication timeline:
  - internal notes
  - client-visible messages
  - status and proof events
  - audit/event separation
  - backend message visibility guardrail now started in v1.3
- Completion proof and closeout:
  - required proof rules
  - manager override reason
  - before/after photos
  - receipts
  - backend completion gate now started in v1.3
  - closeout package summary
- Dispatch improvements:
  - workload board
  - SLA-risk flags
  - duplicate-detection warnings
  - manual override tracking
- Reporting improvements:
  - aging work orders
  - overloaded technicians
  - property hotspots
  - backend operations report now started in v1.3
  - completion cycle time
  - basic CSV export
- Operational hardening:
  - error monitoring
  - uptime monitoring
  - backup/restore documentation
  - stricter synthetic demo reset process
- End-of-v1.3 showcase gate:
  - Vercel backend deployed behind HTTPS
  - `APP_ENV=demo` configured in Vercel
  - CORS locked to the intended portfolio/demo origins
  - hosted smoke-test evidence captured
  - portfolio sliver/showcase link connected only after the portfolio is live

v1.3 exit criteria:

- Property/client/vendor concepts exist in the data model and API.
- Client-visible communication is separated from internal notes at the backend
  API/data layer, with frontend/client portal UX still to complete.
- A work order cannot be closed without attachment proof unless an org
  admin/coordinator override reason is recorded.
- At least one client/homeowner demo flow is showable with synthetic data.
- Backend reporting shows stale work, overloaded technicians, and property
  hotspot evidence, with dashboard UI still to complete.
- Vercel hosting and portfolio linking are completed as the final showcase step,
  not before the product feels robust enough to show.
- Documentation explains which v1.3 features are prototype-ready versus still
  deferred.

## Beyond v1.3

Candidate later versions:

- v1.4: background jobs, notifications, PDF/email ingestion, exports, and
  closeout package generation.
- v1.5: offline mobile sync, maps/routing, calendar integration, and stronger
  technician field UX.
- v2.0: paid pilots, production-grade monitoring/backups, legal docs, billing,
  and real customer onboarding controls.
