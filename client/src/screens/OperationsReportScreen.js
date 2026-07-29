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
import {
  buildCompletionCycleRows,
  buildPropertyHotspotRows,
  buildRiskBreakdown,
  buildTechnicianLoadRows,
} from '../utils/reportMetrics';

const STALE_DAY_OPTIONS = [7, 14, 30];
const HOTSPOT_DAY_OPTIONS = [30, 90, 180];
const COMPLETION_DAY_OPTIONS = [30, 90, 180];
const REPORT_LIMIT = 10;

const getStatusColor = status => {
  switch (status) {
    case 'open':
      return '#fbbf24';
    case 'in_progress':
      return '#38bdf8';
    case 'paused':
      return '#f97316';
    case 'escalated':
      return '#fb7185';
    case 'completed':
      return '#a3e635';
    case 'cancelled':
      return '#ef4444';
    case 'archived':
      return '#94a3b8';
    default:
      return '#9ca3af';
  }
};

const getPriorityColor = priority => {
  switch (priority) {
    case 'emergency':
      return '#f97316';
    case 'high':
      return '#fb7185';
    case 'medium':
      return '#fbbf24';
    case 'low':
      return '#a3e635';
    default:
      return '#9ca3af';
  }
};

const formatLabel = value => (value || '').replace(/_/g, ' ');

const formatDate = value => {
  if (!value) {
    return 'No date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No date';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const SegmentGroup = ({label, options, selected, onSelect, suffix}) => (
  <View style={styles.segmentBlock}>
    <Text style={styles.segmentLabel}>{label}</Text>
    <View style={styles.segmentRow}>
      {options.map(option => {
        const isSelected = option === selected;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.segmentButton, isSelected && styles.segmentButtonActive]}
            onPress={() => onSelect(option)}>
            <Text
              style={[
                styles.segmentButtonText,
                isSelected && styles.segmentButtonTextActive,
              ]}>
              {option}
              {suffix}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const EmptyState = ({message}) => (
  <View style={styles.emptyPanel}>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

const ChartBlock = ({title, subtitle, rows, emptyMessage}) => (
  <View style={styles.chartBlock}>
    <View style={styles.chartHeader}>
      <Text style={styles.chartTitle}>{title}</Text>
      {subtitle ? <Text style={styles.chartSubtitle}>{subtitle}</Text> : null}
    </View>
    {rows.length === 0 || rows.every(row => row.value === 0) ? (
      <EmptyState message={emptyMessage} />
    ) : (
      rows.map(row => (
        <View key={row.key || row.id || row.label} style={styles.barRow}>
          <View style={styles.barTextRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {row.label}
            </Text>
            <Text style={styles.barValue}>{row.value}</Text>
          </View>
          {row.detail ? <Text style={styles.barDetail}>{row.detail}</Text> : null}
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${row.percent}%`,
                  backgroundColor: row.color,
                },
              ]}
            />
          </View>
          {row.loadPercent ? (
            <Text style={styles.barDetail}>{row.loadPercent}% utilization</Text>
          ) : null}
        </View>
      ))
    )}
  </View>
);

function OperationsReportScreen() {
  const {authFetch, logout} = useAuth();
  const [report, setReport] = useState(null);
  const [staleDays, setStaleDays] = useState(7);
  const [hotspotDays, setHotspotDays] = useState(90);
  const [completionDays, setCompletionDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(
        `/dashboard/operations-report?stale_days=${staleDays}&hotspot_days=${hotspotDays}&completion_days=${completionDays}&limit=${REPORT_LIMIT}`,
      );

      if (res.ok) {
        const json = await res.json();
        setReport(json);
        setError(null);
      } else if (res.status === 401) {
        setError('Session expired. Please login again.');
        await logout();
      } else if (res.status === 403) {
        setError('Operations report access requires an admin or coordinator role.');
      } else {
        setError('Unable to load operations report.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load operations report.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, completionDays, hotspotDays, logout, staleDays]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReport();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const summary = useMemo(
    () => ({
      stale: report?.stale_work_orders?.length || 0,
      overloaded: report?.overloaded_technicians?.length || 0,
      hotspots: report?.property_hotspots?.length || 0,
      cycles: report?.completion_cycles?.length || 0,
    }),
    [report],
  );

  const riskBreakdown = useMemo(() => buildRiskBreakdown(report), [report]);
  const technicianLoadRows = useMemo(
    () => buildTechnicianLoadRows(report?.overloaded_technicians),
    [report],
  );
  const propertyHotspotRows = useMemo(
    () => buildPropertyHotspotRows(report?.property_hotspots),
    [report],
  );
  const completionCycleRows = useMemo(
    () => buildCompletionCycleRows(report?.completion_cycles),
    [report],
  );
  const completionCycles = report?.completion_cycles || [];

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
        <Text style={styles.title}>Operations Report</Text>
        <Text style={styles.subtitle}>Stale work, capacity risk, property patterns</Text>
      </View>

      <View style={styles.controls}>
        <SegmentGroup
          label="Stale older than"
          options={STALE_DAY_OPTIONS}
          selected={staleDays}
          onSelect={setStaleDays}
          suffix="d"
        />
        <SegmentGroup
          label="Hotspot window"
          options={HOTSPOT_DAY_OPTIONS}
          selected={hotspotDays}
          onSelect={setHotspotDays}
          suffix="d"
        />
        <SegmentGroup
          label="Completion window"
          options={COMPLETION_DAY_OPTIONS}
          selected={completionDays}
          onSelect={setCompletionDays}
          suffix="d"
        />
      </View>

      {loading && <ActivityIndicator style={styles.loader} color="#38bdf8" />}

      {error && (
        <ScreenErrorState message={error} onRetry={fetchReport} />
      )}

      {!loading && !error && report && (
        <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryValue}>{summary.stale}</Text>
              <Text style={styles.summaryLabel}>Stale</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryValue}>{summary.overloaded}</Text>
              <Text style={styles.summaryLabel}>Overloaded</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryValue}>{summary.hotspots}</Text>
              <Text style={styles.summaryLabel}>Hotspots</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryValue}>{summary.cycles}</Text>
              <Text style={styles.summaryLabel}>Cycle Types</Text>
            </View>
          </View>

          <ChartBlock
            title="Risk Snapshot"
            subtitle="Share of visible report risk in this window"
            rows={riskBreakdown}
            emptyMessage="No report risk to chart in this window."
          />

          <ChartBlock
            title="Capacity Pressure"
            subtitle="Highest technician workload in this report"
            rows={technicianLoadRows}
            emptyMessage="No overloaded technician load to chart."
          />

          <ChartBlock
            title="Hotspot Activity"
            subtitle="Top repeated-property activity by total work orders"
            rows={propertyHotspotRows}
            emptyMessage="No repeated property activity to chart."
          />

          <ChartBlock
            title="Completion Cycle Time"
            subtitle="Average created-to-completed hours by service type"
            rows={completionCycleRows}
            emptyMessage="No completed work orders in this window."
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stale Work</Text>
            {report.stale_work_orders.length === 0 ? (
              <EmptyState message="No stale open work in this window." />
            ) : (
              report.stale_work_orders.map(item => (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaBadge, {color: getStatusColor(item.status)}]}>
                      {formatLabel(item.status)}
                    </Text>
                    <Text
                      style={[styles.metaBadge, {color: getPriorityColor(item.priority)}]}>
                      {formatLabel(item.priority)}
                    </Text>
                  </View>
                  <Text style={styles.cardMeta}>Created {formatDate(item.created_at)}</Text>
                  {item.sla_due_at ? (
                    <Text style={styles.cardMeta}>SLA due {formatDate(item.sla_due_at)}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technician Load</Text>
            {report.overloaded_technicians.length === 0 ? (
              <EmptyState message="No technicians over their daily capacity." />
            ) : (
              report.overloaded_technicians.map(item => (
                <View key={item.technician_id} style={styles.card}>
                  <Text style={styles.cardTitle}>{item.full_name}</Text>
                  <Text style={styles.cardMeta}>{item.email}</Text>
                  <View style={styles.loadRow}>
                    <Text style={styles.loadValue}>{item.active_work_order_count}</Text>
                    <Text style={styles.loadLabel}>active / max {item.max_daily_jobs}</Text>
                  </View>
                  <Text style={styles.cardMeta}>
                    Availability: {formatLabel(item.availability_status)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Hotspots</Text>
            {report.property_hotspots.length === 0 ? (
              <EmptyState message="No repeated property activity in this window." />
            ) : (
              report.property_hotspots.map(item => (
                <View key={item.property_id} style={styles.card}>
                  <Text style={styles.cardTitle}>{item.property_name}</Text>
                  <Text style={styles.cardMeta}>{item.address_line1}</Text>
                  <View style={styles.countGrid}>
                    <Text style={styles.countCell}>Total {item.total_work_orders}</Text>
                    <Text style={styles.countCell}>Open {item.open_count}</Text>
                    <Text style={styles.countCell}>Active {item.in_progress_count}</Text>
                    <Text style={styles.countCell}>Done {item.completed_count}</Text>
                  </View>
                  <Text style={styles.cardMeta}>
                    Latest {formatDate(item.latest_work_order_at)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completion Cycle Time</Text>
            {completionCycles.length === 0 ? (
              <EmptyState message="No completed work orders in this window." />
            ) : (
              completionCycles.map(item => (
                <View key={item.service_type} style={styles.card}>
                  <Text style={styles.cardTitle}>{formatLabel(item.service_type)}</Text>
                  <View style={styles.countGrid}>
                    <Text style={styles.countCell}>Done {item.completed_count}</Text>
                    <Text style={styles.countCell}>Avg {item.average_cycle_hours}h</Text>
                    <Text style={styles.countCell}>Fast {item.fastest_cycle_hours}h</Text>
                    <Text style={styles.countCell}>Slow {item.slowest_cycle_hours}h</Text>
                  </View>
                  <Text style={styles.cardMeta}>
                    Latest {formatDate(item.latest_completed_at)}
                  </Text>
                </View>
              ))
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
    fontSize: 26,
    fontWeight: '800',
    color: '#f9fafb',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#94a3b8',
  },
  controls: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  segmentBlock: {
    marginBottom: 12,
  },
  segmentLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentButton: {
    minWidth: 64,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  segmentButtonActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  segmentButtonText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  segmentButtonTextActive: {
    color: '#050816',
  },
  loader: {
    marginTop: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  summaryTile: {
    flex: 1,
    minWidth: 132,
    minHeight: 72,
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
  },
  summaryValue: {
    color: '#38bdf8',
    fontSize: 24,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  chartBlock: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  chartHeader: {
    marginBottom: 10,
  },
  chartTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '800',
  },
  chartSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 3,
  },
  barRow: {
    marginBottom: 12,
  },
  barTextRow: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  barLabel: {
    flex: 1,
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '700',
  },
  barValue: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '800',
  },
  barDetail: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  barTrack: {
    height: 10,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderRadius: 5,
    marginTop: 6,
  },
  barFill: {
    height: 10,
    borderRadius: 5,
  },
  section: {
    marginBottom: 18,
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
  cardTitle: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '700',
  },
  cardMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  metaBadge: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  loadRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
    marginBottom: 2,
  },
  loadValue: {
    color: '#fb7185',
    fontSize: 24,
    fontWeight: '800',
    marginRight: 8,
  },
  loadLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  countGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  countCell: {
    minWidth: 86,
    color: '#cbd5e1',
    backgroundColor: '#0f172a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '700',
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

export default OperationsReportScreen;
