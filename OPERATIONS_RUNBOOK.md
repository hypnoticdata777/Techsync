# TechSync Ops Operations Runbook

Date: July 29, 2026

This runbook captures the local/demo operational readiness path for backup,
restore, export, monitoring, and lifecycle evidence. It does not deploy or host
the app. Vercel and portfolio linking remain the final showcase gate.

## Scope

- Use only local or synthetic demo data.
- Keep database URLs, provider screenshots, tokens, passwords, SMTP keys,
  storage keys, and Stripe secrets out of screenshots and commits.
- Prefer provider-managed backups for hosted Neon Postgres, with local `pg_dump`
  evidence used only against demo data.
- Treat this as investor POC readiness, not production operations certification.

## Work-Order Lifecycle Evidence

Supported lifecycle states:

| State | Meaning | Active Surface |
|---|---|---|
| `open` | Intake or queued work | Queue, stale report, dispatch |
| `in_progress` | Technician or vendor execution is underway | Queue, stale report, dispatch, workload |
| `paused` | Work is on hold but still visible | Queue, stale report, dispatch |
| `escalated` | Coordinator/manager review is required | Queue, stale report, dispatch, workload, SLA risk |
| `completed` | Work is closed with proof or manager override | History, closeout, reports |
| `cancelled` | Work stopped without completion | History |
| `archived` | Historical record retained outside active operations | History only |

Manager-only behavior:

- Org admins and coordinators can archive work orders.
- Technicians can pause or escalate assigned work, but cannot archive work.
- Archived work is terminal.

Synthetic demo seed coverage:

- `DEMO-WO-006` proves paused work.
- `DEMO-WO-007` proves escalated work.
- `DEMO-WO-008` proves archived historical work.

## Backup Evidence

Use provider-managed backups for hosted Neon. Before public showcase, capture:

- Neon project name and region.
- Backup/restore or point-in-time recovery setting visible in Neon.
- Date and operator.
- Confirmation that screenshots contain no connection string or password.

Optional local/demo logical backup command:

```powershell
pg_dump "$env:DATABASE_URL" --format=custom --file ".\tmp\techsync-demo.backup"
```

Do not commit backup files. If the backup file is created inside the repo, delete
it after evidence capture.

## Restore Evidence

Restore only into a local disposable database or a provider-created disposable
demo branch. Never restore over the active demo database without an explicit
snapshot and rollback plan.

Disposable restore example:

```powershell
createdb techsync_restore_check
pg_restore --dbname "postgresql://localhost/techsync_restore_check" ".\tmp\techsync-demo.backup"
```

Minimum restore checks:

- Alembic version table exists.
- Synthetic organization exists.
- Expected synthetic counts match `DEMO_DATA_RUNBOOK.md`.
- No real customer data appears.

## Export Evidence

Already implemented local/demo exports:

- Operations report CSV.
- Dispatch board CSV.
- Client CSV.
- Property CSV.
- Vendor CSV.
- Closeout package HTML/text/PDF export.

Before hosting, capture one export from synthetic data and confirm:

- Filename is demo-safe.
- Rows belong to the synthetic tenant only.
- No provider secrets, terminal windows, or real customer data are visible.

## Monitoring Evidence

For the first hosted demo, minimum monitoring should include:

- `/health` endpoint check.
- Hosting provider function/runtime logs.
- Structured backend logs with `LOG_FORMAT=json` where supported.
- Manual smoke evidence from `scripts/smoke_v13.py`.

Deferred production monitoring:

- Error tracking service.
- Uptime monitor with alert routing.
- Database performance alerts.
- Object storage usage alerts.

## Pre-Showcase Checklist

- [ ] Latest migrations applied to the demo database.
- [ ] Synthetic seed reset completed.
- [ ] `alembic current` shows latest head.
- [ ] Backend tests pass.
- [ ] Client tests pass.
- [ ] Lifecycle states visible in synthetic demo data.
- [ ] Backup setting evidence captured without secrets.
- [ ] Restore procedure dry-run documented or intentionally deferred.
- [ ] Export evidence captured with synthetic data.
- [ ] Monitoring plan documented for the hosted demo.
