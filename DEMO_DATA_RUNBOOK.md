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
- Secondary no-work viewer and vendor users for deterministic empty-state
  screenshot evidence.
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
$env:DATABASE_URL = (Get-Clipboard).Trim()
$env:DATABASE_URL.StartsWith("postgresql://")
$env:DATABASE_URL.Contains("-pooler")
python -m alembic upgrade head
python -m alembic current
cd ..
python scripts\seed_demo_data.py status
python scripts\seed_demo_data.py seed --reset-existing
python scripts\seed_demo_data.py status --strict
Remove-Item Env:DATABASE_URL
```

Use the direct Neon URL for `alembic upgrade head` and seeding. Use the pooled
Neon URL only for hosted/serverless runtime configuration.

If Windows Terminal shows a plain `C:\...>` prompt, run `powershell` first.
The `$env:` commands are PowerShell syntax. Copy only the direct connection
string from Neon, not a full language-specific code snippet.

To see synthetic demo login emails and the shared demo password after seeding:

```powershell
python scripts\seed_demo_data.py seed --reset-existing --show-credentials
```

Synthetic login emails printed by the seed include:

- `admin.demo@demo.techsyncops.dev`
- `coordinator.demo@demo.techsyncops.dev`
- `client.demo@demo.techsyncops.dev`
- `owner-group.demo@demo.techsyncops.dev`
- `apex.demo@demo.techsyncops.dev`
- `quiet-owner.demo@demo.techsyncops.dev`
- `quiet-vendor.demo@demo.techsyncops.dev`
- three technician accounts

## Local v1.3 Invite and Approval Proof

The normal invitation API does not return raw invite tokens. For a local/demo
smoke proof, `scripts/smoke_v13.py` can use the direct synthetic demo database
URL to insert a known hashed invitation token, then accept it through the public
API and use the accepted client token to approve a pending work order.

Use this only with synthetic/demo data:

```powershell
cd "C:\Users\hypno\Documents\Codex\2026-07-21\he\work\Techsync"
$env:DATABASE_URL = (Get-Clipboard).Trim()
server\venv\Scripts\python.exe scripts\smoke_v13.py --base-url "http://127.0.0.1:8000" --invite-database-url $env:DATABASE_URL --output v13-smoke-evidence.json
Remove-Item Env:DATABASE_URL
```

The evidence file records only sanitized statuses and IDs. It does not write
the database URL, raw invitation token, bearer token, or password.

## Expected Seed Counts

Expected approximate counts after a clean seed:

```text
users: 10
technicians: 3
clients: 3
properties: 3
vendors: 3
work_orders: 8
messages: 4
attachments: 1
events: 13
```

The final role UX smoke expects both secondary empty-state accounts:

- `quiet-owner.demo@demo.techsyncops.dev`
- `quiet-vendor.demo@demo.techsyncops.dev`

If `scripts/smoke_role_ux.py` reports `401` for either account, or if
`python scripts\seed_demo_data.py status --strict` exits non-zero, the demo
database is using an older or incomplete seed. Run the seed command again with
`--reset-existing` before final screenshots. A failed role smoke now prints the
failed checks plus stale-seed recovery guidance inline.

To diagnose an existing smoke evidence file without rerunning the API probe:

```powershell
python scripts\smoke_role_ux.py --diagnose role-ux-smoke-evidence.json
```

If the output reports a stale demo seed and lists the quiet viewer/vendor
emails, reset the synthetic tenant, confirm `status --strict`, then rerun the
role smoke against the local API.

Strict status checks:

- exact synthetic counts
- all ten synthetic login users
- manager lifecycle depth
- technician active assigned work targets
- client pending approval target
- viewer scoped work plus no-work viewer account
- linked Apex vendor work plus vendor-visible message target
- no-work vendor account

## Reset Only

```powershell
cd server
$env:DATABASE_URL = (Get-Clipboard).Trim()
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
