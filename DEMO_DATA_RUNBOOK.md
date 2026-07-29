# TechSync Ops Demo Data Runbook

Date: July 29, 2026

## Purpose

`scripts/seed_demo_data.py` creates or resets one synthetic tenant for local,
Neon, or hosted-demo evidence work. It exists so the investor POC can be
refreshed repeatably without using real customer, property, vendor, technician,
or attachment data.

## Safety Model

- The script only targets the deterministic synthetic organization slug
  `techsync-ops-demo-pmc`.
- `reset` deletes only that organization row; tenant-owned rows are removed by
  database foreign-key cascade.
- The script does not print database URLs, tokens, or provider secrets.
- The default password is synthetic and demo-only. Do not use this script for
  real customer tenants.

## Demo Story Created

The seed creates:

- One PMC organization.
- Admin, coordinator, client, viewer, vendor, and technician users.
- Client records.
- Property records.
- Vendor records.
- Technician profiles with skills, capacity, zones, and availability.
- Active, stale, assigned, unassigned, completed, and duplicate-prone work
  orders.
- Client-visible and internal messages.
- Audit events.
- Synthetic proof attachment metadata.

This gives the dashboard, dispatch board, duplicate warnings, closeout package,
client approval state, and CSV exports useful data immediately.

## Commands

From the repo root:

```powershell
cd server
$env:DATABASE_URL = Get-Clipboard
alembic upgrade head
alembic current
cd ..
python scripts\seed_demo_data.py status
python scripts\seed_demo_data.py seed --reset-existing
python scripts\seed_demo_data.py status
Remove-Item Env:DATABASE_URL
```

Use the direct Neon URL for `alembic upgrade head` and seeding. Use the pooled
Neon URL only for hosted/serverless runtime configuration.

To see synthetic demo login emails and the shared demo password after seeding:

```powershell
python scripts\seed_demo_data.py seed --reset-existing --show-credentials
```

Synthetic login emails printed by the seed include:

- `admin.demo@techsync.local`
- `coordinator.demo@techsync.local`
- `client.demo@techsync.local`
- `owner-group.demo@techsync.local`
- `apex.demo@techsync.local`
- three technician accounts

## Expected Seed Counts

Expected approximate counts after a clean seed:

```text
users: 8
technicians: 3
clients: 2
properties: 3
vendors: 2
work_orders: 5
messages: 3
attachments: 1
events: 7
```

## Reset Only

```powershell
cd server
$env:DATABASE_URL = Get-Clipboard
cd ..
python scripts\seed_demo_data.py reset
python scripts\seed_demo_data.py status
Remove-Item Env:DATABASE_URL
```

## Evidence Notes

- Do not paste the database URL or secrets into this file.
- Do not capture screenshots that show environment variables or provider
  credentials.
- If the demo is publicly reachable, rotate/reset the synthetic tenant before
  and after live demonstrations.
