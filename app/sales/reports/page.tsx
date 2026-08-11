'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Store,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { loadCurrencyLocal } from '../../../lib/currency-service';

type ReportRow = {
  id: string;
  channel: string;
  reference: string;
  date: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
};

type ReportSummary = {
  count: number;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  byChannel: {
    orders: { count: number; grandTotal: number };
    pos: { count: number; grandTotal: number };
    invoices: { count: number; grandTotal: number };
  };
};

const PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
] as const;

const CHANNELS = [
  { label: 'All Channels', value: 'all' },
  { label: 'POS', value: 'pos' },
  { label: 'Orders', value: 'orders' },
  { label: 'Invoices', value: 'invoices' },
] as const;

function formatCurrency(amount: number) {
  const { symbol, code } = loadCurrencyLocal();
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code || 'PKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${symbol} ${(amount || 0).toFixed(2)}`;
  }
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function SalesReportsPage() {
  const [period, setPeriod] = useState('month');
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const queryString = useMemo(() => {
    const qs = new URLSearchParams({
      channel,
      period,
      status,
      page: String(page),
      limit: '50',
    });
    if (search.trim()) qs.set('search', search.trim());
    if (period === 'custom') {
      if (startDate) qs.set('startDate', startDate);
      if (endDate) qs.set('endDate', endDate);
    }
    return qs.toString();
  }, [channel, period, status, search, page, startDate, endDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/sales/reports?${queryString}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load sales report');
      }
      setRows(data.data?.rows || []);
      setSummary(data.data?.summary || null);
      setTotal(data.data?.pagination?.total || 0);
      setTotalPages(data.data?.pagination?.totalPages || 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load report');
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const fetchAllForExport = async (): Promise<ReportRow[]> => {
    const qs = new URLSearchParams(queryString);
    qs.set('page', '1');
    qs.set('limit', '2000');
    const res = await fetch(`/api/sales/reports?${qs.toString()}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load export data');
    }
    return data.data?.rows || [];
  };

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const exportRows = await fetchAllForExport();
      if (exportRows.length === 0) {
        alert('No records to export for the selected filters');
        return;
      }

      const { createBrandedReport } = await import('../../../lib/pdf-branding');
      const autoTable = (await import('jspdf-autotable')).default;

      const channelLabel =
        CHANNELS.find((c) => c.value === channel)?.label || channel;
      const periodLabel =
        PERIODS.find((p) => p.value === period)?.label || period;

      const { doc, margin, startY, accentHex, finalize } = await createBrandedReport({
        reportTitle: 'Sales Report',
      });

      let y = startY;
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(`Channel: ${channelLabel}`, margin, y);
      y += 5;
      doc.text(
        period === 'custom' && startDate && endDate
          ? `Date Range: ${startDate} to ${endDate}`
          : `Period: ${periodLabel}`,
        margin,
        y
      );
      y += 5;
      doc.text(`Records: ${exportRows.length}`, margin, y);
      y += 5;
      if (summary) {
        doc.text(`Grand Total: ${formatCurrency(summary.grandTotal)}`, margin, y);
        y += 8;
      } else {
        y += 3;
      }

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Channel', 'Reference', 'Customer', 'Status', 'Payment', 'Total']],
        body: exportRows.map((r) => [
          formatDate(r.date),
          r.channel.toUpperCase(),
          r.reference,
          r.customerName,
          r.status,
          r.paymentStatus,
          formatCurrency(r.grandTotal),
        ]),
        theme: 'striped',
        headStyles: { fillColor: accentHex, textColor: '#ffffff' },
        styles: { fontSize: 7 },
        margin: { left: margin, right: margin },
      });

      finalize({
        filename: `sales_report_${channel}_${period}_${Date.now()}.pdf`,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const exportRows = await fetchAllForExport();
      if (exportRows.length === 0) {
        alert('No records to export for the selected filters');
        return;
      }

      const sheetRows = exportRows.map((r) => ({
        Date: formatDate(r.date),
        Channel: r.channel,
        Reference: r.reference,
        Customer: r.customerName,
        Status: r.status,
        Payment: r.paymentStatus,
        Subtotal: r.subtotal,
        Tax: r.tax,
        Discount: r.discount,
        GrandTotal: r.grandTotal,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sheetRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
      XLSX.writeFile(wb, `sales_report_${channel}_${period}_${Date.now()}.xlsx`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Excel export failed');
    } finally {
      setExporting(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchReport();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Filter POS, orders and invoices — preview then download PDF or Excel
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-[#1088dd] text-white hover:bg-[#0b6bb3] disabled:opacity-60"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Excel
          </button>
          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Filter className="w-4 h-4 text-[#1088dd]" />
          Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Period</label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1088dd]"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Channel</label>
            <select
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1088dd]"
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1088dd]"
            >
              <option value="all">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Invoiced">Invoiced</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Reference or customer"
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#1088dd]"
              />
            </div>
          </div>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1088dd]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1088dd]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Transactions', value: String(summary.count), color: 'text-gray-900' },
            { label: 'Grand Total', value: formatCurrency(summary.grandTotal), color: 'text-[#1088dd]' },
            {
              label: 'POS',
              value: `${summary.byChannel.pos.count} · ${formatCurrency(summary.byChannel.pos.grandTotal)}`,
              color: 'text-amber-600',
            },
            {
              label: 'Orders + Invoices',
              value: `${summary.byChannel.orders.count + summary.byChannel.invoices.count} · ${formatCurrency(
                summary.byChannel.orders.grandTotal + summary.byChannel.invoices.grandTotal
              )}`,
              color: 'text-indigo-600',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
            >
              <p className="text-xs text-gray-400 font-medium">{card.label}</p>
              <p className={`text-lg font-bold mt-1 ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Preview table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1088dd]" />
            <h2 className="font-bold text-gray-800">Report Preview</h2>
          </div>
          <span className="text-xs text-gray-400">{total} records</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#1088dd] mb-3" />
            <p className="text-sm text-gray-500">Loading sales data...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No sales found for these filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['Date', 'Channel', 'Reference', 'Customer', 'Status', 'Payment', 'Total'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.channel}-${row.id}`} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{formatDate(row.date)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          row.channel === 'pos'
                            ? 'bg-amber-50 text-amber-700'
                            : row.channel === 'orders'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {row.channel === 'pos' ? <Store className="w-3 h-3" /> : null}
                        {row.channel}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{row.reference}</td>
                    <td className="py-3 px-4 text-gray-600">{row.customerName}</td>
                    <td className="py-3 px-4 text-gray-600">{row.status}</td>
                    <td className="py-3 px-4 text-gray-600">{row.paymentStatus}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {formatCurrency(row.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-sm font-medium text-[#1088dd] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="text-sm font-medium text-[#1088dd] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
