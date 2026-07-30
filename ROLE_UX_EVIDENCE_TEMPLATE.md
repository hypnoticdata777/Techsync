# TechSync Ops Role UX Evidence Template

Use this file for the final local or hosted pre-public walkthrough. It should be
completed only with synthetic demo data from `scripts/seed_demo_data.py`.

Hosting and portfolio linking remain the final gate. This template prepares the
evidence path; it does not mean the demo has been deployed.

## Run Metadata

- Date:
- Git commit:
- Environment: local / hosted demo
- API base URL:
- Demo database target:
- Operator:
- Seed command used:
- Screenshot storage location:

## Synthetic Login Set

Use the shared synthetic password only from the seed command output. Do not paste
the password here.

| Role | Synthetic Login | Purpose |
|---|---|---|
| org_admin | `admin.demo@techsync.local` | Tenant control, reports, dispatch, directory, work creation |
| coordinator | `coordinator.demo@techsync.local` | Intake, assignment, client follow-up, closeout readiness |
| technician | `lena.tech@techsync.local` | Assigned queue, status update, proof upload |
| client | `client.demo@techsync.local` | Linked work, client-visible messages, approval decision |
| viewer | `owner-group.demo@techsync.local` | Read-only linked owner/board snapshot |
| vendor | `apex.demo@techsync.local` | Staged vendor-access guardrail |

## Screenshot Manifest

Use these exact filenames so the portfolio evidence stays easy to audit.
The filenames and role/safety expectations are generated from
`client/src/utils/roleWalkthrough.js`; the automated readiness audit should pass
before manual capture.

| Role | Route / Screen | Screenshot Filename | Required Proof |
|---|---|---|---|
| org_admin | WorkOrdersList | `techsync-ops-org_admin-01-queue.png` | Admin landing band, manager actions, and queue summary visible |
| org_admin | PmcDirectory | `techsync-ops-org_admin-02-directory.png` | Clients, properties, and vendors can be managed |
| org_admin | DispatchBoard | `techsync-ops-org_admin-03-dispatch.png` | Unassigned work, technician lanes, capacity, and SLA risk visible |
| org_admin | OperationsReport | `techsync-ops-org_admin-04-report.png` | Risk, capacity, hotspots, and completion cycle bars visible |
| org_admin | WorkOrderForm | `techsync-ops-org_admin-05-create-work.png` | Client/property/vendor selectors and review panel visible |
| coordinator | WorkOrdersList | `techsync-ops-coordinator-01-queue.png` | Coordinator landing band and manager action cards visible |
| coordinator | WorkOrderForm | `techsync-ops-coordinator-02-create-work.png` | Duplicate warning path and linked context review are reachable |
| coordinator | DispatchBoard | `techsync-ops-coordinator-03-dispatch.png` | Coordinator can inspect unassigned work and technician load |
| coordinator | WorkOrderDetails | `techsync-ops-coordinator-04-detail.png` | Status, approval request, messages, and proof summary visible |
| technician | WorkOrdersList | `techsync-ops-technician-01-assigned-queue.png` | Technician sees assigned work only |
| technician | WorkOrderDetails | `techsync-ops-technician-02-detail-status.png` | Allowed status buttons, notes, messages, and proof controls visible |
| technician | WorkOrdersList | `techsync-ops-technician-03-empty-assigned.png` | No assigned jobs empty state is clear when queue is empty |
| client | WorkOrdersList | `techsync-ops-client-01-client-queue.png` | Only linked client work is visible |
| client | WorkOrderDetails | `techsync-ops-client-02-approval-detail.png` | Approval/decline controls show only when approval is pending |
| client | WorkOrderDetails | `techsync-ops-client-03-client-messages.png` | Client-visible messages appear; internal tab is hidden |
| viewer | WorkOrdersList | `techsync-ops-viewer-01-viewer-queue.png` | Only linked viewer work is visible |
| viewer | WorkOrderDetails | `techsync-ops-viewer-02-readonly-detail.png` | Visible status/messages/proof context without action controls |
| viewer | WorkOrdersList | `techsync-ops-viewer-03-viewer-empty.png` | No visible snapshot empty state is clear when scoped queue is empty |
| vendor | WorkOrdersList | `techsync-ops-vendor-01-vendor-staged.png` | Vendor staged/disabled state is explicit |

## Per-Role Checks

- [ ] `getRoleEvidenceReadinessAudit()` passes before screenshots are captured.
- [ ] `getRoleEvidenceChecklistMarkdown()` output matches this screenshot plan.
- [ ] Admin sees Directory, Dispatch, Report, and New Work actions.
- [ ] Coordinator sees Directory, Dispatch, Report, and New Work actions.
- [ ] Technician does not see Directory, Dispatch, Report, or New Work actions.
- [ ] Technician queue uses assigned work only.
- [ ] Client does not see internal messages.
- [ ] Client does not see unrelated client work.
- [ ] Viewer has no mutation controls.
- [ ] Viewer does not see internal messages.
- [ ] Vendor sees staged/disabled access messaging.
- [ ] Empty states are captured where meaningful.
- [ ] Retry/error states are captured or documented if API failure proof is
      needed.

## Safety Review

- [ ] Screenshots use only the synthetic demo tenant.
- [ ] No real organization, client, vendor, technician, resident, property,
      address, attachment, or location data appears.
- [ ] No terminal window, environment variable, provider dashboard, token,
      password, database URL, or secret appears.
- [ ] Browser URL bars are cropped or safe.
- [ ] Screenshots are reviewed before portfolio/investor use.

## Notes

- Issues found:
- Follow-up fixes:
- Approved for portfolio use: yes / no
