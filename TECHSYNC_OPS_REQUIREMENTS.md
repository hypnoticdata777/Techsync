# TechSync Ops Product Requirements

Version: 1.2 planning baseline
Date: July 28, 2026
Owner: Carlos Sanchez Gonzalez

## Product Positioning

TechSync Ops is a multi-tenant maintenance command platform for property
management companies (PMCs) and field-service teams that need intake, dispatch,
technician proof, client communication, reporting, and operational
accountability in one place.

The current codebase already proves the backbone: tenant-scoped organizations,
users, technicians, work orders, matching, ingestion, audit events, attachments,
and hosted-demo configuration. This document reframes the product around the
PMC operations workflow and becomes the active requirements source for v1.2 and
v1.3 planning.

## Requirement Batch Coverage

The attached PMC operations brief contained all 10 requirement batches:

1. Business Requirements
2. Business Rules
3. Constraints
4. External Interface Requirements
5. Features
6. Functional Requirements
7. Nonfunctional Requirements
8. Quality Attributes
9. System Requirements
10. User Requirements

All 10 batches are captured below.

## 1. Business Requirements

- Provide PMCs and field-service teams with one source of truth for maintenance
  intake, assignment, technician updates, client communication, and closeout
  proof.
- Reduce manual follow-up by enforcing structured technician status updates,
  photos, receipts, and completion notes.
- Support multi-tenant operations so each PMC/company can manage its own users,
  properties, clients, vendors, technicians, and work orders.
- Improve dispatch quality through prioritization, workload visibility, skill
  matching, proximity, and manual override.
- Give clients/homeowners controlled visibility into approvals, status, proof,
  and communication without exposing internal operations.
- Produce reporting that shows aging work, SLA risk, technician workload,
  property hotspots, and completion trends.

## 2. Business Rules

- Every work order must belong to exactly one organization/tenant and one
  property.
- Users can only view or modify records permitted by organization, role, and
  assignment.
- Technicians can update assigned work and upload proof, but cannot edit
  financial/client fields unless authorized.
- Client-visible communication must be separated from internal notes.
- High-priority or emergency work orders must bypass normal queue ordering and
  trigger escalation notifications.
- Work orders cannot be closed without required completion proof unless a
  manager applies a documented override.
- Assignment recommendations may be automated, but dispatchers must be able to
  override them.
- All status, assignment, communication, and proof changes must create audit
  events.

## 3. Constraints

- The platform must support privacy separation across tenants, clients,
  technicians, vendors, and internal users.
- External property-management software integrations may arrive gradually, so
  CSV/import workflows must remain useful.
- Mobile technician workflows must work under field conditions with small
  screens, variable signal, and fast photo-capture needs.
- Offline sync, advanced routing, PDF/email ingestion, and deep accounting
  integrations can be staged after MVP.
- Location tracking must be consent-based and jurisdiction-aware.
- The system should not attempt to replace accounting, payroll, or legal
  compliance systems in the first version.

## 4. External Interface Requirements

- CSV import/export for work orders, properties, vendors, technicians, and
  reports.
- Webhook/API intake for external portals, forms, or property management
  systems.
- Email, SMS, and push notification interfaces for dispatch, client updates,
  approvals, and escalations.
- Calendar integration for technician schedules, property visits, and follow-up
  dates.
- Maps/routing interface for technician proximity, route planning, and
  service-area constraints.
- File storage interface for photos, receipts, invoices, PDFs, and closeout
  packages.
- Future accounting/export interface for owner charges, vendor invoices, and
  billing reconciliation.

## 5. Features

- Central work-order intake with normalized fields, source tracking,
  duplicates, priority, and property/client context.
- Dispatch board with technician workload, assignment recommendations, SLA
  risk, and manual reassignment.
- Technician mobile workflow for job queue, status updates, notes,
  before/after photos, receipts, and completion proof.
- Client/homeowner portal for approval status, updates, messages, proof, and
  controlled visibility.
- Communication timeline that separates internal notes from client-facing
  messages.
- Vendor/technician profiles with skills, service area, reliability notes,
  capacity, and affinity history.
- Operational reporting for aging work orders, workload, cost trends, property
  hotspots, and completion cycle time.

## 6. Functional Requirements

- The system shall allow an organization admin to create users and assign roles
  such as admin, coordinator, technician, vendor, client, and viewer.
- The system shall allow authorized users to create, import, edit, assign, and
  archive work orders.
- The system shall detect likely duplicate work orders during import or manual
  creation.
- The system shall recommend technicians based on skill, proximity, capacity,
  workload, priority, and historical affinity.
- The system shall allow dispatchers to manually assign, reassign, pause,
  escalate, or cancel work orders.
- The system shall allow technicians to update status, add notes, upload
  before/after photos, upload receipts, and request additional approval.
- The system shall allow clients to approve, decline, comment, or view status
  only within their authorized scope.
- The system shall generate closeout packages containing timeline, proof,
  receipts, notes, cost summary, and completion status.
- The system shall send notifications based on status changes, approvals
  needed, SLA risk, assignment, and completion.

## 7. Nonfunctional Requirements

- Tenant data isolation must be enforced at application and
  database/security-rule levels.
- Common dashboard views should load within 3 seconds for normal tenant data
  volumes.
- Technician status/photo updates should be optimized for mobile networks and
  retry gracefully after transient failures.
- The platform should keep an immutable audit trail for sensitive workflow
  changes.
- The system should support backup, restore, and export procedures for tenant
  records.
- Security logs and operational errors should be observable by administrators.
- The UI should meet accessibility expectations for role dashboards and client
  approval views.

## 8. Quality Attributes

- Reliability: dispatch and technician updates must not silently fail.
- Security: tenant data, client messages, photos, receipts, and access
  instructions must be protected.
- Scalability: the platform should support growth from a small PMC to
  multi-team operations.
- Usability: coordinators should see what needs action without digging through
  every work order.
- Auditability: managers should be able to reconstruct decisions, assignments,
  approvals, and closeout evidence.
- Maintainability: integrations and assignment logic should be modular enough
  to evolve without rewriting the platform.

## 9. System Requirements

- Multi-tenant backend API with organization-scoped data access and role-based
  permissions.
- Relational database or equivalent model for organizations, users, roles,
  properties, clients, vendors, technicians, work orders, assignments, files,
  messages, approvals, and audit events.
- Technician mobile app or responsive PWA for field updates, photos, receipts,
  and route/day views.
- Web admin dashboard for coordinators, managers, billing/admin users, and
  reporting.
- Object storage for photos, receipts, PDFs, and closeout packets.
- Background job system for notifications, imports, duplicate checks, SLA
  checks, and report generation.
- Monitoring, logging, error tracking, backup, and deployment pipeline for
  production operations.

## 10. User Requirements

- As a maintenance coordinator, I want every request in one queue so I can
  prioritize the day.
- As a dispatcher, I want assignment recommendations so I can choose the best
  technician faster.
- As a technician, I want a simple mobile queue so I know what to do next and
  what proof is required.
- As a PMC admin, I want role permissions and tenant controls so staff and
  clients only see appropriate data.
- As a client/homeowner, I want to see approval status and proof without needing
  to call for updates.
- As an operations manager, I want reports showing stale work, overloaded
  technicians, and properties with repeated maintenance problems.

## Current Implementation Fit

Already represented in the codebase:

- Multi-tenant organizations, users, roles, technicians, work orders, audit
  events, invitations, password reset tokens, priority rules, attachments, and
  billing boundary tables.
- FastAPI backend with SQLAlchemy/psycopg2 repositories and Alembic migration
  `0001`, plus v1.3 migration work for clients, properties, vendors, and work
  order entity links.
- JWT auth, bcrypt password hashing, role dependencies, tenant-scoped data
  access, and Postgres RLS policies as a database backstop.
- Work-order CRUD, status transitions, assignment, technician queue, CSV
  import, webhook intake, dashboard metrics, S3-compatible attachment upload,
  and Stripe test-mode boundary.
- v1.3 backend work-order messages with explicit `internal`, `client-visible`,
  and `vendor-visible` separation.
- v1.3 mobile work-order communication timeline with client-visible comments,
  vendor-visible comments, internal notes for staff, client/viewer users
  limited to client-visible communication, and vendors limited to
  vendor-visible communication.
- v1.3 client/viewer work-order visibility scoped by active client email.
- v1.3 vendor work-order visibility scoped by active vendor email, with
  vendor users limited to linked work orders and vendor-visible messages.
- v1.3 client approval state, staff approval request endpoint, client
  approve/decline endpoint, and mobile approval controls.
- v1.3 backend completion gate that blocks completed status without attachment
  proof unless an org admin/coordinator records an override reason.
- v1.3 backend operations report for stale work, overloaded technicians, and
  property hotspots.
- v1.3 dashboard CSV exports for the operations report and dispatch board.
- v1.3 client/property/vendor CSV exports for tenant-owned PMC directory data.
- v1.3 tenant-owned JSON export bundle for organization, users, technicians,
  clients, properties, vendors, work orders, messages, audit events, and
  attachment metadata, excluding credentials and provider secrets.
- v1.3 mobile operations report view for org admins/coordinators to scan stale
  work, overloaded technicians, and property hotspots.
- v1.3 mobile operations report chart bars for risk mix, technician capacity
  pressure, and property hotspot activity.
- v1.3 completion cycle-time reporting by service type, with mobile chart bars
  and operations-report CSV export evidence.
- v1.3 mobile PMC directory workflow for org admins/coordinators to create and
  edit clients, properties, and vendors.
- v1.3 mobile work-order form selectors for linking client, property, and
  vendor context during manual work-order creation/editing.
- v1.3 mobile work-order form before-save review summary for linked/manual/open
  client, property, vendor, and address context.
- v1.3 role-specific mobile work-order landing band for admin, coordinator,
  technician, client, viewer, and vendor states.
- v1.3 active-user orientation on the role landing screen: role badge, visible
  scope, next move, and privacy/operations guardrails for admin, coordinator,
  technician, client, viewer, and vendor users.
- v1.3 role-aware work-order detail guidance for admin, coordinator,
  technician, client, viewer, and vendor users, covering visible scope,
  current action, and guardrails before approval, messaging, proof, and
  lifecycle controls.
- v1.3 work-order interoperability cues for next owner, waiting-on state, and
  visible audiences so admin, coordinator, technician, client, viewer, and
  vendor users understand handoffs before taking action.
- v1.3 work-order create/edit guidance for linked/manual intake states so
  client, property, vendor, and address context gaps are visible before save.
- v1.3 manager-only mobile navigation gating for directory, dispatch,
  operations report, and work-order creation screens.
- v1.3 role-scope regression coverage for client/viewer unrelated-work
  blocking, client-visible message enforcement, and technician assigned-work
  boundaries.
- v1.3 role-scope regression coverage for linked-vendor work-order visibility,
  vendor-visible message enforcement, and vendor/viewer attachment mutation
  blocking.
- v1.3 compact mobile touch target and text-wrapping hardening for primary role
  workflow controls before public screenshot capture.
- v1.3 accessibility labels/hints and tested helper coverage for role
  dashboards, work-order cards, form inputs, dispatch chips, approval controls,
  attachments, messages, and lifecycle actions.
- v1.3 tested role-specific empty queue panel states for manager, technician,
  client, viewer, and vendor contexts.
- v1.3 role walkthrough manifest and evidence template for synthetic
  screenshot capture across admin, coordinator, technician, client, viewer, and
  vendor roles.
- v1.3 role UX evidence readiness audit for synthetic login coverage,
  screenshot-plan uniqueness, public safety guardrails, role controls, privacy
  expectations, and linked-vendor scope before manual capture.
- v1.3 manager-only mobile Role Evidence screen for the readiness audit,
  role capture plan, screenshot targets, and screenshot safety checklist before
  hosting.
- v1.3 manual Role Evidence proof checklist and capture worksheet for
  synthetic role execution, small-width/mobile comfort, screen-reader notes,
  and screenshot safety before hosting.
- v1.3 local role UX smoke script for synthetic role login and role-scope API
  evidence before final screenshots.
- v1.3 pause, escalate, cancel, and manager-only archive lifecycle states for
  work orders, with backend/mobile handling, dashboard counts, dispatch
  visibility, regression tests, and synthetic seed examples.
- v1.3 local/demo operations runbook for backup, restore, export, lifecycle,
  and monitoring evidence.
- v1.3 backend dispatch board for unassigned active work, technician lanes,
  workload utilization, and SLA risk.
- v1.3 mobile dispatch board view for org admins/coordinators to scan
  unassigned work, technician load, and SLA risk.
- v1.3 duplicate-warning preflight for manual work-order creation using
  property/address plus service type, with mobile coordinator confirmation.
- v1.3 backend closeout package summary for work-order status, proof,
  attachments, messages, and audit events.
- v1.3 HTML/text/PDF closeout export endpoint for work-order summary, proof,
  attachments, communication, and audit history.
- v1.3 closeout attachment JSON/CSV handoff manifest for binary evidence
  portability without embedding files, private storage paths, or storage
  credentials.
- v1.3 estimated/actual work-order cost fields, invoice-reference capture,
  operations cost-summary reporting, mobile cost chart/cards, and CSV export
  evidence.
- React Native/Expo mobile client for onboarding, auth, work-order list,
  details, creation, invitation acceptance, and password reset.
- `APP_ENV=demo` for hosted investor-safe POC deployment with deferred SMTP,
  storage, and Stripe where intentionally configured.
- Synthetic demo seed/reset tooling for a repeatable tenant story covering
  users, technicians, clients, properties, vendors, work orders, messages,
  events, proof metadata, dashboard reports, dispatch board, duplicate
  warnings, approvals, and closeout evidence.

Important gaps for the PMC operations product:

- Property/client/vendor records are now first-class v1.3 entities with
  backend APIs and a mobile directory workflow; deeper role-specific list
  filtering, bulk import/export, and richer relationship views remain.
- Full client/homeowner portal UI is not built yet; scoped work-order
  visibility, client-visible comments, and approval/decline actions have
  started in v1.3.
- Calendar/maps, background jobs, final role screenshot evidence, deep
  accounting integrations, and provider-level binary storage export automation
  remain roadmap items.

## Version Planning Boundary

- v1.2 is the checkpoint-complete product foundation: safe, documented,
  tenant-scoped, demo-database ready, and clearly positioned as TechSync Ops for
  PMC maintenance operations.
- v1.3 is the next productization pass: properties, clients, vendors, approvals,
  communication separation, closeout packages, richer reporting, and the final
  Vercel/portfolio showcase gate.

See `PRODUCT_ROADMAP.md` for version scope and exit criteria.
See `TECHSYNC_OPS_TRACEABILITY.md` for the requirement-by-requirement mapping
to v1.2, v1.3, and later work.
