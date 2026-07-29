import {
  ROLE_WALKTHROUGH_ORDER,
  getEvidenceSafetyChecklist,
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
        visibleControls: expect.arrayContaining(['Directory', 'Dispatch', 'Report', 'New Work']),
      }),
    );
    expect(getRoleWalkthrough('technician')).toEqual(
      expect.objectContaining({
        canManage: false,
        hiddenControls: expect.arrayContaining(['Directory', 'Dispatch', 'Report', 'New Work']),
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
});
