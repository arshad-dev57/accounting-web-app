'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Factory,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Package,
  Recycle,
  RotateCcw,
  XCircle,
  Wrench,
  TrendingUp,
  Gauge,
  Percent,
  Target,
  RefreshCw,
  PlayCircle,
} from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import {
  manufacturingDashboardService,
  emptyDashboard,
  type MfgDashboardData,
} from '@/lib/manufacturing-service';
import {
  MfgPage,
  MfgPageHeader,
  MfgStatCard,
  MfgCard,
  MfgTable,
  MfgTableRow,
  MfgTableCell,
  MfgStatusBadge,
  MfgProgress,
  MfgLoading,
  MfgError,
  MFG_COLORS,
} from '../ui';
import { DashboardCharts } from '../_components/DashboardCharts';

export default function ManufacturingDashboardPage() {
  const { locationIdForApi } = useLocation();
  const [data, setData] = useState<MfgDashboardData>(emptyDashboard());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = (withLoader = true) => {
    if (withLoader) setLoading(true);
    setError('');
    manufacturingDashboardService
      .get({ locationId: locationIdForApi || undefined })
      .then(setData)
      .catch((e: any) => setError(e.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [locationIdForApi]);

  if (loading) return <MfgPage><MfgLoading label="Loading manufacturing dashboard…" /></MfgPage>;
  if (error) return <MfgPage><MfgError message={error} /></MfgPage>;

  const k = data.kpis || {};
  const n = (v: any) => Number(v || 0);
  const pct = (v: any) => `${Math.round(Number(v || 0))}%`;

  const statCards = [
    { label: 'Production Today', value: n(k.productionToday), icon: CalendarDays, color: MFG_COLORS.accent },
    { label: 'Production This Month', value: n(k.productionMonth), icon: CalendarDays, color: MFG_COLORS.primary },
    { label: 'Planned Production', value: n(k.plannedProduction), icon: Target, color: MFG_COLORS.purple },
    { label: 'Actual Production', value: n(k.actualProduction), icon: CheckCircle2, color: MFG_COLORS.success },
    { label: 'Pending Orders', value: n(k.pendingOrders), icon: ClipboardList, color: MFG_COLORS.warning },
    { label: 'In Progress', value: n(k.inProgress), icon: PlayCircle, color: MFG_COLORS.accent },
    { label: 'Completed', value: n(k.completed), icon: CheckCircle2, color: MFG_COLORS.success },
    { label: 'Delayed', value: n(k.delayed), icon: Clock, color: MFG_COLORS.warning },
    { label: 'Cancelled', value: n(k.cancelled), icon: XCircle, color: MFG_COLORS.danger },
    { label: 'Material Shortage', value: n(k.materialShortage), icon: AlertTriangle, color: MFG_COLORS.danger },
    { label: 'WIP Quantity', value: n(k.wipQty), icon: Layers, color: MFG_COLORS.purple },
    { label: 'Finished Goods', value: n(k.finishedGoods), icon: Package, color: MFG_COLORS.success },
    { label: 'Scrap', value: n(k.scrap), icon: Recycle, color: MFG_COLORS.danger },
    { label: 'Rework', value: n(k.rework), icon: RotateCcw, color: MFG_COLORS.warning },
    { label: 'Quality Rejections', value: n(k.qualityRejections), icon: XCircle, color: MFG_COLORS.danger },
    { label: 'Downtime (hrs)', value: n(k.machineDowntime), icon: Wrench, color: MFG_COLORS.warning },
    { label: 'Prod. Efficiency', value: pct(k.productionEfficiency), icon: TrendingUp, color: MFG_COLORS.success },
    { label: 'Capacity Utilization', value: pct(k.capacityUtilization), icon: Gauge, color: MFG_COLORS.accent },
    { label: 'Yield', value: pct(k.yield), icon: Percent, color: MFG_COLORS.purple },
    { label: 'OEE', value: pct(k.oee), icon: Target, color: MFG_COLORS.success },
  ];

  return (
    <MfgPage>
      <MfgPageHeader
        title="Manufacturing Dashboard"
        subtitle="Real-time view of production, materials, quality, machines and orders"
        icon={<Factory className="w-5 h-5 text-white" />}
        actions={
          <button
            onClick={() => refresh(false)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 text-white text-sm font-semibold hover:bg-white/25 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <MfgStatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      <DashboardCharts prod={data.production} mat={data.materials} qual={data.quality} mach={data.machines} />

      <MfgCard
        title="Recent Production Orders"
        action={<Link href="/manufacturing/production/orders" className="text-xs font-semibold text-[#014582] hover:underline">View All →</Link>}
      >
        {data.productionOrders.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#7A8FA6]">No production orders yet.</p>
        ) : (
          <MfgTable columns={['Order', 'Product', 'Planned', 'Produced', 'Remaining', 'Start', 'Due', 'Status', 'Progress']}>
            {data.productionOrders.map((o: any, i: number) => {
              const planned = n(o.plannedQuantity);
              const produced = n(o.producedQuantity ?? o.goodQuantity);
              const progress = planned ? (produced / planned) * 100 : 0;
              return (
                <MfgTableRow key={o.id || i} onClick={() => { window.location.href = `/manufacturing/production/orders/${o.id}`; }}>
                  <MfgTableCell className="font-bold text-[#014582]">{o.orderNumber || o.number || '—'}</MfgTableCell>
                  <MfgTableCell>{o.productName || o.product?.name || '—'}</MfgTableCell>
                  <MfgTableCell>{planned}</MfgTableCell>
                  <MfgTableCell>{produced}</MfgTableCell>
                  <MfgTableCell>{n(o.remainingQuantity) || Math.max(0, planned - produced)}</MfgTableCell>
                  <MfgTableCell>{o.startDate ? new Date(o.startDate).toLocaleDateString('en-GB') : '—'}</MfgTableCell>
                  <MfgTableCell>{o.dueDate ? new Date(o.dueDate).toLocaleDateString('en-GB') : '—'}</MfgTableCell>
                  <MfgTableCell><MfgStatusBadge status={o.status} /></MfgTableCell>
                  <MfgTableCell><MfgProgress value={progress} /></MfgTableCell>
                </MfgTableRow>
              );
            })}
          </MfgTable>
        )}
      </MfgCard>
    </MfgPage>
  );
}
