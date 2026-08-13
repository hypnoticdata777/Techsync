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
  buildRoleCardRows,
  buildRoleEventLaneRows,
  buildRoleNextBestAction,
  buildRoleOutcomeRows,
  buildRoleQueueFilterRows,
  buildRoleLaneRows,
  buildWorkOrderFlowRows,
  canManageOperations,
  filterWorkOrdersForRoleQueue,
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
      return '#b98524'; // yellow
    case 'in_progress':
      return '#2f6f9f'; // blue
    case 'paused':
      return '#b86b2b'; // orange
    case 'escalated':
      return '#b24a3a'; // rose
    case 'completed':
      return '#5f8f62'; // green
    case 'cancelled':
      return '#b24a3a'; // red
    case 'archived':
      return '#746a5d'; // slate
    case 'pending':
      return '#b98524';
    case 'missing':
      return '#b24a3a';
    case 'verified':
      return '#5f8f62';
    case 'active':
      return '#2f6f9f';
    default:
      return '#746a5d'; // gray
  }
};

function WorkOrdersListScreen({navigation}) {
  const {user, logout, authFetch} = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeQueueFilter, setActiveQueueFilter] = useState('all');
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
  const roleOutcomeRows = useMemo(
    () => buildRoleOutcomeRows(user?.role, queueSummary, workOrders),
    [queueSummary, user?.role, workOrders],
  );
  const roleNextBestAction = useMemo(
    () => buildRoleNextBestAction(user?.role, workOrders),
    [user?.role, workOrders],
  );
  const roleEventLaneRows = useMemo(
    () => buildRoleEventLaneRows(user?.role, workOrders),
    [user?.role, workOrders],
  );
  const queueFilterRows = useMemo(
    () => buildRoleQueueFilterRows(user?.role, workOrders),
    [user?.role, workOrders],
  );
  const activeFilterRow = useMemo(
    () => queueFilterRows.find(row => row.key === activeQueueFilter) || queueFilterRows[0],
    [activeQueueFilter, queueFilterRows],
  );
  const visibleWorkOrders = useMemo(
    () => filterWorkOrdersForRoleQueue(user?.role, activeQueueFilter, workOrders),
    [activeQueueFilter, user?.role, workOrders],
  );
  const isQueueFocused = activeQueueFilter !== 'all';
  const activeFilterTone = activeFilterRow?.tone || roleNextBestAction.tone || 'active';
  const activeFilterColor = getStatusColor(activeFilterTone);

  useEffect(() => {
    if (!queueFilterRows.some(row => row.key === activeQueueFilter)) {
      setActiveQueueFilter('all');
    }
  }, [activeQueueFilter, queueFilterRows]);

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
    const cardRows = buildRoleCardRows(user?.role, item);

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
        <View style={styles.cardSignalRow}>
          {cardRows.map(row => (
            <View
              key={row.key}
              style={styles.cardSignal}
              accessible
              accessibilityLabel={`${row.label}: ${row.value}. ${row.detail}`}>
              <Text style={styles.cardSignalLabel}>{row.label}</Text>
              <Text
                style={[
                  styles.cardSignalValue,
                  {color: getStatusColor(row.tone || item.status)},
                ]}
                numberOfLines={1}>
                {row.value}
              </Text>
              <Text style={styles.cardSignalDetail} numberOfLines={2}>
                {row.detail}
              </Text>
            </View>
          ))}
        </View>
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
                  {color: row.key === 'owner' ? getStatusColor(item.status) : '#27313d'},
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

  const handleNextBestOpen = () => {
    const target = workOrders.find(item => item.id === roleNextBestAction.workOrderId);
    if (target) {
      navigation.navigate('WorkOrderDetails', {workOrder: target});
      return;
    }
    fetchWorkOrders();
  };

  const handleNextBestFocus = () => {
    setActiveQueueFilter(roleNextBestAction.filterKey || 'all');
  };

  const handleClearFocus = () => {
    setActiveQueueFilter('all');
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

        <View
          style={[styles.nextActionPanel, {borderLeftColor: getStatusColor(roleNextBestAction.tone)}]}
          accessible
          accessibilityLabel={`Next best action. ${roleNextBestAction.label}. ${roleNextBestAction.value}. Target: ${roleNextBestAction.workOrderTitle}. ${roleNextBestAction.detail}`}>
          <View style={styles.nextActionHeader}>
            <View style={styles.nextActionCopy}>
              <Text style={styles.nextActionEyebrow}>{roleNextBestAction.label}</Text>
              <Text style={styles.nextActionTitle}>{roleNextBestAction.value}</Text>
              <Text style={styles.nextActionTarget} numberOfLines={2}>
                {roleNextBestAction.workOrderTitle}
              </Text>
              <Text style={styles.nextActionDetail}>{roleNextBestAction.detail}</Text>
            </View>
            <View style={styles.nextActionButtons}>
              <TouchableOpacity
                style={styles.nextActionPrimary}
                onPress={handleNextBestOpen}
                {...actionButtonA11y(
                  roleNextBestAction.actionLabel,
                  roleNextBestAction.workOrderId
                    ? `Opens ${roleNextBestAction.workOrderTitle}.`
                    : 'Refreshes the visible queue.',
                )}>
                <Text style={styles.nextActionPrimaryText}>
                  {roleNextBestAction.actionLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.nextActionSecondary,
                  activeQueueFilter === roleNextBestAction.filterKey &&
                    styles.nextActionSecondaryActive,
                ]}
                onPress={handleNextBestFocus}
                {...actionButtonA11y(
                  activeQueueFilter === roleNextBestAction.filterKey
                    ? `${roleNextBestAction.filterLabel} active`
                    : roleNextBestAction.filterLabel,
                  `Shows only ${roleNextBestAction.filterKey || 'all'} queue records.`,
                )}>
                <Text style={styles.nextActionSecondaryText}>
                  {activeQueueFilter === roleNextBestAction.filterKey
                    ? `Showing ${activeFilterRow?.label || 'Focus'}`
                    : roleNextBestAction.filterLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.outcomeRow}>
            {roleOutcomeRows.map(row => (
              <View
                key={row.key}
                style={[
                  styles.outcomeCard,
                  {borderLeftColor: getStatusColor(row.tone)},
                ]}>
                <Text style={styles.outcomeLabel}>{row.label}</Text>
                <Text
                  style={[styles.outcomeValue, {color: getStatusColor(row.tone)}]}
                  numberOfLines={2}>
                  {row.value}
                </Text>
                <Text style={styles.outcomeDetail} numberOfLines={3}>
                  {row.detail}
                </Text>
              </View>
            ))}
          </View>
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

        <View style={styles.eventLaneGrid}>
          {roleEventLaneRows.map(row => (
            <View
              key={row.key}
              style={[styles.eventLaneCard, {borderLeftColor: getStatusColor(row.tone)}]}
              accessible
              accessibilityLabel={`${row.label}. ${row.value}. ${row.detail}`}>
              <Text style={styles.eventLaneLabel}>{row.label}</Text>
              <Text
                style={[styles.eventLaneValue, {color: getStatusColor(row.tone)}]}
                numberOfLines={1}>
                {row.value}
              </Text>
              <Text style={styles.eventLaneDetail} numberOfLines={3}>
                {row.detail}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.queueFilterPanel}>
          <Text style={styles.queueFilterTitle}>Focus Queue</Text>
          <Text style={styles.queueFilterHint}>{activeFilterRow?.detail}</Text>
          {isQueueFocused ? (
            <View
              style={[styles.focusStatusPanel, {borderLeftColor: activeFilterColor}]}
              accessible
              accessibilityLabel={`${activeFilterRow?.label} focus is active. ${visibleWorkOrders.length} of ${workOrders.length} records are shown. ${activeFilterRow?.detail}`}>
              <View style={styles.focusStatusCopy}>
                <Text style={styles.focusStatusLabel}>Active Focus</Text>
                <Text style={[styles.focusStatusTitle, {color: activeFilterColor}]}>
                  Showing {activeFilterRow?.label}
                </Text>
                <Text style={styles.focusStatusDetail}>
                  {visibleWorkOrders.length} of {workOrders.length} visible records match this lane.
                  Clear focus to restore the full queue.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.focusClearButton}
                onPress={handleClearFocus}
                {...actionButtonA11y(
                  'Clear Focus',
                  'Restores all visible work orders for this role.',
                )}>
                <Text style={styles.focusClearText}>Clear Focus</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.queueFilterRow}>
            {queueFilterRows.map(row => {
              const selected = row.key === activeQueueFilter;
              return (
                <TouchableOpacity
                  key={row.key}
                  style={[
                    styles.queueFilterChip,
                    selected && styles.queueFilterChipSelected,
                    selected && {borderColor: getStatusColor(row.tone)},
                  ]}
                  onPress={() => setActiveQueueFilter(selected && row.key !== 'all' ? 'all' : row.key)}
                  accessibilityRole="button"
                  accessibilityState={{selected}}
                  accessibilityLabel={`${row.label} queue filter. ${row.value}. ${row.detail}${
                    selected && row.key !== 'all' ? ' Tap again to clear focus.' : ''
                  }`}>
                  <Text
                    style={[
                      styles.queueFilterLabel,
                      selected && {color: getStatusColor(row.tone)},
                    ]}>
                    {row.label}
                  </Text>
                  <Text style={styles.queueFilterCount}>{row.count}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
          data={visibleWorkOrders}
          keyExtractor={item => String(item.id)}
          renderItem={renderWorkOrder}
          ListEmptyComponent={
            <EmptyQueueState
              state={roleEmptyState}
              filter={activeQueueFilter === 'all' ? null : activeFilterRow}
              onAction={roleEmptyState.actionRoute ? handleEmptyAction : null}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            visibleWorkOrders.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2f6f9f"
              colors={['#2f6f9f']}
            />
          }
        />
      )}
    </View>
  );
}

const EmptyQueueState = ({state, filter, onAction}) => (
  <View style={styles.emptyPanel}>
    <Text style={styles.emptyTitle}>
      {filter ? `No ${filter.label.toLowerCase()} items` : state.title}
    </Text>
    <Text style={styles.emptyMessage}>
      {filter
        ? `${filter.detail} Switch back to All to see the full visible queue.`
        : state.message}
    </Text>
    <Text style={styles.emptyDetail}>{filter ? state.detail : state.detail}</Text>
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
    backgroundColor: '#f7f3ea',
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
    color: '#746a5d',
  },
  roleBadge: {
    borderColor: '#c7b89f',
    borderRadius: 999,
    borderWidth: 1,
    color: '#6f5f95',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  logoutText: {
    fontSize: 12,
    color: '#b24a3a',
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
    color: '#1f2933',
  },
  sectionSubtitle: {
    color: '#746a5d',
    fontSize: 12,
    lineHeight: 17,
  },
  scopeLine: {
    alignSelf: 'flex-start',
    color: '#5f8f62',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  rolePanel: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#d8ccb9',
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
    backgroundColor: '#fdf8ef',
    borderWidth: 1,
    borderColor: '#d8ccb9',
    borderRadius: 7,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  summaryValue: {
    color: '#2f6f9f',
    fontSize: 18,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#4f5f6f',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  laneMap: {
    borderTopColor: '#d8ccb9',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 10,
    marginBottom: 10,
  },
  laneRow: {
    borderLeftColor: '#2f6f9f',
    borderLeftWidth: 2,
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 62,
    paddingLeft: 9,
    paddingRight: 6,
  },
  laneLabel: {
    color: '#2f6f9f',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  laneValue: {
    color: '#4f5f6f',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  nextActionPanel: {
    backgroundColor: '#fffaf0',
    borderColor: '#c7b89f',
    borderLeftWidth: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
  nextActionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  nextActionCopy: {
    flex: 1,
    minWidth: 220,
  },
  nextActionEyebrow: {
    color: '#1f2933',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  nextActionTitle: {
    color: '#2f6f9f',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25,
    marginTop: 4,
  },
  nextActionTarget: {
    color: '#1f2933',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 5,
  },
  nextActionDetail: {
    color: '#4f5f6f',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  nextActionButtons: {
    flexBasis: 210,
    flexGrow: 1,
    gap: 8,
    justifyContent: 'center',
  },
  nextActionPrimary: {
    alignItems: 'center',
    backgroundColor: '#2f6f9f',
    borderColor: '#2f6f9f',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  nextActionPrimaryText: {
    color: '#fffaf0',
    fontSize: 13,
    fontWeight: '900',
  },
  nextActionSecondary: {
    alignItems: 'center',
    backgroundColor: '#fdf8ef',
    borderColor: '#c7b89f',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  nextActionSecondaryActive: {
    backgroundColor: '#efe6d6',
    borderColor: '#2f6f9f',
  },
  nextActionSecondaryText: {
    color: '#27313d',
    fontSize: 12,
    fontWeight: '900',
  },
  outcomeRow: {
    borderTopColor: '#d8ccb9',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
  },
  outcomeCard: {
    backgroundColor: '#fffaf0',
    borderColor: '#d8ccb9',
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 190,
    flexGrow: 1,
    minHeight: 92,
    minWidth: 160,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  outcomeLabel: {
    color: '#2f6f9f',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  outcomeValue: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
    marginTop: 4,
  },
  outcomeDetail: {
    color: '#4f5f6f',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  guidanceStack: {
    borderTopColor: '#d8ccb9',
    borderTopWidth: 1,
    marginBottom: 10,
  },
  guidanceRow: {
    borderBottomColor: '#efe6d6',
    borderBottomWidth: 1,
    paddingVertical: 9,
  },
  guidanceLabel: {
    color: '#27313d',
    fontSize: 12,
    fontWeight: '800',
  },
  guidanceValue: {
    color: '#746a5d',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  eventLaneGrid: {
    borderTopColor: '#d8ccb9',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    paddingTop: 10,
  },
  eventLaneCard: {
    backgroundColor: '#fffaf0',
    borderColor: '#c7b89f',
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 180,
    flexGrow: 1,
    minHeight: 92,
    minWidth: 160,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  eventLaneLabel: {
    color: '#2f6f9f',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  eventLaneValue: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
    marginTop: 4,
  },
  eventLaneDetail: {
    color: '#4f5f6f',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  queueFilterPanel: {
    borderTopColor: '#d8ccb9',
    borderTopWidth: 1,
    marginBottom: 10,
    paddingTop: 10,
  },
  queueFilterTitle: {
    color: '#27313d',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  queueFilterHint: {
    color: '#746a5d',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  focusStatusPanel: {
    alignItems: 'center',
    backgroundColor: '#fffaf0',
    borderColor: '#c7b89f',
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    padding: 10,
  },
  focusStatusCopy: {
    flex: 1,
    minWidth: 210,
  },
  focusStatusLabel: {
    color: '#2f6f9f',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  focusStatusTitle: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
    marginTop: 3,
  },
  focusStatusDetail: {
    color: '#4f5f6f',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  focusClearButton: {
    alignItems: 'center',
    backgroundColor: '#fdf8ef',
    borderColor: '#c7b89f',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  focusClearText: {
    color: '#1f2933',
    fontSize: 12,
    fontWeight: '900',
  },
  queueFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  queueFilterChip: {
    alignItems: 'center',
    backgroundColor: '#fdf8ef',
    borderColor: '#c7b89f',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 10,
  },
  queueFilterChipSelected: {
    backgroundColor: '#fffaf0',
    borderWidth: 2,
  },
  queueFilterLabel: {
    color: '#4f5f6f',
    fontSize: 12,
    fontWeight: '900',
  },
  queueFilterCount: {
    color: '#1f2933',
    fontSize: 12,
    fontWeight: '900',
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
    backgroundColor: '#fdf8ef',
  },
  directoryAction: {
    borderColor: '#6f5f95',
  },
  dispatchAction: {
    borderColor: '#5f8f62',
  },
  reportAction: {
    borderColor: '#2f6f9f',
  },
  evidenceAction: {
    borderColor: '#b98524',
  },
  primaryAction: {
    backgroundColor: '#2f6f9f',
    borderColor: '#2f6f9f',
  },
  actionLabel: {
    color: '#1f2933',
    fontWeight: '700',
    fontSize: 14,
  },
  actionDetail: {
    color: '#746a5d',
    fontSize: 11,
    marginTop: 3,
  },
  primaryActionLabel: {
    color: '#f7f3ea',
  },
  portalPanel: {
    backgroundColor: '#fffaf0',
    borderColor: '#c7b89f',
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
    color: '#1f2933',
    fontSize: 16,
    fontWeight: '900',
  },
  portalSubtitle: {
    color: '#746a5d',
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
    borderLeftColor: '#5f8f62',
    borderLeftWidth: 2,
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 48,
    paddingLeft: 9,
    paddingRight: 6,
  },
  portalMetricLabel: {
    color: '#2f6f9f',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  portalMetricValue: {
    color: '#27313d',
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
    backgroundColor: '#fffaf0',
    borderRadius: 10,
    minHeight: 72,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d8ccb9',
  },
  workOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27313d',
  },
  workOrderDescription: {
    fontSize: 13,
    color: '#746a5d',
    marginTop: 4,
  },
  workOrderMeta: {
    fontSize: 12,
    color: '#5f8f62',
    marginTop: 6,
  },
  flowChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  cardSignalRow: {
    borderTopColor: '#efe6d6',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
  },
  cardSignal: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 64,
    borderLeftColor: '#2f6f9f',
    borderLeftWidth: 2,
    paddingLeft: 9,
    paddingRight: 6,
  },
  cardSignalLabel: {
    color: '#2f6f9f',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardSignalValue: {
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    marginTop: 3,
  },
  cardSignalDetail: {
    color: '#746a5d',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  flowChip: {
    flexGrow: 1,
    flexBasis: '31%',
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: '#fdf8ef',
    borderWidth: 1,
    borderColor: '#d8ccb9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  flowChipLabel: {
    color: '#746a5d',
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
    backgroundColor: '#fffaf0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8ccb9',
    marginTop: 8,
    padding: 16,
  },
  emptyTitle: {
    color: '#1f2933',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyMessage: {
    color: '#4f5f6f',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyDetail: {
    color: '#746a5d',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyActionButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#2f6f9f',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 44,
    minWidth: 132,
    paddingHorizontal: 18,
  },
  emptyActionText: {
    color: '#f7f3ea',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  loader: {
    marginTop: 24,
  },
});

export default WorkOrdersListScreen;
