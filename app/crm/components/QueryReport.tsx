'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Download,
  MoreHorizontal,
  Printer,
  RefreshCw,
} from 'lucide-react';
import {
  ERPNEXT_REPORT_LABELS,
  getErpnextReport,
  LEAD_STATUSES,
  type ErpnextReportType,
} from '@/lib/crm-api';
import { deskInput, deskLabel, deskSelect } from './ErpDeskForm';

function defaultFromDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

function defaultToDate() {
  return new Date().toISOString().slice(0, 10);
}

function flattenRow(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj || {})) {
    const val = obj[key];
    const fullKey = prefix ? `${prefix}_${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenRow(val as Record<string, unknown>, fullKey));
    } else if (!Array.isArray(val)) {
      result[fullKey] = val;
    }
  }
  return result;
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(','),
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function prettyHeader(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const FUNNEL_REPORTS = new Set(['sales-funnel']);
const STAGE_REPORTS = new Set([
  'sales-pipeline-analytics',
  'opportunity-summary-by-sales-stage',
]);

export type ReportFilterConfig = {
  showStatus?: boolean;
  showTerritory?: boolean;
  showFunnelType?: boolean;
};

const FILTERS_BY_REPORT: Partial<Record<ErpnextReportType, ReportFilterConfig>> = {
  'lead-details': { showStatus: true, showTerritory: true },
  'sales-funnel': { showFunnelType: true },
  'sales-pipeline-analytics': {},
  'opportunity-summary-by-sales-stage': {},
  'prospects-engaged-but-not-converted': {},
  'first-response-time-for-opportunity': {},
  'inactive-customers': {},
  'campaign-efficiency': {},
  'lead-owner-efficiency': {},
};

export function QueryReport({ reportType }: { reportType: ErpnextReportType }) {
  const title = ERPNEXT_REPORT_LABELS[reportType];
  const filters = FILTERS_BY_REPORT[reportType] || {};

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [status, setStatus] = useState('');
  const [territory, setTerritory] = useState('');
  const [funnelType, setFunnelType] = useState('sales_funnel');
  const [menuOpen, setMenuOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [funnel, setFunnel] = useState<{ stage: string; count: number }[]>([]);
  const [stages, setStages] = useState<
    { stage: string; count: number; revenue?: number; weighted?: number }[]
  >([]);

  const runReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRows([]);
    setFunnel([]);
    setStages([]);
    try {
      const params: Record<string, string> = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (status) params.status = status;
      if (territory) params.territory = territory;
      if (filters.showFunnelType) params.funnelType = funnelType;

      const result = await getErpnextReport(reportType, params);

      if (Array.isArray(result.rows)) {
        setRows(result.rows as Record<string, unknown>[]);
      } else if (Array.isArray(result.funnel)) {
        setFunnel(result.funnel as { stage: string; count: number }[]);
      } else if (Array.isArray(result.stages)) {
        setStages(
          result.stages as {
            stage: string;
            count: number;
            revenue?: number;
            weighted?: number;
          }[],
        );
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [reportType, fromDate, toDate, status, territory, funnelType, filters.showFunnelType]);

  useEffect(() => {
    void runReport();
  }, [runReport]);

  const flatRows = useMemo(
    () => rows.map((row) => flattenRow(row)),
    [rows],
  );
  const columns = flatRows.length ? Object.keys(flatRows[0]) : [];

  const exportRows = useMemo(() => {
    if (funnel.length) {
      return funnel.map((f) => ({ stage: f.stage, count: f.count }));
    }
    if (stages.length) {
      return stages.map((s) => ({
        stage: s.stage,
        count: s.count,
        revenue: s.revenue ?? 0,
        weighted: s.weighted ?? 0,
      }));
    }
    return flatRows;
  }, [funnel, stages, flatRows]);

  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div className="w-full space-y-4">
      {/* Report header */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-5">
        <h1 className="truncate text-[22px] font-semibold tracking-tight text-gray-900">
          {title}
        </h1>
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => void runReport()}
            disabled={loading}
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 sm:inline-flex"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() =>
              downloadCSV(exportRows as Record<string, unknown>[], reportType)
            }
            disabled={!exportRows.length}
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 sm:inline-flex"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 sm:inline-flex"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Report menu"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  void runReport();
                }}
              >
                Refresh
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-40"
                disabled={!exportRows.length}
                onClick={() => {
                  setMenuOpen(false);
                  downloadCSV(exportRows as Record<string, unknown>[], reportType);
                }}
              >
                Export
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  window.print();
                }}
              >
                Print
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5">
          <div className="grid max-w-3xl grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={deskLabel}>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                onBlur={() => void runReport()}
                className={deskInput}
              />
            </div>
            <div>
              <label className={deskLabel}>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                onBlur={() => void runReport()}
                className={deskInput}
              />
            </div>
            {filters.showStatus ? (
              <div>
                <label className={deskLabel}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={deskSelect}
                >
                  <option value="">Status</option>
                  {LEAD_STATUSES.filter(Boolean).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {filters.showTerritory ? (
              <div>
                <label className={deskLabel}>Territory</label>
                <input
                  type="text"
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  placeholder="Territory"
                  className={deskInput}
                />
              </div>
            ) : null}
            {filters.showFunnelType ? (
              <div>
                <label className={deskLabel}>Type</label>
                <select
                  value={funnelType}
                  onChange={(e) => setFunnelType(e.target.value)}
                  className={deskSelect}
                >
                  <option value="sales_funnel">Sales Funnel</option>
                  <option value="sales_pipeline">Sales Pipeline</option>
                  <option value="opp_by_lead_source">Opportunities by lead source</option>
                </select>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading...</div>
        ) : null}

        {!loading && !error && FUNNEL_REPORTS.has(reportType) ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            {funnel.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">Nothing to show</p>
            ) : (
              <div className="flex flex-col items-center gap-1 py-4">
                {funnel.map((step, i) => {
                  const widthPct = Math.max(18, (step.count / maxFunnel) * 100);
                  const opacity = 1 - i * 0.12;
                  return (
                    <div
                      key={step.stage}
                      className="relative flex items-center justify-center text-white font-semibold text-sm transition-all"
                      style={{
                        width: `${widthPct}%`,
                        minWidth: 140,
                        height: 48,
                        background: `rgba(232, 73, 15, ${Math.max(0.45, opacity)})`,
                        clipPath:
                          i === funnel.length - 1
                            ? 'polygon(8% 0, 92% 0, 50% 100%)'
                            : 'polygon(0 0, 100% 0, 94% 100%, 6% 100%)',
                      }}
                      title={`${step.stage}: ${step.count}`}
                    >
                      <span className="drop-shadow-sm">
                        {step.stage} · {step.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {!loading && !error && STAGE_REPORTS.has(reportType) ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {stages.length === 0 ? (
              <p className="text-center text-gray-400 py-16 text-sm">Nothing to show</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[#f4f5f6] border-b border-gray-200 text-left text-xs font-semibold text-gray-600">
                      <th className="px-4 py-3">Sales Stage</th>
                      <th className="px-4 py-3">Count</th>
                      <th className="px-4 py-3">Opportunity Amount</th>
                      <th className="px-4 py-3">Weighted Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map((s) => (
                      <tr key={s.stage} className="border-b border-gray-100 hover:bg-blue-50/30">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{s.stage}</td>
                        <td className="px-4 py-2.5 text-gray-700">{s.count}</td>
                        <td className="px-4 py-2.5 text-gray-700">
                          {Number(s.revenue || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700">
                          {Number(s.weighted || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {!loading &&
        !error &&
        !FUNNEL_REPORTS.has(reportType) &&
        !STAGE_REPORTS.has(reportType) ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {flatRows.length === 0 ? (
              <p className="text-center text-gray-400 py-16 text-sm">Nothing to show</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[#f4f5f6] border-b border-gray-200 text-left text-xs font-semibold text-gray-600">
                      {columns.map((col) => (
                        <th key={col} className="px-4 py-3 whitespace-nowrap">
                          {prettyHeader(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {flatRows.slice(0, 500).map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/30">
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="px-4 py-2.5 text-gray-700 whitespace-nowrap max-w-[220px] truncate"
                          >
                            {row[col] === null || row[col] === undefined
                              ? '—'
                              : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {flatRows.length > 500 ? (
                  <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                    Showing first 500 of {flatRows.length} rows — export for full data.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
