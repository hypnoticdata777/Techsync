const buildLookup = records =>
  (records || []).reduce((lookup, record) => {
    lookup[record.id] = record;
    return lookup;
  }, {});

export const formatPropertyAddress = property =>
  [
    property?.address_line1,
    property?.unit ? `Unit ${property.unit}` : null,
    property?.city,
    property?.state,
  ]
    .filter(Boolean)
    .join(', ');

const makeRow = ({key, label, value, detail, state = 'missing'}) => ({
  key,
  label,
  value,
  detail,
  state,
});

export const buildWorkOrderContextSummary = ({
  clientId,
  propertyId,
  vendorId,
  directory,
  manualCustomerName,
  manualAddress,
}) => {
  const clientsById = buildLookup(directory?.clients);
  const propertiesById = buildLookup(directory?.properties);
  const vendorsById = buildLookup(directory?.vendors);
  const client = clientId ? clientsById[clientId] : null;
  const property = propertyId ? propertiesById[propertyId] : null;
  const vendor = vendorId ? vendorsById[vendorId] : null;
  const trimmedCustomer = (manualCustomerName || '').trim();
  const trimmedAddress = (manualAddress || '').trim();
  const propertyAddress = formatPropertyAddress(property);

  return [
    client
      ? makeRow({
          key: 'client',
          label: 'Client',
          value: client.display_name,
          detail: client.contact_name || client.email || 'Directory linked',
          state: 'linked',
        })
      : makeRow({
          key: 'client',
          label: 'Client',
          value: trimmedCustomer || 'No client selected',
          detail: trimmedCustomer ? 'Manual customer name' : 'Optional',
          state: trimmedCustomer ? 'manual' : 'missing',
        }),
    property
      ? makeRow({
          key: 'property',
          label: 'Property',
          value: property.unit ? `${property.name} ${property.unit}` : property.name,
          detail: propertyAddress || 'Directory property selected',
          state: 'linked',
        })
      : makeRow({
          key: 'property',
          label: 'Property',
          value: 'No property selected',
          detail: trimmedAddress ? 'Manual address only' : 'Optional',
          state: trimmedAddress ? 'manual' : 'missing',
        }),
    vendor
      ? makeRow({
          key: 'vendor',
          label: 'Vendor',
          value: vendor.name,
          detail: vendor.service_types?.length
            ? vendor.service_types.join(', ')
            : 'Directory vendor selected',
          state: 'linked',
        })
      : makeRow({
          key: 'vendor',
          label: 'Vendor',
          value: 'No vendor assigned',
          detail: 'Auto-assign remains available',
          state: 'missing',
        }),
    propertyAddress || trimmedAddress
      ? makeRow({
          key: 'address',
          label: 'Address',
          value: propertyAddress || trimmedAddress,
          detail: propertyAddress ? 'From selected property' : 'Manual entry',
          state: propertyAddress ? 'linked' : 'manual',
        })
      : makeRow({
          key: 'address',
          label: 'Address',
          value: 'No address entered',
          detail: 'Add one for dispatch clarity',
          state: 'missing',
        }),
  ];
};

export const summarizeContextStates = rows => {
  const totals = rows.reduce(
    (acc, row) => {
      acc[row.state] = (acc[row.state] || 0) + 1;
      return acc;
    },
    {linked: 0, manual: 0, missing: 0},
  );

  const missingLabels = rows
    .filter(row => row.state === 'missing')
    .map(row => row.label);

  return {
    ...totals,
    missingLabels,
    label: `${totals.linked} linked, ${totals.manual} manual, ${totals.missing} open`,
  };
};
