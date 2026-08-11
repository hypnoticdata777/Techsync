import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import ScreenErrorState from '../components/ScreenErrorState';
import {
  actionButtonA11y,
  roleActionA11y,
  summaryA11yLabel,
  workOrderButtonA11y,
} from '../utils/accessibility';
import {LOGOUT_CONFIRMATION, shouldLogoutImmediately} from '../utils/logoutFlow';
import {
  buildQueueSummary,
  buildRoleGuidanceRows,
  buildRoleLaneRows,
  buildWorkOrderFlowRows,
  canManageOperations,
  getRoleAccessMessage,
  getRoleActions,
  getRoleEmptyState,
  getRoleHome,
  getRolePortalSummary,
  getRoleUserExperience,
  getWorkOrdersEndpointForRole,
} from '../utils/roleWorkflows';

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'open':
      return '#fbbf24'; // yellow
    case 'in_progress':
      return '#38bdf8'; // blue
    case 'paused':
      return '#f97316'; // orange
    case 'escalated':
      return '#fb7185'; // rose
    case 'completed':
      return '#a3e635'; // green
    case 'cancelled':
      return '#ef4444'; // red
    case 'archived':
      return '#94a3b8'; // slate
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
  const roleExperience = useMemo(() => getRoleUserExperience(user?.role), [user?.role]);
  const roleEmptyState = useMemo(() => getRoleEmptyState(user?.role), [user?.role]);
  const roleActions = useMemo(() => getRoleActions(user?.role), [user?.role]);
  const queueSummary = useMemo(() => buildQueueSummary(workOrders), [workOrders]);
  const roleLaneRows = useMemo(() => buildRoleLaneRows(user?.role), [user?.role]);
  const portalSummary = useMemo(
    () => getRolePortalSummary(user?.role, queueSummary),
    [user?.role, queueSummary],
  );
  const roleGuidanceRows = useMemo(
    () => buildRoleGuidanceRows(user?.role, queueSummary),
    [user?.role, queueSummary],
  );

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

  const renderWorkOrder = ({item}) => {
    const flowRows = buildWorkOrderFlowRows(item);

    return (
      <TouchableOpacity
        style={styles.workOrderCard}
        {...workOrderButtonA11y(item)}
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
        <View style={styles.flowChipRow}>
          {flowRows.map(row => (
            <View
              key={row.key}
              style={styles.flowChip}
              accessible
              accessibilityLabel={`${row.label}: ${row.value}. ${row.detail}`}>
              <Text style={styles.flowChipLabel}>{row.label}</Text>
              <Text
                style={[
                  styles.flowChipValue,
                  {color: row.key === 'owner' ? getStatusColor(item.status) : '#e5e7eb'},
                ]}
                numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const handleLogout = async () => {
    if (shouldLogoutImmediately(Platform.OS)) {
      await logout();
      return;
    }

    Alert.alert(LOGOUT_CONFIRMATION.title, LOGOUT_CONFIRMATION.message, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleEmptyAction = () => {
    if (roleEmptyState.actionRoute) {
      navigation.navigate(roleEmptyState.actionRoute);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.userBar}>
        <View style={styles.userIdentity}>
          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          <Text style={styles.roleBadge}>{roleExperience.roleLabel}</Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          {...actionButtonA11y('Logout', 'Signs out of TechSync Ops.')}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.sectionTitle}>{roleHome.title}</Text>
          <Text style={styles.sectionSubtitle}>{roleHome.subtitle}</Text>
          <Text style={styles.scopeLine}>{roleExperience.scopeLabel}</Text>
        </View>
      </View>

      <View style={styles.rolePanel}>
        <View style={styles.summaryRow}>
          <View
            style={styles.summaryPill}
            accessible
            accessibilityLabel={summaryA11yLabel('Total work orders', queueSummary.total)}>
            <Text style={styles.summaryValue}>{queueSummary.total}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View
            style={styles.summaryPill}
            accessible
            accessibilityLabel={summaryA11yLabel('Open work orders', queueSummary.open)}>
            <Text style={styles.summaryValue}>{queueSummary.open}</Text>
            <Text style={styles.summaryLabel}>Open</Text>
          </View>
          <View
            style={styles.summaryPill}
            accessible
            accessibilityLabel={summaryA11yLabel('Active work orders', queueSummary.inProgress)}>
            <Text style={styles.summaryValue}>{queueSummary.inProgress}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View
            style={styles.summaryPill}
            accessible
            accessibilityLabel={summaryA11yLabel('Pending approvals', queueSummary.pendingApproval)}>
            <Text style={styles.summaryValue}>{queueSummary.pendingApproval}</Text>
            <Text style={styles.summaryLabel}>Approvals</Text>
          </View>
        </View>

        <View style={styles.laneMap}>
          {roleLaneRows.map(row => (
            <View
              key={row.key}
              style={styles.laneRow}
              accessible
              accessibilityLabel={`${row.label}. ${row.value}`}>
              <Text style={styles.laneLabel}>{row.label}</Text>
              <Text style={styles.laneValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.guidanceStack}>
          {roleGuidanceRows.map(row => (
            <View
              key={row.key}
              style={styles.guidanceRow}
              accessible
              accessibilityLabel={`${row.label}. ${row.value}`}>
              <Text style={styles.guidanceLabel}>{row.label}</Text>
              <Text style={styles.guidanceValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {canManageWorkOrders && (
          <View style={styles.actionGrid}>
            {roleActions.map(action => (
              <TouchableOpacity
                key={action.key}
                style={[styles.actionCard, styles[`${action.tone}Action`]]}
                {...roleActionA11y(action)}
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

      {portalSummary ? (
        <View
          style={styles.portalPanel}
          accessible
          accessibilityLabel={`${portalSummary.title}. ${portalSummary.subtitle}`}>
          <View style={styles.portalHeader}>
            <Text style={styles.portalTitle}>{portalSummary.title}</Text>
            <Text style={styles.portalSubtitle}>{portalSummary.subtitle}</Text>
          </View>
          <View style={styles.portalRow}>
            {portalSummary.rows.map(row => (
              <View
                key={row.key}
                style={styles.portalMetric}
                accessible
                accessibilityLabel={`${row.label}. ${row.value}`}>
                <Text style={styles.portalMetricLabel}>{row.label}</Text>
                <Text style={styles.portalMetricValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

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
            <EmptyQueueState
              state={roleEmptyState}
              onAction={roleEmptyState.actionRoute ? handleEmptyAction : null}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            workOrders.length === 0 && styles.emptyListContent,
          ]}
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

const EmptyQueueState = ({state, onAction}) => (
  <View style={styles.emptyPanel}>
    <Text style={styles.emptyTitle}>{state.title}</Text>
    <Text style={styles.emptyMessage}>{state.message}</Text>
    <Text style={styles.emptyDetail}>{state.detail}</Text>
    {onAction ? (
      <TouchableOpacity
        style={styles.emptyActionButton}
        onPress={onAction}
        {...actionButtonA11y(state.actionLabel, state.message)}>
        <Text style={styles.emptyActionText}>{state.actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

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
  userIdentity: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  userName: {
    fontSize: 12,
    color: '#9ca3af',
  },
  roleBadge: {
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  scopeLine: {
    alignSelf: 'flex-start',
    color: '#a3e635',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
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
  laneMap: {
    borderTopColor: '#1f2937',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 10,
    marginBottom: 10,
  },
  laneRow: {
    borderLeftColor: '#38bdf8',
    borderLeftWidth: 2,
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 62,
    paddingLeft: 9,
    paddingRight: 6,
  },
  laneLabel: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  laneValue: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  guidanceStack: {
    borderTopColor: '#1f2937',
    borderTopWidth: 1,
    marginBottom: 10,
  },
  guidanceRow: {
    borderBottomColor: '#111827',
    borderBottomWidth: 1,
    paddingVertical: 9,
  },
  guidanceLabel: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '800',
  },
  guidanceValue: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
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
  evidenceAction: {
    borderColor: '#fbbf24',
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
  portalPanel: {
    backgroundColor: '#07111f',
    borderColor: '#243449',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
  },
  portalHeader: {
    marginBottom: 10,
  },
  portalTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '900',
  },
  portalSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  portalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  portalMetric: {
    borderLeftColor: '#a3e635',
    borderLeftWidth: 2,
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 48,
    paddingLeft: 9,
    paddingRight: 6,
  },
  portalMetricLabel: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  portalMetricValue: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  workOrderCard: {
    backgroundColor: '#020617',
    borderRadius: 10,
    minHeight: 72,
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
  flowChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  flowChip: {
    flexGrow: 1,
    flexBasis: '31%',
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  flowChipLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  flowChipValue: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    marginTop: 3,
  },
  emptyPanel: {
    backgroundColor: '#020617',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginTop: 8,
    padding: 16,
  },
  emptyTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyMessage: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyDetail: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyActionButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 44,
    minWidth: 132,
    paddingHorizontal: 18,
  },
  emptyActionText: {
    color: '#050816',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  loader: {
    marginTop: 24,
  },
});

export default WorkOrdersListScreen;
