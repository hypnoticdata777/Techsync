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
  technician: 'marco.tech@demo.techsyncops.dev',
  client: 'client.demo@demo.techsyncops.dev',
  viewer: 'owner-group.demo@demo.techsyncops.dev',
  vendor: 'apex.demo@demo.techsyncops.dev',
};

export const SYNTHETIC_EMPTY_STATE_LOGINS = {
  technician: 'lena.tech@demo.techsyncops.dev',
  viewer: 'quiet-owner.demo@demo.techsyncops.dev',
  vendor: 'quiet-vendor.demo@demo.techsyncops.dev',
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

export const CAPTURE_VIEWPORTS = [
  {
    key: 'mobile_390',
    label: '390px mobile',
    size: '390 x 844',
    proof: 'Primary queues, cards, and action rows remain readable without clipped labels.',
  },
  {
    key: 'narrow_320',
    label: '320px narrow',
    size: '320 x 740',
    proof: 'Compact controls wrap cleanly and no evidence rows overlap.',
  },
  {
    key: 'desktop_review',
    label: 'Desktop review',
    size: '1365 x 768 or wider',
    proof: 'Screenshots are free of terminals, provider dashboards, secrets, and browser devtools.',
  },
];

const CAPTURE_PREFLIGHT_STEPS = [
  {
    key: 'seed_status_strict',
    label: 'Strict seed status',
    owner: 'local API terminal',
    detail: 'Run the demo seed status gate with --strict before role login screenshots.',
  },
  {
    key: 'smoke_role_ux',
    label: 'Role smoke evidence',
    owner: 'repo terminal',
    detail: 'Run scripts/smoke_role_ux.py against the local API and review sanitized role/API evidence.',
  },
  {
    key: 'prepare_capture',
    label: 'Capture manifest',
    owner: 'repo terminal',
    detail: 'Generate the ignored screenshot folder, manual notes copy, and capture manifest.',
  },
  {
    key: 'manual_walkthrough',
    label: 'Manual role pass',
    owner: 'browser',
    detail: 'Walk every synthetic role, capture required views, and record 390px/320px comfort notes.',
  },
  {
    key: 'strict_evidence_pack',
    label: 'Strict evidence pack',
    owner: 'repo terminal',
    detail: 'Build the evidence pack with --strict and resolve every screenshot/manual blocker.',
  },
  {
    key: 'safety_review',
    label: 'Screenshot safety',
    owner: 'reviewer',
    detail: 'Confirm every image is synthetic and contains no terminals, provider pages, URLs, tokens, or passwords.',
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

const CAPTURE_FOCUS_BY_ROLE = {
  org_admin: [
    'Manager controls are visible.',
    'Directory, dispatch, reports, evidence, and linked work creation are reachable.',
    'No provider dashboards, URLs, or terminal overlays appear in captures.',
  ],
  coordinator: [
    'Coordinator can create linked work and review duplicate-warning context.',
    'Dispatch and detail follow-through are visible without admin-only tenant settings.',
    'Approval request and client/vendor communication paths are understandable.',
  ],
  technician: [
    'Assigned queue shows active assigned work only.',
    'Status, notes, and proof controls are touch-friendly at narrow widths.',
    'Manager-only screens and internal admin controls remain hidden.',
  ],
  client: [
    'Only linked client work is visible.',
    'Pending approval decisions are obvious and internal notes remain hidden.',
    'Client-visible messages read like updates, not internal operations chatter.',
  ],
  viewer: [
    'Read-only scope is obvious.',
    'No mutation, proof-upload, or manager controls are visible.',
    'Empty-state capture proves unrelated work stays hidden.',
  ],
  vendor: [
    'Only linked vendor work is visible.',
    'Vendor-visible messages appear without client/internal message leakage.',
    'Empty-state capture proves unrelated vendor work stays hidden.',
  ],
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
    emptyStateLoginEmail: SYNTHETIC_EMPTY_STATE_LOGINS[role] || null,
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

export const getCaptureViewportPlan = () => CAPTURE_VIEWPORTS;

export const getCapturePreflightSteps = () => CAPTURE_PREFLIGHT_STEPS;

export const getRoleCaptureStatusRows = (roles = ROLE_WALKTHROUGH_ORDER) =>
  getRoleWalkthroughManifest(roles).map(item => ({
    role: item.role,
    persona: item.persona,
    primaryLoginEmail: item.loginEmail,
    emptyStateLoginEmail: item.emptyStateLoginEmail,
    screenshotCount: item.screens.length,
    screenshots: item.screens.map(screen => screen.screenshotName),
    focusChecks: CAPTURE_FOCUS_BY_ROLE[item.role] || [],
    viewportKeys: CAPTURE_VIEWPORTS.map(viewport => viewport.key),
  }));

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
    capturePreflightRows: getCapturePreflightSteps(),
    captureViewportRows: getCaptureViewportPlan(),
    captureStatusRows: getRoleCaptureStatusRows(roles),
    roleRows: manifest.map(item => ({
      role: item.role,
      persona: item.persona,
      loginEmail: item.loginEmail,
      emptyStateLoginEmail: item.emptyStateLoginEmail,
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

const emptyStateRolesHaveLogins = manifest =>
  manifest
    .filter(item => item.screens.some(screen => screen.key.includes('empty')))
    .every(item => Boolean(item.emptyStateLoginEmail));

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

const capturePreflightHasStrictSeed = () =>
  CAPTURE_PREFLIGHT_STEPS.some(
    step => step.key === 'seed_status_strict' && step.detail.includes('--strict'),
  );

const capturePreflightHasStrictEvidencePack = () =>
  CAPTURE_PREFLIGHT_STEPS.some(
    step => step.key === 'strict_evidence_pack' && step.detail.includes('--strict'),
  );

const captureWidthsAreDocumented = () =>
  ['mobile_390', 'narrow_320'].every(key =>
    CAPTURE_VIEWPORTS.some(viewport => viewport.key === key),
  );

const everyRoleHasCaptureFocus = manifest =>
  manifest.every(item => (CAPTURE_FOCUS_BY_ROLE[item.role] || []).length >= 2);

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
      key: 'empty_state_login_coverage',
      passed: emptyStateRolesHaveLogins(manifest),
      detail: 'Every role with an empty-state screenshot has a secondary synthetic no-work login.',
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
    {
      key: 'strict_seed_preflight',
      passed: capturePreflightHasStrictSeed(),
      detail: 'Capture preflight requires strict demo seed status before screenshots.',
    },
    {
      key: 'strict_evidence_pack_preflight',
      passed: capturePreflightHasStrictEvidencePack(),
      detail: 'Capture preflight ends with a strict evidence-pack gate.',
    },
    {
      key: 'small_width_viewports_documented',
      passed: captureWidthsAreDocumented(),
      detail: '390px and 320px viewport checks are explicit before hosting.',
    },
    {
      key: 'role_capture_focus_documented',
      passed: everyRoleHasCaptureFocus(manifest),
      detail: 'Every role has manual capture focus checks for friction review.',
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
    '',
    '## Capture Preflight',
    '',
    ...CAPTURE_PREFLIGHT_STEPS.map(
      step => `- ${step.label}: ${step.detail}`,
    ),
    '',
    '## Viewport Checks',
    '',
    ...CAPTURE_VIEWPORTS.map(
      viewport => `- ${viewport.label} (${viewport.size}): ${viewport.proof}`,
    ),
  ];

  return `${lines.join('\n')}\n`;
};

export default {
  ROLE_WALKTHROUGH_ORDER,
  SYNTHETIC_ROLE_LOGINS,
  SYNTHETIC_EMPTY_STATE_LOGINS,
  getRoleWalkthrough,
  getRoleWalkthroughManifest,
  getScreenshotPlan,
  getEvidenceSafetyChecklist,
  getManualEvidenceChecklist,
  getCaptureViewportPlan,
  getCapturePreflightSteps,
  getRoleCaptureStatusRows,
  getRoleEvidenceDashboard,
  getRoleEvidenceReadinessAudit,
  getRoleEvidenceChecklistMarkdown,
};
