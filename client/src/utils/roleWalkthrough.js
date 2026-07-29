import {
  canManageOperations,
  getRoleEmptyState,
  getRoleHome,
  getWorkOrdersEndpointForRole,
} from './roleWorkflows';

export const ROLE_WALKTHROUGH_ORDER = [
  'org_admin',
  'coordinator',
  'technician',
  'client',
  'viewer',
  'vendor',
];

export const SYNTHETIC_ROLE_LOGINS = {
  org_admin: 'admin.demo@techsync.local',
  coordinator: 'coordinator.demo@techsync.local',
  technician: 'lena.tech@techsync.local',
  client: 'client.demo@techsync.local',
  viewer: 'owner-group.demo@techsync.local',
  vendor: 'apex.demo@techsync.local',
};

const SAFETY_CHECKS = [
  'synthetic-login-only',
  'no-real-customer-data',
  'no-provider-secrets',
  'no-database-urls',
  'no-console-or-terminal-overlays',
];

const WALKTHROUGH_BY_ROLE = {
  org_admin: {
    persona: 'PMC owner/operator',
    objective: 'Show tenant control, queue health, directory, dispatch, reporting, and linked work creation.',
    screens: [
      {key: 'queue', route: 'WorkOrdersList', proof: 'Admin landing band, manager actions, and queue summary visible.'},
      {key: 'directory', route: 'PmcDirectory', proof: 'Clients, properties, and vendors can be managed.'},
      {key: 'dispatch', route: 'DispatchBoard', proof: 'Unassigned work, technician lanes, capacity, and SLA risk visible.'},
      {key: 'report', route: 'OperationsReport', proof: 'Risk, capacity, hotspots, and completion cycle bars visible.'},
      {key: 'create-work', route: 'WorkOrderForm', proof: 'Client/property/vendor selectors and review panel visible.'},
    ],
    visibleControls: ['Directory', 'Dispatch', 'Report', 'New Work'],
    hiddenControls: [],
  },
  coordinator: {
    persona: 'Operations coordinator',
    objective: 'Show intake, assignment, client updates, proof follow-through, and reporting access.',
    screens: [
      {key: 'queue', route: 'WorkOrdersList', proof: 'Coordinator landing band and manager action cards visible.'},
      {key: 'create-work', route: 'WorkOrderForm', proof: 'Duplicate warning path and linked context review are reachable.'},
      {key: 'dispatch', route: 'DispatchBoard', proof: 'Coordinator can inspect unassigned work and technician load.'},
      {key: 'detail', route: 'WorkOrderDetails', proof: 'Status, approval request, messages, and proof summary visible.'},
    ],
    visibleControls: ['Directory', 'Dispatch', 'Report', 'New Work'],
    hiddenControls: [],
  },
  technician: {
    persona: 'Field technician',
    objective: 'Show assigned queue, status update path, proof attachment, and no manager-only actions.',
    screens: [
      {key: 'assigned-queue', route: 'WorkOrdersList', proof: 'Technician uses /work-orders/mine and sees assigned work only.'},
      {key: 'detail-status', route: 'WorkOrderDetails', proof: 'Allowed status buttons, notes, messages, and proof controls visible.'},
      {key: 'empty-assigned', route: 'WorkOrdersList', proof: 'No assigned jobs empty state is clear when queue is empty.'},
    ],
    visibleControls: ['Assigned queue', 'Status updates', 'Proof upload'],
    hiddenControls: ['Directory', 'Dispatch', 'Report', 'New Work'],
  },
  client: {
    persona: 'Homeowner/client contact',
    objective: 'Show linked work visibility, client-visible messages, approval decision, and hidden internal context.',
    screens: [
      {key: 'client-queue', route: 'WorkOrdersList', proof: 'Only work linked to client.demo@techsync.local is visible.'},
      {key: 'approval-detail', route: 'WorkOrderDetails', proof: 'Approval/decline controls show only when approval is pending.'},
      {key: 'client-messages', route: 'WorkOrderDetails', proof: 'Client-visible messages appear; internal tab is hidden.'},
    ],
    visibleControls: ['Client messages', 'Approval decision when pending'],
    hiddenControls: ['Internal messages', 'Directory', 'Dispatch', 'Report', 'New Work'],
  },
  viewer: {
    persona: 'Read-only owner/board viewer',
    objective: 'Show read-only linked work and absence of mutation/manager controls.',
    screens: [
      {key: 'viewer-queue', route: 'WorkOrdersList', proof: 'Only work linked to owner-group.demo@techsync.local is visible.'},
      {key: 'readonly-detail', route: 'WorkOrderDetails', proof: 'Visible status/messages/proof context without action controls.'},
      {key: 'viewer-empty', route: 'WorkOrdersList', proof: 'No visible snapshot empty state is clear when scoped queue is empty.'},
    ],
    visibleControls: ['Read-only status', 'Client-visible messages'],
    hiddenControls: ['Internal messages', 'Status updates', 'Proof upload', 'Directory', 'Dispatch', 'Report', 'New Work'],
  },
  vendor: {
    persona: 'External vendor contact',
    objective: 'Show that vendor portal access is intentionally staged and blocked in the POC.',
    screens: [
      {key: 'vendor-staged', route: 'WorkOrdersList', proof: 'Vendor staged/disabled state is explicit.'},
    ],
    visibleControls: ['Staged access explanation'],
    hiddenControls: ['Work-order detail', 'Directory', 'Dispatch', 'Report', 'New Work'],
  },
};

const withScreenshotName = (role, screen, index) => ({
  ...screen,
  screenshotName: `techsync-ops-${role}-${String(index + 1).padStart(2, '0')}-${screen.key}.png`,
  safetyChecks: SAFETY_CHECKS,
});

export const getRoleWalkthrough = role => {
  const base = WALKTHROUGH_BY_ROLE[role] || {
    persona: 'Authenticated user',
    objective: 'Show the default authenticated work-order queue.',
    screens: [{key: 'queue', route: 'WorkOrdersList', proof: 'Default queue is visible.'}],
    visibleControls: [],
    hiddenControls: [],
  };

  return {
    role,
    persona: base.persona,
    loginEmail: SYNTHETIC_ROLE_LOGINS[role] || null,
    endpoint: getWorkOrdersEndpointForRole(role),
    home: getRoleHome(role),
    emptyState: getRoleEmptyState(role),
    canManage: canManageOperations(role),
    objective: base.objective,
    visibleControls: base.visibleControls,
    hiddenControls: base.hiddenControls,
    screens: base.screens.map((screen, index) => withScreenshotName(role, screen, index)),
  };
};

export const getRoleWalkthroughManifest = (roles = ROLE_WALKTHROUGH_ORDER) =>
  roles.map(role => getRoleWalkthrough(role));

export const getScreenshotPlan = (roles = ROLE_WALKTHROUGH_ORDER) =>
  getRoleWalkthroughManifest(roles).flatMap(item =>
    item.screens.map(screen => ({
      role: item.role,
      persona: item.persona,
      loginEmail: item.loginEmail,
      route: screen.route,
      screenshotName: screen.screenshotName,
      proof: screen.proof,
      safetyChecks: screen.safetyChecks,
    })),
  );

export const getEvidenceSafetyChecklist = () => [
  'Use only the synthetic demo tenant created by scripts/seed_demo_data.py.',
  'Do not show terminal windows, database URLs, provider dashboards, tokens, or passwords in screenshots.',
  'Do not capture real customer names, addresses, vendors, technicians, attachments, or locations.',
  'Use filenames from getScreenshotPlan so role, route, and order are obvious.',
  'Review every screenshot before adding it to portfolio or investor materials.',
];

export default {
  ROLE_WALKTHROUGH_ORDER,
  SYNTHETIC_ROLE_LOGINS,
  getRoleWalkthrough,
  getRoleWalkthroughManifest,
  getScreenshotPlan,
  getEvidenceSafetyChecklist,
};
