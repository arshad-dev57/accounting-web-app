'use client';

// The workspace Dashboard tab. ERPNext renders the dashboard doctype as a grid
// of charts; the same charts (same doctype and grouping, from the dashboard_chart
// documents shipped with Frappe HR) are computed here against this company's rows.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { CircleAlert, ListChecks, RefreshCcw } from 'lucide-react';
import { HRCard, HRPage, HRStatCard } from '../../ui';
import { CHART_COLORS, HrChartCard } from '../../components/hr-chart-card';
import { useHrNav } from '@/lib/hr-nav-context';
import { hrWorkspaceService, type HrDashboardChart } from '@/lib/hr-workspace-service';

export default function HrWorkspaceDashboardPage() {
  const params = useParams<{ workspace: string }>();
  const slug = params?.workspace || '';
  const { workspace: workspaceOf } = useHrNav();
  const ws = useMemo(() => workspaceOf(slug), [workspaceOf, slug]);

  const [charts, setCharts] = useState<HrDashboardChart[]>([]);
  const [cards, setCards] = useState<{ label: string; value: number }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!ws) return;
    setLoading(true);
    setError('');
    try {
      const [chartList, dashboard] = await Promise.all([
        hrWorkspaceService.charts(ws.slug),
        hrWorkspaceService.dashboard(ws.slug)
      ]);
      setCharts(chartList);
      setCards(dashboard.numberCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this dashboard');
    } finally {
      setLoading(false);
    }
  }, [ws]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!ws) {
    return (
      <HRPage>
        <HRCard title="Unknown workspace">
          <p className="flex items-start gap-2 text-sm text-[#1A1A2E]">
            <CircleAlert className="w-4 h-4 text-[#F39C12] mt-0.5" />
            <span>{slug} is not an HR workspace.</span>
          </p>
        </HRCard>
      </HRPage>
    );
  }

  return (
    <HRPage>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A8FA6]">Dashboard</p>
          <h1 className="text-2xl font-extrabold text-[#1A1A2E]">{ws.label}</h1>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#52677E] hover:text-[#014582]"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/5 px-4 py-3 text-xs font-semibold text-[#E74C3C]">
          {error}
        </div>
      )}

      {cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {cards.map((card) => (
            <HRStatCard key={card.label} label={card.label} value={card.value.toLocaleString()} icon={ListChecks} color={CHART_COLORS[0]} />
          ))}
        </div>
      )}

      {loading && charts.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-72 rounded-2xl border border-[#DDE4EE] bg-white animate-pulse" />
          ))}
        </div>
      ) : charts.length === 0 ? (
        <HRCard>
          <p className="text-sm text-[#7A8FA6]">
            This dashboard has no charts whose source document exists in this product yet.
          </p>
        </HRCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {charts.map((chart) => (
            <HrChartCard key={chart.label} chart={chart} />
          ))}
        </div>
      )}
    </HRPage>
  );
}
