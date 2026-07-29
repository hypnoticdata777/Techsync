# TechSync Ops Product Roadmap

Date: July 28, 2026

## Roadmap Principle

TechSync Ops should advance in checkpoints that are easy to demo, easy to
verify, and honest about what is production-ready versus POC-ready. The next
checkpoint is v1.2: public POC completion. v1.3 is the first deeper PMC
operations expansion.

## v1.2 - Public POC Completion Checkpoint

Goal:

TechSync Ops is a hosted, portfolio-connected, investor-safe public POC for PMC
maintenance operations. It proves the multi-tenant backend, hosted database,
core intake/dispatch/technician workflow, and public product positioning without
using real customer data.

Primary audience:

- Portfolio viewers
- Investors/advisors
- Technical reviewers
- Early PMC discovery conversations

Scope:

- Product name and documentation updated to TechSync Ops.
- Active requirements source moved to `TECHSYNC_OPS_REQUIREMENTS.md`.
- Hosted FastAPI backend deployed behind HTTPS.
- Neon demo Postgres used through the pooled runtime connection string.
- `APP_ENV=demo` configured in the host secret manager.
- CORS locked to the intended portfolio/demo origins.
- Synthetic organization, users, technicians, and work orders available for
  demo/evidence.
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

Deferred from v1.2:

- Real customer onboarding
- Live billing
- App-store release
- Offline sync
- Real push notifications
- Full client/homeowner portal
- Full property/client/vendor data model
- Closeout PDF packages
- Deep accounting integrations

v1.2 exit criteria:

- Repo is clean, pushed, and CI passes.
- Public docs consistently use TechSync Ops positioning.
- All 10 requirement batches are captured.
- Hosted backend works over HTTPS.
- Neon migration is at `0001 (head)` or later.
- Runtime secrets are only in the host secret manager.
- Demo uses synthetic data only.
- Portfolio page or case-study shell exists.
- Evidence screenshots/notes are captured.
- Known limitations are visible, not hidden.

## v1.3 - PMC Operations Expansion

Goal:

TechSync Ops moves from a hosted POC into a more complete PMC operations product
prototype with first-class property/client context, client-facing visibility,
closeout proof, and stronger operational reporting.

Primary audience:

- PMC operators
- Maintenance coordinators
- Dispatch managers
- Prospective pilot users

Likely scope:

- First-class property records:
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
- Completion proof and closeout:
  - required proof rules
  - manager override reason
  - before/after photos
  - receipts
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
  - completion cycle time
  - basic CSV export
- Operational hardening:
  - error monitoring
  - uptime monitoring
  - backup/restore documentation
  - stricter synthetic demo reset process

v1.3 exit criteria:

- Property/client/vendor concepts exist in the data model or are intentionally
  mocked with a documented migration path.
- Client-visible communication is separated from internal notes.
- A work order cannot be closed without proof unless an override is recorded.
- At least one client/homeowner demo flow is showable with synthetic data.
- Reporting shows stale work, workload, and property hotspot evidence.
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
