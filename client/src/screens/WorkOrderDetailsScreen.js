import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import {API_BASE_URL} from '../config';
import {useAuth} from '../context/AuthContext';

function WorkOrderDetailsScreen({route, navigation}) {
  const {token} = useAuth();
  const {workOrder} = route.params;
  const [deleting, setDeleting] = useState(false);

  const handleEdit = () => {
    navigation.navigate('WorkOrderForm', {workOrder});
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Work Order',
      'Are you sure you want to delete this work order?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              const res = await fetch(
                `${API_BASE_URL}/work-orders/${workOrder.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              if (res.ok || res.status === 204) {
                navigation.goBack();
              } else {
                Alert.alert('Error', 'Failed to delete work order');
              }
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete work order');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{workOrder.title}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{workOrder.status}</Text>
          </View>
        </View>

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

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            disabled={deleting}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}>
            <Text style={styles.deleteButtonText}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Text>
          </TouchableOpacity>
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
    color: '#a3e635',
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
  actions: {
    marginTop: 32,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#38bdf8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#050816',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default WorkOrderDetailsScreen;
