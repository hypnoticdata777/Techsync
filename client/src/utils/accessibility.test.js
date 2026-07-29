import {
  accessibilityEvidenceChecklist,
  buildWorkOrderA11yLabel,
  inputA11y,
  roleActionA11y,
  statusActionA11y,
  summaryA11yLabel,
} from './accessibility';

describe('accessibility helpers', () => {
  test('announces work-order status, priority, approval, and SLA risk', () => {
    expect(
      buildWorkOrderA11yLabel({
        title: 'Emergency leak',
        status: 'escalated',
        priority: 'emergency',
        client_approval_status: 'pending',
        sla_risk_level: 'due_soon',
      }),
    ).toBe(
      'Open work order Emergency leak, status escalated, priority emergency, client approval pending, SLA due soon.',
    );
  });

  test('builds lifecycle transition action labels and hints', () => {
    expect(statusActionA11y('paused', 'in_progress')).toEqual({
      accessibilityRole: 'button',
      accessibilityLabel: 'Pause work order',
      accessibilityHint: 'Changes status from in progress to paused.',
    });
  });

  test('marks required and multiline inputs clearly', () => {
    expect(inputA11y('Title', {required: true})).toEqual({
      accessibilityLabel: 'Title, required',
      accessibilityHint: 'Double tap to edit.',
    });
    expect(inputA11y('Notes', {multiline: true}).accessibilityHint).toContain('multi-line');
  });

  test('provides role action and summary evidence labels', () => {
    expect(
      roleActionA11y({label: 'Dispatch', detail: 'Unassigned work, SLA risk', route: 'DispatchBoard'}),
    ).toEqual({
      accessibilityRole: 'button',
      accessibilityLabel: 'Dispatch. Unassigned work, SLA risk',
      accessibilityHint: 'Opens DispatchBoard.',
    });
    expect(summaryA11yLabel('Approvals', 3)).toBe('Approvals: 3');
  });

  test('keeps the accessibility evidence checklist explicit', () => {
    expect(accessibilityEvidenceChecklist).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Work-order cards announce'),
        expect.stringContaining('Status transition buttons'),
      ]),
    );
  });
});
