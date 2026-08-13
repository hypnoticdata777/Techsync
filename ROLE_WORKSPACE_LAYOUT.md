# TechSync Ops Role Workspace Layout

## Decision

TechSync Ops uses one shared role workspace pattern across admin, coordinator,
technician, client, viewer, and vendor lanes:

- Left rail: a single Work Views control surface with count-bearing buttons
  that change the center list. Role scope, lane promise, and filter
  explanation live behind contextual `?` bubbles so the rail tells the user
  what they can look at without publishing instruction text everywhere. It
  uses a stronger beige rail background so fixed controls read separately from
  the working data.
- Center workspace: the primary data the user is acting on, such as work-order
  queues, linked client work, approval items, or vendor work. Work-order cards
  must show an obvious hover/pressed state because opening a record is a core
  interaction.
- Right action rail: next-best action, waiting-on signals, operating guidance,
  and event-lane cues. It uses the same fixed-rail treatment and scrolls inside
  the rail so long guidance does not push the primary queue out of view.
- Inline explanations should not compete with the work. Section purpose copy
  now lives behind compact `?` help bubbles. On hover, keyboard focus, or tap,
  the bubble opens a small contextual explanation window. Only one help bubble
  may stay active at a time, and clicking the active bubble dismisses it so
  tooltip copy never stacks over the workspace. On web, help popovers should
  render through a document-level portal and clamp away from viewport edges so
  they are not hidden by rails, cards, or scroll panes. The always-visible
  surface should keep only labels, counts, statuses, work titles, and actions.

On narrow screens, the same order stacks vertically: identity and scope first,
then Work Views, then primary data, then next actions. The user should never
lose the role lane or the current work view when moving between screen sizes.

## Visual Contract

- Backgrounds stay in the white/light-beige family, but the canvas is slightly
  toned down so it is not bright white.
- Blue, green, yellow, and red remain semantic signals, not decorative fills.
  They should appear on borders, text, and small status emphasis before large
  saturated panels.
- Controls use compact rectangular proportions with small radius. Large pill
  shapes are reserved for small labels or identity chips only.
- Left/right rails use stronger muted surfaces than the center workspace. The
  contrast should create a clear scan boundary without returning to the harsh
  dark POC look.
- Interactable cards and jump surfaces shade on hover/press so users can tell
  they are clickable before committing to a click.
- Explanatory paragraphs belong in contextual help bubbles next to the label or
  title they explain. Work-order cards should not show synthetic seed/story
  descriptions inline unless that text is part of the user-facing record body.
- Non-action summaries must remain visually quieter than clickable work cards,
  while clickable cards should feel slightly raised at rest and slightly
  pressed/darker on interaction.
- Roboto Serif remains the app typography direction for web. Text hierarchy
  should come from size, weight, spacing, and placement instead of loud colors.
- The signed-in app header gives TechSync the strongest brand weight with a
  polished circled copyright mark; page titles and role content stay smaller
  so the product identity anchors the workspace without overwhelming the data.

## Role Navigation Baseline

Each role should always answer three questions from its home workspace:

- What can I see?
- What can I do next?
- What is waiting on me or my lane?

Role-specific Work Views may differ, but they should map into the same zones:

- Org admin: tenant command, directory, reporting, evidence, risk, approvals.
- Coordinator: intake, assignment, dispatch risk, escalations, closeout review.
- Technician: assigned queue, status changes, proof capture, blockers.
- Client: linked requests, approvals, proof review, client-visible replies.
- Viewer: read-only linked work and proof context.
- Vendor: linked vendor work, vendor-visible updates, proof/request handoffs.

## Implementation Notes

- `WorkOrdersListScreen` is the reference implementation for the three-zone
  shell. It keeps role purpose, lane meaning, work-order seed context, action
  guidance, and next-action rationale behind hover/tap help bubbles instead of
  always-visible paragraphs.
- `WorkOrderDetailsScreen` should stay quieter and denser than the first dark
  POC pass: compact cards, toned surfaces, and action sections sized around
  the text they contain. The detail page now frames each job as a work story:
  intake, schedule, assignment, field work, proof, and latest update, with
  explanation hidden behind contextual help where it would otherwise compete
  with the action path.
- Future role pages should reuse the same model before adding new page-specific
  chrome.
