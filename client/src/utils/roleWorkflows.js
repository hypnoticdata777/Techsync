const MANAGER_ROLES = ['org_admin', 'coordinator'];
const BASE_MAIN_ROUTES = ['WorkOrdersList', 'WorkOrderDetails'];
const MANAGER_MAIN_ROUTES = [
  'WorkOrderForm',
  'OperationsReport',
  'DispatchBoard',
  'PmcDirectory',
  'RoleEvidence',
];

export const canManageOperations = role => MANAGER_ROLES.includes(role);

export const getAvailableMainRoutes = role => [
  ...BASE_MAIN_ROUTES,
  ...(canManageOperations(role) ? MANAGER_MAIN_ROUTES : []),
];

export const canAccessMainRoute = (role, routeName) =>
  getAvailableMainRoutes(role).includes(routeName);

export const getWorkOrdersEndpointForRole = role =>
  role === 'technician' ? '/work-orders/mine' : '/work-orders';

export const getRoleHome = role => {
  switch (role) {
    case 'org_admin':
      return {
        title: 'Admin Workspace',
        subtitle: 'Tenant controls, dispatch visibility, reporting, and queue health',
        emptyState: 'No work orders yet. Create the first request when the demo queue is ready.',
      };
    case 'coordinator':
      return {
        title: 'Coordinator Queue',
        subtitle: 'Intake, assignment, client updates, and proof follow-through',
        emptyState: 'No work orders need coordination in this queue.',
      };
    case 'technician':
      return {
        title: 'Technician Queue',
        subtitle: 'Assigned work, status updates, notes, and proof',
        emptyState: 'No assigned work is waiting right now.',
      };
    case 'client':
      return {
        title: 'Client View',
        subtitle: 'Visible requests, approvals, updates, and closeout proof',
        emptyState: 'No visible work orders are linked to this client profile.',
      };
    case 'viewer':
      return {
        title: 'Viewer Snapshot',
        subtitle: 'Read-only work-order visibility for linked client records',
        emptyState: 'No visible work orders are available for this viewer.',
      };
    case 'vendor':
      return {
        title: 'Vendor View',
        subtitle: 'Linked vendor work, updates, and proof context',
        emptyState: 'No visible vendor work is linked to this vendor profile.',
      };
    default:
      return {
        title: 'Work Orders',
        subtitle: 'Maintenance queue and status activity',
        emptyState: 'No work orders are available.',
      };
  }
};

const ROLE_USER_EXPERIENCES = {
  org_admin: {
    roleLabel: 'Org Admin',
    scopeLabel: 'Full tenant command',
    scopeDetail: 'Can see every synthetic client, property, vendor, technician, and work order.',
    nextMove: 'Use Dispatch or Report to spot risk, then create or tune linked work.',
    guardrail: 'Investor captures must stay synthetic and avoid provider or terminal windows.',
  },
  coordinator: {
    roleLabel: 'Coordinator',
    scopeLabel: 'Operations follow-through',
    scopeDetail: 'Can coordinate tenant work, client updates, vendor context, and proof readiness.',
    nextMove: 'Triage open work, assign the right technician/vendor, and request approvals when needed.',
    guardrail: 'Keep internal notes separate from client and vendor-visible updates.',
  },
  technician: {
    roleLabel: 'Technician',
    scopeLabel: 'Assigned field queue',
    scopeDetail: 'Sees only assigned work in priority order, with status, notes, and proof actions.',
    nextMove: 'Open the highest-risk assigned job, update status, and attach completion proof.',
    guardrail: 'Manager screens, unrelated jobs, and directory/report controls stay hidden.',
  },
  client: {
    roleLabel: 'Client',
    scopeLabel: 'Linked request view',
    scopeDetail: 'Sees work tied to this client profile, visible updates, approvals, and proof.',
    nextMove: 'Review pending approvals and respond from the work-order detail page.',
    guardrail: 'Internal notes, unrelated clients, and vendor-only context stay hidden.',
  },
  viewer: {
    roleLabel: 'Read-Only Viewer',
    scopeLabel: 'Owner snapshot',
    scopeDetail: 'Sees linked client records without mutation, dispatch, or closeout controls.',
    nextMove: 'Review status, visible messages, and proof context without changing work.',
    guardrail: 'Read-only mode should never expose edit, approval, proof-upload, or manager controls.',
  },
  vendor: {
    roleLabel: 'Vendor',
    scopeLabel: 'Linked vendor work',
    scopeDetail: 'Sees work assigned to this vendor and vendor-visible communication only.',
    nextMove: 'Open linked jobs, read vendor updates, and respond through the vendor message path.',
    guardrail: 'Internal/client messages and unrelated vendor work stay hidden.',
  },
};

const DEFAULT_USER_EXPERIENCE = {
  roleLabel: 'User',
  scopeLabel: 'Authenticated queue',
  scopeDetail: 'Sees the work orders available to this account.',
  nextMove: 'Open a work order to review status, communication, and proof context.',
  guardrail: 'Refresh or sign out if the visible queue does not match this account.',
};

export const getRoleUserExperience = role =>
  ROLE_USER_EXPERIENCES[role] || DEFAULT_USER_EXPERIENCE;

const ROLE_LANE_EXPERIENCES = {
  org_admin: {
    laneLabel: 'Tenant Command',
    job: 'Own the full operating picture across people, properties, vendors, work, proof, and risk.',
    handoff: 'Coordinator, technician, client, vendor, and read-only owner stakeholders.',
    success: 'The tenant story is explainable: queue health, risk, proof, and closeout are visible.',
    canDo: ['Create linked work', 'Manage directory data', 'Review reports', 'Archive closeouts'],
    cannotDo: ['Mix synthetic proof with real data', 'Blur internal/client/vendor message lanes'],
  },
  coordinator: {
    laneLabel: 'Dispatch Control',
    job: 'Turn intake into assigned, visible, and approval-ready work without losing context.',
    handoff: 'Admin oversight, technicians, client approvals, and vendor-visible updates.',
    success: 'Every active item has an owner, waiting state, visibility lane, and next action.',
    canDo: ['Create work', 'Assign technicians', 'Request approval', 'Coordinate vendor/client updates'],
    cannotDo: ['Expose internal notes externally', 'Leave linked work without an owner'],
  },
  technician: {
    laneLabel: 'Field Execution',
    job: 'Work the assigned queue, update status, leave notes, and attach proof.',
    handoff: 'Coordinator receives status movement, proof, and field notes.',
    success: 'Assigned jobs move cleanly from open to completed with proof and notes.',
    canDo: ['Update assigned status', 'Add internal notes', 'Attach proof', 'Escalate blockers'],
    cannotDo: ['Edit directory records', 'See unrelated jobs', 'Request client approval'],
  },
  client: {
    laneLabel: 'Client Decision',
    job: 'Review linked work, visible updates, proof, and approval requests.',
    handoff: 'Coordinator receives approval decisions and client-visible feedback.',
    success: 'Approvals and concerns are captured without exposing internal operations context.',
    canDo: ['Review linked work', 'Approve or decline requests', 'Send client-visible messages'],
    cannotDo: ['See internal notes', 'See vendor-only context', 'Change operations status'],
  },
  viewer: {
    laneLabel: 'Owner Snapshot',
    job: 'Inspect visible work status and proof without changing the record.',
    handoff: 'Client-facing updates and proof flow into a read-only owner view.',
    success: 'Stakeholders understand progress without edit, approval, or dispatch controls.',
    canDo: ['Read linked status', 'Review visible messages', 'Review proof context'],
    cannotDo: ['Use mutation controls', 'See internal notes', 'See unrelated client work'],
  },
  vendor: {
    laneLabel: 'Vendor Delivery',
    job: 'Track linked vendor work and respond through the vendor-visible path.',
    handoff: 'Coordinator receives vendor updates while client/internal lanes stay protected.',
    success: 'Vendor work is clear, scoped, and separated from client and internal messages.',
    canDo: ['Review linked vendor work', 'Send vendor-visible messages', 'Track proof context'],
    cannotDo: ['See internal/client messages', 'See other vendor work', 'Change client approvals'],
  },
};

const DEFAULT_ROLE_LANE = {
  laneLabel: 'Authenticated Lane',
  job: 'Review the work orders and actions available to this account.',
  handoff: 'The visible queue determines the next role handoff.',
  success: 'The account can understand available work without seeing unrelated context.',
  canDo: ['Review visible work'],
  cannotDo: ['Assume access outside the authenticated lane'],
};

export const getRoleLane = role => ROLE_LANE_EXPERIENCES[role] || DEFAULT_ROLE_LANE;

export const buildRoleLaneRows = role => {
  const lane = getRoleLane(role);

  return [
    {
      key: 'lane',
      label: lane.laneLabel,
      value: lane.job,
    },
    {
      key: 'handoff',
      label: 'Works With',
      value: lane.handoff,
    },
    {
      key: 'success',
      label: 'Done When',
      value: lane.success,
    },
  ];
};

export const buildRoleBoundaryRows = role => {
  const lane = getRoleLane(role);

  return [
    {
      key: 'can',
      label: 'Can Do',
      value: lane.canDo.join(' | '),
    },
    {
      key: 'cannot',
      label: 'Not In This Lane',
      value: lane.cannotDo.join(' | '),
    },
  ];
};

export const getRolePortalSummary = (role, queueSummary = {}) => {
  const total = queueSummary.total || 0;
  const open = queueSummary.open || 0;
  const active = queueSummary.inProgress || 0;
  const approvals = queueSummary.pendingApproval || 0;

  switch (role) {
    case 'client':
      return {
        title: 'Client Portal',
        subtitle: 'Approvals, visible updates, and closeout proof for linked work.',
        rows: [
          {
            key: 'approvals',
            label: 'Needs Review',
            value: `${approvals} approval${approvals === 1 ? '' : 's'}`,
          },
          {
            key: 'visible',
            label: 'Visible Work',
            value: `${total} linked item${total === 1 ? '' : 's'}`,
          },
          {
            key: 'path',
            label: 'Reply Path',
            value: 'Client-visible messages only',
          },
        ],
      };
    case 'viewer':
      return {
        title: 'Owner Snapshot',
        subtitle: 'Read-only status and proof context for linked client records.',
        rows: [
          {
            key: 'visible',
            label: 'Visible Work',
            value: `${total} linked item${total === 1 ? '' : 's'}`,
          },
          {
            key: 'open',
            label: 'Open Items',
            value: `${open} open`,
          },
          {
            key: 'mode',
            label: 'Mode',
            value: 'Read-only review',
          },
        ],
      };
    case 'vendor':
      return {
        title: 'Vendor Desk',
        subtitle: 'Linked vendor work, vendor-visible messages, and proof context.',
        rows: [
          {
            key: 'linked',
            label: 'Linked Work',
            value: `${total} vendor item${total === 1 ? '' : 's'}`,
          },
          {
            key: 'active',
            label: 'Active',
            value: `${active} active`,
          },
          {
            key: 'path',
            label: 'Reply Path',
            value: 'Vendor-visible messages only',
          },
        ],
      };
    default:
      return null;
  }
};

export const getCommunicationLaneNotice = (role, visibility = 'internal') => {
  if (role === 'client') {
    return {
      title: 'Client-visible channel',
      detail: 'Replies go to operations and stay separate from internal and vendor-only messages.',
    };
  }

  if (role === 'viewer') {
    return {
      title: 'Read-only channel',
      detail: 'Visible updates and proof can be reviewed here; replies are intentionally disabled.',
    };
  }

  if (role === 'vendor') {
    return {
      title: 'Vendor-visible channel',
      detail: 'Replies go to operations through the vendor lane and stay separate from client/internal messages.',
    };
  }

  return {
    title: `${visibility.replace('_', ' ')} channel`,
    detail: 'Choose the audience before sending so internal, client, and vendor updates stay separated.',
  };
};

export const buildRoleGuidanceRows = (role, queueSummary = {}) => {
  const experience = getRoleUserExperience(role);
  const total = queueSummary.total || 0;
  const active = queueSummary.inProgress || 0;
  const approvals = queueSummary.pendingApproval || 0;

  return [
    {
      key: 'scope',
      label: experience.scopeLabel,
      value: experience.scopeDetail,
    },
    {
      key: 'next',
      label: approvals > 0 ? 'Approval attention' : 'Next move',
      value:
        approvals > 0
          ? `${approvals} pending approval${approvals === 1 ? '' : 's'} need review.`
          : experience.nextMove,
    },
    {
      key: 'watch',
      label: active > 0 || total === 0 ? 'Watch point' : 'Guardrail',
      value:
        active > 0
          ? `${active} active job${active === 1 ? '' : 's'} need status and proof follow-through.`
          : total === 0
            ? getRoleEmptyState(role).detail
            : experience.guardrail,
    },
  ];
};

const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const countWhere = (rows, predicate) => rows.filter(predicate).length;
const isOpenOrActiveStatus = item =>
  ['open', 'in_progress', 'paused', 'escalated'].includes(item?.status);
const isBlockedStatus = item => ['paused', 'escalated'].includes(item?.status);
const needsCompletionProof = item => item?.status === 'completed' && !hasCompletionProof(item);
const needsApprovalDecision = item => item?.client_approval_status === 'pending';
const needsAssignment = item => item?.status === 'open' && !hasAssignedTechnician(item);
const isQueueRiskEvent = item =>
  needsApprovalDecision(item) ||
  needsAssignment(item) ||
  isBlockedStatus(item) ||
  needsCompletionProof(item);

export const buildRoleOutcomeRows = (role, queueSummary = {}, workOrders = []) => {
  const rows = workOrders || [];
  const total = queueSummary.total ?? rows.length;
  const open = queueSummary.open ?? countWhere(rows, item => item?.status === 'open');
  const active = queueSummary.inProgress ?? countWhere(rows, item => item?.status === 'in_progress');
  const pendingApprovals =
    queueSummary.pendingApproval ?? countWhere(rows, needsApprovalDecision);
  const unassigned = countWhere(rows, needsAssignment);
  const blockers = countWhere(rows, isBlockedStatus);
  const completed = countWhere(rows, item => item?.status === 'completed');
  const completedNeedsProof = countWhere(rows, needsCompletionProof);
  const completedReady = completed - completedNeedsProof;
  const openOrActive = countWhere(rows, isOpenOrActiveStatus);
  const riskEvents = countWhere(rows, isQueueRiskEvent);

  switch (role) {
    case 'org_admin':
      return [
        {
          key: 'promise',
          label: 'Primary Win',
          value: 'Control tenant risk',
          detail: 'Every visible record should explain owner, waiting state, audience, proof, and audit trail.',
          tone: riskEvents > 0 ? 'pending' : 'verified',
        },
        {
          key: 'proof',
          label: 'Queue Proof',
          value: pluralize(riskEvents, 'risk signal'),
          detail: `${pluralize(total, 'record')} visible across the tenant operating story.`,
          tone: riskEvents > 0 ? 'pending' : 'verified',
        },
        {
          key: 'next',
          label: 'Best Next Move',
          value: riskEvents > 0 ? 'Open Risk focus' : 'Review clean queue',
          detail: riskEvents > 0
            ? 'Start with work missing an owner, decision, recovery path, or proof.'
            : 'Use reports and closeout review to keep the demo story explainable.',
          tone: riskEvents > 0 ? 'pending' : 'active',
        },
      ];
    case 'coordinator':
      return [
        {
          key: 'promise',
          label: 'Primary Win',
          value: 'Clear the handoff',
          detail: 'Turn open requests into assigned, visible, approval-ready work with the right next owner.',
          tone: unassigned > 0 || pendingApprovals > 0 || blockers > 0 ? 'pending' : 'verified',
        },
        {
          key: 'proof',
          label: 'Queue Proof',
          value: `${unassigned} assign, ${pendingApprovals} approve, ${blockers} blocked`,
          detail: 'These are the coordination loops that usually create follow-up noise.',
          tone: unassigned > 0 || pendingApprovals > 0 || blockers > 0 ? 'pending' : 'verified',
        },
        {
          key: 'next',
          label: 'Best Next Move',
          value: unassigned > 0
            ? 'Assign next request'
            : pendingApprovals > 0
              ? 'Follow approval'
              : blockers > 0
                ? 'Recover blocker'
                : 'Watch stable queue',
          detail: 'Use the matching focus filter, then open the work order and move the handoff forward.',
          tone: unassigned > 0 ? 'open' : pendingApprovals > 0 ? 'pending' : blockers > 0 ? 'escalated' : 'verified',
        },
      ];
    case 'technician':
      return [
        {
          key: 'promise',
          label: 'Primary Win',
          value: 'Know the field move',
          detail: 'Assigned work should make the next status, note, blocker, or proof step obvious.',
          tone: openOrActive > 0 ? 'active' : 'verified',
        },
        {
          key: 'proof',
          label: 'Queue Proof',
          value: pluralize(open + active + blockers, 'assigned action'),
          detail: 'Open, active, paused, and escalated assigned jobs are the technician work lane.',
          tone: open + active + blockers > 0 ? 'active' : 'verified',
        },
        {
          key: 'next',
          label: 'Best Next Move',
          value: active > 0
            ? 'Update proof/status'
            : open > 0
              ? 'Start open job'
              : blockers > 0
                ? 'Clarify blocker'
                : 'Queue is clear',
          detail: 'Open the highest-priority assigned job and leave the field record cleaner than you found it.',
          tone: active > 0 ? 'missing' : open > 0 ? 'open' : blockers > 0 ? 'escalated' : 'verified',
        },
      ];
    case 'client':
      return [
        {
          key: 'promise',
          label: 'Primary Win',
          value: 'Decide without calls',
          detail: 'Linked work should show status, visible updates, approval requests, and proof context in one place.',
          tone: pendingApprovals > 0 ? 'pending' : 'active',
        },
        {
          key: 'proof',
          label: 'Queue Proof',
          value: `${pendingApprovals} approvals, ${completed} completed`,
          detail: `${pluralize(total, 'linked item')} visible without exposing internal or vendor-only notes.`,
          tone: pendingApprovals > 0 ? 'pending' : completed > 0 ? 'verified' : 'active',
        },
        {
          key: 'next',
          label: 'Best Next Move',
          value: pendingApprovals > 0
            ? 'Decide approval'
            : completed > 0
              ? 'Review proof'
              : 'Read visible update',
          detail: 'Use client-visible replies only when operations needs feedback.',
          tone: pendingApprovals > 0 ? 'pending' : completed > 0 ? 'verified' : 'active',
        },
      ];
    case 'viewer':
      return [
        {
          key: 'promise',
          label: 'Primary Win',
          value: 'See progress safely',
          detail: 'The snapshot should explain linked progress without mutation controls or private operations context.',
          tone: total > 0 ? 'active' : 'default',
        },
        {
          key: 'proof',
          label: 'Queue Proof',
          value: pluralize(total, 'visible snapshot'),
          detail: `${pluralize(openOrActive, 'active item')} and ${pluralize(completedReady, 'proof-ready closeout')} available for review.`,
          tone: total > 0 ? 'active' : 'default',
        },
        {
          key: 'next',
          label: 'Best Next Move',
          value: openOrActive > 0
            ? 'Review progress'
            : completedReady > 0
              ? 'Review closeout'
              : 'Monitor snapshot',
          detail: 'Use the page as read-only visibility; operational changes stay with the active team.',
          tone: openOrActive > 0 ? 'open' : completedReady > 0 ? 'verified' : 'default',
        },
      ];
    case 'vendor':
      return [
        {
          key: 'promise',
          label: 'Primary Win',
          value: 'Work the vendor lane',
          detail: 'Only linked vendor work and vendor-visible messages should appear here.',
          tone: total > 0 ? 'active' : 'default',
        },
        {
          key: 'proof',
          label: 'Queue Proof',
          value: `${openOrActive} active, ${blockers} blocked`,
          detail: `${pluralize(total, 'vendor item')} scoped to this vendor profile.`,
          tone: blockers > 0 ? 'escalated' : openOrActive > 0 ? 'active' : 'default',
        },
        {
          key: 'next',
          label: 'Best Next Move',
          value: blockers > 0
            ? 'Respond to blocker'
            : openOrActive > 0
              ? 'Send vendor update'
              : 'Review scope',
          detail: 'Use vendor-visible replies; client and internal threads stay out of this lane.',
          tone: blockers > 0 ? 'escalated' : openOrActive > 0 ? 'active' : 'default',
        },
      ];
    default:
      return [
        {
          key: 'promise',
          label: 'Primary Win',
          value: 'Review visible work',
          detail: 'Open a work order to understand status, owner, messages, proof, and next action.',
          tone: total > 0 ? 'active' : 'default',
        },
      ];
  }
};

const QUEUE_FILTERS_BY_ROLE = {
  org_admin: [
    {
      key: 'risk',
      label: 'Risk',
      detail: 'Shows: requests that need attention. Includes approvals, missing assignment, blockers, or missing proof.',
      tone: 'pending',
      match: isQueueRiskEvent,
    },
    {
      key: 'active',
      label: 'Active',
      detail: 'Shows: work that is still moving. Includes open, in progress, paused, and escalated requests.',
      tone: 'active',
      match: isOpenOrActiveStatus,
    },
    {
      key: 'closeout',
      label: 'Closeout',
      detail: 'Shows: completed requests. Use this to review proof before archive or final reporting.',
      tone: 'verified',
      match: item => item?.status === 'completed',
    },
  ],
  coordinator: [
    {
      key: 'unassigned',
      label: 'Assign',
      detail: 'Shows: open requests with no technician. Use this first when work needs an owner.',
      tone: 'open',
      match: needsAssignment,
    },
    {
      key: 'approvals',
      label: 'Approvals',
      detail: 'Shows: client approval requests. Use this when the next move belongs to the client.',
      tone: 'pending',
      match: needsApprovalDecision,
    },
    {
      key: 'blockers',
      label: 'Blockers',
      detail: 'Shows: paused or escalated work. Use this when operations needs to recover the request.',
      tone: 'escalated',
      match: isBlockedStatus,
    },
  ],
  technician: [
    {
      key: 'start',
      label: 'Start',
      detail: 'Shows: assigned open jobs. Start here when you are ready to move a job into field work.',
      tone: 'open',
      match: item => item?.status === 'open',
    },
    {
      key: 'proof',
      label: 'Proof',
      detail: 'Shows: active or proof-missing jobs. Use this for notes, photos, and completion proof.',
      tone: 'missing',
      match: item => item?.status === 'in_progress' || needsCompletionProof(item),
    },
    {
      key: 'blockers',
      label: 'Blocked',
      detail: 'Shows: paused or escalated assigned jobs. Add clear notes so operations knows what is stuck.',
      tone: 'escalated',
      match: isBlockedStatus,
    },
  ],
  client: [
    {
      key: 'decisions',
      label: 'Decisions',
      detail: 'Shows: approval requests waiting for you. Open these to approve, decline, or message operations.',
      tone: 'pending',
      match: needsApprovalDecision,
    },
    {
      key: 'updates',
      label: 'Updates',
      detail: 'Shows: your visible requests that are still moving. Use this to read the latest status.',
      tone: 'active',
      match: isOpenOrActiveStatus,
    },
    {
      key: 'proof',
      label: 'Proof',
      detail: 'Shows: completed visible requests. Use this to review closeout proof.',
      tone: 'verified',
      match: item => item?.status === 'completed',
    },
  ],
  viewer: [
    {
      key: 'active',
      label: 'Active',
      detail: 'Shows: visible linked work that is still moving. This is read-only.',
      tone: 'active',
      match: isOpenOrActiveStatus,
    },
    {
      key: 'completed',
      label: 'Complete',
      detail: 'Shows: completed visible work. Use this to review status and proof without changing anything.',
      tone: 'verified',
      match: item => item?.status === 'completed',
    },
    {
      key: 'watch',
      label: 'Watch',
      detail: 'Shows: open or approval-related items. Use this when you only need to keep an eye on progress.',
      tone: 'open',
      match: item => item?.status === 'open' || needsApprovalDecision(item),
    },
  ],
  vendor: [
    {
      key: 'active',
      label: 'Active',
      detail: 'Shows: work linked to this vendor that is still moving. Use this to send vendor-visible updates.',
      tone: 'active',
      match: isOpenOrActiveStatus,
    },
    {
      key: 'blocked',
      label: 'Blocked',
      detail: 'Shows: paused or escalated vendor work. Use this when operations needs a vendor reply.',
      tone: 'escalated',
      match: isBlockedStatus,
    },
    {
      key: 'complete',
      label: 'Complete',
      detail: 'Shows: completed vendor work. Use this to review finished scope and proof context.',
      tone: 'verified',
      match: item => item?.status === 'completed',
    },
  ],
};

const ALL_WORK_DETAILS = {
  org_admin: 'Shows: every request in the tenant. Use this when you need the whole operating picture.',
  coordinator: 'Shows: every request operations can coordinate. Use this before narrowing to assignment, approvals, or blockers.',
  technician: 'Shows: every assigned active job. This does not include unrelated jobs or manager pages.',
  client: 'Shows: every request linked to this client. Internal notes and vendor-only updates stay hidden.',
  viewer: 'Shows: every visible linked request. This view is read-only.',
  vendor: 'Shows: every request linked to this vendor. Client and internal messages stay hidden.',
  default: 'Shows: every request visible to this account.',
};

const getQueueFiltersForRole = role => QUEUE_FILTERS_BY_ROLE[role] || [];

export const buildRoleQueueFilterRows = (role, workOrders = []) => {
  const rows = workOrders || [];
  const roleFilters = getQueueFiltersForRole(role);

  return [
    {
      key: 'all',
      label: 'All Work',
      value: pluralize(rows.length, 'item'),
      count: rows.length,
      detail: ALL_WORK_DETAILS[role] || ALL_WORK_DETAILS.default,
      tone: rows.length > 0 ? 'active' : 'default',
    },
    ...roleFilters.map(filter => {
      const count = countWhere(rows, filter.match);
      return {
        key: filter.key,
        label: filter.label,
        value: pluralize(count, 'item'),
        count,
        detail: filter.detail,
        tone: count > 0 ? filter.tone : 'default',
      };
    }),
  ];
};

export const filterWorkOrdersForRoleQueue = (role, filterKey, workOrders = []) => {
  const rows = workOrders || [];
  if (!filterKey || filterKey === 'all') {
    return rows;
  }
  const filter = getQueueFiltersForRole(role).find(row => row.key === filterKey);
  return filter ? rows.filter(filter.match) : rows;
};

const ROLE_QUEUE_SEARCH_CONFIG = {
  org_admin: {
    label: 'Search',
    placeholder: 'Search TS number, client, property, vendor, technician, risk, or status',
    help: 'Search changes only the center list. Options: request ID | address | client | vendor | technician | priority | proof state | status',
    emptyTitle: 'No tenant work matches',
    emptyDetail: 'Try a TS number, client name, property, vendor, technician, priority, status, or proof term.',
  },
  coordinator: {
    label: 'Search',
    placeholder: 'Search TS number, address, unit, assignee, vendor, client, or status',
    help: 'Search changes only the center list. Options: request ID | address | client | vendor | technician | priority | status | waiting state',
    emptyTitle: 'No dispatch work matches',
    emptyDetail: 'Try the TS number, address, unit, client, assigned technician, vendor, priority, or status.',
  },
  technician: {
    label: 'Search',
    placeholder: 'Search TS number, address, unit, service, status, proof, or date',
    help: 'Search changes only the center list. Options: request ID | service | address | status | priority | proof state | date',
    emptyTitle: 'No assigned work matches',
    emptyDetail: 'Try the TS number, address, service type, status, priority, or proof term.',
  },
  client: {
    label: 'Search',
    placeholder: 'Search TS number, address, unit, status, proof, update, or date',
    help: 'Search changes only the center list. Options: request ID | property | unit | status | approval | proof | date',
    emptyTitle: 'No client requests match',
    emptyDetail: 'Try a TS number, address, unit, status, approval, proof, or date term.',
  },
  viewer: {
    label: 'Search',
    placeholder: 'Search TS number, linked work, address, unit, proof, or status',
    help: 'Search changes only the center list. Options: request ID | property | status | approval | proof | date. This stays read-only.',
    emptyTitle: 'No visible snapshot matches',
    emptyDetail: 'Try a TS number, address, status, proof, approval, or date term.',
  },
  vendor: {
    label: 'Search',
    placeholder: 'Search TS number, assigned vendor work, address, service, status, or proof',
    help: 'Search changes only the center list. Options: request ID | service | address | status | blocker | proof state | date',
    emptyTitle: 'No vendor work matches',
    emptyDetail: 'Try a TS number, service, address, status, blocker, proof, or date term.',
  },
  default: {
    label: 'Search',
    placeholder: 'Search TS number, title, address, status, proof, or date',
    help: 'Search changes only the center list. Options: request ID | title | address | status | proof | date',
    emptyTitle: 'No work matches',
    emptyDetail: 'Try a TS number, title, address, status, proof, or date term.',
  },
};

export const getRoleQueueSearchConfig = role =>
  ROLE_QUEUE_SEARCH_CONFIG[role] || ROLE_QUEUE_SEARCH_CONFIG.default;

const normalizeSearchValue = value =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[_#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildSearchReferenceTerms = workOrder => {
  if (!workOrder?.id) {
    return [];
  }

  const padded = String(workOrder.id).padStart(4, '0');
  return [`Request TS-${padded}`, `TS-${padded}`, `TS${padded}`, workOrder.id];
};

const buildWorkOrderSearchHaystack = workOrder => {
  const proofState = hasCompletionProof(workOrder) ? 'proof verified closeout complete' : 'proof pending missing';
  const approvalState = workOrder?.client_approval_status
    ? `approval ${workOrder.client_approval_status}`
    : '';

  return [
    ...buildSearchReferenceTerms(workOrder),
    workOrder?.title,
    workOrder?.description,
    workOrder?.status,
    workOrder?.priority,
    workOrder?.service_type,
    workOrder?.customer_name,
    workOrder?.client_display_name,
    workOrder?.property_name,
    workOrder?.vendor_name,
    workOrder?.assigned_technician_name,
    workOrder?.address,
    workOrder?.unit,
    workOrder?.created_at,
    workOrder?.updated_at,
    approvalState,
    proofState,
  ]
    .map(normalizeSearchValue)
    .filter(Boolean)
    .join(' ');
};

export const filterWorkOrdersForRoleSearch = (role, query, workOrders = []) => {
  const rows = workOrders || [];
  const terms = normalizeSearchValue(query).split(' ').filter(Boolean);

  if (terms.length === 0) {
    return rows;
  }

  return rows.filter(workOrder => {
    const haystack = buildWorkOrderSearchHaystack(workOrder);
    return terms.every(term => haystack.includes(term));
  });
};

const PRIORITY_SCORE = {
  emergency: 50,
  urgent: 40,
  high: 30,
  medium: 20,
  normal: 10,
  low: 5,
};

const STATUS_SCORE = {
  escalated: 25,
  paused: 20,
  open: 15,
  in_progress: 12,
  completed: 8,
};

const scoreWorkOrder = item =>
  (PRIORITY_SCORE[item?.priority] || 0) +
  (STATUS_SCORE[item?.status] || 0) +
  (needsApprovalDecision(item) ? 18 : 0) +
  (needsAssignment(item) ? 14 : 0) +
  (needsCompletionProof(item) ? 10 : 0);

const ROLE_QUEUE_SORT_OPTIONS = {
  org_admin: [
    {
      key: 'risk',
      label: 'Risk First',
      detail: 'Puts requests needing attention at the top: approvals, missing assignment, blockers, missing proof, then priority.',
    },
    {
      key: 'recent',
      label: 'Recent',
      detail: 'Puts the most recently updated tenant requests at the top.',
    },
    {
      key: 'priority',
      label: 'Priority',
      detail: 'Puts emergency and high-priority requests before lower-priority work.',
    },
  ],
  coordinator: [
    {
      key: 'handoff',
      label: 'Handoff First',
      detail: 'Puts the requests a coordinator can move first: assignment, approvals, blockers, then proof gaps.',
    },
    {
      key: 'recent',
      label: 'Recent',
      detail: 'Puts the most recently updated coordination items at the top.',
    },
    {
      key: 'priority',
      label: 'Priority',
      detail: 'Puts emergency and high-priority coordination work before lower-priority work.',
    },
  ],
  technician: [
    {
      key: 'field',
      label: 'Field First',
      detail: 'Puts field work you can act on first: active jobs, open starts, blockers, proof gaps, then priority.',
    },
    {
      key: 'recent',
      label: 'Recent',
      detail: 'Puts the most recently updated assigned jobs at the top.',
    },
    {
      key: 'priority',
      label: 'Priority',
      detail: 'Puts emergency and high-priority assigned jobs first.',
    },
  ],
  client: [
    {
      key: 'decisions',
      label: 'Decisions First',
      detail: 'Puts approval decisions first, then active updates, completed proof, and priority.',
    },
    {
      key: 'recent',
      label: 'Recent',
      detail: 'Puts the most recently updated client-visible requests at the top.',
    },
    {
      key: 'proof',
      label: 'Proof First',
      detail: 'Puts completed requests and visible proof before earlier work states.',
    },
  ],
  viewer: [
    {
      key: 'watch',
      label: 'Watch First',
      detail: 'Puts active visible work before completed records for read-only review.',
    },
    {
      key: 'recent',
      label: 'Recent',
      detail: 'Puts the most recently updated visible records at the top.',
    },
    {
      key: 'proof',
      label: 'Proof First',
      detail: 'Puts completed and proof-ready records before active work.',
    },
  ],
  vendor: [
    {
      key: 'vendor',
      label: 'Vendor First',
      detail: 'Puts blocked and active vendor work before completed scope review.',
    },
    {
      key: 'recent',
      label: 'Recent',
      detail: 'Puts the most recently updated vendor-visible work at the top.',
    },
    {
      key: 'priority',
      label: 'Priority',
      detail: 'Puts emergency and high-priority vendor work first.',
    },
  ],
  default: [
    {
      key: 'recent',
      label: 'Recent',
      detail: 'Puts the most recently updated visible work at the top.',
    },
    {
      key: 'priority',
      label: 'Priority',
      detail: 'Puts emergency and high-priority visible work first.',
    },
  ],
};

export const getRoleQueueSortOptions = role =>
  ROLE_QUEUE_SORT_OPTIONS[role] || ROLE_QUEUE_SORT_OPTIONS.default;

const getWorkOrderTimestamp = item => {
  const parsed = Date.parse(item?.updated_at || item?.created_at || '');
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getRoleQueueSortScore = (role, sortKey, item) => {
  switch (sortKey) {
    case 'priority':
      return (PRIORITY_SCORE[item?.priority] || 0) + (STATUS_SCORE[item?.status] || 0);
    case 'recent':
      return getWorkOrderTimestamp(item);
    case 'handoff':
      return (
        (needsAssignment(item) ? 120 : 0) +
        (needsApprovalDecision(item) ? 90 : 0) +
        (isBlockedStatus(item) ? 70 : 0) +
        (needsCompletionProof(item) ? 50 : 0) +
        scoreWorkOrder(item)
      );
    case 'field':
      return (
        (item?.status === 'in_progress' ? 140 : 0) +
        (item?.status === 'open' && !needsApprovalDecision(item) ? 100 : 0) +
        (isBlockedStatus(item) ? 80 : 0) +
        (needsCompletionProof(item) ? 70 : 0) +
        (PRIORITY_SCORE[item?.priority] || 0)
      );
    case 'decisions':
      return (
        (needsApprovalDecision(item) ? 120 : 0) +
        (isOpenOrActiveStatus(item) ? 60 : 0) +
        (item?.status === 'completed' ? 40 : 0) +
        (PRIORITY_SCORE[item?.priority] || 0)
      );
    case 'proof':
      return (
        (item?.status === 'completed' ? 100 : 0) +
        (hasCompletionProof(item) ? 70 : 0) +
        (needsCompletionProof(item) ? 60 : 0) +
        getWorkOrderTimestamp(item) / 100000000000
      );
    case 'watch':
      return (
        (isOpenOrActiveStatus(item) ? 100 : 0) +
        (needsApprovalDecision(item) ? 40 : 0) +
        (item?.status === 'completed' ? 20 : 0) +
        getWorkOrderTimestamp(item) / 100000000000
      );
    case 'vendor':
      return (
        (isBlockedStatus(item) ? 160 : 0) +
        (item?.status === 'in_progress' ? 120 : 0) +
        (item?.status === 'open' ? 80 : 0) +
        (item?.status === 'completed' ? 30 : 0) +
        (PRIORITY_SCORE[item?.priority] || 0)
      );
    case 'risk':
    default:
      return scoreWorkOrder(item);
  }
};

export const sortWorkOrdersForRoleQueue = (role, sortKey, workOrders = []) => {
  const rows = workOrders || [];
  const options = getRoleQueueSortOptions(role);
  const resolvedSortKey = options.some(option => option.key === sortKey)
    ? sortKey
    : options[0]?.key;

  if (!resolvedSortKey) {
    return rows;
  }

  return rows.slice().sort((left, right) => {
    const scoreDelta =
      getRoleQueueSortScore(role, resolvedSortKey, right) -
      getRoleQueueSortScore(role, resolvedSortKey, left);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    const recentDelta = getWorkOrderTimestamp(right) - getWorkOrderTimestamp(left);
    if (recentDelta !== 0) {
      return recentDelta;
    }

    return (left?.id || 0) - (right?.id || 0);
  });
};

const pickHighestImpact = (rows, predicate) =>
  rows
    .filter(predicate)
    .slice()
    .sort((left, right) => {
      const scoreDelta = scoreWorkOrder(right) - scoreWorkOrder(left);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      return (left?.id || 0) - (right?.id || 0);
    })[0] || null;

const buildNextAction = ({
  key,
  label,
  value,
  detail,
  workOrder,
  filterKey = 'all',
  actionLabel = 'Open Work Order',
  filterLabel = 'Work Views',
  tone = 'active',
}) => ({
  key,
  label,
  value,
  detail,
  workOrderId: workOrder?.id || null,
  workOrderTitle: workOrder?.title || 'No specific work order',
  filterKey,
  actionLabel,
  filterLabel,
  tone,
});

const buildClearQueueAction = role => {
  const roleExperience = getRoleUserExperience(role);
  return buildNextAction({
    key: 'clear',
    label: 'Queue Clear',
    value: 'Refresh or review',
    detail: `${roleExperience.roleLabel} has no urgent visible action. Refresh the queue or review all visible work.`,
    workOrder: null,
    filterKey: 'all',
    actionLabel: 'Refresh Queue',
    filterLabel: 'Show All',
    tone: 'verified',
  });
};

export const buildRoleNextBestAction = (role, workOrders = []) => {
  const rows = workOrders || [];

  if (rows.length === 0) {
    return buildClearQueueAction(role);
  }

  switch (role) {
    case 'org_admin': {
      const risk = pickHighestImpact(rows, isQueueRiskEvent);
      if (risk) {
        return buildNextAction({
          key: 'admin-risk',
          label: 'Tenant Risk Tool',
          value: 'Resolve highest-risk item',
          detail: 'This opens the request most likely to need admin attention. It looks for approvals, missing owners, blockers, missing proof, and priority.',
          workOrder: risk,
          filterKey: 'risk',
          actionLabel: 'Open Risk Item',
          filterLabel: 'Show Risk',
          tone: 'pending',
        });
      }
      const closeout = pickHighestImpact(rows, item => item?.status === 'completed');
      return buildNextAction({
        key: 'admin-closeout',
        label: 'Tenant Review Tool',
        value: closeout ? 'Review closeout' : 'Inspect operating queue',
        detail: closeout
          ? 'No urgent risk is waiting. Open completed work to review proof before archive.'
          : 'No urgent risk is waiting. Open the full queue to review the tenant picture.',
        workOrder: closeout || pickHighestImpact(rows, () => true),
        filterKey: closeout ? 'closeout' : 'all',
        actionLabel: closeout ? 'Open Closeout' : 'Open Queue Item',
        filterLabel: closeout ? 'Show Closeout' : 'Show All',
        tone: closeout ? 'verified' : 'active',
      });
    }
    case 'coordinator': {
      const unassigned = pickHighestImpact(rows, needsAssignment);
      if (unassigned) {
        return buildNextAction({
          key: 'coordinator-assign',
          label: 'Dispatch Tool',
          value: 'Assign the next request',
          detail: 'This opens the open request most ready for assignment. Add the right owner so the work can move.',
          workOrder: unassigned,
          filterKey: 'unassigned',
          actionLabel: 'Assign This Work',
          filterLabel: 'Show Assignments',
          tone: 'open',
        });
      }
      const approval = pickHighestImpact(rows, needsApprovalDecision);
      if (approval) {
        return buildNextAction({
          key: 'coordinator-approval',
          label: 'Approval Follow-Up',
          value: 'Move client decision',
          detail: 'This opens a request waiting on client approval. Add clear client-visible context if the client needs help deciding.',
          workOrder: approval,
          filterKey: 'approvals',
          actionLabel: 'Open Approval',
          filterLabel: 'Show Approvals',
          tone: 'pending',
        });
      }
      const blocker = pickHighestImpact(rows, isBlockedStatus);
      if (blocker) {
        return buildNextAction({
          key: 'coordinator-blocker',
          label: 'Recovery Tool',
          value: 'Recover blocker',
          detail: 'This opens paused or escalated work. Use it to add a reason, owner, or recovery note.',
          workOrder: blocker,
          filterKey: 'blockers',
          actionLabel: 'Open Blocker',
          filterLabel: 'Show Blockers',
          tone: 'escalated',
        });
      }
      return buildNextAction({
        key: 'coordinator-watch',
        label: 'Stable Queue Tool',
        value: 'Review active handoffs',
        detail: 'No assignment, approval, or blocker is waiting; open the most important active item for status follow-through.',
        workOrder: pickHighestImpact(rows, isOpenOrActiveStatus) || pickHighestImpact(rows, () => true),
        filterKey: 'all',
        actionLabel: 'Open Work Item',
        filterLabel: 'Show All',
        tone: 'verified',
      });
    }
    case 'technician': {
      const proof = pickHighestImpact(
        rows,
        item => item?.status === 'in_progress' || needsCompletionProof(item),
      );
      if (proof) {
        return buildNextAction({
          key: 'technician-proof',
          label: 'Field Proof Tool',
          value: 'Update status or proof',
          detail: 'This opens assigned work that needs status, notes, photos, or completion proof.',
          workOrder: proof,
          filterKey: 'proof',
          actionLabel: 'Open Field Update',
          filterLabel: 'Show Proof Work',
          tone: 'missing',
        });
      }
      const starter = pickHighestImpact(rows, item => item?.status === 'open');
      if (starter) {
        return buildNextAction({
          key: 'technician-start',
          label: 'Start Work Tool',
          value: 'Start next job',
          detail: 'This opens the assigned open job that should start next.',
          workOrder: starter,
          filterKey: 'start',
          actionLabel: 'Open Job',
          filterLabel: 'Show Start Work',
          tone: 'open',
        });
      }
      const blocker = pickHighestImpact(rows, isBlockedStatus);
      return blocker
        ? buildNextAction({
            key: 'technician-blocker',
            label: 'Blocker Tool',
            value: 'Clarify blocker',
            detail: 'This opens paused or escalated assigned work. Add notes so operations knows what is stuck.',
            workOrder: blocker,
            filterKey: 'blockers',
            actionLabel: 'Open Blocker',
            filterLabel: 'Show Blockers',
            tone: 'escalated',
          })
        : buildClearQueueAction(role);
    }
    case 'client': {
      const approval = pickHighestImpact(rows, needsApprovalDecision);
      if (approval) {
        return buildNextAction({
          key: 'client-decision',
          label: 'Decision Tool',
          value: 'Approve or decline',
          detail: 'This opens your pending approval. Review the visible request, then approve, decline, or message operations.',
          workOrder: approval,
          filterKey: 'decisions',
          actionLabel: 'Open Decision',
          filterLabel: 'Show Decisions',
          tone: 'pending',
        });
      }
      const proof = pickHighestImpact(rows, item => item?.status === 'completed');
      return buildNextAction({
        key: proof ? 'client-proof' : 'client-update',
        label: proof ? 'Proof Review Tool' : 'Update Review Tool',
        value: proof ? 'Review closeout proof' : 'Read latest update',
        detail: proof
          ? 'No approval is waiting. Open completed work to review visible proof.'
          : 'No approval is waiting. Open active work to read the latest visible update.',
        workOrder: proof || pickHighestImpact(rows, isOpenOrActiveStatus) || pickHighestImpact(rows, () => true),
        filterKey: proof ? 'proof' : 'updates',
        actionLabel: proof ? 'Open Proof' : 'Open Update',
        filterLabel: proof ? 'Show Proof' : 'Show Updates',
        tone: proof ? 'verified' : 'active',
      });
    }
    case 'viewer': {
      const active = pickHighestImpact(rows, isOpenOrActiveStatus);
      const completed = pickHighestImpact(rows, item => item?.status === 'completed');
      return buildNextAction({
        key: active ? 'viewer-progress' : 'viewer-closeout',
        label: 'Read-Only Review Tool',
        value: active ? 'Review progress' : 'Review closeout',
        detail: active
          ? 'This opens active visible work for review. You can read it, but you cannot change it.'
          : 'No active work is visible. Open completed work to review status and proof.',
        workOrder: active || completed || pickHighestImpact(rows, () => true),
        filterKey: active ? 'active' : 'completed',
        actionLabel: 'Open Snapshot',
        filterLabel: active ? 'Show Active' : 'Show Complete',
        tone: active ? 'active' : 'verified',
      });
    }
    case 'vendor': {
      const blocker = pickHighestImpact(rows, isBlockedStatus);
      if (blocker) {
        return buildNextAction({
          key: 'vendor-blocker',
          label: 'Vendor Response Tool',
          value: 'Respond to blocker',
          detail: 'This opens blocked work linked to this vendor. Reply only in the vendor-visible lane.',
          workOrder: blocker,
          filterKey: 'blocked',
          actionLabel: 'Open Blocker',
          filterLabel: 'Show Blocked',
          tone: 'escalated',
        });
      }
      const active = pickHighestImpact(rows, isOpenOrActiveStatus);
      return buildNextAction({
        key: active ? 'vendor-active' : 'vendor-complete',
        label: 'Vendor Lane Tool',
        value: active ? 'Send vendor update' : 'Review completed scope',
        detail: active
          ? 'This opens active work linked to this vendor. Use vendor-visible messages for updates.'
          : 'No active vendor work is waiting. Open completed work to review finished scope.',
        workOrder: active || pickHighestImpact(rows, item => item?.status === 'completed') || pickHighestImpact(rows, () => true),
        filterKey: active ? 'active' : 'complete',
        actionLabel: active ? 'Open Vendor Work' : 'Open Completed Work',
        filterLabel: active ? 'Show Active' : 'Show Complete',
        tone: active ? 'active' : 'verified',
      });
    }
    default:
      return buildNextAction({
        key: 'default-open',
        label: 'Queue Tool',
        value: 'Open visible work',
        detail: 'Opens the highest-impact visible record for this authenticated account.',
        workOrder: pickHighestImpact(rows, () => true),
        filterKey: 'all',
        actionLabel: 'Open Work Order',
        filterLabel: 'Show All',
        tone: 'active',
      });
  }
};

export const buildRoleEventLaneRows = (role, workOrders = []) => {
  const rows = workOrders || [];
  const pendingApprovals = countWhere(
    rows,
    item => item.client_approval_status === 'pending',
  );
  const unassigned = countWhere(
    rows,
    item => item.status === 'open' && !hasAssignedTechnician(item),
  );
  const active = countWhere(rows, item => item.status === 'in_progress');
  const paused = countWhere(rows, item => item.status === 'paused');
  const escalated = countWhere(rows, item => item.status === 'escalated');
  const completed = countWhere(rows, item => item.status === 'completed');
  const completedNeedsProof = countWhere(
    rows,
    item => item.status === 'completed' && !hasCompletionProof(item),
  );
  const completedReady = completed - completedNeedsProof;
  const openOrActive = countWhere(
    rows,
    item => ['open', 'in_progress', 'paused', 'escalated'].includes(item.status),
  );
  const blockers = paused + escalated;
  const riskEvents = pendingApprovals + unassigned + blockers + completedNeedsProof;

  switch (role) {
    case 'org_admin':
      return [
        {
          key: 'risk',
          label: 'Explain Risk',
          value: pluralize(riskEvents, 'event'),
          detail: 'These are the items admin should be able to explain: approvals, unassigned work, blockers, and proof gaps.',
          tone: riskEvents > 0 ? 'pending' : 'verified',
        },
        {
          key: 'operating-story',
          label: 'Operating Story',
          value: pluralize(rows.length, 'record'),
          detail: 'Use this to check whether each request shows status, next owner, audience, proof, and history.',
          tone: rows.length > 0 ? 'active' : 'default',
        },
        {
          key: 'closeout',
          label: 'Closeout Watch',
          value: pluralize(completed, 'completed item'),
          detail:
            completedReady > 0
              ? `${pluralize(completedReady, 'item')} can move toward archive after review.`
              : 'Completed work appears here when proof or manager override is ready.',
          tone: completedNeedsProof > 0 ? 'missing' : 'verified',
        },
      ];
    case 'coordinator':
      return [
        {
          key: 'intake',
          label: 'Intake To Assign',
          value: pluralize(unassigned, 'request'),
          detail: 'These open requests need an owner before field work can start.',
          tone: unassigned > 0 ? 'open' : 'verified',
        },
        {
          key: 'approval',
          label: 'Approval Loop',
          value: pluralize(pendingApprovals, 'decision'),
          detail: 'These requests are waiting on the client. Keep follow-up notes client-visible and clear.',
          tone: pendingApprovals > 0 ? 'pending' : 'default',
        },
        {
          key: 'blockers',
          label: 'Blocker Recovery',
          value: pluralize(blockers, 'blocker'),
          detail: 'These paused or escalated requests need a reason, owner, or recovery step.',
          tone: blockers > 0 ? 'escalated' : 'verified',
        },
      ];
    case 'technician':
      return [
        {
          key: 'start',
          label: 'Start Next',
          value: pluralize(countWhere(rows, item => item.status === 'open'), 'job'),
          detail: 'These assigned jobs are open and ready to start.',
          tone: unassigned > 0 ? 'open' : 'default',
        },
        {
          key: 'proof',
          label: 'Proof Loop',
          value: pluralize(active, 'active job'),
          detail: 'Active work needs status, notes, and photo proof before completion.',
          tone: active > 0 ? 'missing' : 'verified',
        },
        {
          key: 'blockers',
          label: 'Blocked Work',
          value: pluralize(blockers, 'item'),
          detail: 'Paused or escalated jobs need clear notes so operations can help.',
          tone: blockers > 0 ? 'escalated' : 'default',
        },
      ];
    case 'client':
      return [
        {
          key: 'decision',
          label: 'Needs Decision',
          value: pluralize(pendingApprovals, 'approval'),
          detail: 'Open these first. Review the visible request, then approve, decline, or message operations.',
          tone: pendingApprovals > 0 ? 'pending' : 'verified',
        },
        {
          key: 'updates',
          label: 'Visible Updates',
          value: pluralize(openOrActive, 'active item'),
          detail: 'These requests are still moving. Use client-visible messages to reply to operations.',
          tone: openOrActive > 0 ? 'active' : 'default',
        },
        {
          key: 'proof',
          label: 'Proof Review',
          value: pluralize(completed, 'completed item'),
          detail: 'Completed proof appears here without internal notes or vendor-only messages.',
          tone: completed > 0 ? 'verified' : 'default',
        },
      ];
    case 'viewer':
      return [
        {
          key: 'snapshot',
          label: 'Snapshot Scope',
          value: pluralize(rows.length, 'visible item'),
          detail: 'This is the visible work this viewer can read. It cannot be changed here.',
          tone: rows.length > 0 ? 'active' : 'default',
        },
        {
          key: 'watch',
          label: 'Open Watch',
          value: pluralize(openOrActive, 'active item'),
          detail: 'Use this to understand progress. Operations owns all changes.',
          tone: openOrActive > 0 ? 'open' : 'verified',
        },
        {
          key: 'boundary',
          label: 'Boundary',
          value: 'Read only',
          detail: 'Edit, message, approval, upload, dispatch, and archive controls stay hidden.',
          tone: 'default',
        },
      ];
    case 'vendor':
      return [
        {
          key: 'linked',
          label: 'Linked Work',
          value: pluralize(rows.length, 'vendor item'),
          detail: 'Only work connected to this vendor should appear here.',
          tone: rows.length > 0 ? 'active' : 'default',
        },
        {
          key: 'active',
          label: 'Active Delivery',
          value: pluralize(openOrActive, 'active item'),
          detail: 'Review scope and reply through vendor-visible messages only.',
          tone: openOrActive > 0 ? 'open' : 'verified',
        },
        {
          key: 'boundary',
          label: 'Boundary',
          value: 'Vendor lane',
          detail: 'Client messages, internal notes, and unrelated vendor work stay hidden.',
          tone: 'default',
        },
      ];
    default:
      return [
        {
          key: 'visible',
          label: 'Visible Work',
          value: pluralize(rows.length, 'item'),
          detail: 'Open a work order to see the next owner, waiting state, and visible audience.',
          tone: rows.length > 0 ? 'active' : 'default',
        },
      ];
  }
};

export const getRoleEmptyState = role => {
  switch (role) {
    case 'org_admin':
      return {
        title: 'Queue is ready',
        message: 'No demo work orders exist yet. Create the first linked request when you are ready to seed the admin story.',
        detail: 'Use synthetic clients, properties, vendors, and work-order details only.',
        actionLabel: 'Create Work',
        actionRoute: 'WorkOrderForm',
      };
    case 'coordinator':
      return {
        title: 'No coordination work',
        message: 'There are no open requests needing intake, assignment, or client follow-through right now.',
        detail: 'Create a linked request when the demo queue needs a coordinator workflow.',
        actionLabel: 'Create Work',
        actionRoute: 'WorkOrderForm',
      };
    case 'technician':
      return {
        title: 'No assigned jobs',
        message: 'Assigned open or in-progress work orders will appear here in priority order.',
        detail: 'Status updates, notes, photos, and completion proof start from an assigned job.',
      };
    case 'client':
      return {
        title: 'No visible client work',
        message: 'Work orders linked to this client profile will appear here with client-visible updates and approvals.',
        detail: 'Internal notes and unrelated client work stay hidden.',
      };
    case 'viewer':
      return {
        title: 'No visible snapshot',
        message: 'Read-only work orders linked to this viewer profile will appear here.',
        detail: 'Viewer access is intentionally limited to visible client updates and proof context.',
      };
    case 'vendor':
      return {
        title: 'No linked vendor work',
        message: 'Work orders linked to this active vendor profile will appear here with vendor-visible updates.',
        detail: 'Internal notes, client messages, and unrelated vendor work stay hidden.',
      };
    default:
      return {
        title: 'No work orders',
        message: 'No work orders are available for this account.',
        detail: 'Refresh or switch users after demo data is seeded.',
      };
  }
};

export const getRoleActions = role => {
  if (!canManageOperations(role)) {
    return [];
  }

  return [
    {
      key: 'directory',
      label: 'Directory',
      detail: 'Opens: client, property, and vendor records. Use it when a request needs better linked context.',
      route: 'PmcDirectory',
      tone: 'directory',
    },
    {
      key: 'dispatch',
      label: 'Dispatch',
      detail: 'Opens: the assignment board. Use it to match open work with technicians and spot schedule pressure.',
      route: 'DispatchBoard',
      tone: 'dispatch',
    },
    {
      key: 'report',
      label: 'Report',
      detail: 'Opens: operations reporting. Use it to review stale work, workload, and service hot spots.',
      route: 'OperationsReport',
      tone: 'report',
    },
    {
      key: 'evidence',
      label: 'Evidence',
      detail: 'Opens: the role testing checklist. Use it to confirm each role sees only the right screens.',
      route: 'RoleEvidence',
      tone: 'evidence',
    },
    {
      key: 'create',
      label: 'New Work',
      detail: 'Opens: the new request form. Use it to create a work order linked to the right client and property.',
      route: 'WorkOrderForm',
      tone: 'primary',
    },
  ];
};

const formatHelpList = rows =>
  rows
    .map(row => `${row.label} = ${row.detail.replace(/^Shows:\s*/, '').replace(/^Opens:\s*/, '')}`)
    .join(' | ');

export const buildRoleWorkViewsHelp = (role, queueFilters = [], roleActions = []) => {
  const views = formatHelpList(queueFilters);
  const actionText =
    roleActions.length > 0
      ? formatHelpList(roleActions)
      : 'This role only opens work from the queue; manager pages are hidden.';
  const boundaryByRole = {
    org_admin: 'Admin can use every left-rail page.',
    coordinator: 'Coordinator can use the same manager pages for dispatch work.',
    technician: 'Technician stays in assigned work and work-order details.',
    client: 'Client stays in linked requests, approvals, and client-visible messages.',
    viewer: 'Viewer can review linked requests but cannot change them.',
    vendor: 'Vendor stays in linked vendor work and vendor-visible messages.',
  };

  return `Use the left rail first. It controls what happens in the center list. Views: ${views} Other pages: ${actionText} Boundary: ${boundaryByRole[role] || 'This account only sees its allowed work.'}`;
};

export const getRoleAccessMessage = role => {
  if (role === 'vendor') {
    return 'Unable to load linked vendor work orders.';
  }
  return 'Unable to load work orders.';
};

export const buildQueueSummary = workOrders => {
  const rows = workOrders || [];
  return {
    total: rows.length,
    open: rows.filter(item => item.status === 'open').length,
    inProgress: rows.filter(item => item.status === 'in_progress').length,
    paused: rows.filter(item => item.status === 'paused').length,
    escalated: rows.filter(item => item.status === 'escalated').length,
    pendingApproval: rows.filter(item => item.client_approval_status === 'pending').length,
  };
};

export const getDetailRoleContext = (role, workOrder = {}) => {
  switch (role) {
    case 'org_admin':
      return {
        title: 'Admin Control',
        subtitle: 'Assignment, approval, closeout readiness, and tenant audit context',
      };
    case 'coordinator':
      return {
        title: 'Coordinator Control',
        subtitle: 'Client updates, dispatch follow-through, proof, and closeout readiness',
      };
    case 'technician':
      return {
        title: 'Field Work',
        subtitle: 'Assigned status, notes, photos, and completion proof',
      };
    case 'client':
      return {
        title: workOrder.client_approval_status === 'pending' ? 'Approval Needed' : 'Client Update',
        subtitle: 'Visible status, client messages, approval state, and closeout proof',
      };
    case 'viewer':
      return {
        title: 'Read-Only Snapshot',
        subtitle: 'Visible status, client messages, and proof context',
      };
    case 'vendor':
      return {
        title: 'Vendor Update',
        subtitle: 'Linked work status, vendor messages, and proof context',
      };
    default:
      return {
        title: 'Work Order',
        subtitle: 'Status, communication, proof, and audit context',
      };
  }
};

export const buildDetailSummary = (workOrder = {}, attachments = [], messages = []) => {
  const proofState = workOrder.completion_proof_verified_at
    ? 'Verified'
    : workOrder.completion_override_reason
      ? 'Override'
      : attachments.length > 0
        ? `${attachments.length} file${attachments.length === 1 ? '' : 's'}`
        : 'Missing';

  return [
    {
      key: 'status',
      label: 'Status',
      value: (workOrder.status || 'unknown').replace(/_/g, ' '),
      tone: workOrder.status || 'default',
    },
    {
      key: 'approval',
      label: 'Approval',
      value: (workOrder.client_approval_status || 'not_required').replace(/_/g, ' '),
      tone: workOrder.client_approval_status || 'default',
    },
    {
      key: 'proof',
      label: 'Proof',
      value: proofState,
      tone:
        proofState === 'Missing'
          ? 'missing'
          : proofState === 'Override'
            ? 'override'
            : 'verified',
    },
    {
      key: 'messages',
      label: 'Messages',
      value: String(messages.length),
      tone: messages.length > 0 ? 'active' : 'default',
    },
  ];
};

const DETAIL_SCOPE = {
  org_admin: {
    label: 'Full control',
    value: 'Review tenant impact, client approval, proof readiness, and lifecycle actions from one place.',
    guardrail: 'Internal, client, and vendor communication channels must stay intentionally separated.',
  },
  coordinator: {
    label: 'Coordinator pass',
    value: 'Confirm assignment, client context, approval state, and vendor handoff before moving the job.',
    guardrail: 'Use client/vendor-visible notes only when the recipient should see the update.',
  },
  technician: {
    label: 'Field execution',
    value: 'Update status, leave work notes, and attach proof from assigned jobs only.',
    guardrail: 'Directory edits, approval requests, and unrelated work stay out of technician flow.',
  },
  client: {
    label: 'Client decision',
    value: 'Review visible status, messages, and closeout proof before approving or declining requests.',
    guardrail: 'Only client-visible messages and linked work-order proof should be visible here.',
  },
  viewer: {
    label: 'Read-only review',
    value: 'Check status, visible messages, and proof context without changing the work order.',
    guardrail: 'Mutation controls, internal notes, and unrelated client work must remain hidden.',
  },
  vendor: {
    label: 'Vendor scope',
    value: 'Review linked vendor work and reply only through the vendor-visible message path.',
    guardrail: 'Internal/client messages and other vendor work must remain hidden.',
  },
};

const getDetailActionRow = (role, workOrder = {}, capability = {}) => {
  if (capability.canDecideApproval) {
    return {
      key: 'action',
      label: 'Approval decision',
      value: 'Use the approval panel to approve or decline with an optional decision note.',
    };
  }

  if (capability.canRequestApproval) {
    return {
      key: 'action',
      label:
        workOrder.client_approval_status === 'pending'
          ? 'Approval pending'
          : 'Approval path',
      value:
        workOrder.client_approval_status === 'pending'
          ? 'Client approval has already been requested; keep client-visible updates clean.'
          : 'Request approval after the client-facing context and proof are ready.',
    };
  }

  if (capability.canUpdateStatus && capability.nextStatusCount > 0) {
    return {
      key: 'action',
      label: 'Lifecycle controls',
      value: 'Use the status actions below when the visible work state truly changes.',
    };
  }

  if (role === 'vendor') {
    return {
      key: 'action',
      label: 'Vendor update',
      value: 'Send vendor-visible updates only when the message belongs outside the internal thread.',
    };
  }

  if (role === 'client') {
    return {
      key: 'action',
      label: 'Client visibility',
      value: 'Review client-visible updates; approvals appear here when the operations team requests one.',
    };
  }

  return {
    key: 'action',
    label: 'No direct action',
    value: 'This role is intentionally limited to review for this work-order state.',
  };
};

export const buildDetailGuidanceRows = (role, workOrder = {}, capability = {}) => {
  const scope = DETAIL_SCOPE[role] || {
    label: 'Work-order scope',
    value: 'Review status, communication, proof, and next steps available to this account.',
    guardrail: 'Refresh or sign out if the visible controls do not match this account.',
  };

  return [
    {
      key: 'scope',
      label: scope.label,
      value: scope.value,
    },
    getDetailActionRow(role, workOrder, capability),
    {
      key: 'guardrail',
      label: 'Guardrail',
      value: scope.guardrail,
    },
  ];
};

const terminalStatuses = ['completed', 'cancelled', 'archived'];

const hasLinkedClient = workOrder => Boolean(workOrder?.client_id || workOrder?.client_display_name);
const hasLinkedVendor = workOrder => Boolean(workOrder?.vendor_id || workOrder?.vendor_name);
const hasAssignedTechnician = workOrder => Boolean(workOrder?.assigned_technician_id);
const hasCompletionProof = workOrder =>
  Boolean(workOrder?.completion_proof_verified_at || workOrder?.completion_override_reason);

export const buildWorkOrderReference = (workOrder = {}) => {
  if (!workOrder?.id) {
    return 'Request pending';
  }

  return `Request TS-${String(workOrder.id).padStart(4, '0')}`;
};

const getNextOwner = workOrder => {
  if (workOrder?.client_approval_status === 'pending') {
    return {
      value: 'Client',
      detail: 'The client needs to approve, decline, or reply before work moves forward.',
      tone: 'pending',
    };
  }

  if (workOrder?.status === 'open' && !hasAssignedTechnician(workOrder)) {
    return {
      value: 'Coordinator',
      detail: 'Operations needs to assign an owner or review dispatch.',
      tone: 'open',
    };
  }

  if (['in_progress', 'paused', 'escalated'].includes(workOrder?.status)) {
    return {
      value: hasAssignedTechnician(workOrder) ? 'Technician' : 'Coordinator',
      detail: hasAssignedTechnician(workOrder)
        ? 'The field owner needs to update status, notes, or proof.'
        : 'Operations needs to assign an owner before field work can continue.',
      tone: workOrder?.status || 'active',
    };
  }

  if (workOrder?.status === 'completed' && !hasCompletionProof(workOrder)) {
    return {
      value: 'Coordinator',
      detail: 'Operations needs to review proof or add a manager override.',
      tone: 'missing',
    };
  }

  if (terminalStatuses.includes(workOrder?.status)) {
    return {
      value: 'Operations',
      detail: 'No active field handoff remains for this request.',
      tone: 'default',
    };
  }

  return {
    value: hasAssignedTechnician(workOrder) ? 'Technician' : 'Coordinator',
    detail: 'Open the request to confirm the next useful action.',
    tone: 'default',
  };
};

const getWaitingOn = workOrder => {
  if (workOrder?.client_approval_status === 'pending') {
    return 'Client approval';
  }
  if (workOrder?.status === 'open' && !hasAssignedTechnician(workOrder)) {
    return 'Assignment';
  }
  if (workOrder?.status === 'in_progress') {
    return hasCompletionProof(workOrder) ? 'Status closeout' : 'Proof upload';
  }
  if (workOrder?.status === 'paused') {
    return 'Resume decision';
  }
  if (workOrder?.status === 'escalated') {
    return 'Coordinator review';
  }
  if (workOrder?.status === 'completed') {
    return hasCompletionProof(workOrder) ? 'Archive review' : 'Proof review';
  }
  if (terminalStatuses.includes(workOrder?.status)) {
    return 'Nothing active';
  }
  return 'Triage';
};

const CLIENT_WAITING_ON_COPY = {
  'Client approval': {
    value: 'Your decision',
    detail:
      'Review the visible scope, update, cost/proof context, then approve, decline, or message operations.',
  },
  Assignment: {
    value: 'Operations review',
    detail:
      'Operations is confirming scope, priority, owner, and the next visible update before field work moves forward.',
  },
  'Proof upload': {
    value: 'Field proof',
    detail:
      'The field team needs to attach client-visible proof before closeout can be reviewed.',
  },
  'Status closeout': {
    value: 'Operations closeout',
    detail:
      'Operations is checking status, proof, and client-visible notes before this becomes a completed record.',
  },
  'Resume decision': {
    value: 'Operations update',
    detail:
      'Operations is deciding what unblocks the paused request and what the client should see next.',
  },
  'Coordinator review': {
    value: 'Operations review',
    detail:
      'Operations is resolving an exception before the next client-visible update or decision.',
  },
  'Archive review': {
    value: 'Closeout review',
    detail:
      'Review the final proof and visible timeline; message operations if anything is unclear.',
  },
  'Proof review': {
    value: 'Proof review',
    detail:
      'Operations still needs proof or an approved override before the completed request is client-safe.',
  },
  'Nothing active': {
    value: 'No action needed',
    detail: 'This request has no active handoff for the client right now.',
  },
  Triage: {
    value: 'Operations review',
    detail: 'Operations is deciding the next owner, status, and client-visible update.',
  },
};

const ROLE_WAITING_ON_COPY = {
  client: CLIENT_WAITING_ON_COPY,
  viewer: {
    ...CLIENT_WAITING_ON_COPY,
    'Client approval': {
      value: 'Client decision',
      detail: 'The linked client must approve, decline, or message operations before the request moves forward.',
    },
  },
  vendor: {
    Assignment: {
      value: 'Operations dispatch',
      detail: 'Operations is confirming whether this request should be routed to a vendor.',
    },
    Triage: {
      value: 'Operations review',
      detail: 'Operations is deciding if the request needs vendor visibility or action.',
    },
    'Proof upload': {
      value: 'Vendor update',
      detail: 'A vendor-visible update or proof item is needed before closeout.',
    },
  },
};

const DEFAULT_WAITING_ON_DETAILS = {
  'Client approval': 'The client decision is the next required handoff.',
  Assignment: 'A coordinator needs to assign an owner or confirm dispatch.',
  'Proof upload': 'Field proof must be attached before closeout can be trusted.',
  'Status closeout': 'The work needs final status review before it can close.',
  'Resume decision': 'Someone must record what unblocks paused work.',
  'Coordinator review': 'Operations needs to resolve an exception before the next move.',
  'Archive review': 'Completed work is waiting for archive-ready review.',
  'Proof review': 'Completed work still needs proof review or override.',
  'Nothing active': 'No active handoff remains for this request.',
  Triage: 'Operations needs to decide the first useful owner, status, and path.',
};

const getRoleWaitingOn = (role, workOrder) => {
  const rawValue = getWaitingOn(workOrder);
  const roleCopy = ROLE_WAITING_ON_COPY[role]?.[rawValue];

  return {
    value: roleCopy?.value || rawValue,
    detail: roleCopy?.detail || DEFAULT_WAITING_ON_DETAILS[rawValue] || 'Use this to understand the current handoff.',
  };
};

const getVisibleTo = workOrder => {
  const audiences = ['Internal'];
  if (hasLinkedClient(workOrder)) {
    audiences.push('Client');
  }
  if (hasLinkedVendor(workOrder)) {
    audiences.push('Vendor');
  }
  return audiences.join(' + ');
};

export const buildWorkOrderFlowRows = (workOrder = {}, role) => {
  const nextOwner = getNextOwner(workOrder);
  const waitingOn = getRoleWaitingOn(role, workOrder);

  return [
    {
      key: 'owner',
      label: 'Next Owner',
      value: nextOwner.value,
      detail: nextOwner.detail,
      tone: nextOwner.tone,
    },
    {
      key: 'waiting',
      label: 'Waiting On',
      value: waitingOn.value,
      detail: waitingOn.detail,
      tone: nextOwner.tone,
    },
    {
      key: 'visible',
      label: 'Visible To',
      value: getVisibleTo(workOrder),
      detail: 'This shows who is linked to the request. Individual messages can still be internal, client-visible, or vendor-visible.',
      tone: hasLinkedClient(workOrder) || hasLinkedVendor(workOrder) ? 'active' : 'default',
    },
  ];
};

const EVENT_PLAYBOOK_BY_STATUS = {
  open: {
    event: 'Intake open',
    response: 'Confirm context, owner, and first action.',
    handoff: 'Coordinator keeps assignment and client/vendor links clean.',
    tone: 'open',
  },
  in_progress: {
    event: 'Field work active',
    response: 'Track field progress and proof readiness.',
    handoff: 'Technician updates status, notes, and attachments.',
    tone: 'active',
  },
  paused: {
    event: 'Work paused',
    response: 'Name the blocker and decide what resumes the job.',
    handoff: 'Coordinator or technician records the next resume condition.',
    tone: 'paused',
  },
  escalated: {
    event: 'Escalation raised',
    response: 'Review risk, ownership, and client/vendor communication.',
    handoff: 'Coordinator drives the recovery plan and keeps the lane visible.',
    tone: 'escalated',
  },
  completed: {
    event: 'Completion reported',
    response: 'Review proof, messages, and closeout readiness.',
    handoff: 'Manager confirms proof or override before archive.',
    tone: 'completed',
  },
  cancelled: {
    event: 'Work cancelled',
    response: 'Keep the cancellation reason visible for audit review.',
    handoff: 'Operations can archive when the record no longer needs action.',
    tone: 'cancelled',
  },
  archived: {
    event: 'Record archived',
    response: 'Use as historical evidence only.',
    handoff: 'No active handoff remains.',
    tone: 'archived',
  },
};

const getBaseEventPlaybook = workOrder =>
  EVENT_PLAYBOOK_BY_STATUS[workOrder?.status] || {
    event: 'Work-order review',
    response: 'Read the current state before acting.',
    handoff: 'Use the role lane and visibility cues to choose the next move.',
    tone: 'default',
  };

const getRoleEventResponse = (role, workOrder, context) => {
  const approvalStatus = workOrder?.client_approval_status || 'not_required';
  const attachmentCount = context.attachmentCount || 0;
  const messageCount = context.messageCount || 0;
  const proofSatisfied = hasCompletionProof(workOrder);

  if (role === 'client') {
    if (approvalStatus === 'pending') {
      return {
        event: 'Approval requested',
        response: 'Review visible details, proof context, and notes, then approve or decline.',
        handoff: 'Your decision sends the next handoff back to operations.',
        tone: 'pending',
      };
    }
    return {
      event: 'Client update available',
      response: 'Review status, visible messages, and proof context.',
      handoff: 'Use client-visible replies when operations needs feedback.',
      tone: 'active',
    };
  }

  if (role === 'viewer') {
    return {
      event: messageCount > 0 ? 'Snapshot updated' : 'Read-only snapshot',
      response: 'Review visible status, proof, and client-facing notes without changing the record.',
      handoff: 'Questions flow back through the client or operations team outside this lane.',
      tone: 'default',
    };
  }

  if (role === 'vendor') {
    return {
      event: messageCount > 0 ? 'Vendor thread active' : 'Vendor scope review',
      response: 'Review linked work and respond only through vendor-visible messages.',
      handoff: 'Operations receives vendor updates without exposing internal or client threads.',
      tone: workOrder?.status || 'active',
    };
  }

  if (role === 'technician') {
    if (workOrder?.status === 'in_progress' && !proofSatisfied && attachmentCount === 0) {
      return {
        event: 'Proof needed',
        response: 'Attach field evidence before trying to complete the work.',
        handoff: 'Coordinator receives proof and status notes for closeout.',
        tone: 'missing',
      };
    }
    return {
      event: workOrder?.status === 'open' ? 'Assigned work ready' : getBaseEventPlaybook(workOrder).event,
      response: 'Move the job only when field reality changes and keep notes clear.',
      handoff: 'Operations relies on technician status, notes, and proof to update clients.',
      tone: workOrder?.status || 'active',
    };
  }

  if (role === 'coordinator') {
    if (approvalStatus === 'pending') {
      return {
        event: 'Client decision pending',
        response: 'Monitor the approval and keep visible messages focused on the decision.',
        handoff: 'Client decision returns the job to dispatch or closeout.',
        tone: 'pending',
      };
    }
    if (['paused', 'escalated'].includes(workOrder?.status)) {
      return {
        event: workOrder.status === 'paused' ? 'Pause needs resolution' : 'Escalation needs owner',
        response: 'Clarify blocker, owner, and next recovery action.',
        handoff: 'Technician, vendor, or client receives the next explicit update.',
        tone: workOrder.status,
      };
    }
    return {
      event: 'Coordination checkpoint',
      response: 'Check assignment, visibility lane, approval state, and proof readiness.',
      handoff: 'Route the next action to technician, client, vendor, or admin as needed.',
      tone: workOrder?.status || 'active',
    };
  }

  if (role === 'org_admin') {
    return {
      event: 'Tenant control checkpoint',
      response: 'Review risk, auditability, proof, cost, and handoff clarity.',
      handoff: 'Use reports, dispatch, archive, or directory cleanup when the record shows friction.',
      tone: workOrder?.status || 'active',
    };
  }

  return getBaseEventPlaybook(workOrder);
};

export const buildRoleEventPlaybookRows = (role, workOrder = {}, context = {}) => {
  const roleResponse = getRoleEventResponse(role, workOrder, context);
  const baseResponse = getBaseEventPlaybook(workOrder);

  return [
    {
      key: 'event',
      label: 'Event',
      value: roleResponse.event || baseResponse.event,
      detail: baseResponse.response,
      tone: roleResponse.tone || baseResponse.tone,
    },
    {
      key: 'response',
      label: 'Your Response',
      value: roleResponse.response,
      detail: roleResponse.handoff,
      tone: roleResponse.tone || baseResponse.tone,
    },
  ];
};

const formatMessageVisibility = visibility => {
  if (visibility === 'client') {
    return 'client-visible';
  }
  if (visibility === 'vendor') {
    return 'vendor-visible';
  }
  return 'internal';
};

export const buildActionOutcomeNotice = (role, outcome = {}, workOrder = {}) => {
  const type = outcome.type;

  if (type === 'status') {
    const status = outcome.status || workOrder.status;
    const statusLabel = formatStatus(status);
    const nextWaiting = getWaitingOn(workOrder).toLowerCase();
    const detailByStatus = {
      completed:
        role === 'technician'
          ? 'Completion is recorded. Operations can now review proof and closeout.'
          : 'Completion is recorded. Review proof and closeout before archive.',
      paused: 'Pause is visible now. Keep the blocker and resume condition clear in notes.',
      escalated: 'Escalation is visible now. Coordination should own the recovery path.',
      cancelled: 'Cancellation is recorded and visible for audit review.',
      archived: 'Archive is recorded. The item leaves active operating surfaces.',
    };

    return {
      title: `${statusLabel} recorded`,
      detail: detailByStatus[status] || `Status changed to ${statusLabel}; next handoff is ${nextWaiting}.`,
      tone: status || 'active',
    };
  }

  if (type === 'message') {
    const lane = formatMessageVisibility(outcome.visibility);
    const detailByRole = {
      client: 'Operations can now respond from the client-visible lane.',
      vendor: 'Operations can now respond from the vendor-visible lane.',
      viewer: 'Read-only users cannot send messages.',
    };

    return {
      title: `${lane} message sent`,
      detail:
        detailByRole[role] ||
        `The message is saved to the ${lane} thread and stays scoped to that audience.`,
      tone: 'active',
    };
  }

  if (type === 'approval_request') {
    return {
      title: 'Approval requested',
      detail: 'The client lane now owns the decision; keep follow-up messages client-visible.',
      tone: 'pending',
    };
  }

  if (type === 'approval_decision') {
    const decision = outcome.decision === 'declined' ? 'declined' : 'approved';
    return {
      title: `Approval ${decision}`,
      detail:
        decision === 'approved'
          ? 'The decision is recorded; operations can continue the work or closeout path.'
          : 'The decline is recorded; operations should revise scope, cost, or communication.',
      tone: decision,
    };
  }

  if (type === 'attachment') {
    return {
      title: 'Proof attached',
      detail:
        role === 'technician'
          ? 'Photo evidence is saved. Complete the work when field state and proof are ready.'
          : 'Attachment is saved for proof review and closeout context.',
      tone: 'verified',
    };
  }

  return null;
};

const formatStatus = value => (value || 'unknown').replace(/_/g, ' ');

const getProofSignal = workOrder => {
  if (workOrder?.completion_proof_verified_at) {
    return 'Verified proof';
  }
  if (workOrder?.completion_override_reason) {
    return 'Manager override';
  }
  if (workOrder?.status === 'completed') {
    return 'Proof review needed';
  }
  return 'Proof pending';
};

const getWorkContext = workOrder => {
  const context = [];
  if (workOrder?.client_display_name) {
    context.push(workOrder.client_display_name);
  }
  if (workOrder?.property_name) {
    context.push(workOrder.property_name);
  }
  if (workOrder?.vendor_name) {
    context.push(workOrder.vendor_name);
  }

  return context.length > 0 ? context.join(' | ') : 'Manual intake context';
};

const getCoordinatorCardAction = workOrder => {
  if (workOrder?.client_approval_status === 'pending') {
    return 'Monitor approval';
  }
  if (workOrder?.status === 'open' && !hasAssignedTechnician(workOrder)) {
    return 'Assign owner';
  }
  if (workOrder?.status === 'completed' && !hasCompletionProof(workOrder)) {
    return 'Review closeout';
  }
  if (['paused', 'escalated'].includes(workOrder?.status)) {
    return 'Resolve blocker';
  }
  return 'Move handoff';
};

const getTechnicianCardAction = workOrder => {
  if (workOrder?.status === 'open') {
    return 'Start work';
  }
  if (workOrder?.status === 'in_progress') {
    return hasCompletionProof(workOrder) ? 'Finish closeout' : 'Capture proof';
  }
  if (workOrder?.status === 'paused') {
    return 'Update blocker';
  }
  if (workOrder?.status === 'escalated') {
    return 'Sync with ops';
  }
  if (workOrder?.status === 'completed') {
    return 'Review proof';
  }
  return 'Review job';
};

const getClientCardAction = workOrder =>
  workOrder?.client_approval_status === 'pending' ? 'Review approval' : 'Review update';

export const buildRoleCardRows = (role, workOrder = {}) => {
  const nextOwner = getNextOwner(workOrder);
  const waitingOn = getRoleWaitingOn(role, workOrder);
  const proofSignal = getProofSignal(workOrder);
  const status = formatStatus(workOrder.status);
  const priority = workOrder.priority || 'normal';
  const serviceType = workOrder.service_type || 'general';

  switch (role) {
    case 'org_admin':
      return [
        {
          key: 'risk',
          label: 'Operational Signal',
          value: `${priority} ${serviceType}`,
          detail: `This is the request's scan cue: ${status} status, ${priority} priority, and waiting on ${waitingOn.value.toLowerCase()}.`,
          tone: workOrder.status || 'default',
        },
        {
          key: 'context',
          label: 'Tenant Context',
          value: getWorkContext(workOrder),
          detail: 'This shows the linked client, property, or vendor. Open the request to inspect the full context.',
          tone: hasLinkedClient(workOrder) || hasLinkedVendor(workOrder) ? 'active' : 'missing',
        },
      ];
    case 'coordinator':
      return [
        {
          key: 'coordination',
          label: 'Coordination Need',
          value: getCoordinatorCardAction(workOrder),
          detail: `This explains the coordinator's likely next move. ${nextOwner.detail}`,
          tone: nextOwner.tone,
        },
        {
          key: 'handoff',
          label: 'Handoff Target',
          value: nextOwner.value,
          detail: `This shows who owns the next step. Waiting on ${waitingOn.value.toLowerCase()}. ${waitingOn.detail}`,
          tone: nextOwner.tone,
        },
      ];
    case 'technician':
      return [
        {
          key: 'field',
          label: 'Field Focus',
          value: getTechnicianCardAction(workOrder),
          detail: `This is the field cue for the assigned job: ${priority} priority and ${serviceType} service.`,
          tone: workOrder.status || 'default',
        },
        {
          key: 'proof',
          label: 'Proof',
          value: proofSignal,
          detail: 'This tells you whether completion proof is still needed before closeout.',
          tone: hasCompletionProof(workOrder) ? 'verified' : 'missing',
        },
      ];
    case 'client':
      return [
        {
          key: 'client-action',
          label: 'Client Action',
          value: getClientCardAction(workOrder),
          detail:
            workOrder?.client_approval_status === 'pending'
              ? 'This request is waiting on the client to approve, decline, or message operations.'
              : 'Open this request to read visible updates and proof context.',
          tone: workOrder?.client_approval_status === 'pending' ? 'pending' : 'active',
        },
        {
          key: 'proof',
          label: 'Proof',
          value: proofSignal,
          detail: 'This shows proof status without exposing internal or vendor-only notes.',
          tone: hasCompletionProof(workOrder) ? 'verified' : 'default',
        },
      ];
    case 'viewer':
      return [
        {
          key: 'snapshot',
          label: 'Snapshot',
          value: status,
          detail: 'This shows the current status for read-only review.',
          tone: workOrder.status || 'default',
        },
        {
          key: 'mode',
          label: 'Mode',
          value: 'Read only',
          detail: 'This role can read the request but cannot edit, approve, upload, or message.',
          tone: 'default',
        },
      ];
    case 'vendor':
      return [
        {
          key: 'vendor-action',
          label: 'Vendor Action',
          value: workOrder?.status === 'in_progress' ? 'Track active work' : 'Review scope',
          detail: 'Open this request to review scope or send a vendor-visible update.',
          tone: workOrder.status || 'default',
        },
        {
          key: 'visibility',
          label: 'Visible Thread',
          value: 'Vendor only',
          detail: 'This role sees vendor-visible messages only. Client and internal messages stay hidden.',
          tone: hasLinkedVendor(workOrder) ? 'active' : 'missing',
        },
      ];
    default:
      return [
        {
          key: 'status',
          label: 'Status',
          value: status,
          detail: `This shows current status and what is waiting next. Waiting on ${waitingOn.value.toLowerCase()}. ${waitingOn.detail}`,
          tone: workOrder.status || 'default',
        },
      ];
  }
};

export const buildDetailActionPathRows = (
  role,
  workOrder = {},
  capability = {},
  context = {},
) => {
  const attachmentCount = context.attachmentCount || 0;
  const messageCount = context.messageCount || 0;
  const proofSatisfied = hasCompletionProof(workOrder);
  const approvalStatus = workOrder.client_approval_status || 'not_required';

  const approvalRow = (() => {
    if (capability.canDecideApproval) {
      return {
        key: 'approval-path',
        label: 'Approval',
        target: 'approval',
        value: 'Decide request',
        detail: 'Approve or decline after reviewing the visible status, proof, and notes.',
        tone: 'pending',
      };
    }
    if (approvalStatus === 'pending') {
      return {
        key: 'approval-path',
        label: 'Approval',
        target: 'approval',
        value: role === 'client' ? 'Waiting on you' : 'Awaiting client',
        detail: 'Keep the client-visible thread clean while the decision is pending.',
        tone: 'pending',
      };
    }
    if (['approved', 'declined'].includes(approvalStatus)) {
      return {
        key: 'approval-path',
        label: 'Approval',
        target: 'approval',
        value: approvalStatus === 'approved' ? 'Approved' : 'Declined',
        detail: 'The decision is recorded in the work-order timeline.',
        tone: approvalStatus,
      };
    }
    if (capability.canRequestApproval) {
      return {
        key: 'approval-path',
        label: 'Approval',
        target: 'approval',
        value: 'Request if needed',
        detail: 'Use this only when the client should make a visible decision.',
        tone: 'active',
      };
    }
    return {
      key: 'approval-path',
      label: 'Approval',
      target: 'approval',
      value: 'No request active',
      detail: 'This lane can monitor the status without starting an approval.',
      tone: 'default',
    };
  })();

  const communicationRow = (() => {
    if (role === 'viewer') {
      return {
        key: 'communication-path',
        label: 'Communication',
        target: 'communication',
        value: 'Read only',
        detail: `${messageCount} visible message${messageCount === 1 ? '' : 's'} available for review.`,
        tone: 'default',
      };
    }
    if (role === 'vendor') {
      return {
        key: 'communication-path',
        label: 'Communication',
        target: 'communication',
        value: 'Vendor-visible reply',
        detail: 'Reply only through the vendor lane; client/internal threads stay hidden.',
        tone: 'active',
      };
    }
    if (role === 'client') {
      return {
        key: 'communication-path',
        label: 'Communication',
        target: 'communication',
        value: 'Client-visible reply',
        detail: 'Replies go to operations without exposing internal or vendor-only notes.',
        tone: 'active',
      };
    }
    return {
      key: 'communication-path',
      label: 'Communication',
      target: 'communication',
      value: capability.canSendMessages ? 'Choose audience' : 'Review only',
      detail: 'Pick internal, client, or vendor visibility before sending.',
      tone: capability.canSendMessages ? 'active' : 'default',
    };
  })();

  const proofRow = (() => {
    if (proofSatisfied) {
      return {
        key: 'proof-path',
        label: 'Proof',
        target: 'proof',
        value: getProofSignal(workOrder),
        detail: 'Closeout proof or override is already attached to the record.',
        tone: 'verified',
      };
    }
    if (attachmentCount > 0) {
      return {
        key: 'proof-path',
        label: 'Proof',
        target: 'proof',
        value: `${attachmentCount} file${attachmentCount === 1 ? '' : 's'} ready`,
        detail: 'Review the uploaded proof before completion or closeout.',
        tone: 'active',
      };
    }
    if (capability.canUploadAttachments) {
      return {
        key: 'proof-path',
        label: 'Proof',
        target: 'proof',
        value: 'Upload proof',
        detail: 'Add photo evidence before marking completed when proof is required.',
        tone: 'missing',
      };
    }
    return {
      key: 'proof-path',
      label: 'Proof',
      target: 'proof',
      value: 'Visible proof only',
      detail: 'This lane can review proof once operations or field users attach it.',
      tone: 'default',
    };
  })();

  const lifecycleRow =
    capability.canUpdateStatus && capability.nextStatusCount > 0
      ? {
          key: 'lifecycle-path',
          label: 'Lifecycle',
          target: 'lifecycle',
          value: `${capability.nextStatusCount} action${capability.nextStatusCount === 1 ? '' : 's'}`,
          detail: 'Use the status buttons only when the real work state changes.',
          tone: workOrder.status || 'active',
        }
      : {
          key: 'lifecycle-path',
          label: 'Lifecycle',
          target: 'lifecycle',
          value: 'Operations controlled',
          detail: 'Status movement is intentionally unavailable in this lane.',
          tone: 'default',
        };

  return [approvalRow, communicationRow, proofRow, lifecycleRow];
};

export const buildDetailSectionReadinessRows = (
  role,
  workOrder = {},
  capability = {},
  context = {},
) => {
  const attachmentCount = context.attachmentCount || 0;
  const messageCount = context.messageCount || 0;
  const proofSatisfied = hasCompletionProof(workOrder);
  const approvalStatus = workOrder.client_approval_status || 'not_required';
  const status = (workOrder.status || 'open').replace('_', ' ');

  const approval = (() => {
    if (capability.canDecideApproval) {
      return {
        key: 'approval-readiness',
        label: 'Approval Readiness',
        value: 'Decision available',
        detail: 'Review visible status, client notes, communication, and proof context before approving or declining.',
        tone: 'pending',
      };
    }
    if (approvalStatus === 'pending') {
      return {
        key: 'approval-readiness',
        label: 'Approval Readiness',
        value: role === 'client' ? 'Waiting on you' : 'Waiting on client',
        detail: 'The request is already open; keep follow-up messages in the client-visible lane.',
        tone: 'pending',
      };
    }
    if (['approved', 'declined'].includes(approvalStatus)) {
      return {
        key: 'approval-readiness',
        label: 'Approval Readiness',
        value: approvalStatus === 'approved' ? 'Approved' : 'Declined',
        detail: 'The client decision is recorded, so operations can continue from the current work state.',
        tone: approvalStatus,
      };
    }
    if (capability.canRequestApproval) {
      return {
        key: 'approval-readiness',
        label: 'Approval Readiness',
        value: 'Request available',
        detail: 'Use this when the linked client needs to make a visible decision before work continues.',
        tone: 'active',
      };
    }
    if (capability.canEdit && !hasLinkedClient(workOrder)) {
      return {
        key: 'approval-readiness',
        label: 'Approval Readiness',
        value: 'Client not linked',
        detail: 'Link a client before requesting approval; otherwise this record stays internal-only for decisions.',
        tone: 'missing',
      };
    }
    return {
      key: 'approval-readiness',
      label: 'Approval Readiness',
      value: 'No approval action',
      detail: 'This role can monitor the approval state without opening or deciding a request.',
      tone: 'default',
    };
  })();

  const communication = (() => {
    if (role === 'viewer') {
      return {
        key: 'communication-readiness',
        label: 'Communication Readiness',
        value: 'Read-only review',
        detail: `${messageCount} visible message${messageCount === 1 ? '' : 's'} can be reviewed; replies are disabled for this lane.`,
        tone: 'default',
      };
    }
    if (role === 'vendor') {
      return {
        key: 'communication-readiness',
        label: 'Communication Readiness',
        value: 'Vendor lane ready',
        detail: 'Replies go to vendor-visible communication only; client and internal notes remain separate.',
        tone: 'active',
      };
    }
    if (role === 'client') {
      return {
        key: 'communication-readiness',
        label: 'Communication Readiness',
        value: 'Client lane ready',
        detail: 'Replies go to operations as client-visible updates without exposing internal or vendor-only context.',
        tone: 'active',
      };
    }
    if (capability.canSendMessages) {
      return {
        key: 'communication-readiness',
        label: 'Communication Readiness',
        value: 'Audience required',
        detail: 'Choose internal, client, or vendor visibility before sending so the update lands in the right lane.',
        tone: 'active',
      };
    }
    return {
      key: 'communication-readiness',
      label: 'Communication Readiness',
      value: 'Review only',
      detail: `${messageCount} visible message${messageCount === 1 ? '' : 's'} can be reviewed by this role.`,
      tone: 'default',
    };
  })();

  const proof = (() => {
    if (proofSatisfied) {
      return {
        key: 'proof-readiness',
        label: 'Proof Readiness',
        value: getProofSignal(workOrder),
        detail: 'Closeout proof or manager override is already recorded for this work order.',
        tone: 'verified',
      };
    }
    if (attachmentCount > 0) {
      return {
        key: 'proof-readiness',
        label: 'Proof Readiness',
        value: `${attachmentCount} file${attachmentCount === 1 ? '' : 's'} ready`,
        detail: 'Review uploaded evidence before completion, approval, or closeout movement.',
        tone: 'active',
      };
    }
    if (capability.canUploadAttachments) {
      return {
        key: 'proof-readiness',
        label: 'Proof Readiness',
        value: 'Upload needed',
        detail: 'Capture photo evidence here before marking work complete when proof is required.',
        tone: 'missing',
      };
    }
    return {
      key: 'proof-readiness',
      label: 'Proof Readiness',
      value: 'Proof not available yet',
      detail: 'This lane can review proof once operations or field users attach it.',
      tone: 'default',
    };
  })();

  const lifecycle =
    capability.canUpdateStatus && capability.nextStatusCount > 0
      ? {
          key: 'lifecycle-readiness',
          label: 'Lifecycle Readiness',
          value: `${capability.nextStatusCount} action${capability.nextStatusCount === 1 ? '' : 's'} available`,
          detail: `Current status is ${status}; use status actions only when the real work state changes.`,
          tone: workOrder.status || 'active',
        }
      : {
          key: 'lifecycle-readiness',
          label: 'Lifecycle Readiness',
          value: 'Operations controlled',
          detail: `Current status is ${status}; this role can monitor status without changing it.`,
          tone: 'default',
        };

  return {approval, communication, proof, lifecycle};
};

export default {
  canManageOperations,
  getAvailableMainRoutes,
  canAccessMainRoute,
  getWorkOrdersEndpointForRole,
  getRoleHome,
  getRoleEmptyState,
  getRoleActions,
  getRoleAccessMessage,
  buildQueueSummary,
  buildRoleGuidanceRows,
  buildRoleQueueFilterRows,
  buildRoleWorkViewsHelp,
  filterWorkOrdersForRoleQueue,
  filterWorkOrdersForRoleSearch,
  getRoleQueueSearchConfig,
  getRoleQueueSortOptions,
  sortWorkOrdersForRoleQueue,
  getDetailRoleContext,
  buildDetailSummary,
  buildDetailGuidanceRows,
  buildWorkOrderReference,
  buildWorkOrderFlowRows,
  buildRoleCardRows,
  buildRoleEventLaneRows,
  buildDetailActionPathRows,
  buildDetailSectionReadinessRows,
  buildRoleEventPlaybookRows,
  buildActionOutcomeNotice,
  getRoleUserExperience,
  getRoleLane,
  buildRoleLaneRows,
  buildRoleBoundaryRows,
  getRolePortalSummary,
  getCommunicationLaneNotice,
};
