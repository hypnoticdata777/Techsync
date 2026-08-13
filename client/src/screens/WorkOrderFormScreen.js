import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {actionButtonA11y, inputA11y} from '../utils/accessibility';
import {
  buildFormGuidanceRows,
  buildWorkOrderContextSummary,
  summarizeContextStates,
} from '../utils/workOrderContextSummary';

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'emergency'];

const formatLabel = value => (value || '').replace(/_/g, ' ');

const confirmDuplicateWarnings = warnings =>
  new Promise(resolve => {
    if (!warnings.length) {
      resolve(true);
      return;
    }

    const preview = warnings
      .slice(0, 3)
      .map(item => `#${item.id} ${item.title} (${formatLabel(item.status)})`)
      .join('\n');

    Alert.alert(
      'Possible duplicate work',
      `${preview}\n\nCreate a new work order anyway?`,
      [
        {text: 'Review First', style: 'cancel', onPress: () => resolve(false)},
        {text: 'Create Anyway', onPress: () => resolve(true)},
      ],
    );
  });

const SelectorSection = ({label, emptyLabel, records, selectedId, getLabel, onSelect}) => (
  <View style={styles.selectorBlock}>
    <Text style={styles.label}>{label}</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.selectorScroller}>
      <TouchableOpacity
        style={[styles.selectorChip, !selectedId && styles.selectorChipActive]}
        {...actionButtonA11y(
          `Clear ${label}`,
          !selectedId ? `${label} is already unset.` : `Removes the selected ${label.toLowerCase()}.`,
        )}
        onPress={() => onSelect(null)}>
        <Text
          style={[
            styles.selectorChipText,
            !selectedId && styles.selectorChipTextActive,
          ]}>
          {emptyLabel}
        </Text>
      </TouchableOpacity>
      {records.map(item => {
        const isSelected = selectedId === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.selectorChip, isSelected && styles.selectorChipActive]}
            {...actionButtonA11y(
              `Select ${label} ${getLabel(item)}`,
              isSelected ? `${getLabel(item)} is currently selected.` : `Sets ${label.toLowerCase()} context.`,
            )}
            onPress={() => onSelect(item.id)}>
            <Text
              style={[
                styles.selectorChipText,
                isSelected && styles.selectorChipTextActive,
              ]}
              numberOfLines={1}>
              {getLabel(item)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

const ContextSummaryRow = ({row}) => (
  <View style={styles.contextSummaryRow}>
    <View style={styles.contextSummaryText}>
      <Text style={styles.contextSummaryLabel}>{row.label}</Text>
      <Text style={styles.contextSummaryValue} numberOfLines={1}>
        {row.value}
      </Text>
      <Text style={styles.contextSummaryDetail} numberOfLines={1}>
        {row.detail}
      </Text>
    </View>
    <View
      style={[
        styles.contextStatePill,
        row.state === 'linked' && styles.contextStateLinked,
        row.state === 'manual' && styles.contextStateManual,
      ]}>
      <Text
        style={[
          styles.contextStateText,
          row.state === 'linked' && styles.contextStateTextLinked,
          row.state === 'manual' && styles.contextStateTextManual,
        ]}>
        {row.state === 'missing' ? 'open' : row.state}
      </Text>
    </View>
  </View>
);

const GuidanceRow = ({row}) => (
  <View style={styles.guidanceRow}>
    <Text style={styles.guidanceLabel}>{row.label}</Text>
    <Text style={styles.guidanceValue}>{row.value}</Text>
  </View>
);

function WorkOrderFormScreen({route, navigation}) {
  const {authFetch} = useAuth();
  const existingWorkOrder = route.params?.workOrder;
  const isEditing = !!existingWorkOrder;

  const [title, setTitle] = useState(existingWorkOrder?.title || '');
  const [description, setDescription] = useState(existingWorkOrder?.description || '');
  const [customerName, setCustomerName] = useState(existingWorkOrder?.customer_name || '');
  const [address, setAddress] = useState(existingWorkOrder?.address || '');
  const [serviceType, setServiceType] = useState(existingWorkOrder?.service_type || 'general');
  const [priority, setPriority] = useState(existingWorkOrder?.priority || 'medium');
  const [clientId, setClientId] = useState(existingWorkOrder?.client_id || null);
  const [propertyId, setPropertyId] = useState(existingWorkOrder?.property_id || null);
  const [vendorId, setVendorId] = useState(existingWorkOrder?.vendor_id || null);
  const [directory, setDirectory] = useState({clients: [], properties: [], vendors: []});
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState(null);
  const [saving, setSaving] = useState(false);

  const clientsById = useMemo(() => {
    const map = {};
    directory.clients.forEach(client => {
      map[client.id] = client;
    });
    return map;
  }, [directory.clients]);

  const selectedClientProperties = useMemo(
    () =>
      directory.properties.filter(
        property => !clientId || !property.client_id || property.client_id === clientId,
      ),
    [clientId, directory.properties],
  );

  const contextSummaryRows = useMemo(
    () =>
      buildWorkOrderContextSummary({
        clientId,
        propertyId,
        vendorId,
        directory,
        manualCustomerName: customerName,
        manualAddress: address,
      }),
    [address, clientId, customerName, directory, propertyId, vendorId],
  );

  const contextStateSummary = useMemo(
    () => summarizeContextStates(contextSummaryRows),
    [contextSummaryRows],
  );
  const formGuidanceRows = useMemo(
    () =>
      buildFormGuidanceRows({
        isEditing,
        contextStateSummary,
        hasTitle: !!title.trim(),
        hasLinkedContext: contextSummaryRows.some(row => row.state === 'linked'),
        hasManualAddress: !!address.trim(),
      }),
    [address, contextStateSummary, contextSummaryRows, isEditing, title],
  );

  const loadDirectory = useCallback(async () => {
    try {
      setDirectoryLoading(true);
      const [clientsRes, propertiesRes, vendorsRes] = await Promise.all([
        authFetch('/clients?active_only=true'),
        authFetch('/properties?active_only=true'),
        authFetch('/vendors?active_only=true'),
      ]);

      if (![clientsRes, propertiesRes, vendorsRes].every(res => res.ok)) {
        setDirectoryError('Linked records are unavailable. You can still create a manual work order.');
        return;
      }

      setDirectory({
        clients: await clientsRes.json(),
        properties: await propertiesRes.json(),
        vendors: await vendorsRes.json(),
      });
      setDirectoryError(null);
    } catch (err) {
      console.error(err);
      setDirectoryError('Linked records are unavailable. You can still create a manual work order.');
    } finally {
      setDirectoryLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  const selectClient = selectedClientId => {
    setClientId(selectedClientId);
    if (selectedClientId && propertyId) {
      const selectedProperty = directory.properties.find(item => item.id === propertyId);
      if (selectedProperty?.client_id && selectedProperty.client_id !== selectedClientId) {
        setPropertyId(null);
      }
    }
    const selectedClient = selectedClientId ? clientsById[selectedClientId] : null;
    if (selectedClient && !customerName.trim()) {
      setCustomerName(selectedClient.contact_name || selectedClient.display_name);
    }
  };

  const selectProperty = selectedPropertyId => {
    setPropertyId(selectedPropertyId);
    const selectedProperty = directory.properties.find(item => item.id === selectedPropertyId);
    if (!selectedProperty) {
      return;
    }
    if (selectedProperty.client_id) {
      setClientId(selectedProperty.client_id);
    }
    setAddress(
      [
        selectedProperty.address_line1,
        selectedProperty.unit ? `Unit ${selectedProperty.unit}` : null,
        selectedProperty.city,
        selectedProperty.state,
      ]
        .filter(Boolean)
        .join(', '),
    );
  };

  const selectVendor = selectedVendorId => {
    setVendorId(selectedVendorId);
    const selectedVendor = directory.vendors.find(item => item.id === selectedVendorId);
    if (selectedVendor?.service_types?.length && serviceType === 'general') {
      setServiceType(selectedVendor.service_types[0]);
    }
  };

  const buildPayload = () => {
    const basePayload = {
      title: title.trim(),
      description: description.trim() || null,
      property_id: propertyId || null,
      client_id: clientId || null,
      vendor_id: vendorId || null,
      customer_name: customerName.trim() || null,
      address: address.trim() || null,
      service_type: serviceType,
      priority,
    };

    return isEditing ? basePayload : {...basePayload, auto_assign: true};
  };

  const checkDuplicateWarnings = async payload => {
    if (isEditing) {
      return true;
    }

    const res = await authFetch('/work-orders/duplicate-warnings', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return true;
    }

    const warnings = await res.json();
    return confirmDuplicateWarnings(warnings);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      setSaving(true);

      const path = isEditing ? `/work-orders/${existingWorkOrder.id}` : '/work-orders';
      const method = isEditing ? 'PATCH' : 'POST';
      const payload = buildPayload();
      const shouldContinue = await checkDuplicateWarnings(payload);
      if (!shouldContinue) {
        setSaving(false);
        return;
      }

      const res = await authFetch(path, {
        method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        navigation.goBack();
      } else {
        const errorData = await res.json().catch(() => ({}));
        const message = Array.isArray(errorData.detail)
          ? errorData.detail.map(d => d.msg || JSON.stringify(d)).join('\n')
          : errorData.detail || 'Failed to save work order';
        Alert.alert('Error', message);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to save work order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>
          {isEditing ? 'Edit Work Order' : 'New Work Order'}
        </Text>

        <View style={styles.guidancePanel}>
          {formGuidanceRows.map(row => (
            <GuidanceRow key={row.key} row={row} />
          ))}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Fix kitchen sink leak"
            placeholderTextColor="#8a7f70"
            value={title}
            onChangeText={setTitle}
            {...inputA11y('Title', {required: true})}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional details about the work order..."
            placeholderTextColor="#8a7f70"
            value={description}
            onChangeText={setDescription}
            {...inputA11y('Description', {multiline: true})}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.directoryPanel}>
          <View style={styles.directoryPanelHeader}>
            <View>
              <Text style={styles.directoryTitle}>PMC Links</Text>
              <Text style={styles.directorySubtitle}>Client, property, and vendor context</Text>
            </View>
            <TouchableOpacity
              style={styles.directoryManageButton}
              {...actionButtonA11y(
                'Manage PMC directory',
                'Opens client, property, and vendor management.',
              )}
              onPress={() => navigation.navigate('PmcDirectory')}>
              <Text style={styles.directoryManageButtonText}>Manage</Text>
            </TouchableOpacity>
          </View>

          {directoryLoading ? (
            <ActivityIndicator color="#2f6f9f" style={styles.directoryLoader} />
          ) : null}

          {directoryError ? (
            <Text style={styles.directoryError}>{directoryError}</Text>
          ) : null}

          <SelectorSection
            label="Client"
            emptyLabel="No client"
            records={directory.clients}
            selectedId={clientId}
            getLabel={item => item.display_name}
            onSelect={selectClient}
          />

          <SelectorSection
            label="Property"
            emptyLabel="No property"
            records={selectedClientProperties}
            selectedId={propertyId}
            getLabel={item => item.unit ? `${item.name} ${item.unit}` : item.name}
            onSelect={selectProperty}
          />

          <SelectorSection
            label="Vendor"
            emptyLabel="No vendor"
            records={directory.vendors}
            selectedId={vendorId}
            getLabel={item => item.name}
            onSelect={selectVendor}
          />

          <View style={styles.contextSummaryPanel}>
            <View style={styles.contextSummaryHeader}>
              <Text style={styles.contextSummaryTitle}>Review Before Save</Text>
              <Text style={styles.contextSummaryCount} numberOfLines={1}>
                {contextStateSummary.label}
              </Text>
            </View>
            {contextSummaryRows.map(row => (
              <ContextSummaryRow key={row.key} row={row} />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Customer Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Jane Doe"
            placeholderTextColor="#8a7f70"
            value={customerName}
            onChangeText={setCustomerName}
            {...inputA11y('Customer name')}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 123 Main St, Apt 4"
            placeholderTextColor="#8a7f70"
            value={address}
            onChangeText={setAddress}
            {...inputA11y('Address')}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Service Type</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., plumbing, hvac, electrical"
            placeholderTextColor="#8a7f70"
            value={serviceType}
            onChangeText={setServiceType}
            {...inputA11y('Service type', {required: true})}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.statusOptions}>
            {PRIORITY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.statusOption,
                  priority === option && styles.statusOptionActive,
                ]}
                {...actionButtonA11y(
                  `Set priority to ${option}`,
                  priority === option
                    ? 'This priority is currently selected.'
                    : 'Changes the work-order priority.',
                )}
                onPress={() => setPriority(option)}>
                <Text
                  style={[
                    styles.statusOptionText,
                    priority === option && styles.statusOptionTextActive,
                  ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          {...actionButtonA11y(
            isEditing ? 'Update work order' : 'Create work order',
            'Saves the work-order form after validation.',
          )}
          onPress={handleSave}
          disabled={saving}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          {...actionButtonA11y('Cancel work-order form', 'Returns to the previous screen without saving.')}
          onPress={() => navigation.goBack()}
          disabled={saving}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f3ea',
  },
  content: {
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2933',
    marginBottom: 14,
  },
  guidancePanel: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#d8ccb9',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  guidanceRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  guidanceLabel: {
    width: 118,
    color: '#2f6f9f',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  guidanceValue: {
    flex: 1,
    color: '#4f5f6f',
    fontSize: 12,
    lineHeight: 17,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#746a5d',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#d8ccb9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#27313d',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  directoryPanel: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#d8ccb9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  directoryPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  directoryTitle: {
    color: '#1f2933',
    fontSize: 17,
    fontWeight: '800',
  },
  directorySubtitle: {
    color: '#746a5d',
    fontSize: 12,
    marginTop: 3,
  },
  directoryManageButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6f5f95',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#fdf8ef',
  },
  directoryManageButtonText: {
    color: '#d8b4fe',
    fontSize: 12,
    fontWeight: '800',
  },
  directoryLoader: {
    marginBottom: 8,
  },
  directoryError: {
    color: '#f97373',
    fontSize: 12,
    marginBottom: 10,
  },
  selectorBlock: {
    marginBottom: 12,
  },
  selectorScroller: {
    gap: 8,
    paddingRight: 8,
  },
  selectorChip: {
    maxWidth: 190,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#c7b89f',
    borderRadius: 8,
    backgroundColor: '#fdf8ef',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  selectorChipActive: {
    backgroundColor: '#5f8f62',
    borderColor: '#5f8f62',
  },
  selectorChipText: {
    color: '#4f5f6f',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  selectorChipTextActive: {
    color: '#e4f0e2',
  },
  contextSummaryPanel: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#233044',
    borderRadius: 8,
    backgroundColor: '#0b1120',
    padding: 10,
    gap: 8,
  },
  contextSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  contextSummaryTitle: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  contextSummaryCount: {
    maxWidth: 150,
    color: '#746a5d',
    fontSize: 11,
    fontWeight: '700',
  },
  contextSummaryRow: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: '#d8ccb9',
    borderRadius: 8,
    backgroundColor: '#fffaf0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contextSummaryText: {
    flex: 1,
    minWidth: 0,
  },
  contextSummaryLabel: {
    color: '#746a5d',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  contextSummaryValue: {
    color: '#1f2933',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  contextSummaryDetail: {
    color: '#746a5d',
    fontSize: 11,
    marginTop: 2,
  },
  contextStatePill: {
    width: 58,
    minHeight: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7b89f',
    backgroundColor: '#efe6d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextStateLinked: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  contextStateManual: {
    backgroundColor: '#fef3c7',
    borderColor: '#facc15',
  },
  contextStateText: {
    color: '#4f5f6f',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  contextStateTextLinked: {
    color: '#335c39',
  },
  contextStateTextManual: {
    color: '#7a541d',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#d8ccb9',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statusOptionActive: {
    backgroundColor: '#2f6f9f',
    borderColor: '#2f6f9f',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#746a5d',
    fontWeight: '500',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  statusOptionTextActive: {
    color: '#f7f3ea',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2f6f9f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#f7f3ea',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#746a5d',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default WorkOrderFormScreen;
