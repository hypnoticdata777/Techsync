const MANAGER_ROLES = ['org_admin', 'coordinator'];

export const canManageOperations = role => MANAGER_ROLES.includes(role);

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

export default {
  canManageOperations,
  getWorkOrdersEndpointForRole,
  getRoleHome,
  getRoleActions,
  getRoleAccessMessage,
  buildQueueSummary,
};
