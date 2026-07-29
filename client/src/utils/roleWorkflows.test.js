import {
  buildQueueSummary,
  canManageOperations,
  getRoleActions,
  getRoleHome,
  getWorkOrdersEndpointForRole,
} from './roleWorkflows';

describe('role workflow helpers', () => {
  test('limits operations actions to admin and coordinator roles', () => {
    expect(canManageOperations('org_admin')).toBe(true);
    expect(canManageOperations('coordinator')).toBe(true);
    expect(canManageOperations('technician')).toBe(false);
    expect(canManageOperations('client')).toBe(false);
  });

  test('routes technicians to their assigned queue endpoint', () => {
    expect(getWorkOrdersEndpointForRole('technician')).toBe('/work-orders/mine');
    expect(getWorkOrdersEndpointForRole('client')).toBe('/work-orders');
    expect(getWorkOrdersEndpointForRole('org_admin')).toBe('/work-orders');
  });

  test('returns manager actions in workflow order', () => {
    expect(getRoleActions('coordinator').map(action => action.route)).toEqual([
      'PmcDirectory',
      'DispatchBoard',
      'OperationsReport',
      'WorkOrderForm',
    ]);
    expect(getRoleActions('viewer')).toEqual([]);
  });

  test('provides role-specific home copy', () => {
    expect(getRoleHome('technician').title).toBe('Technician Queue');
    expect(getRoleHome('client').emptyState).toContain('linked to this client');
  });

  test('builds queue summary counts from status and approval state', () => {
    expect(
      buildQueueSummary([
        {status: 'open', client_approval_status: 'pending'},
        {status: 'in_progress', client_approval_status: 'not_required'},
        {status: 'completed', client_approval_status: 'approved'},
      ]),
    ).toEqual({
      total: 3,
      open: 1,
      inProgress: 1,
      pendingApproval: 1,
    });
  });
});
