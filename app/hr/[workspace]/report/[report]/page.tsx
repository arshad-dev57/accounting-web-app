'use client';

// ERPNext report view for the screens each HR workspace links under "Reports".
// Filter controls come from the backend report `filterDefs` (Monthly Attendance
// Sheet, Hours Utilization, …). Reports that need Standard Working Hours surface
// the same Message dialog ERPNext shows when HR Settings is empty.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2, X } from 'lucide-react';
import {
  HRCard,
  HRPage,
  HRTable,
  HRTableCell,
  HRTableRow
} from '../../../ui';
import {
  HrApiError,
  hrWorkspaceService,
  type HrLinkOption,
  type HrReportFilterDef,
  type HrReportResult
} from '../../../../../lib/hr-workspace-service';
import { useHrNav } from '../../../../../lib/hr-nav-context';

const inputCls =
  'w-full bg-white rounded-xl py-2 px-3 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]/50 transition-all';

const MONTH_OPTIONS = [
  { value: '1', label: 'Jan' },
  { value: '2', label: 'Feb' },
  { value: '3', label: 'Mar' },
  { value: '4', label: 'Apr' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'Aug' },
  { value: '9', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' }
];

function monthRange() {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  return { from, to };
}

function formatCell(value: unknown, type?: string) {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'number' || type === 'currency') {
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value);
  }
  if (type === 'date') return String(value).slice(0, 10);
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function toCsv(result: HrReportResult) {
  const header = result.columns.map((column) => column.label);
  const lines = [header, ...result.rows.map((row) => result.columns.map((column) => formatCell(row[column.key], column.type)))];
  return lines.map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

function csvName(result: HrReportResult) {
  return result.filters.date && result.filters.from
    ? `${result.report}-${result.filters.from}-to-${result.filters.to}.csv`
    : `${result.report}.csv`;
}

function filterVisible(def: HrReportFilterDef, values: Record<string, unknown>) {
  if (!def.when) return true;
  return Object.entries(def.when).every(([key, expected]) => String(values[key] ?? '') === String(expected));
}

function optionList(def: HrReportFilterDef): { value: string; label: string }[] {
  if (!def.options || def.options === 'years') return [];
  if (typeof def.options === 'string') return [];
  return def.options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt || '—' } : opt
  );
}

function defaultFilterValues(defs: HrReportFilterDef[]): Record<string, unknown> {
  const now = new Date();
  const range = monthRange();
  const out: Record<string, unknown> = {
    filterBasedOn: 'Month',
    month: String(now.getUTCMonth() + 1),
    year: String(now.getUTCFullYear()),
    from: range.from,
    to: range.to,
    status: 'Active',
    includeCompanyDescendants: true,
    summarizedView: false
  };
  for (const def of defs) {
    if (def.default !== undefined) out[def.key] = def.default;
  }
  return out;
}

export default function HrReportPage() {
  const params = useParams<{ workspace: string; report: string }>();
  const workspaceSlug = params?.workspace || '';
  const reportName = params?.report || '';
  const { workspace } = useHrNav();
  const ws = useMemo(() => workspace(workspaceSlug), [workspace, workspaceSlug]);

  const [filterValues, setFilterValues] = useState<Record<string, unknown>>(() => defaultFilterValues([]));
  const [filterDefs, setFilterDefs] = useState<HrReportFilterDef[]>([]);
  const [linkOptions, setLinkOptions] = useState<Record<string, HrLinkOption[]>>({});
  const [result, setResult] = useState<HrReportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoursDialog, setHoursDialog] = useState<{ message: string; path: string } | null>(null);

  const setFilter = (key: string, value: unknown) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    let cancelled = false;
    const targets = ['employee', 'department', 'branch', 'employment-type', 'company'];
    Promise.all(
      targets.map(async (target) => {
        try {
          const rows = await hrWorkspaceService.linkOptions(target);
          return [target, rows] as const;
        } catch {
          return [target, []] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      const next: Record<string, HrLinkOption[]> = {};
      for (const [target, rows] of entries) next[target] = rows;
      setLinkOptions(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number | undefined> = {};
      for (const [key, value] of Object.entries(filterValues)) {
        if (value === undefined || value === null || value === '') continue;
        if (typeof value === 'boolean') params[key] = value ? '1' : '0';
        else params[key] = String(value);
      }
      const next = await hrWorkspaceService.report(reportName, params);
      setResult(next);
      if (next.filterDefs?.length) setFilterDefs(next.filterDefs);
      setHoursDialog(null);
    } catch (err: unknown) {
      setResult(null);
      if (err instanceof HrApiError && err.data?.code === 'STANDARD_WORKING_HOURS_REQUIRED') {
        if (Array.isArray(err.data.filterDefs)) setFilterDefs(err.data.filterDefs as HrReportFilterDef[]);
        setHoursDialog({
          message: err.message,
          path: String(err.data.hrSettingsPath || '/hr/hr-setup/hr-settings')
        });
        setError('');
      } else {
        setHoursDialog(null);
        setError(err instanceof Error ? err.message : `The ${reportName} report could not be loaded`);
      }
    } finally {
      setLoading(false);
    }
  }, [reportName, filterValues]);

  // Reload when filters change, but wait a tick so rapid checkbox toggles coalesce.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const download = () => {
    if (!result) return;
    const blob = new Blob([toCsv(result)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = csvName(result);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const visibleDefs = (filterDefs.length
    ? filterDefs
    : [
        { key: 'from', label: 'From', type: 'date' as const },
        { key: 'to', label: 'To', type: 'date' as const },
        { key: 'employeeId', label: 'Employee', type: 'link' as const, options: 'employee' },
        { key: 'department', label: 'Department', type: 'data' as const }
      ]
  ).filter((def) => filterVisible(def, filterValues));

  const renderFilter = (def: HrReportFilterDef) => {
    const value = filterValues[def.key];
    if (def.type === 'check') {
      return (
        <label className="flex items-center gap-2 pt-6 text-sm text-[#1A1A2E]">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => setFilter(def.key, e.target.checked)}
            className="h-4 w-4 rounded border-[#c7c7c7]"
          />
          <span>{def.label}</span>
        </label>
      );
    }

    const label = (
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7A8FA6]">
        {def.label}
        {def.required ? ' *' : ''}
      </label>
    );

    if (def.type === 'date') {
      return (
        <div>
          {label}
          <input
            type="date"
            className={inputCls}
            value={String(value || '')}
            onChange={(e) => setFilter(def.key, e.target.value)}
          />
        </div>
      );
    }

    if (def.type === 'select') {
      const options =
        def.key === 'month' && !optionList(def).length
          ? MONTH_OPTIONS
          : optionList(def);
      return (
        <div>
          {label}
          <select
            className={inputCls}
            value={String(value ?? '')}
            onChange={(e) => setFilter(def.key, e.target.value)}
          >
            {options.map((opt) => (
              <option key={`${def.key}-${opt.value}`} value={opt.value}>
                {opt.label || '—'}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (def.type === 'link' || def.type === 'company') {
      const target = def.type === 'company' ? 'company' : String(def.options || '');
      const rows = linkOptions[target] || [];
      return (
        <div>
          {label}
          <select
            className={inputCls}
            value={String(value || '')}
            onChange={(e) => setFilter(def.key, e.target.value)}
          >
            <option value="">Begin typing for results.</option>
            {rows.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div>
        {label}
        <input
          type="text"
          className={inputCls}
          value={String(value || '')}
          onChange={(e) => setFilter(def.key, e.target.value)}
          placeholder="Begin typing for results."
        />
      </div>
    );
  };

  return (
    <HRPage>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/hr/${workspaceSlug}`}
            className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7A8FA6] hover:text-[#014582]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {ws?.label || workspaceSlug}
          </Link>
          <h1 className="text-2xl font-extrabold text-[#1A1A2E]">{result?.doctype || reportName.replace(/-/g, ' ')}</h1>
          <p className="mt-1 text-xs text-[#52677E]">
            {loading && !result
              ? 'Loading…'
              : `${result?.total ?? 0} row${(result?.total ?? 0) === 1 ? '' : 's'}`}
            {result?.filters.date
              ? ` between ${result.filters.from} and ${result.filters.to}`
              : result
                ? ' for every record of this company'
                : ''}
          </p>
        </div>
        {!!result?.rows.length && (
          <button
            type="button"
            onClick={download}
            className="flex items-center gap-2 rounded-xl bg-[#014582] px-3.5 py-2 text-[11px] font-bold text-white transition-all hover:bg-[#013a6b]"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </button>
        )}
      </div>

      <HRCard>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {visibleDefs.map((def) => (
            <React.Fragment key={def.key}>{renderFilter(def)}</React.Fragment>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={load}
            className="rounded-xl bg-[#014582] px-3.5 py-2 text-[11px] font-bold text-white hover:bg-[#01366a]"
          >
            Refresh
          </button>
        </div>
      </HRCard>

      {error && (
        <div className="mt-4 rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/5 px-4 py-3 text-xs font-semibold text-[#E74C3C]">
          {error}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#DDE4EE] bg-white shadow-sm">
        {loading && !result ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#014582]" />
          </div>
        ) : !result || result.rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#7A8FA6]">
            {hoursDialog
              ? 'Set Standard Working Hours in HR Settings to run this report.'
              : result?.filters.date
                ? 'No rows for this report in the selected period.'
                : 'No rows for this report yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <HRTable columns={result.columns.map((column) => column.label)}>
              {result.rows.map((row, index) => (
                <HRTableRow key={index}>
                  {result.columns.map((column) => (
                    <HRTableCell key={column.key}>{formatCell(row[column.key], column.type)}</HRTableCell>
                  ))}
                </HRTableRow>
              ))}
            </HRTable>
          </div>
        )}
      </div>

      {hoursDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e2e2e2] px-4 py-3">
              <h2 className="text-[15px] font-semibold text-[#171717]">Message</h2>
              <button type="button" onClick={() => setHoursDialog(null)} className="rounded p-1 hover:bg-[#f3f3f3]">
                <X className="h-4 w-4 text-[#525252]" />
              </button>
            </div>
            <div className="space-y-3 px-4 py-4 text-sm text-[#171717]">
              <p>
                The metrics for this report are calculated based on{' '}
                <strong>Standard Working Hours</strong>. Please set Standard Working Hours in{' '}
                <Link href={hoursDialog.path} className="font-semibold text-[#014582] underline">
                  HR Settings
                </Link>
                .
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e2e2e2] px-4 py-3">
              <button
                type="button"
                onClick={() => setHoursDialog(null)}
                className="rounded-lg border border-[#c7c7c7] px-3 py-1.5 text-[12px] font-medium"
              >
                Close
              </button>
              <Link
                href={hoursDialog.path}
                className="rounded-lg bg-[#014582] px-3 py-1.5 text-[12px] font-semibold text-white"
              >
                Open HR Settings
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </HRPage>
  );
}
