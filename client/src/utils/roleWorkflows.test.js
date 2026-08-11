import {
  buildDetailGuidanceRows,
  buildDetailSummary,
  buildRoleGuidanceRows,
  buildRoleBoundaryRows,
  buildRoleLaneRows,
  buildQueueSummary,
  buildWorkOrderFlowRows,
  canAccessMainRoute,
  canManageOperations,
  getAvailableMainRoutes,
  getDetailRoleContext,
  getRoleEmptyState,
  getRoleActions,
  getRoleHome,
  getRoleLane,
  getRoleUserExperience,
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
        'RoleEvidence',
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
      'RoleEvidence',
      'WorkOrderForm',
    ]);
    expect(getRoleActions('viewer')).toEqual([]);
  });

  test('provides role-specific home copy', () => {
    expect(getRoleHome('technician').title).toBe('Technician Queue');
    expect(getRoleHome('client').emptyState).toContain('linked to this client');
  });

  test('locates each user role with clear scope and guardrails', () => {
    expect(getRoleUserExperience('org_admin')).toEqual(
      expect.objectContaining({
        roleLabel: 'Org Admin',
        scopeLabel: 'Full tenant command',
      }),
    );
    expect(getRoleUserExperience('viewer')).toEqual(
      expect.objectContaining({
        roleLabel: 'Read-Only Viewer',
        guardrail: expect.stringContaining('Read-only mode'),
      }),
    );
    expect(getRoleUserExperience('vendor').scopeDetail).toContain('vendor-visible');
  });

  test('defines every SaaS user lane with handoffs and success signals', () => {
    [
      'org_admin',
      'coordinator',
      'technician',
      'client',
      'viewer',
      'vendor',
    ].forEach(role => {
      const lane = getRoleLane(role);
      const rows = buildRoleLaneRows(role);

      expect(lane.laneLabel).toBeTruthy();
      expect(lane.handoff).toBeTruthy();
      expect(lane.success).toBeTruthy();
      expect(rows.map(row => row.key)).toEqual(['lane', 'handoff', 'success']);
      expect(rows.every(row => row.value.length > 20)).toBe(true);
    });
  });

  test('keeps role boundaries explicit on detail screens', () => {
    expect(buildRoleBoundaryRows('coordinator')).toEqual([
      expect.objectContaining({
        label: 'Can Do',
        value: expect.stringContaining('Assign technicians'),
      }),
      expect.objectContaining({
        label: 'Not In This Lane',
        value: expect.stringContaining('internal notes'),
      }),
    ]);

    expect(buildRoleBoundaryRows('viewer')[1].value).toContain('mutation controls');
    expect(buildRoleBoundaryRows('vendor')[1].value).toContain('internal/client messages');
    expect(buildRoleBoundaryRows('technician')[1].value).toContain('unrelated jobs');
  });

  test('builds role guidance from queue state', () => {
    const withApproval = buildRoleGuidanceRows('client', {
      total: 2,
      inProgress: 0,
      pendingApproval: 1,
    });
    expect(withApproval[1]).toEqual(
      expect.objectContaining({
        label: 'Approval attention',
        value: '1 pending approval need review.',
      }),
    );

    const emptyTechnician = buildRoleGuidanceRows('technician', {
      total: 0,
      inProgress: 0,
      pendingApproval: 0,
    });
    expect(emptyTechnician[2].value).toContain('Status updates');
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

  test('builds detail guidance from role capability state', () => {
    const clientRows = buildDetailGuidanceRows(
      'client',
      {client_approval_status: 'pending'},
      {canDecideApproval: true},
    );
    expect(clientRows).toEqual([
      expect.objectContaining({label: 'Client decision'}),
      expect.objectContaining({
        label: 'Approval decision',
        value: expect.stringContaining('approve or decline'),
      }),
      expect.objectContaining({label: 'Guardrail'}),
    ]);

    const managerRows = buildDetailGuidanceRows(
      'coordinator',
      {client_approval_status: 'not_required'},
      {canRequestApproval: true},
    );
    expect(managerRows[1]).toEqual(
      expect.objectContaining({
        label: 'Approval path',
        value: expect.stringContaining('Request approval'),
      }),
    );

    const vendorRows = buildDetailGuidanceRows('vendor', {}, {});
    expect(vendorRows[1].label).toBe('Vendor update');
    expect(vendorRows[2].value).toContain('Internal/client messages');
  });

  test('marks verified and override proof states clearly', () => {
    expect(
      buildDetailSummary({completion_proof_verified_at: '2026-07-29T00:00:00Z'})[2],
    ).toEqual(expect.objectContaining({value: 'Verified', tone: 'verified'}));
    expect(
      buildDetailSummary({completion_override_reason: 'Manager approved'})[2],
    ).toEqual(expect.objectContaining({value: 'Override', tone: 'override'}));
  });

  test('builds interoperable work-order handoff rows', () => {
    expect(
      buildWorkOrderFlowRows({
        status: 'open',
        client_approval_status: 'pending',
        client_id: 10,
        vendor_id: 11,
      }),
    ).toEqual([
      expect.objectContaining({
        key: 'owner',
        value: 'Client',
        detail: expect.stringContaining('Approval decision'),
      }),
      expect.objectContaining({
        key: 'waiting',
        value: 'Client approval',
      }),
      expect.objectContaining({
        key: 'visible',
        value: 'Internal + Client + Vendor',
      }),
    ]);

    expect(
      buildWorkOrderFlowRows({
        status: 'open',
        client_approval_status: 'not_required',
      })[0],
    ).toEqual(
      expect.objectContaining({
        value: 'Coordinator',
        detail: expect.stringContaining('assignment'),
      }),
    );

    expect(
      buildWorkOrderFlowRows({
        status: 'in_progress',
        assigned_technician_id: 12,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({key: 'owner', value: 'Technician'}),
        expect.objectContaining({key: 'waiting', value: 'Proof upload'}),
      ]),
    );
  });
});
