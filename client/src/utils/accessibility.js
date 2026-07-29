const STATUS_LABELS = {
  open: 'open',
  in_progress: 'in progress',
  paused: 'paused',
  escalated: 'escalated',
  completed: 'completed',
  cancelled: 'cancelled',
  archived: 'archived',
};

const STATUS_ACTIONS = {
  open: 'Reopen',
  in_progress: 'Start work',
  paused: 'Pause',
  escalated: 'Escalate',
  completed: 'Mark completed',
  cancelled: 'Cancel',
  archived: 'Archive',
};

export const MIN_TOUCH_TARGET = 44;

export const formatForSpeech = value =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const statusForSpeech = status =>
  STATUS_LABELS[status] || formatForSpeech(status || 'unknown');

export const buildWorkOrderA11yLabel = workOrder => {
  const parts = [
    `Open work order ${workOrder?.title || 'Untitled work order'}`,
    `status ${statusForSpeech(workOrder?.status)}`,
  ];

  if (workOrder?.priority) {
    parts.push(`priority ${formatForSpeech(workOrder.priority)}`);
  }
  if (workOrder?.client_approval_status && workOrder.client_approval_status !== 'not_required') {
    parts.push(`client approval ${formatForSpeech(workOrder.client_approval_status)}`);
  }
  if (workOrder?.sla_risk_level && workOrder.sla_risk_level !== 'none') {
    parts.push(`SLA ${formatForSpeech(workOrder.sla_risk_level)}`);
  }

  return `${parts.join(', ')}.`;
};

export const workOrderButtonA11y = workOrder => ({
  accessibilityRole: 'button',
  accessibilityLabel: buildWorkOrderA11yLabel(workOrder),
  accessibilityHint: 'Opens the work order detail view.',
});

export const actionButtonA11y = (label, hint) => ({
  accessibilityRole: 'button',
  accessibilityLabel: label,
  accessibilityHint: hint,
});

export const summaryA11yLabel = (label, value) => `${label}: ${value}`;

export const statusActionA11y = (nextStatus, currentStatus) => ({
  accessibilityRole: 'button',
  accessibilityLabel: `${STATUS_ACTIONS[nextStatus] || formatForSpeech(nextStatus)} work order`,
  accessibilityHint: `Changes status from ${statusForSpeech(currentStatus)} to ${statusForSpeech(nextStatus)}.`,
});

export const inputA11y = (label, {required = false, multiline = false} = {}) => ({
  accessibilityLabel: `${label}${required ? ', required' : ''}`,
  accessibilityHint: multiline ? 'Double tap to edit a multi-line text field.' : 'Double tap to edit.',
});

export const roleActionA11y = action =>
  actionButtonA11y(
    `${action.label}. ${action.detail}`,
    `Opens ${formatForSpeech(action.route)}.`,
  );

export const accessibilityEvidenceChecklist = [
  'Primary touch controls expose accessibilityRole button.',
  'Work-order cards announce title, status, priority, approval, and SLA risk when available.',
  'Status transition buttons announce the current and next lifecycle state.',
  'Inputs announce their field purpose and required/multiline expectations.',
  'Summary counters provide explicit label and value pairs.',
];

export default {
  MIN_TOUCH_TARGET,
  accessibilityEvidenceChecklist,
  actionButtonA11y,
  buildWorkOrderA11yLabel,
  formatForSpeech,
  inputA11y,
  roleActionA11y,
  statusActionA11y,
  statusForSpeech,
  summaryA11yLabel,
  workOrderButtonA11y,
};
