import {
  buildDetailSummary,
  buildQueueSummary,
  canAccessMainRoute,
  canManageOperations,
  getAvailableMainRoutes,
  getDetailRoleContext,
  getRoleEmptyState,
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

  test('keeps manager-only screens out of non-manager navigation', () => {
    expect(getAvailableMainRoutes('org_admin')).toEqual(
      expect.arrayContaining([
        'WorkOrderForm',
        'OperationsReport',
        'DispatchBoard',
        'PmcDirectory',
      ]),
    );
    expect(getAvailableMainRoutes('technician')).toEqual([
      'WorkOrdersList',
      'WorkOrderDetails',
    ]);
    expect(canAccessMainRoute('client', 'PmcDirectory')).toBe(false);
    expect(canAccessMainRoute('viewer', 'OperationsReport')).toBe(false);
    expect(canAccessMainRoute('coordinator', 'DispatchBoard')).toBe(true);
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

  test('provides screenshot-ready role empty states', () => {
    expect(getRoleEmptyState('org_admin')).toEqual(
      expect.objectContaining({
        title: 'Queue is ready',
        actionRoute: 'WorkOrderForm',
      }),
    );
    const technicianState = getRoleEmptyState('technician');
    expect(technicianState.title).toBe('No assigned jobs');
    expect(technicianState).not.toHaveProperty('actionRoute');
    expect(getRoleEmptyState('vendor').message).toContain('linked to this active vendor profile');
  });

  test('builds queue summary counts from status and approval state', () => {
    expect(
      buildQueueSummary([
        {status: 'open', client_approval_status: 'pending'},
        {status: 'in_progress', client_approval_status: 'not_required'},
        {status: 'paused', client_approval_status: 'not_required'},
        {status: 'escalated', client_approval_status: 'not_required'},
        {status: 'completed', client_approval_status: 'approved'},
      ]),
    ).toEqual({
      total: 5,
      open: 1,
      inProgress: 1,
      paused: 1,
      escalated: 1,
      pendingApproval: 1,
    });
  });

  test('provides detail role context for clients with pending approval', () => {
    expect(
      getDetailRoleContext('client', {client_approval_status: 'pending'}),
    ).toEqual(
      expect.objectContaining({
        title: 'Approval Needed',
      }),
    );
  });

  test('builds detail summary from work order, attachments, and messages', () => {
    expect(
      buildDetailSummary(
        {status: 'in_progress', client_approval_status: 'pending'},
        [{id: 1}, {id: 2}],
        [{id: 3}],
      ),
    ).toEqual([
      expect.objectContaining({key: 'status', value: 'in progress'}),
      expect.objectContaining({key: 'approval', value: 'pending'}),
      expect.objectContaining({key: 'proof', value: '2 files'}),
      expect.objectContaining({key: 'messages', value: '1'}),
    ]);
  });

  test('marks verified and override proof states clearly', () => {
    expect(
      buildDetailSummary({completion_proof_verified_at: '2026-07-29T00:00:00Z'})[2],
    ).toEqual(expect.objectContaining({value: 'Verified', tone: 'verified'}));
    expect(
      buildDetailSummary({completion_override_reason: 'Manager approved'})[2],
    ).toEqual(expect.objectContaining({value: 'Override', tone: 'override'}));
  });
});
