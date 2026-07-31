# TechSync Ops Accessibility Evidence

Date: July 30, 2026

This file tracks local-only accessibility readiness before public screenshots,
hosting, or portfolio linking.

## Current Scope

Implemented in this pass:

- Shared accessibility helpers in `client/src/utils/accessibility.js`.
- Tested evidence labels for work-order cards, summary counters, role actions,
  form inputs, and lifecycle transitions.
- Work-order queue cards announce title, status, priority, approval state, and
  SLA risk when available.
- Role dashboard summary counters announce explicit label/value pairs.
- Manager action cards expose button roles, labels, and navigation hints.
- Work-order detail approval, messaging, attachment, edit, and status lifecycle
  controls expose button roles, labels, and hints.
- Work-order form title, description, customer, address, service type, priority,
  directory selectors, save, and cancel controls expose purpose labels/hints.
- Dispatch board work chips and summary tiles expose meaningful labels.
- The manager-only Role Evidence screen now includes visible manual evidence
  checks for each synthetic role, 390px/320px width comfort, screen-reader
  notes, and screenshot safety.

## Manual Evidence Pass

Use synthetic demo data only.

- [ ] Screen reader pass: admin queue and manager action cards.
- [ ] Screen reader pass: coordinator work-order detail lifecycle actions.
- [ ] Screen reader pass: client pending approval approve/decline controls.
- [ ] Screen reader pass: technician assigned queue and proof upload controls.
- [ ] Screen reader pass: dispatch board summary and work chips.
- [ ] Screen reader pass: work-order form required title, service type, PMC
      selectors, and save/cancel actions.
- [ ] Screen reader pass: Role Evidence screen readiness checks, role rows,
      screenshot filenames, and safety checklist.
- [ ] Small-width pass: no accessible control text is visually clipped.
- [ ] Narrow-width pass: 320px-class mobile width wraps controls and evidence
      rows without overlap.
- [ ] Touch comfort pass: primary controls remain easy to tap.
- [ ] Screenshot safety pass: no secrets, provider dashboards, terminal windows,
      database URLs, real customer data, or passwords.

## Remaining Accessibility Work

- Run the manual screen-reader pass on device or emulator using
  `ROLE_UX_CAPTURE_PASS.md`.
- Capture final role screenshots after all non-hosting local product depth is
  complete.
- Add deeper automated component-level accessibility tests if the app later adds
  a React Native testing renderer.
- Validate color contrast with screenshots during the final UX evidence pass.
