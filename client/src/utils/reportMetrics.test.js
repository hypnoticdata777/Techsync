import {
  buildCompletionCycleRows,
  buildPropertyHotspotRows,
  buildRiskBreakdown,
  buildTechnicianLoadRows,
} from './reportMetrics';

describe('report metric helpers', () => {
  test('builds risk breakdown percentages from report buckets', () => {
    const result = buildRiskBreakdown({
      stale_work_orders: [{id: 1}, {id: 2}],
      overloaded_technicians: [{technician_id: 1}],
      property_hotspots: [{property_id: 1}],
    });

    expect(result).toEqual([
      expect.objectContaining({key: 'stale', value: 2, percent: 50}),
      expect.objectContaining({key: 'overloaded', value: 1, percent: 25}),
      expect.objectContaining({key: 'hotspots', value: 1, percent: 25}),
    ]);
  });

  test('returns zeroed risk breakdown for empty reports', () => {
    expect(buildRiskBreakdown(null)).toEqual([
      expect.objectContaining({key: 'stale', value: 0, percent: 0}),
      expect.objectContaining({key: 'overloaded', value: 0, percent: 0}),
      expect.objectContaining({key: 'hotspots', value: 0, percent: 0}),
    ]);
  });

  test('sorts technician load rows by utilization and caps visual width', () => {
    const rows = buildTechnicianLoadRows([
      {technician_id: 1, full_name: 'Standard Tech', active_work_order_count: 3, max_daily_jobs: 6},
      {technician_id: 2, full_name: 'Busy Tech', active_work_order_count: 7, max_daily_jobs: 4},
    ]);

    expect(rows[0]).toEqual(
      expect.objectContaining({
        id: 2,
        label: 'Busy Tech',
        loadPercent: 175,
        percent: 100,
      }),
    );
  });

  test('scales property hotspot rows against the busiest property', () => {
    const rows = buildPropertyHotspotRows([
      {property_id: 1, property_name: 'North Tower', total_work_orders: 2, open_count: 1, in_progress_count: 0},
      {property_id: 2, property_name: 'West Tower', total_work_orders: 4, open_count: 2, in_progress_count: 1},
    ]);

    expect(rows).toEqual([
      expect.objectContaining({id: 1, percent: 50}),
      expect.objectContaining({id: 2, percent: 100}),
    ]);
  });

  test('sorts completion cycle rows by slowest average cycle time', () => {
    const rows = buildCompletionCycleRows([
      {
        service_type: 'plumbing',
        completed_count: 3,
        average_cycle_hours: 18.5,
        fastest_cycle_hours: 4,
        slowest_cycle_hours: 36,
      },
      {
        service_type: 'hvac',
        completed_count: 2,
        average_cycle_hours: 80,
        fastest_cycle_hours: 48,
        slowest_cycle_hours: 120,
      },
    ]);

    expect(rows[0]).toEqual(
      expect.objectContaining({
        id: 'hvac',
        value: '80h',
        percent: 100,
        color: '#fb7185',
      }),
    );
    expect(rows[1]).toEqual(expect.objectContaining({id: 'plumbing', percent: 23}));
  });
});
