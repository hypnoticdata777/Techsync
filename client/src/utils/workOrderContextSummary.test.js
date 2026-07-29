import {
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
});
