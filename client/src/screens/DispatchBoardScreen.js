import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import ScreenErrorState from '../components/ScreenErrorState';
import {summaryA11yLabel, workOrderButtonA11y} from '../utils/accessibility';

const getPriorityColor = priority => {
  switch (priority) {
    case 'emergency':
      return '#b86b2b';
    case 'high':
      return '#b24a3a';
    case 'medium':
      return '#b98524';
    case 'low':
      return '#5f8f62';
    default:
      return '#746a5d';
  }
};

const getRiskColor = risk => {
  switch (risk) {
    case 'breached':
      return '#b24a3a';
    case 'due_soon':
      return '#b86b2b';
    case 'on_track':
      return '#5f8f62';
    default:
      return '#746a5d';
  }
};

const formatLabel = value => (value || 'none').replace(/_/g, ' ');

const formatAge = value => {
  const hours = Number(value || 0);
  if (hours < 1) {
    return '<1h';
  }
  if (hours < 24) {
    return `${Math.round(hours)}h`;
  }
  return `${Math.round(hours / 24)}d`;
};

const formatDate = value => {
  if (!value) {
    return 'No SLA';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No SLA';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const WorkOrderChip = ({item, onPress}) => (
  <TouchableOpacity style={styles.workChip} onPress={onPress} {...workOrderButtonA11y(item)}>
    <View style={styles.workChipHeader}>
      <Text style={styles.workTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.riskBadge, {color: getRiskColor(item.sla_risk_level)}]}>
        {formatLabel(item.sla_risk_level)}
      </Text>
    </View>
    <View style={styles.metaRow}>
      <Text style={[styles.priorityText, {color: getPriorityColor(item.priority)}]}>
        {formatLabel(item.priority)}
      </Text>
      <Text style={styles.metaText}>{formatLabel(item.status)}</Text>
      <Text style={styles.metaText}>age {formatAge(item.age_hours)}</Text>
    </View>
    <Text style={styles.contextText} numberOfLines={1}>
      {item.property_name || item.client_display_name || item.vendor_name || 'No PMC context'}
    </Text>
    <Text style={styles.contextText}>SLA {formatDate(item.sla_due_at)}</Text>
  </TouchableOpacity>
);

const SummaryTile = ({label, value, tone}) => (
  <View
    style={[styles.summaryTile, tone && styles[tone]]}
    accessible
    accessibilityLabel={summaryA11yLabel(label, value)}>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const EmptyPanel = ({message}) => (
  <View style={styles.emptyPanel}>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

function DispatchBoardScreen({navigation}) {
  const {authFetch, logout} = useAuth();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/dashboard/dispatch-board');

      if (res.ok) {
        const json = await res.json();
        setBoard(json);
        setError(null);
      } else if (res.status === 401) {
        setError('Session expired. Please login again.');
        await logout();
      } else if (res.status === 403) {
        setError('Dispatch board access requires an admin or coordinator role.');
      } else {
        setError('Unable to load dispatch board.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load dispatch board.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, logout]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBoard();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const summary = useMemo(
    () =>
      board?.summary || {
        open_count: 0,
        in_progress_count: 0,
        unassigned_count: 0,
        sla_at_risk_count: 0,
        emergency_count: 0,
      },
    [board],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#2f6f9f"
          colors={['#2f6f9f']}
        />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>Dispatch Board</Text>
        <Text style={styles.subtitle}>Unassigned work, technician load, SLA risk</Text>
      </View>

      {loading && <ActivityIndicator style={styles.loader} color="#2f6f9f" />}

      {error && (
        <ScreenErrorState message={error} onRetry={fetchBoard} />
      )}

      {!loading && !error && board && (
        <>
          <View style={styles.summaryGrid}>
            <SummaryTile label="Open" value={summary.open_count} />
            <SummaryTile label="In Progress" value={summary.in_progress_count} />
            <SummaryTile label="Unassigned" value={summary.unassigned_count} tone="warningTile" />
            <SummaryTile label="SLA Risk" value={summary.sla_at_risk_count} tone="riskTile" />
            <SummaryTile label="Emergency" value={summary.emergency_count} tone="urgentTile" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unassigned Queue</Text>
            {board.unassigned_work_orders.length === 0 ? (
              <EmptyPanel message="No unassigned active work." />
            ) : (
              board.unassigned_work_orders.map(item => (
                <WorkOrderChip
                  key={item.id}
                  item={item}
                  onPress={() => navigation.navigate('WorkOrderDetails', {workOrder: item})}
                />
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technician Lanes</Text>
            {board.technician_lanes.length === 0 ? (
              <EmptyPanel message="No technicians found for this organization." />
            ) : (
              board.technician_lanes.map(lane => {
                const isOverloaded =
                  lane.active_work_order_count > lane.max_daily_jobs;
                return (
                  <View key={lane.technician_id} style={styles.lane}>
                    <View style={styles.laneHeader}>
                      <View style={styles.laneTitleBlock}>
                        <Text style={styles.laneTitle}>{lane.full_name}</Text>
                        <Text style={styles.laneMeta}>{formatLabel(lane.availability_status)}</Text>
                      </View>
                      <View style={styles.loadBlock}>
                        <Text style={[styles.loadValue, isOverloaded && styles.loadRisk]}>
                          {lane.active_work_order_count}/{lane.max_daily_jobs}
                        </Text>
                        <Text style={styles.loadLabel}>{lane.utilization_percent}%</Text>
                      </View>
                    </View>
                    {lane.work_orders.length === 0 ? (
                      <Text style={styles.noLaneWork}>No active assigned work.</Text>
                    ) : (
                      lane.work_orders.map(item => (
                        <WorkOrderChip
                          key={item.id}
                          item={item}
                          onPress={() =>
                            navigation.navigate('WorkOrderDetails', {workOrder: item})
                          }
                        />
                      ))
                    )}
                  </View>
                );
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f3ea',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1f2933',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#746a5d',
  },
  loader: {
    marginTop: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  summaryTile: {
    width: '31%',
    minWidth: 96,
    minHeight: 76,
    justifyContent: 'center',
    backgroundColor: '#fdf8ef',
    borderWidth: 1,
    borderColor: '#d8ccb9',
    borderRadius: 8,
    padding: 10,
  },
  warningTile: {
    borderColor: '#b98524',
  },
  riskTile: {
    borderColor: '#b86b2b',
  },
  urgentTile: {
    borderColor: '#b24a3a',
  },
  summaryValue: {
    color: '#2f6f9f',
    fontSize: 24,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#4f5f6f',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#1f2933',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  lane: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#d8ccb9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  laneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  laneTitleBlock: {
    flex: 1,
    paddingRight: 8,
  },
  laneTitle: {
    color: '#27313d',
    fontSize: 16,
    fontWeight: '800',
  },
  laneMeta: {
    color: '#746a5d',
    fontSize: 12,
    marginTop: 2,
  },
  loadBlock: {
    minWidth: 62,
    alignItems: 'flex-end',
  },
  loadValue: {
    color: '#5f8f62',
    fontSize: 18,
    fontWeight: '800',
  },
  loadRisk: {
    color: '#b24a3a',
  },
  loadLabel: {
    color: '#746a5d',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  workChip: {
    backgroundColor: '#fdf8ef',
    borderWidth: 1,
    borderColor: '#d8ccb9',
    borderRadius: 8,
    minHeight: 72,
    padding: 10,
    marginBottom: 8,
  },
  workChipHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  workTitle: {
    flex: 1,
    color: '#1f2933',
    fontSize: 14,
    fontWeight: '800',
  },
  riskBadge: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaText: {
    color: '#4f5f6f',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  contextText: {
    color: '#746a5d',
    fontSize: 12,
    marginTop: 6,
  },
  noLaneWork: {
    color: '#746a5d',
    fontSize: 13,
  },
  emptyPanel: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#d8ccb9',
    borderRadius: 8,
    padding: 14,
  },
  emptyText: {
    color: '#746a5d',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default DispatchBoardScreen;
