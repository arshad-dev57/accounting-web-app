'use client';

// The workspace Home screen — the ERPNext equivalent is the workspace page built
// from Number Cards, one chart and the quick lists. Every figure here is a
// company-scoped query the backend ran for this request.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, CircleAlert, ListChecks, RefreshCcw } from 'lucide-react';
import { HRCard, HRPage, HRStatCard, HRStatusBadge } from '@/hr/ui';
import { CHART_COLORS, HrChartCard } from '@/hr/components/hr-chart-card';
import { useMfgNav } from '@/lib/mfg-nav-context';
import {
  mfgWorkspaceService,
  type MfgDashboardPayload,
  type MfgRow
} from '@/lib/mfg-workspace-service';

const COLORS = CHART_COLORS;

function ChartCard({ chart }: { chart: MfgDashboardPayload['chart'] }) {
  if (!chart) return null;
  return <HrChartCard chart={chart} />;
}

export default function MfgWorkspaceHomePage() {
  const params = useParams<{ workspace: string }>();
  const slug = params?.workspace || '';
  const { workspace: workspaceOf, nav, loading: navLoading } = useMfgNav();
  const ws = useMemo(() => workspaceOf(slug), [workspaceOf, slug]);

  const [data, setData] = useState<MfgDashboardPayload | null>(null);
  const [quickList, setQuickList] = useState<{ label: string; resource: string; rows: MfgRow[] } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!ws) return;
    setLoading(true);
    setError('');
    try {
      const payload = await mfgWorkspaceService.dashboard(ws.slug);
      setData(payload);
      const primary = payload.shortcuts[0];
      if (primary) {
        const list = await mfgWorkspaceService.list(primary.resource, { limit: 5 });
        setQuickList({ label: primary.label, resource: primary.resource, rows: list.rows });
      } else {
        setQuickList(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this workspace');
    } finally {
      setLoading(false);
    }
  }, [ws]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!ws) {
    if (navLoading) {
      return (
        <HRPage>
          <HRCard>{<p className="text-sm text-[#7A8FA6]">Loading workspace…</p>}</HRCard>
        </HRPage>
      );
    }
    return (
      <HRPage>
        <HRCard title="Unknown workspace">
          <div className="space-y-3">
            <p className="flex items-start gap-2 text-sm text-[#1A1A2E]">
              <CircleAlert className="w-4 h-4 text-[#F39C12] mt-0.5" />
              <span>
                <b>{slug}</b> is not an Manufacturing workspace. ERPNext Manufacturing has {nav?.workspaces.length || 9} of them:
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {(nav?.workspaces || []).map((item) => (
                <Link
                  key={item.slug}
                  href={`/manufacturing/${item.slug}`}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#014582]/10 text-[#014582] hover:bg-[#014582] hover:text-white transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </HRCard>
      </HRPage>
    );
  }


  return (
    <HRPage>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A8FA6]">Workspace</p>
          <h1 className="text-2xl font-extrabold text-[#1A1A2E]">{ws.label}</h1>
          {data?.workspace.dashboard && (
            <p className="text-xs text-[#52677E] mt-1">Dashboard: {data.workspace.dashboard}</p>
          )}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {(data?.numberCards || []).map((card) => (
          <HRStatCard
            key={card.label}
            label={card.label}
            value={loading && !data ? '…' : card.value.toLocaleString()}
            icon={ListChecks}
            color={COLORS[0]}
          />
        ))}
        {!data && !error && Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-[#DDE4EE] animate-pulse h-[104px]" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="lg:col-span-2">
          <ChartCard chart={data?.chart || null} />
        </div>
        <HRCard title={quickList ? `Recent ${quickList.label}` : 'Quick list'}>
          {!quickList || quickList.rows.length === 0 ? (
            <p className="text-xs text-[#7A8FA6]">Nothing recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {quickList.rows.map((row) => {
                const titleField = String(row.name || row.title || row.employeeName || row.id);
                return (
                  <Link
                    key={row.id}
                    href={`/manufacturing/${ws.slug}/${quickList.resource}/${row.id}`}
                    className="flex items-center justify-between gap-2 text-xs hover:text-[#014582]"
                  >
                    <span className="truncate font-semibold text-[#1A1A2E]">{titleField}</span>
                    {row.status ? <HRStatusBadge status={String(row.status)} /> : null}
                  </Link>
                );
              })}
            </div>
          )}
        </HRCard>
      </div>

      <HRCard title="Shortcuts">
        {(!data || data.shortcuts.length === 0) && (
          <p className="text-xs text-[#7A8FA6]">{loading ? 'Loading…' : 'No documents are reachable from this workspace for your role.'}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {(data?.shortcuts || []).map((shortcut) => (
            <Link
              key={shortcut.resource}
              href={shortcut.href}
              className="flex items-center justify-between gap-2 rounded-xl border border-[#DDE4EE] bg-[#F7FAFC] px-3 py-2.5 hover:border-[#014582]/40 hover:bg-white transition-all"
            >
              <span className="text-xs font-bold text-[#1A1A2E] truncate">{shortcut.label}</span>
              <span className="text-[11px] font-extrabold text-[#014582] bg-[#014582]/10 rounded-full px-2 py-0.5">
                {shortcut.count.toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
      </HRCard>
    </HRPage>
  );
}
