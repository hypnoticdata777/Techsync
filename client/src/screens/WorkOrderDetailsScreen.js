import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import {useAuth} from '../context/AuthContext';

// Helper function to get status color
const getStatusColor = status => {
  switch (status) {
    case 'open':
      return '#fbbf24'; // yellow
    case 'in_progress':
      return '#38bdf8'; // blue
    case 'completed':
      return '#a3e635'; // green
    case 'cancelled':
      return '#ef4444'; // red
    default:
      return '#9ca3af'; // gray
  }
};

// RF-18: only these transitions are legal, mirrors server/models/work_order.py
const ALLOWED_TRANSITIONS = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled', 'open'],
  completed: [],
  cancelled: [],
};

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'Start Work',
  completed: 'Mark Completed',
  cancelled: 'Cancel',
};

function WorkOrderDetailsScreen({route, navigation}) {
  const {user, authFetch} = useAuth();
  const [workOrder, setWorkOrder] = useState(route.params.workOrder);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const canEdit = user?.role === 'org_admin' || user?.role === 'coordinator';
  const nextStatuses = ALLOWED_TRANSITIONS[workOrder.status] || [];

  const handleEdit = () => {
    navigation.navigate('WorkOrderForm', {workOrder});
  };

  const handleTransition = async newStatus => {
    try {
      setUpdating(true);
      const res = await authFetch(`/work-orders/${workOrder.id}/status`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: newStatus, notes: notes.trim() || null}),
      });

      if (res.ok) {
        const updated = await res.json();
        setWorkOrder(updated);
        setNotes('');
      } else {
        const errorData = await res.json().catch(() => ({}));
        Alert.alert('Error', errorData.detail || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const confirmTransition = newStatus => {
    if (newStatus === 'cancelled') {
      Alert.alert('Cancel work order?', 'This cannot be undone.', [
        {text: 'No', style: 'cancel'},
        {text: 'Yes, cancel', style: 'destructive', onPress: () => handleTransition(newStatus)},
      ]);
      return;
    }
    handleTransition(newStatus);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{workOrder.title}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, {color: getStatusColor(workOrder.status)}]}>
              {workOrder.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {workOrder.priority ? (
          <View style={styles.section}>
            <Text style={styles.label}>Priority</Text>
            <Text style={styles.metaText}>{workOrder.priority}</Text>
          </View>
        ) : null}

        {workOrder.customer_name ? (
          <View style={styles.section}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.metaText}>{workOrder.customer_name}</Text>
          </View>
        ) : null}

        {workOrder.address ? (
          <View style={styles.section}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.metaText}>{workOrder.address}</Text>
          </View>
        ) : null}

        {workOrder.description ? (
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.description}>{workOrder.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Work Order ID</Text>
          <Text style={styles.metaText}>#{workOrder.id}</Text>
        </View>

        {nextStatuses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Add notes for this status change..."
              placeholderTextColor="#6b7280"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        )}

        <View style={styles.actions}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.editButton, updating && styles.buttonDisabled]}
              onPress={handleEdit}
              disabled={updating}>
              <Text style={styles.editButtonText}>Edit Details</Text>
            </TouchableOpacity>
          )}

          {nextStatuses.map(nextStatus => (
            <TouchableOpacity
              key={nextStatus}
              style={[
                nextStatus === 'cancelled' ? styles.dangerButton : styles.primaryButton,
                updating && styles.buttonDisabled,
              ]}
              onPress={() => confirmTransition(nextStatus)}
              disabled={updating}>
              <Text
                style={
                  nextStatus === 'cancelled'
                    ? styles.dangerButtonText
                    : styles.primaryButtonText
                }>
                {updating ? 'Updating...' : STATUS_LABELS[nextStatus]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
  },
  metaText: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#e5e7eb',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: 12,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#38bdf8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#050816',
    fontWeight: '600',
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  dangerButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default WorkOrderDetailsScreen;
