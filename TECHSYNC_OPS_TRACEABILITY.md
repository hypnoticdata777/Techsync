# TechSync Ops Requirements Traceability

Date: July 28, 2026

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
separation, closeout proof, stronger reporting, and the final Vercel/portfolio
showcase gate.

## Batch-Level Traceability

| Batch | Requirement Area | v1.2 Status | v1.3+ Status |
|---|---|---|---|
| 1 | Business Requirements | Partially proven: one source of truth for tenant, users, technicians, work orders, assignment, status, proof metadata, audit, ingestion, and dashboard metrics. | Property/client/vendor context is entering the API in v1.3; client visibility, closeout packages, property hotspots, and richer reporting continue in v1.3. |
| 2 | Business Rules | Partially proven: tenant scoping, roles, technician assignment boundaries, status/audit events, manual reassignment, priority support. | Client-visible/internal-note separation, client-scoped work-order visibility, and proof-gated closeout begin in v1.3; escalations expand next. |
| 3 | Constraints | Captured as guardrails: tenant privacy, synthetic data, CSV remains useful, offline/deep integrations deferred. | Consent-aware location, offline sync, advanced routing, PDF/email ingestion, accounting integrations staged later. |
| 4 | External Interfaces | Partially proven: CSV import, webhook intake, attachment storage boundary, Stripe/email boundaries. | Printable closeout export begins in v1.3; CSV export, SMS/push, calendar/maps, accounting/export, binary PDFs, and deeper storage workflows expand later. |
| 5 | Features | Partially proven: central work-order intake, assignment, technician queue/status, attachment proof boundary, dashboard metrics. | Client/property/vendor CRUD, backend communication visibility, and operations reporting UI begin in v1.3; dispatch board, client/homeowner portal, cost trends, and richer hotspot UX expand through v1.3+. |
| 6 | Functional Requirements | Partially proven: admin onboarding, role-scoped users, work orders, technician recommendation/assignment, technician status, CSV/webhook ingestion. | Proof-gated closeout, backend closeout summaries, printable closeout export, client-visible comments, client-scoped visibility, and client approvals begin in v1.3; admin-created non-technician roles, archive/pause/escalate/cancel depth, duplicate detection, binary PDF polish, and real notifications expand in v1.3+. |
| 7 | Nonfunctional Requirements | Partially proven: app-layer tenant isolation, RLS policies, audit trail, structured logs, hosted-demo config. | Performance targets, retry/offline resilience, backup/restore/export, monitoring, and accessibility evidence remain v1.2/v1.3 operational work. |
| 8 | Quality Attributes | Partially proven: security, auditability, maintainability, and core reliability boundaries. | Scalability, operational observability, and field usability evidence mature through hosted smoke tests and v1.3 workflows. |
| 9 | System Requirements | Partially proven: multi-tenant backend API, relational model for current core entities, mobile client, object storage boundary, deployment pipeline. | Properties, clients, vendors, and work-order messages are v1.3 foundation work; approvals, background jobs, monitoring, backups, and web admin dashboard expand in v1.3+. |
| 10 | User Requirements | Partially proven: coordinator/admin/dispatcher/technician flows are represented in API/mobile POC. | Operations-manager reporting now has a backend endpoint and mobile admin/coordinator view in v1.3; client/homeowner scoped visibility, comments, and approval decisions are started, with fuller portal UX later. |

## v1.2 Must Be True Before Calling The Checkpoint Complete

- Repo is clean, pushed, and CI passes.
- Public docs consistently use TechSync Ops positioning.
- All 10 requirement batches are captured and traceable.
- Vercel adapter and deployment runbook are ready but hosting is intentionally
  deferred until the end of v1.3.
- Neon migration is verified against the demo database.
- Sanitized evidence is captured with `V12_EVIDENCE_TEMPLATE.md`.
- Portfolio case-study source exists in `PORTFOLIO_TECHSYNC_OPS.md`.
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
- Binary closeout PDF rendering beyond printable HTML/text export.
- Duplicate detection.
- Calendar/maps/routing.
- Background jobs.
- Deep accounting integrations.

## v1.3 Priority Requirements

v1.3 should focus on the highest-value PMC product gaps:

1. First-class property/client/vendor data model and tenant-scoped API.
2. Client/homeowner scoped access and approval/comment flow, with scoped
   visibility, comments, and approval decisions now started.
3. Internal versus client-visible communication timeline.
4. Required completion proof and manager override reason.
5. Dispatch board with workload and SLA-risk visibility.
6. Duplicate-detection warnings.
7. Reporting for stale work, overloaded technicians, property hotspots, and
   completion cycle time, with the first mobile report view now started.
8. End-of-v1.3 Vercel deployment, hosted smoke evidence, and portfolio sliver
   link after the product feels robust enough to show.

## Confidence Statement

The requirement set is complete as an input and roadmap baseline. The v1.2 scope
is intentionally narrower than the full product: it proves the tenant-safe
command-platform backbone and creates portfolio/investor-safe evidence. The
remaining PMC operations depth is captured for v1.3+, with Vercel hosting held
until the end of v1.3 instead of driving the product sequence too early.
