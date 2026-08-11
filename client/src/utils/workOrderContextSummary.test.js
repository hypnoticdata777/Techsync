import {
  buildFormGuidanceRows,
  buildWorkOrderContextSummary,
  formatPropertyAddress,
  summarizeContextStates,
} from './workOrderContextSummary';

const directory = {
  clients: [
    {
      id: 'client-1',
      display_name: 'Maple Ridge HOA',
      contact_name: 'Jordan Lee',
      email: 'jordan@example.com',
    },
  ],
  properties: [
    {
      id: 'property-1',
      client_id: 'client-1',
      name: 'Maple Ridge Building A',
      unit: '204',
      address_line1: '100 Main St',
      city: 'Orlando',
      state: 'FL',
    },
  ],
  vendors: [
    {
      id: 'vendor-1',
      name: 'Brightline Plumbing',
      service_types: ['plumbing', 'after hours'],
    },
  ],
};

describe('work order context summary helpers', () => {
  test('formats selected property addresses for dispatch review', () => {
    expect(formatPropertyAddress(directory.properties[0])).toBe(
      '100 Main St, Unit 204, Orlando, FL',
    );
  });

  test('builds linked context rows from selected directory records', () => {
    const rows = buildWorkOrderContextSummary({
      clientId: 'client-1',
      propertyId: 'property-1',
      vendorId: 'vendor-1',
      directory,
      manualCustomerName: '',
      manualAddress: '',
    });

    expect(rows).toEqual([
      expect.objectContaining({
        key: 'client',
        value: 'Maple Ridge HOA',
        detail: 'Jordan Lee',
        state: 'linked',
      }),
      expect.objectContaining({
        key: 'property',
        value: 'Maple Ridge Building A 204',
        state: 'linked',
      }),
      expect.objectContaining({
        key: 'vendor',
        value: 'Brightline Plumbing',
        detail: 'plumbing, after hours',
        state: 'linked',
      }),
      expect.objectContaining({
        key: 'address',
        value: '100 Main St, Unit 204, Orlando, FL',
        detail: 'From selected property',
        state: 'linked',
      }),
    ]);
  });

  test('preserves manual customer and address context without directory records', () => {
    const rows = buildWorkOrderContextSummary({
      clientId: null,
      propertyId: null,
      vendorId: null,
      directory,
      manualCustomerName: 'Alex Rivera',
      manualAddress: '88 Sunset Ave',
    });

    expect(rows).toEqual([
      expect.objectContaining({key: 'client', value: 'Alex Rivera', state: 'manual'}),
      expect.objectContaining({
        key: 'property',
        value: 'No property selected',
        detail: 'Manual address only',
        state: 'manual',
      }),
      expect.objectContaining({key: 'vendor', state: 'missing'}),
      expect.objectContaining({key: 'address', value: '88 Sunset Ave', state: 'manual'}),
    ]);
  });

  test('summarizes linked, manual, and open context states', () => {
    expect(
      summarizeContextStates([
        {label: 'Client', state: 'linked'},
        {label: 'Property', state: 'manual'},
        {label: 'Vendor', state: 'missing'},
      ]),
    ).toEqual({
      linked: 1,
      manual: 1,
      missing: 1,
      missingLabels: ['Vendor'],
      label: '1 linked, 1 manual, 1 open',
    });
  });

  test('builds form guidance for linked and manual intake states', () => {
    const linkedRows = buildFormGuidanceRows({
      isEditing: false,
      hasTitle: true,
      hasLinkedContext: true,
      hasManualAddress: false,
      contextStateSummary: {
        linked: 2,
        manual: 0,
        missing: 2,
        missingLabels: ['Vendor', 'Address'],
      },
    });

    expect(linkedRows).toEqual([
      expect.objectContaining({label: 'Creating new work'}),
      expect.objectContaining({
        label: 'Linked context',
        value: expect.stringContaining('2 directory links selected'),
      }),
      expect.objectContaining({
        label: 'Before save',
        value: expect.stringContaining('Open context is allowed'),
      }),
    ]);

    const manualRows = buildFormGuidanceRows({
      isEditing: true,
      hasTitle: false,
      hasLinkedContext: false,
      hasManualAddress: true,
      contextStateSummary: {
        linked: 0,
        manual: 1,
        missing: 3,
        missingLabels: ['Client', 'Property', 'Vendor'],
      },
    });

    expect(manualRows[0].label).toBe('Editing existing work');
    expect(manualRows[1]).toEqual(
      expect.objectContaining({
        label: 'Manual context',
        value: expect.stringContaining('Manual address is enough'),
      }),
    );
  });
});
