const clampPercent = value => Math.max(0, Math.min(100, Math.round(value)));

const safeNumber = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const buildRiskBreakdown = report => {
  const stale = report?.stale_work_orders?.length || 0;
  const overloaded = report?.overloaded_technicians?.length || 0;
  const hotspots = report?.property_hotspots?.length || 0;
  const total = stale + overloaded + hotspots;

  return [
    {key: 'stale', label: 'Stale work', value: stale, color: '#fbbf24'},
    {key: 'overloaded', label: 'Overloaded techs', value: overloaded, color: '#fb7185'},
    {key: 'hotspots', label: 'Property hotspots', value: hotspots, color: '#38bdf8'},
  ].map(item => ({
    ...item,
    percent: total > 0 ? clampPercent((item.value / total) * 100) : 0,
  }));
};

export const buildTechnicianLoadRows = technicians =>
  [...(technicians || [])]
    .map(item => {
      const active = safeNumber(item.active_work_order_count);
      const maxDaily = Math.max(safeNumber(item.max_daily_jobs), 1);
      const loadPercent = Math.round((active / maxDaily) * 100);
      return {
        id: item.technician_id,
        label: item.full_name || item.email || `Technician ${item.technician_id}`,
        detail: `${active} active / max ${maxDaily}`,
        value: active,
        loadPercent,
        percent: clampPercent(loadPercent),
        color: loadPercent >= 125 ? '#fb7185' : '#f97316',
      };
    })
    .sort((a, b) => b.loadPercent - a.loadPercent)
    .slice(0, 5);

export const buildPropertyHotspotRows = hotspots => {
  const rows = [...(hotspots || [])];
  const maxTotal = Math.max(...rows.map(item => safeNumber(item.total_work_orders)), 0);

  return rows
    .map(item => {
      const total = safeNumber(item.total_work_orders);
      return {
        id: item.property_id,
        label: item.property_name || `Property ${item.property_id}`,
        detail: `${total} total | ${safeNumber(item.open_count)} open | ${safeNumber(
          item.in_progress_count,
        )} active`,
        value: total,
        percent: maxTotal > 0 ? clampPercent((total / maxTotal) * 100) : 0,
        color: '#a3e635',
      };
    })
    .slice(0, 5);
};

export const buildCompletionCycleRows = cycles => {
  const rows = [...(cycles || [])];
  const maxAverage = Math.max(...rows.map(item => safeNumber(item.average_cycle_hours)), 0);

  return rows
    .map(item => {
      const average = safeNumber(item.average_cycle_hours);
      const count = safeNumber(item.completed_count);
      return {
        id: item.service_type || 'general',
        label: item.service_type || 'general',
        detail: `${count} completed | fastest ${safeNumber(
          item.fastest_cycle_hours,
        )}h | slowest ${safeNumber(item.slowest_cycle_hours)}h`,
        value: `${average}h`,
        rawValue: average,
        percent: maxAverage > 0 ? clampPercent((average / maxAverage) * 100) : 0,
        color: average >= 72 ? '#fb7185' : average >= 24 ? '#fbbf24' : '#a3e635',
      };
    })
    .sort((a, b) => b.rawValue - a.rawValue)
    .slice(0, 5);
};

export const buildCostSummaryRows = costs => {
  const rows = [...(costs || [])];
  const maxActual = Math.max(...rows.map(item => safeNumber(item.actual_cost_cents)), 0);

  return rows
    .map(item => {
      const actual = safeNumber(item.actual_cost_cents);
      const estimated = safeNumber(item.estimated_cost_cents);
      const variance = safeNumber(item.variance_cents);
      return {
        id: item.service_type || 'general',
        label: item.service_type || 'general',
        detail: `estimate $${(estimated / 100).toFixed(0)} | variance $${(
          variance / 100
        ).toFixed(0)}`,
        value: `$${(actual / 100).toFixed(0)}`,
        rawValue: actual,
        percent: maxActual > 0 ? clampPercent((actual / maxActual) * 100) : 0,
        color: variance > 0 ? '#fb7185' : variance < 0 ? '#a3e635' : '#38bdf8',
      };
    })
    .sort((a, b) => b.rawValue - a.rawValue)
    .slice(0, 5);
};

export default {
  buildRiskBreakdown,
  buildTechnicianLoadRows,
  buildPropertyHotspotRows,
  buildCompletionCycleRows,
  buildCostSummaryRows,
};
