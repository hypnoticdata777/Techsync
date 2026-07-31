# TechSync Ops Role UX Sweep

This file tracks the local-only role-by-role UX sweep before hosting. It should
stay focused on whether each role can understand its landing surface, reach its
primary workflow, recover from common empty/error states, and avoid seeing
actions that belong to another role.

Hosting and portfolio linking remain the final gate after this sweep is
complete.

## Current Slice

Date: 2026-07-30

Status: started

Implemented:

- Added tested role workflow helpers in `client/src/utils/roleWorkflows.js`.
- Added a role-specific work-order landing band in the mobile client.
- Added manager action cards for:
  - PMC directory
  - dispatch board
  - operations report
  - evidence checklist
  - new work order
- Added role-specific landing copy and empty states for:
  - org admin
  - coordinator
  - technician
  - client
  - viewer
  - vendor
- Added queue summary counts for total, open, active, and pending approval work.
- Added a role-aware work-order detail command panel with status, approval,
  proof, and message summary tiles.
- Added a work-order form review panel that summarizes selected client,
  property, vendor, and address context before save.
- Added tested role-aware route registration so manager-only screens are not
  mounted for technician, client, viewer, or vendor roles.
- Added a manager-only Role Evidence screen that renders automated readiness
  checks, role capture plan, screenshot targets, and safety checklist inside
  the app before hosting.
- Added a reusable retry/error panel for primary mobile API failures, including
  work-order list, dispatch board, operations report, PMC directory, and
  work-order detail message/attachment subloads.
- Added backend regression coverage proving client/viewer users cannot open
  unrelated client-linked work orders by ID, viewer message requests are forced
  to client-visible messages, and technicians cannot open unassigned
  work-order details or attachment subresources.
- Raised compact mobile touch targets and wrapping behavior for report filters,
  directory tabs/options, work-order form selectors/status chips, detail
  visibility tabs/actions, retry buttons, and tappable work-order cards.
- Added tested role-aware empty queue panel copy for admin, coordinator,
  technician, client, viewer, and vendor states, with create-work action only
  for manager roles.
- Added a tested role walkthrough manifest covering synthetic role logins,
  route/screenshots to capture, expected visible/hidden controls, and public
  evidence safety checks.
- Added a tested role UX evidence readiness audit that verifies synthetic login
  coverage, screenshot targets, unique filenames, safety checks, manager
  controls, non-manager hidden controls, technician assigned routing,
  client/viewer privacy, and linked-vendor scope before manual screenshots.
- Added `ROLE_UX_EVIDENCE_TEMPLATE.md` and expanded the synthetic seed to
  include viewer/vendor logins plus secondary no-work viewer/vendor profiles
  for final empty-state screenshots.
- Added tested accessibility labels/hints for role dashboard actions,
  work-order cards, dispatch chips, form inputs/selectors, approval controls,
  attachment controls, messages, and lifecycle actions.
- Added `ACCESSIBILITY_EVIDENCE.md` for the final screen-reader and
  small-width proof pass.
- Preserved technician routing to `/work-orders/mine`; client/viewer scoping
  remains handled by the backend `/work-orders` endpoint.
- Added linked-vendor UX copy and walkthrough targets for vendor queue, vendor
  detail, and vendor empty-state evidence.
- Added vendor-specific message visibility in the mobile work-order detail
  communication timeline while keeping viewers read-only.
- Added backend regression coverage for linked-vendor work-order scoping,
  vendor-visible message enforcement, and vendor/viewer attachment mutation
  blocking.
- Added tested in-app evidence dashboard data so the final local screenshot
  pass can be driven from the mobile UI, not only Markdown.
- Added manual UX proof checks to the in-app Role Evidence screen for running
  each synthetic role, 390px and 320px width comfort, manual screen-reader
  notes, and screenshot safety review.
- Added `ROLE_UX_CAPTURE_PASS.md` as the final local capture checklist and
  evidence worksheet.
- Added `scripts/smoke_role_ux.py` to log in as every synthetic role and
  produce sanitized role-scope API evidence before screenshots.
- Added `scripts/build_role_ux_evidence_pack.py` to summarize sanitized smoke
  JSON, expected screenshot filenames, missing screenshot rows, and manual
  evidence checks into a local-only Markdown report.
- Added `ROLE_UX_MANUAL_NOTES_TEMPLATE.json` and evidence-pack
  `--manual-notes` support so 390px/320px layout, screen-reader, role-scope,
  and screenshot safety observations can be recorded locally and validated.
- Added `scripts/prepare_role_ux_capture.py` so the ignored screenshot folder,
  manual-notes copy, and capture manifest can be generated without overwriting
  filled notes by default.
- Added exact blocker printing and optional sanitized summary JSON output to
  the evidence-pack builder.
- Replaced remaining Pydantic v1-style payload `.dict()` calls with
  `.model_dump()` in create/update paths to remove the known backend warning.
- Hardened unfiltered technician work-order listing so the mobile technician
  queue cannot drift from the active assigned `/work-orders/mine` behavior.
- Polished narrow work-order detail summary tiles so important values such as
  approval state can wrap on 320px-class screens.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
```

Result:

- Client tests passed: `7 passed suites`, `43 passed tests`.
- Backend tests passed: `165 passed`; the prior Pydantic `dict()` deprecation
  warning no longer appears.
- Compile passed: `python -m compileall -q server scripts`.
- Diff hygiene passed: `git diff --check`, with normal Windows LF/CRLF
  warnings.
- Evidence-pack script coverage is included in backend pytest.
- Local browser DOM proof confirmed `lena.tech@demo.techsyncops.dev` sees
  `Total work orders: 0` and `No assigned jobs` after the technician route
  hardening.
- Current capture-pass automation is prepared; final shareable screenshots and
  manual screen-reader notes remain local evidence tasks before hosting.

## Role Matrix

| Role | Landing State | Primary Actions | Status |
|---|---|---|---|
| org_admin | Admin Workspace | Directory, Dispatch, Report, Evidence, New Work | Manager routes mounted |
| coordinator | Coordinator Queue | Directory, Dispatch, Report, Evidence, New Work | Manager routes mounted |
| technician | Technician Queue | Assigned queue, status/proof from details | Manager routes hidden |
| client | Client View | Visible linked work orders, approvals/messages from details | Manager routes hidden |
| viewer | Viewer Snapshot | Read-only visible linked work orders | Manager routes hidden |
| vendor | Vendor View | Linked vendor work, vendor messages, proof context | Manager/internal/client controls hidden |

## Remaining Sweep Items

- Capture mobile screenshots for each role using synthetic demo data.
  Walkthrough manifest/template, automated readiness audit, in-app manual
  checklist, role UX smoke script, manual notes template, capture prep helper,
  evidence-pack builder, and summary JSON output are prepared;
  final screenshots still need a running local/demo API and client.
- Verify role-specific empty states with seeded and empty queues.
  Empty-state code/tests and secondary no-work screenshot personas are
  implemented; technician empty-state DOM proof passed, while viewer/vendor
  final screenshot proof still needs a clean seed reset with the updated script.
- Verify client/viewer cannot see internal messages or unrelated work.
  Covered by backend regression tests; final screenshot proof still needed.
- Verify vendors cannot see unrelated vendor work, internal messages, or
  client-visible messages.
  Covered by backend regression tests; final screenshot proof still needed.
- Verify technician cannot see unassigned/unrelated work.
  Covered by backend regression tests; final screenshot proof still needed.
- Verify manager-only actions are absent for technician/client/viewer/vendor.
  Started with tested navigator route gating; final screenshot proof still
  needed.
- Verify all primary screens have clear retry states after API failures.
  Implemented in code; final screenshot proof still needed.
- Validate text wrapping and touch target comfort on small mobile widths.
  Touch target polish and in-app 390px/320px checklist are implemented; final
  screenshot proof and local manual notes still needed.
- Validate screen-reader labels/hints for role dashboards, approvals,
  lifecycle actions, dispatch chips, and work-order forms.
  Helper tests, primary control labels, and manual Role Evidence checklist are
  implemented; local manual notes and final proof still needed.
- Run the final screenshot/walkthrough pass only after local product depth is
  otherwise complete.
