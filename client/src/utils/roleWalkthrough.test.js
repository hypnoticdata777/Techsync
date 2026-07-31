import {
  SYNTHETIC_EMPTY_STATE_LOGINS,
  ROLE_WALKTHROUGH_ORDER,
  getEvidenceSafetyChecklist,
  getManualEvidenceChecklist,
  getRoleEvidenceDashboard,
  getRoleEvidenceChecklistMarkdown,
  getRoleEvidenceReadinessAudit,
  getRoleWalkthrough,
  getRoleWalkthroughManifest,
  getScreenshotPlan,
} from './roleWalkthrough';

describe('role walkthrough manifest', () => {
  test('covers every public demo role in order', () => {
    expect(getRoleWalkthroughManifest().map(item => item.role)).toEqual(
      ROLE_WALKTHROUGH_ORDER,
    );
  });

  test('keeps manager and non-manager controls explicit', () => {
    expect(getRoleWalkthrough('org_admin')).toEqual(
      expect.objectContaining({
        canManage: true,
        visibleControls: expect.arrayContaining(['Directory', 'Dispatch', 'Report', 'Evidence', 'New Work']),
      }),
    );
    expect(getRoleWalkthrough('technician')).toEqual(
      expect.objectContaining({
        canManage: false,
        hiddenControls: expect.arrayContaining(['Directory', 'Dispatch', 'Report', 'Evidence', 'New Work']),
      }),
    );
  });

  test('documents client and viewer privacy expectations', () => {
    expect(getRoleWalkthrough('client').hiddenControls).toContain('Internal messages');
    expect(getRoleWalkthrough('viewer').hiddenControls).toEqual(
      expect.arrayContaining(['Internal messages', 'Status updates', 'Proof upload']),
    );
  });

  test('builds deterministic synthetic screenshot filenames', () => {
    const plan = getScreenshotPlan(['client']);

    expect(plan.map(item => item.screenshotName)).toEqual([
      'techsync-ops-client-01-client-queue.png',
      'techsync-ops-client-02-approval-detail.png',
      'techsync-ops-client-03-client-messages.png',
    ]);
    expect(plan[0].safetyChecks).toContain('no-real-customer-data');
  });

  test('keeps evidence safety guardrails visible', () => {
    const checklist = getEvidenceSafetyChecklist().join(' ');

    expect(checklist).toContain('synthetic demo tenant');
    expect(checklist).toContain('database URLs');
    expect(checklist).toContain('Review every screenshot');
  });

  test('keeps manual UX proof checks visible', () => {
    const checklist = getManualEvidenceChecklist();

    expect(checklist.map(item => item.key)).toEqual([
      'run_each_role',
      'mobile_width',
      'small_width',
      'screen_reader',
      'screenshot_safety',
    ]);
    expect(checklist.map(item => item.detail).join(' ')).toContain('320px-class narrow width');
  });

  test('audits role evidence readiness before manual screenshots', () => {
    const audit = getRoleEvidenceReadinessAudit();

    expect(audit.passed).toBe(true);
    expect(audit.roleCount).toBe(6);
    expect(audit.screenshotCount).toBe(21);
    expect(audit.checks.map(check => check.key)).toEqual([
      'synthetic_login_coverage',
      'screen_coverage',
      'empty_state_login_coverage',
      'unique_screenshot_names',
      'screenshot_safety_checks',
      'manager_controls_documented',
      'non_manager_controls_hidden',
      'technician_assigned_endpoint',
      'client_privacy_documented',
      'viewer_readonly_documented',
      'vendor_scope_documented',
    ]);
  });

  test('builds an in-app evidence dashboard model', () => {
    const dashboard = getRoleEvidenceDashboard();

    expect(dashboard.audit).toEqual(
      expect.objectContaining({
        passed: true,
        roleCount: 6,
        screenshotCount: 21,
      }),
    );
    expect(dashboard.safetyChecklist).toHaveLength(5);
    expect(dashboard.manualChecklist).toHaveLength(5);
    expect(dashboard.roleRows.find(item => item.role === 'vendor')).toEqual(
      expect.objectContaining({
        loginEmail: 'apex.demo@demo.techsyncops.dev',
        screenshotCount: 3,
        hiddenControls: expect.arrayContaining(['Internal messages', 'Client messages']),
      }),
    );
    expect(dashboard.screenshotRows).toContainEqual(
      expect.objectContaining({
        screenshotName: 'techsync-ops-vendor-01-vendor-queue.png',
      }),
    );
  });

  test('renders a markdown checklist for the manual capture pass', () => {
    const markdown = getRoleEvidenceChecklistMarkdown(['vendor']);

    expect(markdown).toContain('# TechSync Ops Role UX Evidence Checklist');
    expect(markdown).toContain('Roles: 1');
    expect(markdown).toContain('Screenshots: 3');
    expect(markdown).toContain('ready for manual capture');
    expect(markdown).toContain('techsync-ops-vendor-01-vendor-queue.png');
    expect(markdown).toContain('Only work linked to apex.demo@demo.techsyncops.dev is visible.');
  });

  test('uses the active assigned technician for the manual capture pass', () => {
    expect(getRoleWalkthrough('technician').loginEmail).toBe('marco.tech@demo.techsyncops.dev');
  });

  test('documents secondary no-work logins for empty-state proof', () => {
    expect(SYNTHETIC_EMPTY_STATE_LOGINS).toEqual(
      expect.objectContaining({
        technician: 'lena.tech@demo.techsyncops.dev',
        viewer: 'quiet-owner.demo@demo.techsyncops.dev',
        vendor: 'quiet-vendor.demo@demo.techsyncops.dev',
      }),
    );
    expect(getRoleWalkthrough('vendor').emptyStateLoginEmail).toBe('quiet-vendor.demo@demo.techsyncops.dev');
  });
});
