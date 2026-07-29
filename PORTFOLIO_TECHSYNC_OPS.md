# TechSync Ops Portfolio Case Study

Use this as the source copy for the portfolio project page. Replace placeholder
links only after the hosted smoke test passes.

## Page Title

TechSync Ops

## Short Positioning

Multi-tenant maintenance command platform for PMCs and field-service teams.

## One-Line Summary

TechSync Ops brings maintenance intake, dispatch, technician updates, proof
capture, reporting, and tenant-safe operations into one hosted POC for property
management and field-service workflows.

## Problem

PMCs and field-service teams often manage maintenance through scattered emails,
spreadsheets, calls, text threads, and disconnected vendor notes. That makes it
hard to know what is urgent, who owns the job, what proof was collected, whether
clients were updated, and which properties keep creating repeat work.

## What The POC Proves

- A tenant-safe backend can isolate each PMC/company's data.
- A self-service organization can onboard and immediately create operational
  users.
- Work orders can be created manually, imported from CSV, or received through
  integration boundaries.
- Dispatch can assign or reassign work to technicians.
- Technician queues and status transitions can be tracked through the API and
  mobile client.
- Audit events can reconstruct work-order activity.
- Attachment proof can be stored as metadata, with S3-compatible upload support
  available when storage is configured.
- Hosted demo mode can prove the product without enabling real customer data,
  live billing, SMTP, or production storage by default.

## Architecture Summary

```text
React Native / Expo mobile client
        |
        v
FastAPI backend on Vercel
        |
        v
Neon Postgres with tenant-scoped data model and Alembic migrations
        |
        +-- S3-compatible object storage boundary for proof files
        +-- Stripe test-mode billing boundary, deferred for v1.2
        +-- SMTP/email boundary, logged or deferred in APP_ENV=demo
```

## Current Stack

- React Native / Expo
- FastAPI
- SQLAlchemy / psycopg2
- Neon Postgres
- Alembic migrations
- JWT auth
- Postgres Row Level Security policies as a database backstop
- S3-compatible attachment storage boundary
- GitHub Actions CI
- Vercel hosting path for v1.2

## Demo Journey

1. Create a synthetic PMC organization.
2. Log in as the organization admin.
3. Create a synthetic technician.
4. Create a synthetic maintenance work order.
5. Assign the work order to the technician.
6. Log in as the technician.
7. View assigned work in the technician queue.
8. Move the work order from open to in progress to completed.
9. Attach synthetic proof metadata.
10. Review audit events and dashboard metrics.
11. Import a synthetic CSV work order.

## Portfolio Links

- GitHub: https://github.com/hypnoticdata777/Techsync
- Hosted API: add after v1.2 smoke test passes
- Walkthrough/demo: add after screenshots or recording are captured

## Screenshot Checklist

Use synthetic data only.

- [ ] Portfolio hero/project card
- [ ] API `/health` result
- [ ] FastAPI docs or endpoint overview
- [ ] Organization onboarding
- [ ] Login
- [ ] Technician creation
- [ ] Work-order list
- [ ] Work-order detail
- [ ] Assignment/status transition
- [ ] Dashboard metrics
- [ ] Smoke-test evidence summary

## Honest v1.2 Status

TechSync Ops v1.2 is a public POC, not a real-customer production system. It is
designed to demonstrate architecture, workflow, product direction, and hosted
readiness using synthetic data.

## Known Limitations

- Vercel Python runtime is Beta.
- `APP_ENV=demo` intentionally allows SMTP, object storage, and Stripe to remain
  deferred unless explicitly configured.
- Full client/homeowner portal is planned for v1.3.
- First-class property/client/vendor records are planned for v1.3.
- Offline sync, push notifications, closeout PDF packages, background jobs, and
  deep accounting integrations are later roadmap items.
- Real customer onboarding requires production secrets, monitoring, backups,
  privacy/terms, and operational support processes.

## Suggested Portfolio CTA

View the GitHub repo, review the hosted API proof, or read the v1.2/v1.3
roadmap.
