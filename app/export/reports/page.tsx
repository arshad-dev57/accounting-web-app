'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart4,
  FileSpreadsheet,
  FileText,
  DollarSign,
  TrendingUp,
  Globe,
  Send,
  RefreshCw,
  AlertTriangle,
  Search,
  Wallet,
  Receipt,
  PackageCheck,
  Printer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
  TradeTable,
  TradeTableHeader,
  TradeTableBody,
  TradeTableRow,
  TradeTableCell,
  TradeStatCard,
  TRADE_COLORS,
} from '../../../components/trade/TradeUI';
import {
  CustomerPickerModal,
  CurrencySelect,
} from '../../../components/export/ExportSelectors';
import type { Customer } from '@/api/customer/route';
import exportApi, {
  errorMessage,
  formatDate,
  formatMoney,
  type ExportReports,
} from '../../../lib/export-api';
import { useFiscalYear } from '../../../lib/fiscal-year-context';

const EMPTY_REPORT: ExportReports = {
  reportingCurrency: 'USD',
  range: { start: '', end: '' },
  filters: {},
  summary: {
    inquiryCount: 0,
    quotationCount: 0,
    orderCount: 0,
    contractedValue: 0,
    invoicedValue: 0,
    paidValue: 0,
    outstandingValue: 0,
    advanceValue: 0,
    settlementValue: 0,
    expenseValue: 0,
    grossMarginValue: 0,
  },
  conversionWarnings: [],
  byCountry: [],
  statusBreakdown: {},
  aging: [],
};

function toCsv(rows: Array<Record<string, unknown>>, headers: string[]): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ExportReportsPage() {
  const { selectedFiscalYearId, selectedFiscalYear } = useFiscalYear();
  const [data, setData] = useState<ExportReports>(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: Record<string, unknown> = {};
      if (useCustomRange && startDate && endDate) {
        query.startDate = startDate;
        query.endDate = endDate;
      } else if (selectedFiscalYearId) {
        query.fiscalYearId = selectedFiscalYearId;
      }
      if (currency) query.currency = currency;
      if (customer?.id) query.customerId = customer.id;
      const res = await exportApi.getReports(query);
      setData(res && res.summary ? res : EMPTY_REPORT);
    } catch (e) {
      setError(errorMessage(e, 'Failed to load export reports'));
      setData(EMPTY_REPORT);
    } finally {
      setLoading(false);
    }
  }, [selectedFiscalYearId, useCustomRange, startDate, endDate, currency, customer?.id]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const base = data.reportingCurrency || 'USD';
  const money = (value: number) => formatMoney(value, base);
  const s = data.summary;

  const countryChart = useMemo(
    () =>
      (data.byCountry || []).map((c) => ({
        country: c.country,
        contracted: Number(c.contracted || 0),
        invoiced: Number(c.invoiced || 0),
      })),
    [data.byCountry]
  );

  const statusRows = useMemo(
    () =>
      Object.entries(data.statusBreakdown || {})
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
    [data.statusBreakdown]
  );

  const periodLabel = useCustomRange
    ? `${startDate || '…'} → ${endDate || '…'}`
    : selectedFiscalYear?.name ||
      (data.range?.start && data.range?.end
        ? `${formatDate(data.range.start)} → ${formatDate(data.range.end)}`
        : 'Current fiscal year');

  const handleExportCsv = () => {
    const rows = (data.byCountry || []).map((c) => ({
      Country: c.country,
      Orders: c.orders,
      Contracted: c.contracted,
      Invoiced: c.invoiced,
      Currency: base,
    }));
    downloadText(
      `Export_Territorial_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(rows, ['Country', 'Orders', 'Contracted', 'Invoiced', 'Currency'])
    );
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Export Intelligence & Performance Reports"
        subtitle="Global market penetration, destination country performance, settlement ratios and export margin"
        moduleName="Export Reports"
        backHref="/export/dashboard"
        icon={<BarChart4 className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!data.byCountry.length}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-all"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-4 p-3 rounded-xl bg-white border border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1 text-[11px] text-slate-600">
            <input
              type="checkbox"
              checked={useCustomRange}
              onChange={(e) => setUseCustomRange(e.target.checked)}
              className="w-3.5 h-3.5"
            />
            Custom dates
          </label>
          {useCustomRange ? (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px]"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px]"
              />
            </>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-[#014582] border border-blue-200">
              {periodLabel}
            </span>
          )}
          <div className="w-40">
            <CurrencySelect value={currency} onChange={(code) => setCurrency(code)} />
          </div>
          <button
            type="button"
            onClick={() => setCustomerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Search className="w-3.5 h-3.5" />
            {customer?.name || 'All customers'}
          </button>
          {customer && (
            <button
              type="button"
              onClick={() => setCustomer(null)}
              className="text-[11px] font-semibold text-red-600"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500">
            Consolidated in <strong>{base}</strong>
          </span>
          <button
            type="button"
            onClick={() => setReloadKey((v) => v + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#014582] text-white hover:bg-[#01366a] disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {(data.conversionWarnings || []).length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Currency consolidation warnings
          </p>
          {data.conversionWarnings.map((w) => (
            <p key={w}>• {w}</p>
          ))}
        </div>
      )}

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading export report…
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <TradeStatCard
          label={`Contracted Value (${base})`}
          value={money(s.contractedValue)}
          icon={DollarSign}
          color={TRADE_COLORS.primary}
          hint={`${s.orderCount} order(s) · ${s.quotationCount} quotation(s)`}
        />
        <TradeStatCard
          label={`Invoiced Revenue (${base})`}
          value={money(s.invoicedValue)}
          icon={TrendingUp}
          color={TRADE_COLORS.accent}
          hint={`Gross margin ${money(s.grossMarginValue)} after posted expenses`}
        />
        <TradeStatCard
          label={`Outstanding A/R (${base})`}
          value={money(s.outstandingValue)}
          icon={Receipt}
          color={TRADE_COLORS.danger}
          hint={`Paid ${money(s.paidValue)} against invoices`}
        />
        <TradeStatCard
          label={`Advanced / Settled (${base})`}
          value={`${money(s.advanceValue)} / ${money(s.settlementValue)}`}
          icon={Wallet}
          color={TRADE_COLORS.purple}
          hint={`Posted export expenses ${money(s.expenseValue)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TradeCard
          title="Revenue by Destination Territory"
          subtitle="Contracted vs invoiced value by buyer country"
        >
          <div className="h-[260px] w-full">
            {countryChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No territorial export data for the selected filters.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip
                    formatter={(val) => formatMoney(Number(val ?? 0), base)}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="contracted" name="Contracted" fill="#014582" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="invoiced" name="Invoiced" fill="#0FA3E0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TradeCard>

        <TradeCard
          title="Export Order Status Breakdown"
          subtitle="Pipeline distribution for the selected period"
        >
          {statusRows.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No export orders in range.</p>
          ) : (
            <div className="space-y-2">
              {statusRows.map((row) => (
                <div
                  key={row.status}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/60"
                >
                  <span className="text-xs font-semibold text-gray-700">{row.status}</span>
                  <span className="text-xs font-bold text-[#014582]">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </TradeCard>
      </div>

      <TradeCard
        title="Territorial Export Performance Matrix"
        subtitle="Country-level order volume, contracted value and recognized invoiced revenue"
      >
        {data.byCountry.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">No destination records.</p>
        ) : (
          <TradeTable>
            <TradeTableHeader
              columns={[
                'Destination Country',
                'Active Orders',
                `Contracted (${base})`,
                `Invoiced (${base})`,
                'Invoiced Share %',
                'Invoice Realization',
              ]}
            />
            <TradeTableBody>
              {data.byCountry.map((c) => {
                const share = c.contracted > 0 ? (c.invoiced / c.contracted) * 100 : 0;
                return (
                  <TradeTableRow key={c.country}>
                    <TradeTableCell className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#014582]" /> {c.country}
                    </TradeTableCell>
                    <TradeTableCell className="text-gray-700 font-semibold">{c.orders}</TradeTableCell>
                    <TradeTableCell className="font-extrabold text-[#014582]">
                      {money(c.contracted)}
                    </TradeTableCell>
                    <TradeTableCell className="font-bold text-emerald-700">{money(c.invoiced)}</TradeTableCell>
                    <TradeTableCell className="font-bold text-gray-700">{share.toFixed(1)}%</TradeTableCell>
                    <TradeTableCell>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          share >= 100
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : share > 0
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {share >= 100 ? 'Fully invoiced' : share > 0 ? 'Partially invoiced' : 'Not invoiced'}
                      </span>
                    </TradeTableCell>
                  </TradeTableRow>
                );
              })}
            </TradeTableBody>
          </TradeTable>
        )}
      </TradeCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TradeCard
          title="Receivables Aging"
          subtitle="Outstanding export A/R grouped by days past delivery deadline"
        >
          <TradeTable>
            <TradeTableHeader columns={['Aging Bucket', 'Orders', `Outstanding (${base})`]} />
            <TradeTableBody>
              {(data.aging || []).map((row) => (
                <TradeTableRow key={row.bucket}>
                  <TradeTableCell className="font-semibold text-gray-800">{row.bucket}</TradeTableCell>
                  <TradeTableCell className="text-gray-600">{row.count}</TradeTableCell>
                  <TradeTableCell className="font-bold text-[#014582]">{money(row.amount)}</TradeTableCell>
                </TradeTableRow>
              ))}
            </TradeTableBody>
          </TradeTable>
        </TradeCard>

        <TradeCard
          title="Export Funnel Summary"
          subtitle="Inquiry → quotation → order conversion for the period"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/60">
              <p className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                <Search className="w-3 h-3" /> Inquiries
              </p>
              <p className="text-2xl font-extrabold text-[#014582] mt-1">{s.inquiryCount}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/60">
              <p className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Quotations
              </p>
              <p className="text-2xl font-extrabold text-[#014582] mt-1">{s.quotationCount}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/60">
              <p className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                <PackageCheck className="w-3 h-3" /> Orders
              </p>
              <p className="text-2xl font-extrabold text-[#014582] mt-1">{s.orderCount}</p>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-[#014582]/5 border border-[#014582]/15 text-xs text-slate-700 space-y-1">
            <p className="flex justify-between">
              <span>Inquiry → Order conversion</span>
              <strong>{s.inquiryCount ? ((s.orderCount / s.inquiryCount) * 100).toFixed(1) : '0.0'}%</strong>
            </p>
            <p className="flex justify-between">
              <span>Quotation → Order conversion</span>
              <strong>{s.quotationCount ? ((s.orderCount / s.quotationCount) * 100).toFixed(1) : '0.0'}%</strong>
            </p>
            <p className="flex justify-between">
              <span>Invoice realization (invoiced / contracted)</span>
              <strong>
                {s.contractedValue ? ((s.invoicedValue / s.contractedValue) * 100).toFixed(1) : '0.0'}%
              </strong>
            </p>
          </div>
          <p className="mt-3 text-[11px] text-gray-400 flex items-center gap-1">
            <Send className="w-3 h-3" /> Period: {periodLabel}
          </p>
        </TradeCard>
      </div>

      <CustomerPickerModal
        isOpen={customerOpen}
        onClose={() => setCustomerOpen(false)}
        onSelect={(c) => {
          setCustomer(c);
          setCustomerOpen(false);
        }}
      />
    </TradePage>
  );
}
