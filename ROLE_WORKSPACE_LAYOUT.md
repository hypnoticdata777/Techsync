# TechSync Ops Role Workspace Layout

## Decision

TechSync Ops uses one shared role workspace pattern across admin, coordinator,
technician, client, viewer, and vendor lanes:

- Left rail: stable navigation, lane scope, queue filters, and role-permitted
  creation or management actions.
- Center workspace: the primary data the user is acting on, such as work-order
  queues, linked client work, approval items, or vendor work.
- Right action rail: next-best action, waiting-on signals, operating guidance,
  and event-lane cues.

On narrow screens, the same order stacks vertically: identity and scope first,
then navigation/focus, then primary data, then next actions. The user should
never lose the role lane or the current queue focus when moving between screen
sizes.

## Visual Contract

- Backgrounds stay in the white/light-beige family, but the canvas is slightly
  toned down so it is not bright white.
- Blue, green, yellow, and red remain semantic signals, not decorative fills.
  They should appear on borders, text, and small status emphasis before large
  saturated panels.
- Controls use compact rectangular proportions with small radius. Large pill
  shapes are reserved for small labels or identity chips only.
- Roboto Serif remains the app typography direction for web. Text hierarchy
  should come from size, weight, spacing, and placement instead of loud colors.

## Role Navigation Baseline

Each role should always answer three questions from its home workspace:

- What can I see?
- What can I do next?
- What is waiting on me or my lane?

Role-specific navigation may differ, but it should map into the same zones:

- Org admin: tenant command, directory, reporting, evidence, risk, approvals.
- Coordinator: intake, assignment, dispatch risk, escalations, closeout review.
- Technician: assigned queue, status changes, proof capture, blockers.
- Client: linked requests, approvals, proof review, client-visible replies.
- Viewer: read-only linked work and proof context.
- Vendor: linked vendor work, vendor-visible updates, proof/request handoffs.

## Implementation Notes

- `WorkOrdersListScreen` is the reference implementation for the three-zone
  shell.
- `WorkOrderDetailsScreen` should stay quieter and denser than the first dark
  POC pass: compact cards, toned surfaces, and action sections sized around
  the text they contain.
- Future role pages should reuse the same model before adding new page-specific
  chrome.
