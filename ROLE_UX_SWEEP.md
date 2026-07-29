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
- Preserved technician routing to `/work-orders/mine`; client/viewer scoping
  remains handled by the backend `/work-orders` endpoint.

Verification:

```powershell
npm.cmd run test:ci
server\venv\Scripts\python.exe -m pytest server\tests -p no:cacheprovider
```

Result:

- Client tests passed: `4 passed suites`, `16 passed tests`.
- Backend tests passed: `113 passed`.

## Role Matrix

| Role | Landing State | Primary Actions | Status |
|---|---|---|---|
| org_admin | Admin Workspace | Directory, Dispatch, Report, New Work | Started |
| coordinator | Coordinator Queue | Directory, Dispatch, Report, New Work | Started |
| technician | Technician Queue | Assigned queue, status/proof from details | Started |
| client | Client View | Visible linked work orders, approvals/messages from details | Started |
| viewer | Viewer Snapshot | Read-only visible linked work orders | Started |
| vendor | Vendor View | Explicit staged/not-enabled state | Documented guardrail |

## Remaining Sweep Items

- Capture mobile screenshots for each role using synthetic demo data.
- Verify role-specific empty states with seeded and empty queues.
- Verify client/viewer cannot see internal messages or unrelated work.
- Verify technician cannot see unassigned/unrelated work.
- Verify manager-only actions are absent for technician/client/viewer/vendor.
- Verify all primary screens have clear retry states after API failures.
- Validate text wrapping and touch target comfort on small mobile widths.
- Run the final screenshot/walkthrough pass only after local product depth is
  otherwise complete.
