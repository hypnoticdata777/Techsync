import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAuth} from '../context/AuthContext';

const TABS = [
  {key: 'clients', label: 'Clients'},
  {key: 'properties', label: 'Properties'},
  {key: 'vendors', label: 'Vendors'},
];

const EMPTY_FORMS = {
  clients: {
    display_name: '',
    contact_name: '',
    email: '',
    phone: '',
    client_type: 'homeowner',
    notes: '',
    is_active: true,
  },
  properties: {
    client_id: null,
    name: '',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
    unit: '',
    access_notes: '',
    is_active: true,
  },
  vendors: {
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    service_types: '',
    coverage_area: '',
    notes: '',
    is_active: true,
  },
};

const CLIENT_TYPES = ['homeowner', 'owner', 'tenant', 'board_member', 'other'];

const formatLabel = value => (value || '').replace(/_/g, ' ');

const formatApiError = data => {
  if (!data) {
    return 'Request failed';
  }
  if (typeof data.detail === 'string') {
    return data.detail;
  }
  if (Array.isArray(data.detail)) {
    return data.detail.map(item => item.msg || JSON.stringify(item)).join('\n');
  }
  return 'Request failed';
};

const normalizeRecordForForm = (tab, item) => {
  if (!item) {
    return {...EMPTY_FORMS[tab]};
  }

  if (tab === 'vendors') {
    return {
      name: item.name || '',
      contact_name: item.contact_name || '',
      email: item.email || '',
      phone: item.phone || '',
      service_types: (item.service_types || []).join(', '),
      coverage_area: item.coverage_area || '',
      notes: item.notes || '',
      is_active: item.is_active !== false,
    };
  }

  if (tab === 'properties') {
    return {
      client_id: item.client_id || null,
      name: item.name || '',
      address_line1: item.address_line1 || '',
      city: item.city || '',
      state: item.state || '',
      postal_code: item.postal_code || '',
      unit: item.unit || '',
      access_notes: item.access_notes || '',
      is_active: item.is_active !== false,
    };
  }

  return {
    display_name: item.display_name || '',
    contact_name: item.contact_name || '',
    email: item.email || '',
    phone: item.phone || '',
    client_type: item.client_type || 'homeowner',
    notes: item.notes || '',
    is_active: item.is_active !== false,
  };
};

function PmcDirectoryScreen() {
  const {authFetch, logout} = useAuth();
  const [activeTab, setActiveTab] = useState('clients');
  const [records, setRecords] = useState({clients: [], properties: [], vendors: []});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({...EMPTY_FORMS.clients});

  const activeRecords = records[activeTab] || [];

  const clientsById = useMemo(() => {
    const map = {};
    records.clients.forEach(client => {
      map[client.id] = client;
    });
    return map;
  }, [records.clients]);

  const loadDirectory = useCallback(async () => {
    try {
      setLoading(true);
      const [clientsRes, propertiesRes, vendorsRes] = await Promise.all([
        authFetch('/clients'),
        authFetch('/properties'),
        authFetch('/vendors'),
      ]);

      if ([clientsRes, propertiesRes, vendorsRes].some(res => res.status === 401)) {
        setError('Session expired. Please login again.');
        await logout();
        return;
      }

      if ([clientsRes, propertiesRes, vendorsRes].some(res => res.status === 403)) {
        setError('Directory access requires an admin or coordinator role.');
        return;
      }

      if (![clientsRes, propertiesRes, vendorsRes].every(res => res.ok)) {
        setError('Unable to load the PMC directory.');
        return;
      }

      setRecords({
        clients: await clientsRes.json(),
        properties: await propertiesRes.json(),
        vendors: await vendorsRes.json(),
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load the PMC directory.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, logout]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDirectory();
    setRefreshing(false);
  };

  const changeTab = key => {
    setActiveTab(key);
    setEditingId(null);
    setForm({...EMPTY_FORMS[key]});
  };

  const updateForm = (field, value) => {
    setForm(current => ({...current, [field]: value}));
  };

  const editRecord = item => {
    setEditingId(item.id);
    setForm(normalizeRecordForForm(activeTab, item));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({...EMPTY_FORMS[activeTab]});
  };

  const buildPayload = () => {
    if (activeTab === 'clients') {
      return {
        display_name: form.display_name.trim(),
        contact_name: form.contact_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        client_type: form.client_type,
        notes: form.notes.trim() || null,
        is_active: form.is_active,
      };
    }

    if (activeTab === 'properties') {
      return {
        client_id: form.client_id || null,
        name: form.name.trim(),
        address_line1: form.address_line1.trim(),
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        postal_code: form.postal_code.trim() || null,
        country: 'US',
        unit: form.unit.trim() || null,
        access_notes: form.access_notes.trim() || null,
        is_active: form.is_active,
      };
    }

    return {
      name: form.name.trim(),
      contact_name: form.contact_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      service_types: form.service_types
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(Boolean),
      coverage_area: form.coverage_area.trim() || null,
      notes: form.notes.trim() || null,
      is_active: form.is_active,
    };
  };

  const validateForm = () => {
    if (activeTab === 'clients' && !form.display_name.trim()) {
      return 'Client display name is required.';
    }
    if (activeTab === 'properties') {
      if (!form.name.trim()) {
        return 'Property name is required.';
      }
      if (!form.address_line1.trim()) {
        return 'Property address is required.';
      }
    }
    if (activeTab === 'vendors' && !form.name.trim()) {
      return 'Vendor name is required.';
    }
    return null;
  };

  const saveRecord = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Missing information', validationError);
      return;
    }

    try {
      setSaving(true);
      const path = editingId ? `/${activeTab}/${editingId}` : `/${activeTab}`;
      const method = editingId ? 'PATCH' : 'POST';
      const res = await authFetch(path, {
        method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(buildPayload()),
      });

      if (res.ok) {
        resetForm();
        await loadDirectory();
        return;
      }

      const data = await res.json().catch(() => ({}));
      Alert.alert('Save failed', formatApiError(data));
    } catch (err) {
      console.error(err);
      Alert.alert('Save failed', err.message || 'Unable to save record.');
    } finally {
      setSaving(false);
    }
  };

  const renderForm = () => {
    if (activeTab === 'clients') {
      return (
        <View style={styles.formPanel}>
          <FormTitle editingId={editingId} label="Client" />
          <Input label="Display Name *" value={form.display_name} onChangeText={value => updateForm('display_name', value)} />
          <Input label="Contact Name" value={form.contact_name} onChangeText={value => updateForm('contact_name', value)} />
          <Input label="Email" value={form.email} onChangeText={value => updateForm('email', value)} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Phone" value={form.phone} onChangeText={value => updateForm('phone', value)} keyboardType="phone-pad" />
          <Text style={styles.label}>Client Type</Text>
          <View style={styles.optionRow}>
            {CLIENT_TYPES.map(type => (
              <OptionButton
                key={type}
                label={formatLabel(type)}
                active={form.client_type === type}
                onPress={() => updateForm('client_type', type)}
              />
            ))}
          </View>
          <Input label="Notes" value={form.notes} onChangeText={value => updateForm('notes', value)} multiline />
          <ActiveToggle value={form.is_active} onChange={value => updateForm('is_active', value)} />
          <FormActions saving={saving} editing={!!editingId} onSave={saveRecord} onCancel={resetForm} />
        </View>
      );
    }

    if (activeTab === 'properties') {
      return (
        <View style={styles.formPanel}>
          <FormTitle editingId={editingId} label="Property" />
          <Input label="Property Name *" value={form.name} onChangeText={value => updateForm('name', value)} />
          <Input label="Address *" value={form.address_line1} onChangeText={value => updateForm('address_line1', value)} />
          <View style={styles.inlineRow}>
            <View style={styles.inlineField}>
              <Input label="City" value={form.city} onChangeText={value => updateForm('city', value)} />
            </View>
            <View style={styles.inlineFieldSmall}>
              <Input label="State" value={form.state} onChangeText={value => updateForm('state', value)} />
            </View>
          </View>
          <View style={styles.inlineRow}>
            <View style={styles.inlineField}>
              <Input label="Postal Code" value={form.postal_code} onChangeText={value => updateForm('postal_code', value)} />
            </View>
            <View style={styles.inlineFieldSmall}>
              <Input label="Unit" value={form.unit} onChangeText={value => updateForm('unit', value)} />
            </View>
          </View>
          <Text style={styles.label}>Linked Client</Text>
          <View style={styles.optionRow}>
            <OptionButton
              label="None"
              active={!form.client_id}
              onPress={() => updateForm('client_id', null)}
            />
            {records.clients.map(client => (
              <OptionButton
                key={client.id}
                label={client.display_name}
                active={form.client_id === client.id}
                onPress={() => updateForm('client_id', client.id)}
              />
            ))}
          </View>
          <Input label="Access Notes" value={form.access_notes} onChangeText={value => updateForm('access_notes', value)} multiline />
          <ActiveToggle value={form.is_active} onChange={value => updateForm('is_active', value)} />
          <FormActions saving={saving} editing={!!editingId} onSave={saveRecord} onCancel={resetForm} />
        </View>
      );
    }

    return (
      <View style={styles.formPanel}>
        <FormTitle editingId={editingId} label="Vendor" />
        <Input label="Vendor Name *" value={form.name} onChangeText={value => updateForm('name', value)} />
        <Input label="Contact Name" value={form.contact_name} onChangeText={value => updateForm('contact_name', value)} />
        <Input label="Email" value={form.email} onChangeText={value => updateForm('email', value)} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Phone" value={form.phone} onChangeText={value => updateForm('phone', value)} keyboardType="phone-pad" />
        <Input label="Service Types" value={form.service_types} onChangeText={value => updateForm('service_types', value)} placeholder="plumbing, hvac, electrical" autoCapitalize="none" />
        <Input label="Coverage Area" value={form.coverage_area} onChangeText={value => updateForm('coverage_area', value)} />
        <Input label="Notes" value={form.notes} onChangeText={value => updateForm('notes', value)} multiline />
        <ActiveToggle value={form.is_active} onChange={value => updateForm('is_active', value)} />
        <FormActions saving={saving} editing={!!editingId} onSave={saveRecord} onCancel={resetForm} />
      </View>
    );
  };

  const renderRecord = item => {
    if (activeTab === 'clients') {
      return (
        <TouchableOpacity key={item.id} style={styles.card} onPress={() => editRecord(item)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.display_name}</Text>
            <StatusPill active={item.is_active} />
          </View>
          <Text style={styles.cardMeta}>{formatLabel(item.client_type)}</Text>
          {item.contact_name ? <Text style={styles.cardMeta}>{item.contact_name}</Text> : null}
          {item.email ? <Text style={styles.cardMeta}>{item.email}</Text> : null}
        </TouchableOpacity>
      );
    }

    if (activeTab === 'properties') {
      const linkedClient = item.client_id ? clientsById[item.client_id] : null;
      return (
        <TouchableOpacity key={item.id} style={styles.card} onPress={() => editRecord(item)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <StatusPill active={item.is_active} />
          </View>
          <Text style={styles.cardMeta}>{item.address_line1}</Text>
          <Text style={styles.cardMeta}>
            {[item.unit, item.city, item.state].filter(Boolean).join(' | ') || 'No location details'}
          </Text>
          <Text style={styles.cardMeta}>
            Client: {linkedClient?.display_name || 'Unlinked'}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity key={item.id} style={styles.card} onPress={() => editRecord(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <StatusPill active={item.is_active} />
        </View>
        {item.contact_name ? <Text style={styles.cardMeta}>{item.contact_name}</Text> : null}
        {item.email ? <Text style={styles.cardMeta}>{item.email}</Text> : null}
        <Text style={styles.cardMeta}>
          {(item.service_types || []).join(', ') || 'No service types'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#38bdf8"
          colors={['#38bdf8']}
        />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>PMC Directory</Text>
        <Text style={styles.subtitle}>Clients, properties, and vendors for linked work</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            onPress={() => changeTab(tab.key)}>
            <Text
              style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderForm()}

      {loading && <ActivityIndicator style={styles.loader} color="#38bdf8" />}

      {error && (
        <View style={styles.errorPanel}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDirectory}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {TABS.find(tab => tab.key === activeTab)?.label} ({activeRecords.length})
          </Text>
          {activeRecords.length === 0 ? (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyText}>No records yet.</Text>
            </View>
          ) : (
            activeRecords.map(renderRecord)
          )}
        </View>
      )}
    </ScrollView>
  );
}

const FormTitle = ({editingId, label}) => (
  <View style={styles.formTitleRow}>
    <Text style={styles.formTitle}>{editingId ? `Edit ${label}` : `Add ${label}`}</Text>
  </View>
);

const Input = ({label, multiline, style, ...props}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      {...props}
      style={[styles.input, multiline && styles.textArea, style]}
      placeholderTextColor="#64748b"
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
);

const OptionButton = ({label, active, onPress}) => (
  <TouchableOpacity
    style={[styles.optionButton, active && styles.optionButtonActive]}
    onPress={onPress}>
    <Text style={[styles.optionButtonText, active && styles.optionButtonTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ActiveToggle = ({value, onChange}) => (
  <View style={styles.activeRow}>
    <Text style={styles.label}>Status</Text>
    <View style={styles.optionRow}>
      <OptionButton label="Active" active={value} onPress={() => onChange(true)} />
      <OptionButton label="Inactive" active={!value} onPress={() => onChange(false)} />
    </View>
  </View>
);

const FormActions = ({saving, editing, onSave, onCancel}) => (
  <View style={styles.actionRow}>
    <TouchableOpacity
      style={[styles.saveButton, saving && styles.saveButtonDisabled]}
      onPress={onSave}
      disabled={saving}>
      <Text style={styles.saveButtonText}>
        {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
      </Text>
    </TouchableOpacity>
    {editing ? (
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={saving}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const StatusPill = ({active}) => (
  <View style={[styles.statusPill, active ? styles.statusPillActive : styles.statusPillInactive]}>
    <Text style={[styles.statusPillText, active ? styles.statusTextActive : styles.statusTextInactive]}>
      {active ? 'Active' : 'Inactive'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    color: '#f9fafb',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  tabButtonActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  tabButtonText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '800',
  },
  tabButtonTextActive: {
    color: '#050816',
  },
  formPanel: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
  },
  formTitleRow: {
    marginBottom: 10,
  },
  formTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '800',
  },
  field: {
    marginBottom: 12,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 44,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: '#e5e7eb',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 86,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineField: {
    flex: 1,
  },
  inlineFieldSmall: {
    width: 110,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  optionButton: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionButtonActive: {
    backgroundColor: '#a3e635',
    borderColor: '#a3e635',
  },
  optionButtonText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
  },
  optionButtonTextActive: {
    color: '#052e16',
  },
  activeRow: {
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  saveButton: {
    flex: 1,
    minHeight: 46,
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#050816',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelButton: {
    minWidth: 96,
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '800',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '800',
  },
  cardMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
  },
  statusPill: {
    minHeight: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  statusPillActive: {
    backgroundColor: '#1e3a8a',
  },
  statusPillInactive: {
    backgroundColor: '#3f1d1d',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#bfdbfe',
  },
  statusTextInactive: {
    color: '#fecaca',
  },
  loader: {
    marginTop: 20,
  },
  errorPanel: {
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#f97373',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#050816',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyPanel: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 14,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default PmcDirectoryScreen;
