import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {API_BASE_URL} from '../config';

function WorkOrdersListScreen({navigation}) {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/work-orders`);
      const json = await res.json();
      setWorkOrders(json);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to load work orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();

    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchWorkOrders();
    });

    return unsubscribe;
  }, [navigation]);

  const renderWorkOrder = ({item}) => (
    <TouchableOpacity
      style={styles.workOrderCard}
      onPress={() => navigation.navigate('WorkOrderDetails', {workOrder: item})}>
      <Text style={styles.workOrderTitle}>{item.title}</Text>
      {item.description ? (
        <Text style={styles.workOrderDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <Text style={styles.workOrderMeta}>Status: {item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Work Orders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('WorkOrderForm')}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={styles.loader} />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!loading && !error && (
        <FlatList
          data={workOrders}
          keyExtractor={item => String(item.id)}
          renderItem={renderWorkOrder}
          ListEmptyComponent={
            <Text style={styles.emptyState}>
              No work orders yet. Tap "Add" to create one.
            </Text>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
  },
  addButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#050816',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  workOrderCard: {
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  workOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  workOrderDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  workOrderMeta: {
    fontSize: 12,
    color: '#a3e635',
    marginTop: 6,
  },
  emptyState: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 24,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#f97373',
    marginHorizontal: 16,
    marginTop: 8,
  },
  loader: {
    marginTop: 24,
  },
});

export default WorkOrdersListScreen;
