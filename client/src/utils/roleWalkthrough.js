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
  org_admin: 'admin.demo@demo.techsyncops.dev',
  coordinator: 'coordinator.demo@demo.techsyncops.dev',
  technician: 'lena.tech@demo.techsyncops.dev',
  client: 'client.demo@demo.techsyncops.dev',
  viewer: 'owner-group.demo@demo.techsyncops.dev',
  vendor: 'apex.demo@demo.techsyncops.dev',
};

const SAFETY_CHECKS = [
  'synthetic-login-only',
  'no-real-customer-data',
  'no-provider-secrets',
  'no-database-urls',
  'no-console-or-terminal-overlays',
];

const MANUAL_EVIDENCE_CHECKS = [
  {
    key: 'run_each_role',
    label: 'Run each synthetic role',
    detail: 'Log in as admin, coordinator, technician, client, viewer, and vendor before screenshots.',
  },
  {
    key: 'mobile_width',
    label: 'Check mobile width',
    detail: 'Verify 390px-class mobile width has no clipped buttons, hidden labels, or overlapping summary tiles.',
  },
  {
    key: 'small_width',
    label: 'Check narrow width',
    detail: 'Verify 320px-class narrow width still wraps action labels and evidence rows cleanly.',
  },
  {
    key: 'screen_reader',
    label: 'Screen-reader notes',
    detail: 'Confirm primary queues, detail controls, forms, dispatch chips, approvals, and evidence rows announce useful labels.',
  },
  {
    key: 'screenshot_safety',
    label: 'Screenshot safety review',
    detail: 'Review every capture for real data, secrets, URLs, terminals, provider dashboards, and passwords.',
  },
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
    visibleControls: ['Directory', 'Dispatch', 'Report', 'Evidence', 'New Work'],
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
    visibleControls: ['Directory', 'Dispatch', 'Report', 'Evidence', 'New Work'],
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
    hiddenControls: ['Directory', 'Dispatch', 'Report', 'Evidence', 'New Work'],
  },
  client: {
    persona: 'Homeowner/client contact',
    objective: 'Show linked work visibility, client-visible messages, approval decision, and hidden internal context.',
    screens: [
      {key: 'client-queue', route: 'WorkOrdersList', proof: 'Only work linked to client.demo@demo.techsyncops.dev is visible.'},
      {key: 'approval-detail', route: 'WorkOrderDetails', proof: 'Approval/decline controls show only when approval is pending.'},
      {key: 'client-messages', route: 'WorkOrderDetails', proof: 'Client-visible messages appear; internal tab is hidden.'},
    ],
    visibleControls: ['Client messages', 'Approval decision when pending'],
    hiddenControls: ['Internal messages', 'Directory', 'Dispatch', 'Report', 'Evidence', 'New Work'],
  },
  viewer: {
    persona: 'Read-only owner/board viewer',
    objective: 'Show read-only linked work and absence of mutation/manager controls.',
    screens: [
      {key: 'viewer-queue', route: 'WorkOrdersList', proof: 'Only work linked to owner-group.demo@demo.techsyncops.dev is visible.'},
      {key: 'readonly-detail', route: 'WorkOrderDetails', proof: 'Visible status/messages/proof context without action controls.'},
      {key: 'viewer-empty', route: 'WorkOrdersList', proof: 'No visible snapshot empty state is clear when scoped queue is empty.'},
    ],
    visibleControls: ['Read-only status', 'Client-visible messages'],
    hiddenControls: ['Internal messages', 'Status updates', 'Proof upload', 'Directory', 'Dispatch', 'Report', 'Evidence', 'New Work'],
  },
  vendor: {
    persona: 'External vendor contact',
    objective: 'Show linked vendor work visibility, vendor-visible messages, and hidden internal/client context.',
    screens: [
      {key: 'vendor-queue', route: 'WorkOrdersList', proof: 'Only work linked to apex.demo@demo.techsyncops.dev is visible.'},
      {key: 'vendor-detail', route: 'WorkOrderDetails', proof: 'Vendor-visible status, messages, attachments, and proof context appear.'},
      {key: 'vendor-empty', route: 'WorkOrdersList', proof: 'No linked vendor work empty state is clear when scoped queue is empty.'},
    ],
    visibleControls: ['Vendor messages', 'Linked work status', 'Proof context'],
    hiddenControls: ['Internal messages', 'Client messages', 'Status updates', 'Proof upload', 'Directory', 'Dispatch', 'Report', 'Evidence', 'New Work'],
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

export const getManualEvidenceChecklist = () => MANUAL_EVIDENCE_CHECKS;

export const getRoleEvidenceDashboard = (roles = ROLE_WALKTHROUGH_ORDER) => {
  const manifest = getRoleWalkthroughManifest(roles);
  const plan = getScreenshotPlan(roles);
  const audit = getRoleEvidenceReadinessAudit(roles);
  const safetyChecklist = getEvidenceSafetyChecklist();
  const manualChecklist = getManualEvidenceChecklist();

  return {
    audit,
    safetyChecklist,
    manualChecklist,
    roleRows: manifest.map(item => ({
      role: item.role,
      persona: item.persona,
      loginEmail: item.loginEmail,
      objective: item.objective,
      screenshotCount: item.screens.length,
      visibleControls: item.visibleControls,
      hiddenControls: item.hiddenControls,
    })),
    screenshotRows: plan,
  };
};

const allRolesHaveLogin = manifest =>
  manifest.every(item => Boolean(item.loginEmail));

const allRolesHaveScreens = manifest =>
  manifest.every(item => item.screens.length > 0);

const screenshotNamesAreUnique = plan => {
  const names = plan.map(item => item.screenshotName);
  return new Set(names).size === names.length;
};

const everyScreenshotHasSafetyChecks = plan =>
  plan.every(item =>
    SAFETY_CHECKS.every(check => item.safetyChecks.includes(check)),
  );

const managersHaveManagerControls = manifest =>
  manifest
    .filter(item => item.canManage)
    .every(item =>
      ['Directory', 'Dispatch', 'Report', 'Evidence', 'New Work'].every(control =>
        item.visibleControls.includes(control),
      ),
    );

const nonManagersHideManagerControls = manifest =>
  manifest
    .filter(item => !item.canManage)
    .every(item =>
      ['Directory', 'Dispatch', 'Report', 'Evidence', 'New Work'].every(control =>
        item.hiddenControls.includes(control),
      ),
    );

const clientPrivacyIsDocumented = manifest => {
  const client = manifest.find(item => item.role === 'client');
  return Boolean(
    client &&
      client.hiddenControls.includes('Internal messages') &&
      client.objective.includes('linked work visibility'),
  );
};

const viewerReadonlyIsDocumented = manifest => {
  const viewer = manifest.find(item => item.role === 'viewer');
  return Boolean(
    viewer &&
      viewer.hiddenControls.includes('Status updates') &&
      viewer.hiddenControls.includes('Proof upload') &&
      viewer.objective.includes('read-only linked work'),
  );
};

const technicianEndpointIsAssignedOnly = manifest => {
  const technician = manifest.find(item => item.role === 'technician');
  return technician?.endpoint === '/work-orders/mine';
};

const vendorScopeIsDocumented = manifest => {
  const vendor = manifest.find(item => item.role === 'vendor');
  return Boolean(
    vendor &&
      vendor.objective.includes('linked vendor work') &&
      vendor.hiddenControls.includes('Internal messages') &&
      vendor.hiddenControls.includes('Client messages'),
  );
};

const roleNotRequestedOr = (manifest, role, assertion) =>
  !manifest.some(item => item.role === role) || assertion(manifest);

export const getRoleEvidenceReadinessAudit = (roles = ROLE_WALKTHROUGH_ORDER) => {
  const manifest = getRoleWalkthroughManifest(roles);
  const plan = getScreenshotPlan(roles);
  const checks = [
    {
      key: 'synthetic_login_coverage',
      passed: allRolesHaveLogin(manifest),
      detail: 'Every role has a synthetic login email.',
    },
    {
      key: 'screen_coverage',
      passed: allRolesHaveScreens(manifest),
      detail: 'Every role has at least one screenshot target.',
    },
    {
      key: 'unique_screenshot_names',
      passed: screenshotNamesAreUnique(plan),
      detail: 'Screenshot filenames are deterministic and unique.',
    },
    {
      key: 'screenshot_safety_checks',
      passed: everyScreenshotHasSafetyChecks(plan),
      detail: 'Every screenshot target carries the full safety checklist.',
    },
    {
      key: 'manager_controls_documented',
      passed: managersHaveManagerControls(manifest),
      detail: 'Admin/coordinator walkthroughs document manager controls.',
    },
    {
      key: 'non_manager_controls_hidden',
      passed: nonManagersHideManagerControls(manifest),
      detail: 'Technician/client/viewer/vendor walkthroughs hide manager controls.',
    },
    {
      key: 'technician_assigned_endpoint',
      passed: roleNotRequestedOr(manifest, 'technician', technicianEndpointIsAssignedOnly),
      detail: 'Technician evidence uses the assigned-work endpoint.',
    },
    {
      key: 'client_privacy_documented',
      passed: roleNotRequestedOr(manifest, 'client', clientPrivacyIsDocumented),
      detail: 'Client evidence calls out linked-work and internal-message privacy.',
    },
    {
      key: 'viewer_readonly_documented',
      passed: roleNotRequestedOr(manifest, 'viewer', viewerReadonlyIsDocumented),
      detail: 'Viewer evidence calls out read-only access and hidden mutation controls.',
    },
    {
      key: 'vendor_scope_documented',
      passed: roleNotRequestedOr(manifest, 'vendor', vendorScopeIsDocumented),
      detail: 'Vendor evidence calls out linked-work scope and hidden internal/client context.',
    },
  ];

  return {
    generatedFor: roles,
    roleCount: manifest.length,
    screenshotCount: plan.length,
    passed: checks.every(check => check.passed),
    checks,
  };
};

export const getRoleEvidenceChecklistMarkdown = (roles = ROLE_WALKTHROUGH_ORDER) => {
  const audit = getRoleEvidenceReadinessAudit(roles);
  const plan = getScreenshotPlan(roles);
  const lines = [
    '# TechSync Ops Role UX Evidence Checklist',
    '',
    `Roles: ${audit.roleCount}`,
    `Screenshots: ${audit.screenshotCount}`,
    `Readiness: ${audit.passed ? 'ready for manual capture' : 'needs manifest fixes'}`,
    '',
    '## Automated Manifest Checks',
    '',
    ...audit.checks.map(check => `- [${check.passed ? 'x' : ' '}] ${check.detail}`),
    '',
    '## Screenshot Plan',
    '',
    ...plan.map(
      item =>
        `- ${item.role} / ${item.route}: \`${item.screenshotName}\` - ${item.proof}`,
    ),
  ];

  return `${lines.join('\n')}\n`;
};

export default {
  ROLE_WALKTHROUGH_ORDER,
  SYNTHETIC_ROLE_LOGINS,
  getRoleWalkthrough,
  getRoleWalkthroughManifest,
  getScreenshotPlan,
  getEvidenceSafetyChecklist,
  getManualEvidenceChecklist,
  getRoleEvidenceDashboard,
  getRoleEvidenceReadinessAudit,
  getRoleEvidenceChecklistMarkdown,
};
