# TechSync Ops Role UX Capture Pass

Date: July 30, 2026

Purpose: finish the local-only role-by-role UX friction pass before any Vercel
or portfolio hosting. This pass uses only the synthetic demo tenant and the
manager-only in-app Role Evidence screen.

## Current Status

Prepared, automated, and partially exercised live:

- Role walkthrough manifest covers admin, coordinator, technician, client,
  viewer, and vendor.
- In-app Role Evidence screen shows automated readiness checks, role capture
  rows, screenshot targets, manual UX checks, and safety checklist.
- `scripts/smoke_role_ux.py` can log in as each synthetic role and produce
  sanitized role-scope evidence JSON.
- `scripts/build_role_ux_evidence_pack.py` can combine the sanitized smoke JSON
  local screenshot folder, and local manual notes JSON into a Markdown evidence
  report that lists missing screenshots and remaining manual checks.
- `scripts/prepare_role_ux_capture.py` can create the local screenshot folder,
  copy the manual notes template, and write a local capture manifest that lists
  the remaining screenshot targets.
- Backend role-scope tests cover client/viewer, vendor, and technician
  boundaries.
- Client tests cover role workflow helpers, route visibility, role evidence
  dashboard data, screenshot filenames, and manual UX check coverage.
- The local Neon-backed API was migrated through `0008 (head)`.
- Synthetic demo data was seeded with 10 users, 3 technicians, 3 clients,
  3 properties, 3 vendors, 8 work orders, 4 messages, 1 attachment, and
  13 events.
- `scripts/smoke_role_ux.py` passed locally against `http://127.0.0.1:8000`
  with sanitized role/API checks. Tokens were not saved. It now also fails
  early when the seeded demo tenant is missing screenshot-ready scenarios such
  as manager lifecycle depth, technician active assigned work, client pending
  approval, viewer scope, linked vendor work, or vendor-visible messages.
- Admin web login, admin workspace, and an admin work-order detail view were
  manually observed in the local Expo web client at `http://localhost:19006`.

Still pending for the final evidence pack:

- Full 21-screenshot capture using the manifest below.
- Explicit 390px and 320px layout comfort notes.
- Manual screen-reader/accessibility notes for each role.
- Final screenshot safety review before any portfolio or investor use.

## Local Run Commands

Use the direct local/demo database URL. Do not paste the URL into docs or
screenshots.

In Neon, copy the direct connection string with pooling off. In Windows
Terminal, make sure the prompt starts with `PS`. If it starts with plain
`C:\...>`, run `powershell` first.

```powershell
cd "C:\Users\hypno\Documents\Codex\2026-07-21\he\work\Techsync\server"
$env:DATABASE_URL = (Get-Clipboard).Trim()
$env:JWT_SECRET_KEY = "local-role-ux-proof-only-change-me"
python -m alembic upgrade head
python ..\scripts\seed_demo_data.py status
python ..\scripts\seed_demo_data.py seed --reset-existing
python ..\scripts\seed_demo_data.py status --strict
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal:

```powershell
cd "C:\Users\hypno\Documents\Codex\2026-07-21\he\work\Techsync\client"
npm start -- --web --port 19006
```

In a third terminal:

```powershell
cd "C:\Users\hypno\Documents\Codex\2026-07-21\he\work\Techsync"
server\venv\Scripts\python.exe scripts\smoke_role_ux.py --base-url "http://127.0.0.1:8000" --output role-ux-smoke-evidence.json
```

After screenshots are captured into `local-role-ux-evidence`, build the local
evidence report:

```powershell
cd "C:\Users\hypno\Documents\Codex\2026-07-21\he\work\Techsync"
server\venv\Scripts\python.exe scripts\prepare_role_ux_capture.py
# Use local-role-ux-capture-manifest.md as the screenshot checklist.
# Fill local-role-ux-manual-notes.json after the manual layout, screen-reader,
# role-scope, and screenshot safety pass.
server\venv\Scripts\python.exe scripts\build_role_ux_evidence_pack.py --smoke role-ux-smoke-evidence.json --screenshots local-role-ux-evidence --manual-notes local-role-ux-manual-notes.json --output role-ux-evidence-pack.md --summary-json role-ux-evidence-summary.json --environment local
```

Use `--strict` only when the report is expected to be complete; strict mode
returns non-zero if smoke evidence failed, screenshots are missing, or manual
notes are incomplete.

After capture:

```powershell
Remove-Item Env:DATABASE_URL
Remove-Item Env:JWT_SECRET_KEY
```

## Synthetic Logins

Shared synthetic password is the seed script default unless
`TECHSYNC_DEMO_PASSWORD` is set.

- `admin.demo@demo.techsyncops.dev`
- `coordinator.demo@demo.techsyncops.dev`
- `marco.tech@demo.techsyncops.dev`
- `client.demo@demo.techsyncops.dev`
- `owner-group.demo@demo.techsyncops.dev`
- `apex.demo@demo.techsyncops.dev`

Secondary no-work accounts for empty-state screenshots:

- Technician empty queue: `lena.tech@demo.techsyncops.dev`
- Viewer empty snapshot: `quiet-owner.demo@demo.techsyncops.dev`
- Vendor empty queue: `quiet-vendor.demo@demo.techsyncops.dev`

## Capture Widths

Capture or inspect each critical screen at:

- Mobile comfortable: 390 x 844
- Narrow mobile: 320 x 740
- Desktop/web preview: 1280 x 900

Pass criteria:

- No button label is clipped.
- No summary tile overlaps another tile.
- No cards sit inside cards awkwardly.
- Role action cards remain tappable.
- Work-order status, proof, approval, and message controls remain readable.
- Evidence rows wrap filenames and proof notes without horizontal scroll.

## Role Screenshot Targets

Use the filenames generated by `getScreenshotPlan()` and shown in the Role
Evidence screen.

Expected total: 21 screenshots.

- Admin: queue, directory, dispatch, report, create-work.
- Coordinator: queue, create-work, dispatch, detail.
- Technician: assigned queue and detail/status use Marco; empty assigned queue
  uses Lena.
- Client: queue, approval detail, client messages.
- Viewer: queue and read-only detail use the linked owner-group account; empty
  snapshot uses the quiet owner account.
- Vendor: vendor queue and vendor detail use Apex; empty vendor queue uses the
  quiet vendor account.

## Manual Screen-Reader Notes

Record observations here during the final device/emulator pass:

- [ ] Admin queue announces summary counters and Evidence action.
- [ ] Coordinator detail announces approval, message, attachment, and lifecycle
      controls.
- [ ] Technician queue announces assigned work title, status, priority, and
      available transitions.
- [ ] Client detail announces approval/decline controls only when pending.
- [ ] Viewer detail communicates read-only state and does not expose mutation
      controls.
- [ ] Vendor detail exposes vendor-visible message path and hides internal and
      client context.
- [ ] Role Evidence screen announces readiness status, role rows, screenshot
      filenames, and safety checklist clearly.

## Screenshot Safety Review

- [ ] No terminal windows visible.
- [ ] No database URLs visible.
- [ ] No provider dashboards visible.
- [ ] No bearer tokens, passwords, secrets, or API keys visible.
- [ ] No real customer, property, vendor, technician, address, location, file,
      or organization data visible.
- [ ] All captures use synthetic demo tenant data.

## Result Notes

Status: local API/client smoke proof passed; role screenshot capture is in
progress; manual screen-reader notes still pending.

Completed live:

- `python -m alembic upgrade head`
- `python -m alembic current` returned `0008 (head)`.
- `python ..\scripts\seed_demo_data.py seed --reset-existing`
- `python ..\scripts\seed_demo_data.py status --strict`
- Backend running on `http://127.0.0.1:8000`.
- Expo web running on `http://localhost:19006`.
- Admin login and admin work-order detail were manually observed.
- `scripts/smoke_role_ux.py` passed with primary-role and empty-state checks.
- `scripts/build_role_ux_evidence_pack.py` was added so final role evidence can
  be summarized without committing generated smoke JSON, screenshots, or local
  evidence-pack Markdown.
- `ROLE_UX_MANUAL_NOTES_TEMPLATE.json` now gives the final reviewer a local
  fillable notes file for 390px/320px layout, screen-reader, role-scope, and
  screenshot safety evidence; filled copies stay ignored.
- `scripts/prepare_role_ux_capture.py` now creates the ignored local capture
  manifest and manual-notes copy so the final screenshot pass can resume
  without rebuilding the plan by hand.
- `scripts/build_role_ux_evidence_pack.py` now prints exact screenshot/manual
  blockers and can write ignored `role-ux-evidence-summary.json` for a
  machine-readable final gate.
- `scripts/smoke_role_ux.py` now validates screenshot-ready seeded scenarios
  for manager lifecycle depth, technician active assigned work, client pending
  approval, viewer scope, linked vendor work, and vendor-visible messages.
- The local browser pass logged in as `lena.tech@demo.techsyncops.dev` and
  confirmed the technician empty-state DOM: `Total work orders: 0`,
  `No assigned jobs`, and no completed/archived assigned rows.
- The generic technician `/work-orders` route was hardened to use the same
  active assigned queue as `/work-orders/mine` when no filters are supplied.
- A live strict role smoke against the current local API reached primary roles
  but reported `401` for `quiet-owner.demo@demo.techsyncops.dev` and
  `quiet-vendor.demo@demo.techsyncops.dev`, which indicates the current demo
  database was seeded before the secondary empty-state personas were added.
  Run `python ..\scripts\seed_demo_data.py seed --reset-existing` against the
  local/demo database, then confirm
  `python ..\scripts\seed_demo_data.py status --strict` is ready before final
  screenshot capture.
- 320px work-order detail summary tiles now allow two-line values so approval
  text does not truncate awkwardly on narrow screens.
- Automated verification after this hardening:
  - Backend tests: `161 passed`, with one existing Pydantic `dict()`
    deprecation warning.
  - Client tests: `7 passed suites`, `43 passed tests`.
  - `python -m compileall -q server scripts`
  - `git diff --check` passed with normal Windows LF/CRLF warnings.

Known local setup note:

- Expo 50 on Node 24 can hit a Windows `node:sea` Metro external path issue.
  The local `node_modules` workaround proved the app can run, but the durable
  setup recommendation is Node 20 LTS until Expo is upgraded.
- The in-app browser automation surface provided DOM proof but not a working
  file screenshot method in this session, so final shareable image evidence
  still needs the normal manual capture pass.

Next action:

1. Complete manual screenshots from the Role Evidence screen and live role
   logins using `local-role-ux-capture-manifest.md`.
2. Re-run the clean seed with the updated no-work viewer/vendor personas before
   final empty-state screenshots.
3. Build `role-ux-evidence-pack.md` locally and resolve missing screenshot rows.
4. Record screen-reader notes.
5. Run screenshot safety review before portfolio use.
