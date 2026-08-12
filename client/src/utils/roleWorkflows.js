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
      detail: 'Clients, properties, vendors',
      route: 'PmcDirectory',
      tone: 'directory',
    },
    {
      key: 'dispatch',
      label: 'Dispatch',
      detail: 'Unassigned work, SLA risk',
      route: 'DispatchBoard',
      tone: 'dispatch',
    },
    {
      key: 'report',
      label: 'Report',
      detail: 'Stale work, load, hotspots',
      route: 'OperationsReport',
      tone: 'report',
    },
    {
      key: 'evidence',
      label: 'Evidence',
      detail: 'Role capture plan',
      route: 'RoleEvidence',
      tone: 'evidence',
    },
    {
      key: 'create',
      label: 'New Work',
      detail: 'Create linked request',
      route: 'WorkOrderForm',
      tone: 'primary',
    },
  ];
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

const getNextOwner = workOrder => {
  if (workOrder?.client_approval_status === 'pending') {
    return {
      value: 'Client',
      detail: 'Approval decision is the next handoff.',
      tone: 'pending',
    };
  }

  if (workOrder?.status === 'open' && !hasAssignedTechnician(workOrder)) {
    return {
      value: 'Coordinator',
      detail: 'Needs assignment or dispatch review.',
      tone: 'open',
    };
  }

  if (['in_progress', 'paused', 'escalated'].includes(workOrder?.status)) {
    return {
      value: hasAssignedTechnician(workOrder) ? 'Technician' : 'Coordinator',
      detail: hasAssignedTechnician(workOrder)
        ? 'Field update, proof, or status movement is next.'
        : 'Needs assignment before field progress can continue.',
      tone: workOrder?.status || 'active',
    };
  }

  if (workOrder?.status === 'completed' && !hasCompletionProof(workOrder)) {
    return {
      value: 'Coordinator',
      detail: 'Closeout needs proof review or override.',
      tone: 'missing',
    };
  }

  if (terminalStatuses.includes(workOrder?.status)) {
    return {
      value: 'Operations',
      detail: 'No active field handoff remains.',
      tone: 'default',
    };
  }

  return {
    value: hasAssignedTechnician(workOrder) ? 'Technician' : 'Coordinator',
    detail: 'Review the work-order state before the next action.',
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

export const buildWorkOrderFlowRows = (workOrder = {}) => {
  const nextOwner = getNextOwner(workOrder);

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
      value: getWaitingOn(workOrder),
      detail: 'Use this to understand the current handoff.',
      tone: nextOwner.tone,
    },
    {
      key: 'visible',
      label: 'Visible To',
      value: getVisibleTo(workOrder),
      detail: 'Messages still respect internal/client/vendor visibility.',
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
  const waitingOn = getWaitingOn(workOrder);
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
          detail: `${status}; ${waitingOn.toLowerCase()}.`,
          tone: workOrder.status || 'default',
        },
        {
          key: 'context',
          label: 'Tenant Context',
          value: getWorkContext(workOrder),
          detail: 'Client, property, and vendor links stay inspectable from detail.',
          tone: hasLinkedClient(workOrder) || hasLinkedVendor(workOrder) ? 'active' : 'missing',
        },
      ];
    case 'coordinator':
      return [
        {
          key: 'coordination',
          label: 'Coordination Need',
          value: getCoordinatorCardAction(workOrder),
          detail: nextOwner.detail,
          tone: nextOwner.tone,
        },
        {
          key: 'handoff',
          label: 'Handoff Target',
          value: nextOwner.value,
          detail: `Waiting on ${waitingOn.toLowerCase()}.`,
          tone: nextOwner.tone,
        },
      ];
    case 'technician':
      return [
        {
          key: 'field',
          label: 'Field Focus',
          value: getTechnicianCardAction(workOrder),
          detail: `${priority} priority; ${serviceType} service.`,
          tone: workOrder.status || 'default',
        },
        {
          key: 'proof',
          label: 'Proof',
          value: proofSignal,
          detail: 'Completion depends on clear proof or manager override.',
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
              ? 'Approval is waiting on this client lane.'
              : 'Review visible updates and proof context.',
          tone: workOrder?.client_approval_status === 'pending' ? 'pending' : 'active',
        },
        {
          key: 'proof',
          label: 'Proof',
          value: proofSignal,
          detail: 'Only client-visible proof context is shown here.',
          tone: hasCompletionProof(workOrder) ? 'verified' : 'default',
        },
      ];
    case 'viewer':
      return [
        {
          key: 'snapshot',
          label: 'Snapshot',
          value: status,
          detail: 'Read-only review of linked client-visible progress.',
          tone: workOrder.status || 'default',
        },
        {
          key: 'mode',
          label: 'Mode',
          value: 'Read only',
          detail: 'No mutation controls are available in this lane.',
          tone: 'default',
        },
      ];
    case 'vendor':
      return [
        {
          key: 'vendor-action',
          label: 'Vendor Action',
          value: workOrder?.status === 'in_progress' ? 'Track active work' : 'Review scope',
          detail: 'Use vendor-visible messages for external updates only.',
          tone: workOrder.status || 'default',
        },
        {
          key: 'visibility',
          label: 'Visible Thread',
          value: 'Vendor only',
          detail: 'Client and internal messages stay out of this lane.',
          tone: hasLinkedVendor(workOrder) ? 'active' : 'missing',
        },
      ];
    default:
      return [
        {
          key: 'status',
          label: 'Status',
          value: status,
          detail: `Waiting on ${waitingOn.toLowerCase()}.`,
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
        value: 'Decide request',
        detail: 'Approve or decline after reviewing the visible status, proof, and notes.',
        tone: 'pending',
      };
    }
    if (approvalStatus === 'pending') {
      return {
        key: 'approval-path',
        label: 'Approval',
        value: role === 'client' ? 'Waiting on you' : 'Awaiting client',
        detail: 'Keep the client-visible thread clean while the decision is pending.',
        tone: 'pending',
      };
    }
    if (['approved', 'declined'].includes(approvalStatus)) {
      return {
        key: 'approval-path',
        label: 'Approval',
        value: approvalStatus === 'approved' ? 'Approved' : 'Declined',
        detail: 'The decision is recorded in the work-order timeline.',
        tone: approvalStatus,
      };
    }
    if (capability.canRequestApproval) {
      return {
        key: 'approval-path',
        label: 'Approval',
        value: 'Request if needed',
        detail: 'Use this only when the client should make a visible decision.',
        tone: 'active',
      };
    }
    return {
      key: 'approval-path',
      label: 'Approval',
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
        value: 'Read only',
        detail: `${messageCount} visible message${messageCount === 1 ? '' : 's'} available for review.`,
        tone: 'default',
      };
    }
    if (role === 'vendor') {
      return {
        key: 'communication-path',
        label: 'Communication',
        value: 'Vendor-visible reply',
        detail: 'Reply only through the vendor lane; client/internal threads stay hidden.',
        tone: 'active',
      };
    }
    if (role === 'client') {
      return {
        key: 'communication-path',
        label: 'Communication',
        value: 'Client-visible reply',
        detail: 'Replies go to operations without exposing internal or vendor-only notes.',
        tone: 'active',
      };
    }
    return {
      key: 'communication-path',
      label: 'Communication',
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
        value: getProofSignal(workOrder),
        detail: 'Closeout proof or override is already attached to the record.',
        tone: 'verified',
      };
    }
    if (attachmentCount > 0) {
      return {
        key: 'proof-path',
        label: 'Proof',
        value: `${attachmentCount} file${attachmentCount === 1 ? '' : 's'} ready`,
        detail: 'Review the uploaded proof before completion or closeout.',
        tone: 'active',
      };
    }
    if (capability.canUploadAttachments) {
      return {
        key: 'proof-path',
        label: 'Proof',
        value: 'Upload proof',
        detail: 'Add photo evidence before marking completed when proof is required.',
        tone: 'missing',
      };
    }
    return {
      key: 'proof-path',
      label: 'Proof',
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
          value: `${capability.nextStatusCount} action${capability.nextStatusCount === 1 ? '' : 's'}`,
          detail: 'Use the status buttons only when the real work state changes.',
          tone: workOrder.status || 'active',
        }
      : {
          key: 'lifecycle-path',
          label: 'Lifecycle',
          value: 'Operations controlled',
          detail: 'Status movement is intentionally unavailable in this lane.',
          tone: 'default',
        };

  return [approvalRow, communicationRow, proofRow, lifecycleRow];
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
  getDetailRoleContext,
  buildDetailSummary,
  buildDetailGuidanceRows,
  buildWorkOrderFlowRows,
  buildRoleCardRows,
  buildDetailActionPathRows,
  buildRoleEventPlaybookRows,
  buildActionOutcomeNotice,
  getRoleUserExperience,
  getRoleLane,
  buildRoleLaneRows,
  buildRoleBoundaryRows,
  getRolePortalSummary,
  getCommunicationLaneNotice,
};
