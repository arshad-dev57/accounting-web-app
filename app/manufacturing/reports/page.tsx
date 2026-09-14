'use client';

import React, { useEffect, useState } from 'react';
import { FileBarChart } from 'lucide-react';
import { manufacturingReportService } from '@/lib/manufacturing-service';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgStatCard,
  MfgLoading,
  MfgError,
  MfgEmpty,
  MFG_COLORS,
} from '../ui';

const TABS = [
  { key: 'production', label: 'Production' },
  { key: 'material', label: 'Material' },
  { key: 'quality', label: 'Quality' },
  { key: 'machine', label: 'Machine' },
  { key: 'efficiency', label: 'Efficiency' },
  { key: 'cost', label: 'Cost' },
] as const;

export default function ManufacturingReportsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('production');
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    const fetcher: Record<string, () => Promise<any>> = {
      production: () => manufacturingReportService.production({}),
      material: () => manufacturingReportService.material({}),
      quality: () => manufacturingReportService.quality({}),
      machine: () => manufacturingReportService.machine({}),
      efficiency: () => manufacturingReportService.efficiency({}),
      cost: () => manufacturingReportService.cost({}),
    };
    fetcher[tab]()
      .then((res) => { if (mounted) setData({ tab, ...res }); })
      .catch((e: any) => { if (mounted) setError(e.message || 'Failed to load report'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const entries: Array<[string, any, string]> = [];
  const push = (label: string, val: any, color: string) => entries.push([label, val, color]);
  if (tab === 'production') {
    push('Total Orders', data?.totalOrders, MFG_COLORS.primary);
    push('Good Qty', data?.goodQuantity, MFG_COLORS.success);
    push('Scrap', data?.scrapQty, MFG_COLORS.danger);
    push('Completion %', data?.completionRate != null ? `${data.completionRate}%` : '—', MFG_COLORS.accent);
  } else if (tab === 'material') {
    push('Consumed Qty', data?.consumedQty, MFG_COLORS.primary);
    push('Variance', data?.variance, MFG_COLORS.warning);
    push('Shortage', data?.shortage, MFG_COLORS.danger);
    push('WIP', data?.wipQty, MFG_COLORS.purple);
  } else if (tab === 'quality') {
    push('Inspections', data?.total, MFG_COLORS.primary);
    push('Passed', data?.passed, MFG_COLORS.success);
    push('Failed', data?.failed, MFG_COLORS.danger);
    push('Rejection Rate', data?.rejectionRate != null ? `${data.rejectionRate}%` : '—', MFG_COLORS.warning);
  } else if (tab === 'machine') {
    push('Machines', data?.total, MFG_COLORS.primary);
    push('Running', data?.running, MFG_COLORS.success);
    push('Downtime (hrs)', data?.downtime, MFG_COLORS.warning);
    push('Maintenance Cost', data?.maintenanceCost, MFG_COLORS.accent);
  } else if (tab === 'efficiency') {
    push('Efficiency', data?.efficiency != null ? `${data.efficiency}%` : '—', MFG_COLORS.success);
    push('Yield', data?.yield != null ? `${data.yield}%` : '—', MFG_COLORS.accent);
    push('Capacity Utilization', data?.capacityUtilization != null ? `${data.capacityUtilization}%` : '—', MFG_COLORS.purple);
    push('OEE', data?.oee != null ? `${data.oee}%` : '—', MFG_COLORS.success);
  } else {
    push('Standard Cost', data?.standardCost, MFG_COLORS.primary);
    push('Actual Cost', data?.actualCost, MFG_COLORS.accent);
    push('Variance', data?.variance, MFG_COLORS.warning);
    push('Labor Cost', data?.laborCost, MFG_COLORS.purple);
  }

  return (
    <MfgPage>
      <MfgPageHeader
        title="Manufacturing Reports"
        subtitle="Production, material, quality, machine, efficiency and cost reports"
        icon={<FileBarChart className="w-5 h-5 text-white" />}
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-[#014582] text-white' : 'bg-white text-[#7A8FA6] border border-[#DDE4EE] hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <MfgLoading /> : error ? <MfgError message={error} /> : (
        <MfgCard title={`${TABS.find((t) => t.key === tab)?.label} Report`}>
          {entries.length === 0 ? (
            <MfgEmpty title="No report data" message={`The ${tab} report will populate once production data exists.`} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {entries.map(([label, value, color]) => (
                <MfgStatCard key={String(label)} label={String(label)} value={value} icon={FileBarChart} color={color} />
              ))}
            </div>
          )}
        </MfgCard>
      )}
    </MfgPage>
  );
}
