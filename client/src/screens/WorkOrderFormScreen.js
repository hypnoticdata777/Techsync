import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {API_BASE_URL} from '../config';
import {useAuth} from '../context/AuthContext';

function WorkOrderFormScreen({route, navigation}) {
  const {token} = useAuth();
  const existingWorkOrder = route.params?.workOrder;
  const isEditing = !!existingWorkOrder;

  const [title, setTitle] = useState(existingWorkOrder?.title || '');
  const [description, setDescription] = useState(
    existingWorkOrder?.description || '',
  );
  const [status, setStatus] = useState(existingWorkOrder?.status || 'pending');
  const [saving, setSaving] = useState(false);

  const statusOptions = ['pending', 'in_progress', 'completed', 'cancelled'];

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        status,
      };

      const url = isEditing
        ? `${API_BASE_URL}/work-orders/${existingWorkOrder.id}`
        : `${API_BASE_URL}/work-orders`;

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to save work order');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save work order');
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

        <View style={styles.field}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusOptions}>
            {statusOptions.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.statusOption,
                  status === option && styles.statusOptionActive,
                ]}
                onPress={() => setStatus(option)}>
                <Text
                  style={[
                    styles.statusOptionText,
                    status === option && styles.statusOptionTextActive,
                  ]}>
                  {option.replace('_', ' ')}
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
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
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
