import React, {useEffect, useState, useCallback, useMemo} from 'react';
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
import {useAuth} from '../context/AuthContext';
import ScreenErrorState from '../components/ScreenErrorState';
import {
  buildQueueSummary,
  canManageOperations,
  getRoleAccessMessage,
  getRoleActions,
  getRoleHome,
  getWorkOrdersEndpointForRole,
} from '../utils/roleWorkflows';

// Helper function to get status color
const getStatusColor = (status) => {
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

function WorkOrdersListScreen({navigation}) {
  const {user, logout, authFetch} = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const canManageWorkOrders = canManageOperations(user?.role);

  // RF-22: technicians see their assigned queue ordered by priority;
  // client/viewer scoping is enforced by the backend list endpoint (RF-21).
  const endpoint = getWorkOrdersEndpointForRole(user?.role);
  const roleHome = useMemo(() => getRoleHome(user?.role), [user?.role]);
  const roleActions = useMemo(() => getRoleActions(user?.role), [user?.role]);
  const queueSummary = useMemo(() => buildQueueSummary(workOrders), [workOrders]);

  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(endpoint);

      if (res.ok) {
        const json = await res.json();
        setWorkOrders(json);
        setError(null);
      } else if (res.status === 401) {
        setError('Session expired. Please login again.');
        await logout();
      } else if (res.status === 403) {
        setError(getRoleAccessMessage(user?.role));
      } else {
        setError('Unable to load work orders.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load work orders.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, endpoint, logout, user?.role]);

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
        <View style={styles.titleBlock}>
          <Text style={styles.sectionTitle}>{roleHome.title}</Text>
          <Text style={styles.sectionSubtitle}>{roleHome.subtitle}</Text>
        </View>
      </View>

      <View style={styles.rolePanel}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{queueSummary.total}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{queueSummary.open}</Text>
            <Text style={styles.summaryLabel}>Open</Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{queueSummary.inProgress}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{queueSummary.pendingApproval}</Text>
            <Text style={styles.summaryLabel}>Approvals</Text>
          </View>
        </View>

        {canManageWorkOrders && (
          <View style={styles.actionGrid}>
            {roleActions.map(action => (
              <TouchableOpacity
                key={action.key}
                style={[styles.actionCard, styles[`${action.tone}Action`]]}
                onPress={() => navigation.navigate(action.route)}>
                <Text
                  style={[
                    styles.actionLabel,
                    action.tone === 'primary' && styles.primaryActionLabel,
                  ]}>
                  {action.label}
                </Text>
                <Text style={styles.actionDetail}>{action.detail}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading && <ActivityIndicator style={styles.loader} />}
      {error && (
        <ScreenErrorState message={error} onRetry={fetchWorkOrders} />
      )}
      {!loading && !error && (
        <FlatList
          data={workOrders}
          keyExtractor={item => String(item.id)}
          renderItem={renderWorkOrder}
          ListEmptyComponent={
            <Text style={styles.emptyState}>
              {roleHome.emptyState}
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
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  titleBlock: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
  },
  rolePanel: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  summaryPill: {
    flex: 1,
    minHeight: 54,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 7,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  summaryValue: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  directoryAction: {
    borderColor: '#c084fc',
  },
  dispatchAction: {
    borderColor: '#a3e635',
  },
  reportAction: {
    borderColor: '#38bdf8',
  },
  primaryAction: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  actionLabel: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 14,
  },
  actionDetail: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 3,
  },
  primaryActionLabel: {
    color: '#050816',
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
  loader: {
    marginTop: 24,
  },
});

export default WorkOrdersListScreen;
