# TechSync Ops Role UX Sweep

This file tracks the local-only role-by-role UX sweep before hosting. It should
stay focused on whether each role can understand its landing surface, reach its
primary workflow, recover from common empty/error states, and avoid seeing
actions that belong to another role.

Hosting and portfolio linking remain the final gate after this sweep is
complete.

## Current Slice

Date: 2026-07-29

Status: started

Implemented:

- Added tested role workflow helpers in `client/src/utils/roleWorkflows.js`.
- Added a role-specific work-order landing band in the mobile client.
- Added manager action cards for:
  - PMC directory
  - dispatch board
  - operations report
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
- Preserved technician routing to `/work-orders/mine`; client/viewer scoping
  remains handled by the backend `/work-orders` endpoint.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
```

Result:

- Client tests passed: `5 passed suites`, `25 passed tests`.
- Backend tests passed: `119 passed`.

## Role Matrix

| Role | Landing State | Primary Actions | Status |
|---|---|---|---|
| org_admin | Admin Workspace | Directory, Dispatch, Report, New Work | Manager routes mounted |
| coordinator | Coordinator Queue | Directory, Dispatch, Report, New Work | Manager routes mounted |
| technician | Technician Queue | Assigned queue, status/proof from details | Manager routes hidden |
| client | Client View | Visible linked work orders, approvals/messages from details | Manager routes hidden |
| viewer | Viewer Snapshot | Read-only visible linked work orders | Manager routes hidden |
| vendor | Vendor View | Explicit staged/not-enabled state | Documented guardrail |

## Remaining Sweep Items

- Capture mobile screenshots for each role using synthetic demo data.
- Verify role-specific empty states with seeded and empty queues.
- Verify client/viewer cannot see internal messages or unrelated work.
  Covered by backend regression tests; final screenshot proof still needed.
- Verify technician cannot see unassigned/unrelated work.
  Covered by backend regression tests; final screenshot proof still needed.
- Verify manager-only actions are absent for technician/client/viewer/vendor.
  Started with tested navigator route gating; final screenshot proof still
  needed.
- Verify all primary screens have clear retry states after API failures.
  Implemented in code; final screenshot proof still needed.
- Validate text wrapping and touch target comfort on small mobile widths.
  Touch target polish is implemented in code; final screenshot proof still
  needed.
- Run the final screenshot/walkthrough pass only after local product depth is
  otherwise complete.
