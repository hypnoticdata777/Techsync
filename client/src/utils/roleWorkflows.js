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
  getRoleUserExperience,
};
