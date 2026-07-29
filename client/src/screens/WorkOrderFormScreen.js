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
import {
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

        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Fix kitchen sink leak"
            placeholderTextColor="#6b7280"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional details about the work order..."
            placeholderTextColor="#6b7280"
            value={description}
            onChangeText={setDescription}
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
              onPress={() => navigation.navigate('PmcDirectory')}>
              <Text style={styles.directoryManageButtonText}>Manage</Text>
            </TouchableOpacity>
          </View>

          {directoryLoading ? (
            <ActivityIndicator color="#38bdf8" style={styles.directoryLoader} />
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
            placeholderTextColor="#6b7280"
            value={customerName}
            onChangeText={setCustomerName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 123 Main St, Apt 4"
            placeholderTextColor="#6b7280"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Service Type</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., plumbing, hvac, electrical"
            placeholderTextColor="#6b7280"
            value={serviceType}
            onChangeText={setServiceType}
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
          onPress={handleSave}
          disabled={saving}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
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
    backgroundColor: '#050816',
  },
  content: {
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#e5e7eb',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  directoryPanel: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
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
    color: '#f9fafb',
    fontSize: 17,
    fontWeight: '800',
  },
  directorySubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 3,
  },
  directoryManageButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c084fc',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#0f172a',
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
    borderColor: '#334155',
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  selectorChipActive: {
    backgroundColor: '#a3e635',
    borderColor: '#a3e635',
  },
  selectorChipText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  selectorChipTextActive: {
    color: '#052e16',
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
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  contextSummaryRow: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    backgroundColor: '#020617',
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
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  contextSummaryValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  contextSummaryDetail: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  contextStatePill: {
    width: 58,
    minHeight: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
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
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  contextStateTextLinked: {
    color: '#14532d',
  },
  contextStateTextManual: {
    color: '#713f12',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statusOptionActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  statusOptionTextActive: {
    color: '#050816',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#38bdf8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#050816',
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
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default WorkOrderFormScreen;
