# TechSync Ops Role Lane UX

This document defines the six user lanes TechSync Ops must keep predictable as the product matures. Each lane should answer four questions on screen: where am I, what can I do, who receives the next handoff, and what is intentionally outside my lane.

## Shared Operating Shape

TechSync Ops is one workflow with separated lanes:

1. Intake enters through admin/coordinator/client-visible request creation.
2. Coordination links the request to client, property, vendor, technician, status, proof, and approvals.
3. Field execution moves assigned work through status updates, notes, and completion proof.
4. Client/vendor communication stays in explicit visibility channels.
5. Approval and closeout turn field work into reviewed, explainable evidence.
6. Viewer access summarizes linked client work without mutation controls.

## Role Lanes

### Org Admin

- Lane: Tenant Command
- Job: Own the full operating picture across people, properties, vendors, work, proof, and risk.
- Works with: Coordinator, technician, client, vendor, and read-only owner stakeholders.
- Can do: Create linked work, manage directory data, review reports, archive closeouts.
- Not in this lane: Mix synthetic proof with real data or blur internal/client/vendor message lanes.

### Coordinator

- Lane: Dispatch Control
- Job: Turn intake into assigned, visible, and approval-ready work without losing context.
- Works with: Admin oversight, technicians, client approvals, and vendor-visible updates.
- Can do: Create work, assign technicians, request approval, coordinate vendor/client updates.
- Not in this lane: Expose internal notes externally or leave linked work without an owner.

### Technician

- Lane: Field Execution
- Job: Work the assigned queue, update status, leave notes, and attach proof.
- Works with: Coordinator receives status movement, proof, and field notes.
- Can do: Update assigned status, add internal notes, attach proof, escalate blockers.
- Not in this lane: Edit directory records, see unrelated jobs, or request client approval.

### Client

- Lane: Client Decision
- Job: Review linked work, visible updates, proof, and approval requests.
- Works with: Coordinator receives approval decisions and client-visible feedback.
- Can do: Review linked work, approve or decline requests, send client-visible messages.
- Not in this lane: See internal notes, see vendor-only context, or change operations status.

### Viewer

- Lane: Owner Snapshot
- Job: Inspect visible work status and proof without changing the record.
- Works with: Client-facing updates and proof flow into a read-only owner view.
- Can do: Read linked status, review visible messages, review proof context.
- Not in this lane: Use mutation controls, see internal notes, or see unrelated client work.

### Vendor

- Lane: Vendor Delivery
- Job: Track linked vendor work and respond through the vendor-visible path.
- Works with: Coordinator receives vendor updates while client/internal lanes stay protected.
- Can do: Review linked vendor work, send vendor-visible messages, track proof context.
- Not in this lane: See internal/client messages, see other vendor work, or change client approvals.

## UX Rules

- Every home queue must show the user's lane, handoff partners, and success signal before the list.
- Every work-order detail page must show what the role can do and what is intentionally unavailable.
- Empty states should still explain the lane, not just say there is no data.
- Controls must disappear by role when they are not valid, but the page should still explain why the lane is limited.
- Message visibility must remain explicit: internal, client-visible, and vendor-visible are separate product paths.
- The next owner, waiting state, and visible audience should be available anywhere a work order is reviewed.
