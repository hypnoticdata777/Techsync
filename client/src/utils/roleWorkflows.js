const MANAGER_ROLES = ['org_admin', 'coordinator'];
const BASE_MAIN_ROUTES = ['WorkOrdersList', 'WorkOrderDetails'];
const MANAGER_MAIN_ROUTES = [
  'WorkOrderForm',
  'OperationsReport',
  'DispatchBoard',
  'PmcDirectory',
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
        subtitle: 'Vendor portal access is staged for a later workflow',
        emptyState: 'Vendor work-order access is not enabled in this POC yet.',
      };
    default:
      return {
        title: 'Work Orders',
        subtitle: 'Maintenance queue and status activity',
        emptyState: 'No work orders are available.',
      };
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
        title: 'Vendor access staged',
        message: 'Vendor work-order access is documented for later and intentionally disabled in this POC.',
        detail: 'This prevents accidental vendor-facing exposure before the workflow is ready.',
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
    return 'Vendor work-order access is not enabled in this POC yet.';
  }
  return 'Unable to load work orders.';
};

export const buildQueueSummary = workOrders => {
  const rows = workOrders || [];
  return {
    total: rows.length,
    open: rows.filter(item => item.status === 'open').length,
    inProgress: rows.filter(item => item.status === 'in_progress').length,
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
        title: 'Vendor Access Staged',
        subtitle: 'Vendor-facing workflow is planned after the current POC gate',
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
  getDetailRoleContext,
  buildDetailSummary,
};
