import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {API_BASE_URL} from '../config';
import {useAuth} from '../context/AuthContext';
import fetchWithTimeout from '../utils/fetchWithTimeout';

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
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

function WorkOrdersListScreen({navigation}) {
  const {token, user, logout} = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWithTimeout(`${API_BASE_URL}/work-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        setWorkOrders(json);
        setError(null);
      } else if (res.status === 401) {
        setError('Session expired. Please login again.');
        await logout();
      } else {
        setError('Unable to load work orders.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load work orders.');
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchWorkOrders();

    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchWorkOrders();
    });

    return unsubscribe;
  }, [navigation, fetchWorkOrders]);

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
      <Text style={[styles.workOrderMeta, {color: getStatusColor(item.status)}]}>
        Status: {item.status.replace('_', ' ')}
      </Text>
    </TouchableOpacity>
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.userBar}>
        <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Work Orders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('WorkOrderForm')}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={styles.loader} />}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchWorkOrders}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#38bdf8"
              colors={['#38bdf8']}
            />
          }
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
  userBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  userName: {
    fontSize: 12,
    color: '#9ca3af',
  },
  logoutText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
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
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#f97373',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#050816',
    fontWeight: '600',
    fontSize: 14,
  },
  loader: {
    marginTop: 24,
  },
});

export default WorkOrdersListScreen;
