# TechSync Ops Requirements Traceability

Date: July 29, 2026

## Purpose

This matrix confirms that every requirement batch from
`TECHSYNC_OPS_REQUIREMENTS.md` is accounted for and mapped to the current
version plan. It separates:

- **Implemented / v1.2 proof** - present in code or covered by the public POC
  readiness path.
- **v1.2 documentation / guardrail** - documented honestly for public review,
  but not fully implemented.
- **v1.3 active/planned** - part of the next PMC operations product expansion.
- **Later** - intentionally staged after v1.3.

## Summary

All 10 requirement batches are captured. v1.2 proves the tenant-safe
intake/dispatch/technician workflow, demo database path, and documentation
backbone with synthetic data. v1.3 now carries the deeper PMC-specific
operations model: properties, clients, vendors, approvals, communication
separation, closeout proof, stronger reporting, role-lane UX, and a later
public showcase path.

## Batch-Level Traceability

| Batch | Requirement Area | v1.2 Status | v1.3+ Status |
|---|---|---|---|
| 1 | Business Requirements | Partially proven: one source of truth for tenant, users, technicians, work orders, assignment, status, proof metadata, audit, ingestion, and dashboard metrics. | Property/client/vendor context is entering the API in v1.3; client visibility, closeout packages, property hotspots, and richer reporting continue in v1.3. |
| 2 | Business Rules | Partially proven: tenant scoping, roles, technician assignment boundaries, status/audit events, manual reassignment, priority support. | Client-visible/internal-note separation, client-scoped work-order visibility, and proof-gated closeout begin in v1.3; escalations expand next. |
| 3 | Constraints | Captured as guardrails: tenant privacy, synthetic data, CSV remains useful, offline/deep integrations deferred. | Consent-aware location, offline sync, advanced routing, PDF/email ingestion, accounting integrations staged later. |
| 4 | External Interfaces | Partially proven: CSV import, webhook intake, attachment storage boundary, Stripe/email boundaries. | HTML/text/PDF closeout export, closeout attachment JSON/CSV handoff manifests, dashboard CSV exports, client/property/vendor CSV exports, and admin tenant JSON export are now started in v1.3; SMS/push, calendar/maps, accounting/export, and provider-level binary storage export automation expand later. |
| 5 | Features | Partially proven: central work-order intake, assignment, technician queue/status, attachment proof boundary, dashboard metrics. | Client/property/vendor CRUD is now started in backend and mobile, backend communication visibility, operations reporting UI with chart bars, cost summary trends, and dispatch board begin in v1.3; client/homeowner portal and deeper hotspot analytics expand through v1.3+. |
| 6 | Functional Requirements | Partially proven: admin onboarding, role-scoped users, work orders, technician recommendation/assignment, technician status, CSV/webhook ingestion. | Proof-gated closeout, backend closeout summaries, printable closeout export, client-visible comments, client-scoped visibility, client approvals, duplicate-warning preflight, and pause/escalate/cancel/manager-only archive depth begin in v1.3; admin-created non-technician roles, binary PDF polish, and real notifications expand in v1.3+. |
| 7 | Nonfunctional Requirements | Partially proven: app-layer tenant isolation, RLS policies, audit trail, structured logs, hosted-demo config. | Local/demo backup/restore/export/monitoring runbook and admin tenant JSON export are now started, and primary mobile accessibility labels/hints now have helper coverage; performance targets, retry/offline resilience, provider backup evidence, monitoring, and final manual accessibility evidence remain v1.2/v1.3 operational work. |
| 8 | Quality Attributes | Partially proven: security, auditability, maintainability, and core reliability boundaries. | Scalability, operational observability, and field usability evidence mature through hosted smoke tests and v1.3 workflows. |
| 9 | System Requirements | Partially proven: multi-tenant backend API, relational model for current core entities, mobile client, object storage boundary, deployment pipeline. | Properties, clients, vendors, and work-order messages are v1.3 foundation work; approvals, background jobs, monitoring, backups, and web admin dashboard expand in v1.3+. |
| 10 | User Requirements | Partially proven: coordinator/admin/dispatcher/technician flows are represented in API/mobile POC. | Operations-manager reporting and dispatch board now have backend endpoints and mobile admin/coordinator views in v1.3; role-specific landing states, active-user role/scope/next-move guidance, role-aware work-order detail guidance, role-lane UX contract, home queue lane map, role-aware queue-card scan cues, detail action-path cues for approval/communication/proof/lifecycle, role event playbook cues for recurring work-order events, post-action outcome notices, client/viewer/vendor portal summaries, detail-page role boundaries, communication-lane notices, work-order handoff/interoperability cues, linked/manual work-order form guidance, empty queue panels, walkthrough manifest, manager-only navigator gating, and in-app role evidence dashboard are started; client/homeowner scoped visibility, comments, and approval decisions are started; vendor scoped visibility and vendor-visible messages are started; client/viewer/vendor/technician synthetic role logins are prepared; client/viewer/vendor and technician scope boundaries now have regression proof; the local role UX smoke script and capture worksheet are prepared for final screenshot/accessibility evidence, with fuller portal UX later. |

## v1.2 Must Be True Before Calling The Checkpoint Complete

- Repo is clean, pushed, and CI passes.
- Public docs consistently use TechSync Ops positioning.
- All 10 requirement batches are captured and traceable.
- Vercel adapter and deployment runbook are ready but hosting is intentionally
  deferred until the end of v1.3.
- Neon migration is verified against the demo database.
- Sanitized evidence is captured with `V12_EVIDENCE_TEMPLATE.md`.
- Portfolio case-study source exists in `PORTFOLIO_TECHSYNC_OPS.md`.
- Synthetic demo seed/reset tooling exists in `scripts/seed_demo_data.py` and
  `DEMO_DATA_RUNBOOK.md`.
- Portfolio public page or shell is prepared with POC status and limitations,
  but no hard public demo link is required until the v1.3 showcase gate.

## v1.2 Explicit Non-Goals

These are requirements captured by the product, but not required to finish v1.2:

- Real customer onboarding.
- Live billing.
- App-store release.
- Offline sync.
- Real push notifications.
- Full client/homeowner portal.
- Advanced approval workflow beyond basic approve/decline.
- Rich branded closeout PDF styling beyond the lightweight PDF evidence export.
- Duplicate detection beyond manual-entry warnings, including import-time and
  background checks.
- Calendar/maps/routing.
- Background jobs.
- Deep accounting integrations.

## v1.3 Priority Requirements

v1.3 should focus on the highest-value PMC product gaps:

1. First-class property/client/vendor data model, tenant-scoped API, and mobile
   directory workflow.
2. Client/homeowner scoped access and approval/comment flow, with scoped
   visibility, comments, and approval decisions now started.
3. Internal versus client-visible communication timeline.
4. Required completion proof and manager override reason.
5. Dispatch board with workload and SLA-risk visibility now started in
   backend/mobile v1.3.
6. Duplicate-detection warnings now started for manual work-order creation.
7. Reporting for stale work, overloaded technicians, property hotspots, and
   completion cycle time, with the first mobile report view, mobile chart bars,
   dashboard CSV exports, completion cycle/cost export evidence, and PMC
   directory entity CSV exports now started.
8. Pause, escalate, cancel, and manager-only archive lifecycle evidence, with
   active/archived visibility reflected in dispatch, reports, mobile actions,
   and synthetic demo data.
9. v1.3 hosted smoke evidence for PMC entity links, communication visibility,
   linked-vendor visibility, approval request state, proof-gated closeout,
   closeout exports, operations reporting, dashboard CSV exports, PMC
   directory entity CSV exports, closeout attachment manifests, and tenant JSON
   export.
10. Repeatable synthetic demo seed/reset tooling for the hosted/demo tenant.
11. Final local role UX capture evidence using `scripts/smoke_role_ux.py`,
   `ROLE_UX_CAPTURE_PASS.md`, the in-app Role Evidence screen, synthetic demo
   users, and the role-aware landing/detail/form handoff guidance during local
   product-maturity review.
12. Role-lane UX maturity for org admin, coordinator, technician, client,
   viewer, and vendor so each user understands their job, handoff partners,
   allowed controls, queue-level event lanes, and intentionally hidden
   controls.
13. Later Vercel deployment, hosted smoke evidence, and portfolio sliver link
   only after the product feels robust enough to show.

## Confidence Statement

The requirement set is complete as an input and roadmap baseline. The v1.2 scope
is intentionally narrower than the full product: it proves the tenant-safe
command-platform backbone and creates portfolio/investor-safe evidence. The
remaining PMC operations depth is captured for v1.3+, with role-lane UX now
treated as an active product-maturity track instead of waiting on deployment.
