'use client';

export const dynamic = 'force-dynamic';

import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileDown,
  FileText,
  Image as ImageIcon,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  RefreshCw,
  ShoppingBag,
  Truck,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import InstallmentAccountSummary from '@/components/installments/InstallmentAccountSummary';
import { CustomerAccountReport } from '@/components/customers/CustomerAccountReport';
import { loadPdfBranding, type PdfBranding } from '@/lib/pdf-branding';
import {
  addressText,
  dateLabel,
  money,
  periodText,
  plainMoney,
  type CustomerAccountData,
  type CustomerAccountDelivery,
  type CustomerAccountOrder,
} from '@/lib/customer-account';

type TabKey = 'orders' | 'deliveries' | 'invoices' | 'payments' | 'ledger' | 'report' | 'info';

type FilterMode = 'all' | 'month' | 'year' | 'custom';

type FilterState = {
  mode: FilterMode;
  month: string;
  year: string;
  from: string;
  to: string;
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function currentFilter(): FilterState {
  const now = new Date();
  return {
    mode: 'all',
    month: String(now.getMonth() + 1).padStart(2, '0'),
    year: String(now.getFullYear()),
    from: '',
    to: '',
  };
}

function resolveRange(filter: FilterState): { from: string; to: string; label: string } {
  if (filter.mode === 'month') {
    const year = Number(filter.year) || new Date().getFullYear();
    const month = Number(filter.month) || 1;
    const lastDay = new Date(year, month, 0).getDate();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return {
      from: `${prefix}-01`,
      to: `${prefix}-${String(lastDay).padStart(2, '0')}`,
      label: `${MONTHS[month - 1]} ${year}`,
    };
  }
  if (filter.mode === 'year') {
    const year = filter.year || String(new Date().getFullYear());
    return { from: `${year}-01-01`, to: `${year}-12-31`, label: year };
  }
  if (filter.mode === 'custom') {
    return {
      from: filter.from,
      to: filter.to,
      label:
        filter.from && filter.to
          ? `${dateLabel(filter.from)} — ${dateLabel(filter.to)}`
          : 'Custom range',
    };
  }
  return { from: '', to: '', label: 'All time' };
}

function badgeTone(value?: string | null): string {
  const normalized = String(value || '').toLowerCase();
  if (!normalized) return 'bg-gray-100 text-gray-600';
  if (normalized.includes('not delivered')) return 'bg-rose-100 text-rose-700';
  if (normalized.includes('partial')) return 'bg-amber-100 text-amber-700';
  if (normalized.includes('delivered') || normalized.includes('completed') || normalized === 'paid') {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (normalized.includes('overdue') || normalized.includes('cancel') || normalized.includes('reject')) {
    return 'bg-rose-100 text-rose-700';
  }
  if (normalized.includes('pending') || normalized.includes('draft') || normalized.includes('process')) {
    return 'bg-blue-100 text-blue-700';
  }
  return 'bg-gray-100 text-gray-700';
}

function StatusBadge({ value }: { value?: string | null }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badgeTone(
        value
      )}`}
    >
      {value || '—'}
    </span>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  const tones: Record<string, string> = {
    default: 'text-gray-900',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-rose-600',
    accent: 'text-[#014582]',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-black ${tones[tone]}`}>{value}</div>
      {hint ? <div className="mt-0.5 text-[10px] text-gray-400 font-medium">{hint}</div> : null}
    </div>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center text-xs text-gray-400 font-medium">
        {message}
      </td>
    </tr>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams() as { id: string };
  const pathname = usePathname();
  const customersHref = pathname?.startsWith('/sales') ? '/sales/customers' : '/warehouse/customers';

  const [data, setData] = useState<CustomerAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('orders');
  const [draft, setDraft] = useState<FilterState>(currentFilter);
  const [filter, setFilter] = useState<FilterState>(currentFilter);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);
  const [branding, setBranding] = useState<PdfBranding | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'jpeg' | 'print' | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const years = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, index) => String(year - index));
  }, []);

  const range = useMemo(() => resolveRange(filter), [filter]);

  const load = useCallback(
    async (initial = false) => {
      if (!id) return;
      if (initial) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (range.from) params.set('from', range.from);
        if (range.to) params.set('to', range.to);
        const query = params.toString();
        const response = await apiClient.get(
          `/api/distributor/customers/${id}/account${query ? `?${query}` : ''}`
        );
        const body = response.data as any;
        if (!body?.success || !body?.data) {
          throw new Error(body?.message || 'Customer account could not be loaded');
        }
        setData(body.data as CustomerAccountData);
      } catch (err: any) {
        setError(err?.message || 'Failed to load customer account');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, range.from, range.to]
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    loadPdfBranding()
      .then((value) => setBranding(value))
      .catch(() => setBranding(null));
  }, []);

  const currency = data?.company.currencySymbol || data?.company.currencyCode || 'Rs.';
  const summary = data?.summary;
  const customInvalid =
    draft.mode === 'custom' && (!draft.from || !draft.to || draft.from > draft.to);

  const applyFilter = () => {
    if (customInvalid) return;
    setFilter({ ...draft });
  };

  const resetFilter = () => {
    const empty = currentFilter();
    setDraft(empty);
    setFilter(empty);
  };

  const handlePrint = async () => {
    if (!reportRef.current) return;
    setExporting('print');
    try {
      await ensureBranding();
      const win = window.open('', '_blank', 'width=900,height=1200');
      if (!win) return;
      const html = reportRef.current.outerHTML;
      win.document.open();
      win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Customer Account Statement</title>
<style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  img { max-width: 100%; }
</style>
</head>
<body>${html}</body>
</html>`);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 600);
    } finally {
      setTimeout(() => setExporting(null), 600);
    }
  };

  const ensureBranding = async (): Promise<PdfBranding | null> => {
    if (branding) return branding;
    try {
      const loaded = await loadPdfBranding();
      setBranding(loaded);
      return loaded;
    } catch {
      return null;
    }
  };

  const handleJpeg = async () => {
    if (!reportRef.current || !data) return;
    setExporting('jpeg');
    try {
      await ensureBranding();
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.download = `customer_statement_${data.customer.customerNumber || data.customer.id}_${Date.now()}.jpg`;
      link.click();
    } catch (err: any) {
      alert(err?.message || 'JPEG export failed');
    } finally {
      setExporting(null);
    }
  };

  const handlePdf = async () => {
    if (!data || !data.summary) return;
    const summary = data.summary;
    setExporting('pdf');
    try {
      const { createBrandedReport } = await import('@/lib/pdf-branding');
      const autoTable = (await import('jspdf-autotable')).default;
      const { doc, margin, startY, accentHex, finalize } = await createBrandedReport({
        reportTitle: 'Customer Account Statement',
      });

      const fmt = (value: number) => `${data.company.currencyCode || 'PKR'} ${plainMoney(value)}`;
      let y = startY;

      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(data.customer.name, margin, y);
      y += 5;
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const contact = [
        data.customer.customerNumber,
        data.customer.phone,
        data.customer.email,
      ]
        .filter(Boolean)
        .join('  •  ');
      if (contact) {
        doc.text(contact, margin, y);
        y += 4;
      }
      const address =
        addressText(data.customer.billingAddress) || addressText(data.customer.address);
      if (address) {
        doc.text(address, margin, y);
        y += 4;
      }
      doc.text(`Period: ${periodText(data.period)}`, margin, y);
      y += 4;
      doc.text(
        `Opening: ${fmt(summary.openingBalance)}   Invoiced: ${fmt(
          summary.totalInvoiced
        )}   Received: ${fmt(summary.totalReceived)}   Closing: ${fmt(
          summary.closingBalance
        )}   Outstanding: ${fmt(summary.totalOutstanding)}`,
        margin,
        y
      );
      y += 7;

      const ordersBody = data.orders.length
        ? data.orders.map((order) => [
            order.orderNumber,
            dateLabel(order.orderDate),
            order.orderStatus,
            order.deliveryStatus,
            fmt(order.grandTotal),
            fmt(order.paid),
            fmt(order.remaining),
          ])
        : [['No orders in this period', '', '', '', '', '', '']];

      autoTable(doc, {
        startY: y,
        head: [['Order #', 'Date', 'Status', 'Delivery', 'Total', 'Paid', 'Remaining']],
        body: ordersBody,
        theme: 'grid',
        headStyles: { fillColor: accentHex, textColor: '#ffffff', fontSize: 7.5 },
        styles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: {
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
        },
        margin: { left: margin, right: margin },
      });
      y = ((doc as any).lastAutoTable?.finalY || y) + 8;
      if (y > 245) {
        doc.addPage();
        y = margin;
      }

      const paymentsBody = data.payments.length
        ? data.payments.map((payment) => [
            payment.paymentNumber,
            dateLabel(payment.paymentDate),
            payment.paymentMethod || '—',
            payment.reference || payment.bankAccountName || '—',
            fmt(payment.amount),
          ])
        : [['No payments in this period', '', '', '', '']];

      autoTable(doc, {
        startY: y,
        head: [['Receipt #', 'Date', 'Method', 'Reference', 'Amount']],
        body: paymentsBody,
        theme: 'grid',
        headStyles: { fillColor: accentHex, textColor: '#ffffff', fontSize: 7.5 },
        styles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: { 4: { halign: 'right' } },
        margin: { left: margin, right: margin },
      });
      y = ((doc as any).lastAutoTable?.finalY || y) + 8;
      if (y > 235) {
        doc.addPage();
        y = margin;
      }

      const ledgerBody = [
        ['', 'Opening Balance', '', '', '', fmt(summary.openingBalance)],
        ...data.ledger.map((line) => [
          dateLabel(line.date),
          line.documentNumber,
          line.documentType,
          line.debit ? fmt(line.debit) : '—',
          line.credit ? fmt(line.credit) : '—',
          fmt(line.runningBalance),
        ]),
      ];

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Document', 'Type', 'Debit', 'Credit', 'Balance']],
        body: ledgerBody,
        theme: 'grid',
        headStyles: { fillColor: accentHex, textColor: '#ffffff', fontSize: 7.5 },
        styles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
        },
        margin: { left: margin, right: margin },
      });

      finalize({
        filename: `customer_statement_${data.customer.customerNumber || data.customer.id}_${Date.now()}.pdf`,
      });
    } catch (err: any) {
      alert(err?.message || 'PDF export failed');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#014582] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading customer account…</p>
        </div>
      </div>
    );
  }

  if (error || !data || !summary) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">{error || 'Customer Not Found'}</h2>
        <div>
          <Link
            href={customersHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#014582] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const customer = data.customer;
  const tabItems: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: 'orders', label: 'Orders', count: data.orders.length },
    { key: 'deliveries', label: 'Deliveries', count: data.deliveries.length },
    { key: 'invoices', label: 'Invoices', count: data.invoices.length },
    { key: 'payments', label: 'Payments', count: data.payments.length },
    { key: 'ledger', label: 'Ledger', count: data.ledger.length },
    { key: 'report', label: 'Statement Report' },
    { key: 'info', label: 'Customer Info' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={customersHref}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#014582] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => load(false)}
            disabled={refreshing}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-200 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handlePrint}
            disabled={exporting !== null}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-200 transition-colors disabled:opacity-60"
          >
            <Printer className="w-3.5 h-3.5" />
            {exporting === 'print' ? 'Preparing…' : 'Print A4'}
          </button>
          <button
            onClick={handlePdf}
            disabled={exporting !== null}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-200 transition-colors disabled:opacity-60"
          >
            <FileDown className="w-3.5 h-3.5" />
            {exporting === 'pdf' ? 'Generating…' : 'PDF'}
          </button>
          <button
            onClick={handleJpeg}
            disabled={exporting !== null}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-200 transition-colors disabled:opacity-60"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            {exporting === 'jpeg' ? 'Rendering…' : 'JPEG'}
          </button>
          <button
            onClick={() => setTab('report')}
            className="px-4 py-1.5 bg-[#014582] hover:bg-[#01366a] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#014582]/20 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Statement
          </button>
        </div>
      </div>

      {/* Customer header */}
      <div className="bg-gradient-to-r from-[#00274d] via-[#014582] to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                {customer.customerType || 'Customer'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  customer.status === 'Active'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {customer.status || 'Active'}
              </span>
              <span className="text-xs text-white/70 font-mono">#{customer.customerNumber}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/80">
              {customer.companyName ? (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-white/60" />
                  {customer.companyName}
                </span>
              ) : null}
              {customer.email ? (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-white/60" />
                  {customer.email}
                </span>
              ) : null}
              {customer.phone ? (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-white/60" />
                  {customer.phone}
                </span>
              ) : null}
              {customer.taxId ? (
                <span className="flex items-center gap-1 font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded">
                  NTN/Tax: {customer.taxId}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/60">
              <span>Salesperson: {customer.salesperson?.name || 'Unassigned'}</span>
              <span>Territory: {customer.territory || '—'}</span>
              <span>Terms: {customer.creditTerms || 'Net 30'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-[300px]">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <div className="text-[10px] uppercase font-bold text-white/70">Outstanding Receivable</div>
              <div className="text-lg font-black text-amber-300">
                {money(summary.totalOutstanding, currency)}
              </div>
              <div className="text-[10px] text-white/60">
                Overdue {money(summary.overdueAmount, currency)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <div className="text-[10px] uppercase font-bold text-white/70">Credit Limit</div>
              <div className="text-lg font-black text-emerald-300">
                {money(customer.creditLimit, currency)}
              </div>
              <div className="text-[10px] text-white/60">
                Available {money(summary.availableCredit, currency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 text-[#014582] mr-1">
          <CalendarDays className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Period</span>
        </div>
        <label className="text-[10px] font-bold uppercase text-gray-500 flex flex-col gap-1">
          Filter
          <select
            value={draft.mode}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, mode: event.target.value as FilterMode }))
            }
            className="min-w-[150px] px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white"
          >
            <option value="all">All time</option>
            <option value="month">Single month</option>
            <option value="year">Full year</option>
            <option value="custom">Custom range</option>
          </select>
        </label>

        {draft.mode === 'month' ? (
          <label className="text-[10px] font-bold uppercase text-gray-500 flex flex-col gap-1">
            Month
            <select
              value={draft.month}
              onChange={(event) => setDraft((prev) => ({ ...prev, month: event.target.value }))}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={String(index + 1).padStart(2, '0')}>
                  {month}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {draft.mode === 'month' || draft.mode === 'year' ? (
          <label className="text-[10px] font-bold uppercase text-gray-500 flex flex-col gap-1">
            Year
            <select
              value={draft.year}
              onChange={(event) => setDraft((prev) => ({ ...prev, year: event.target.value }))}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {draft.mode === 'custom' ? (
          <>
            <label className="text-[10px] font-bold uppercase text-gray-500 flex flex-col gap-1">
              From
              <input
                type="date"
                value={draft.from}
                onChange={(event) => setDraft((prev) => ({ ...prev, from: event.target.value }))}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white"
              />
            </label>
            <label className="text-[10px] font-bold uppercase text-gray-500 flex flex-col gap-1">
              To
              <input
                type="date"
                value={draft.to}
                onChange={(event) => setDraft((prev) => ({ ...prev, to: event.target.value }))}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white"
              />
            </label>
          </>
        ) : null}

        <button
          onClick={applyFilter}
          disabled={customInvalid}
          className="px-4 py-2 bg-[#014582] text-white rounded-lg text-xs font-bold hover:bg-[#01366a] disabled:opacity-50 transition-colors"
        >
          Apply
        </button>
        <button
          onClick={resetFilter}
          className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
        >
          Reset
        </button>
        <div className="ml-auto text-right">
          <div className="text-[10px] uppercase font-bold text-gray-400">Showing</div>
          <div className="text-xs font-bold text-gray-700">{range.label}</div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          label="Invoiced (period)"
          value={money(summary.totalInvoiced, currency)}
          hint={`${summary.periodInvoiceCount} invoices`}
          tone="accent"
        />
        <KpiCard
          label="Received (period)"
          value={money(summary.totalReceived, currency)}
          hint={`${summary.paymentCount} payments`}
          tone="success"
        />
        <KpiCard
          label="Closing Balance"
          value={money(summary.closingBalance, currency)}
          hint={`Opening ${money(summary.openingBalance, currency)}`}
          tone={summary.closingBalance > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          label="Total Outstanding"
          value={money(summary.totalOutstanding, currency)}
          hint={`${summary.overdueInvoices} overdue invoices`}
          tone={summary.totalOutstanding > 0 ? 'danger' : 'success'}
        />
        <KpiCard
          label="Orders (period)"
          value={String(summary.ordersCount)}
          hint={`${money(summary.ordersValue, currency)} value`}
          tone="default"
        />
        <KpiCard
          label="Delivered Orders"
          value={`${summary.deliveredOrders}/${summary.ordersCount}`}
          hint={`${summary.openDeliveries} open deliveries`}
          tone={summary.deliveredOrders === summary.ordersCount ? 'success' : 'warning'}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-2 pt-1 rounded-xl border overflow-x-auto">
        {tabItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              tab === item.key
                ? 'border-[#014582] text-[#014582]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span className="ml-1.5 text-[10px] font-bold text-gray-400">({item.count})</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Orders & Delivery Status</h3>
              <p className="text-xs text-gray-500">
                Every order with its delivery state, invoiced amount and remaining balance
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-gray-500">
                Value <strong className="text-gray-800">{money(summary.ordersValue, currency)}</strong>
              </span>
              <span className="text-gray-500">
                Paid <strong className="text-emerald-600">{money(summary.ordersPaid, currency)}</strong>
              </span>
              <span className="text-gray-500">
                Remaining{' '}
                <strong className="text-amber-600">{money(summary.ordersRemaining, currency)}</strong>
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wide text-[10px] border-b border-gray-200">
                  <th className="p-3 w-8" />
                  <th className="p-3">Order #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Order Status</th>
                  <th className="p-3">Delivery</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Invoiced</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {data.orders.length === 0 ? (
                  <EmptyRow colSpan={9} message="No orders found for the selected period." />
                ) : (
                  data.orders.map((order) => {
                    const expanded = expandedOrder === order.id;
                    return (
                      <Fragment key={order.id}>
                        <tr className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => setExpandedOrder(expanded ? null : order.id)}
                              className="p-1 rounded text-gray-500 hover:bg-gray-100"
                              title={expanded ? 'Collapse' : 'Show items'}
                            >
                              {expanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                          <td className="p-3 font-mono font-bold text-[#014582]">{order.orderNumber}</td>
                          <td className="p-3 text-gray-600">{dateLabel(order.orderDate)}</td>
                          <td className="p-3">
                            <StatusBadge value={order.orderStatus} />
                          </td>
                          <td className="p-3">
                            <StatusBadge value={order.deliveryStatus} />
                            {order.deliveryDate ? (
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {dateLabel(order.deliveryDate)}
                              </div>
                            ) : null}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            {money(order.grandTotal, currency)}
                          </td>
                          <td className="p-3 text-right text-gray-700">
                            {money(order.invoiced, currency)}
                          </td>
                          <td className="p-3 text-right text-emerald-600">
                            {money(order.paid, currency)}
                          </td>
                          <td
                            className={`p-3 text-right font-black ${
                              order.remaining > 0 ? 'text-amber-600' : 'text-gray-400'
                            }`}
                          >
                            {money(order.remaining, currency)}
                          </td>
                        </tr>
                        {expanded ? (
                          <tr className="bg-gray-50/70">
                            <td colSpan={9} className="p-4">
                              <OrderDetailPanel order={order} currency={currency} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'deliveries' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Delivery Notes</h3>
              <p className="text-xs text-gray-500">Which orders are delivered, partial or still pending</p>
            </div>
            <div className="text-xs text-gray-500">
              {summary.deliveriesCount} deliveries • {summary.openDeliveries} open
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wide text-[10px] border-b border-gray-200">
                  <th className="p-3 w-8" />
                  <th className="p-3">Delivery #</th>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Delivered By</th>
                  <th className="p-3 text-right">Qty (Delivered / Ordered)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {data.deliveries.length === 0 ? (
                  <EmptyRow colSpan={7} message="No deliveries found for the selected period." />
                ) : (
                  data.deliveries.map((delivery) => {
                    const expanded = expandedDelivery === delivery.id;
                    return (
                      <Fragment key={delivery.id}>
                        <tr className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => setExpandedDelivery(expanded ? null : delivery.id)}
                              className="p-1 rounded text-gray-500 hover:bg-gray-100"
                              title={expanded ? 'Collapse' : 'Show items'}
                            >
                              {expanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                          <td className="p-3 font-mono font-bold text-[#014582]">
                            {delivery.deliveryNumber}
                          </td>
                          <td className="p-3 font-mono text-gray-600">{delivery.salesOrderNumber}</td>
                          <td className="p-3 text-gray-600">{dateLabel(delivery.deliveryDate)}</td>
                          <td className="p-3">
                            <StatusBadge value={delivery.deliveryStatus} />
                          </td>
                          <td className="p-3 text-gray-600">
                            {delivery.deliveryPerson || '—'}
                            {delivery.trackingNumber ? (
                              <div className="text-[10px] text-gray-400">{delivery.trackingNumber}</div>
                            ) : null}
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-bold text-gray-900">
                              {delivery.deliveredQuantity.toLocaleString()}
                            </span>
                            <span className="text-gray-400">
                              {' / '}
                              {delivery.orderedQuantity.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                        {expanded ? (
                          <tr className="bg-gray-50/70">
                            <td colSpan={7} className="p-4">
                              <DeliveryDetailPanel delivery={delivery} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Sales Invoices</h3>
              <p className="text-xs text-gray-500">Invoiced, paid and outstanding per invoice</p>
            </div>
            <div className="text-xs font-bold text-gray-700">
              Outstanding{' '}
              <span className="text-amber-600">{money(summary.totalOutstanding, currency)}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wide text-[10px] border-b border-gray-200">
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Due</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Balance</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {data.invoices.length === 0 ? (
                  <EmptyRow colSpan={8} message="No invoices found for the selected period." />
                ) : (
                  data.invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#014582]">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="p-3 font-mono text-gray-500">{invoice.orderNumber || '—'}</td>
                      <td className="p-3 text-gray-600">{dateLabel(invoice.invoiceDate)}</td>
                      <td className="p-3 text-gray-600">{dateLabel(invoice.dueDate)}</td>
                      <td className="p-3 text-right font-bold text-gray-900">
                        {money(invoice.grandTotal, currency)}
                      </td>
                      <td className="p-3 text-right text-emerald-600">
                        {money(invoice.paidAmount, currency)}
                      </td>
                      <td
                        className={`p-3 text-right font-bold ${
                          invoice.outstanding > 0 ? 'text-amber-600' : 'text-gray-400'
                        }`}
                      >
                        {money(invoice.outstanding, currency)}
                      </td>
                      <td className="p-3">
                        <StatusBadge
                          value={invoice.isOverdue ? 'Overdue' : invoice.invoiceStatus || invoice.paymentStatus}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Payments Received</h3>
              <p className="text-xs text-gray-500">Receipt history and payment methods</p>
            </div>
            <div className="text-xs font-bold text-gray-700">
              Received <span className="text-emerald-600">{money(summary.totalReceived, currency)}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wide text-[10px] border-b border-gray-200">
                  <th className="p-3">Receipt #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Bank Account</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {data.payments.length === 0 ? (
                  <EmptyRow colSpan={7} message="No payments found for the selected period." />
                ) : (
                  data.payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#014582]">{payment.paymentNumber}</td>
                      <td className="p-3 text-gray-600">{dateLabel(payment.paymentDate)}</td>
                      <td className="p-3 text-gray-700">{payment.paymentMethod || '—'}</td>
                      <td className="p-3 text-gray-500">{payment.reference || '—'}</td>
                      <td className="p-3 text-gray-500">{payment.bankAccountName || '—'}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {money(payment.amount, currency)}
                      </td>
                      <td className="p-3">
                        <StatusBadge value={payment.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Accounts Receivable Ledger</h3>
              <p className="text-xs text-gray-500">
                Invoices, payments and credit notes with running balance
              </p>
            </div>
            <div className="text-xs font-bold text-gray-700">
              Closing Balance{' '}
              <span className="text-[#014582]">{money(summary.closingBalance, currency)}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wide text-[10px] border-b border-gray-200">
                  <th className="p-3">Date</th>
                  <th className="p-3">Document #</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Due</th>
                  <th className="p-3 text-right">Debit</th>
                  <th className="p-3 text-right">Credit</th>
                  <th className="p-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                <tr className="bg-blue-50/40">
                  <td className="p-3 text-gray-600" colSpan={5}>
                    <strong>Opening Balance</strong>
                  </td>
                  <td className="p-3" />
                  <td className="p-3" />
                  <td className="p-3 text-right font-black text-gray-700">
                    {money(summary.openingBalance, currency)}
                  </td>
                </tr>
                {data.ledger.length === 0 ? (
                  <EmptyRow colSpan={8} message="No ledger movement for the selected period." />
                ) : (
                  data.ledger.map((line, index) => (
                    <tr key={`${line.documentNumber}-${index}`} className="hover:bg-blue-50/30">
                      <td className="p-3 text-gray-600">{dateLabel(line.date)}</td>
                      <td className="p-3 font-mono font-bold text-[#014582]">{line.documentNumber}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            line.documentType === 'Invoice'
                              ? 'bg-blue-100 text-blue-700'
                              : line.documentType === 'Credit Note'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {line.documentType}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700">{line.description}</td>
                      <td className="p-3 text-gray-500">{line.dueDate ? dateLabel(line.dueDate) : '—'}</td>
                      <td className="p-3 text-right font-bold text-gray-900">
                        {line.debit ? money(line.debit, currency) : '—'}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {line.credit ? money(line.credit, currency) : '—'}
                      </td>
                      <td className="p-3 text-right font-black text-[#014582]">
                        {money(line.runningBalance, currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300">
                  <td colSpan={5} className="p-3 text-right text-[10px] uppercase font-bold text-gray-600">
                    Period Totals
                  </td>
                  <td className="p-3 text-right font-bold text-gray-900">
                    {money(summary.totalInvoiced, currency)}
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-600">
                    {money(summary.totalReceived, currency)}
                  </td>
                  <td className="p-3 text-right font-black text-[#014582]">
                    {money(summary.closingBalance, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {tab === 'report' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Customer Account Statement</h3>
              <p className="text-xs text-gray-500">
                A4 statement using your saved report branding — print, PDF or JPEG
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePrint}
                disabled={exporting !== null}
                className="px-3 py-2 bg-[#014582] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
              >
                <Printer className="w-3.5 h-3.5" /> Print A4
              </button>
              <button
                onClick={handlePdf}
                disabled={exporting !== null}
                className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
              >
                <FileDown className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button
                onClick={handleJpeg}
                disabled={exporting !== null}
                className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Download JPEG
              </button>
            </div>
          </div>
          <div className="overflow-auto bg-gray-200/60 p-4 rounded-xl">
            <div className="shadow-2xl" style={{ width: '210mm', margin: '0 auto' }}>
              <CustomerAccountReport data={data} branding={branding} ref={reportRef} />
            </div>
          </div>
        </div>
      )}

      {tab === 'info' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-[#014582]" />
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block">Customer Name</span>
                  <span className="font-bold text-gray-800">{customer.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Customer Number</span>
                  <span className="font-bold text-gray-800 font-mono">{customer.customerNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Category / Type</span>
                  <span className="font-bold text-gray-800">{customer.customerType || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Status</span>
                  <span className="font-bold text-emerald-600">{customer.status || 'Active'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Email Address</span>
                  <span className="font-bold text-gray-800">{customer.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Phone Number</span>
                  <span className="font-bold text-gray-800">{customer.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Company</span>
                  <span className="font-bold text-gray-800">{customer.companyName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Tax ID</span>
                  <span className="font-bold text-gray-800">{customer.taxId || 'N/A'}</span>
                </div>
              </div>
              {customer.notes ? (
                <div className="text-xs pt-2 border-t border-gray-100">
                  <span className="text-gray-500 block mb-1">Notes</span>
                  <span className="text-gray-800 whitespace-pre-wrap">{customer.notes}</span>
                </div>
              ) : null}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#014582]" />
                Credit Terms & Policy
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block">Credit Limit</span>
                  <span className="font-bold text-gray-800">{money(customer.creditLimit, currency)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Credit Terms</span>
                  <span className="font-bold text-gray-800">{customer.creditTerms || 'Net 30'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Credit Days</span>
                  <span className="font-bold text-gray-800">{customer.creditDays || 30} days</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Credit Policy</span>
                  <span className="font-bold text-amber-700">{customer.creditPolicy || 'WARN'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Loyalty Points</span>
                  <span className="font-bold text-amber-600">{customer.loyaltyPoints || 0} pts</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Salesperson</span>
                  <span className="font-bold text-gray-800">
                    {customer.salesperson?.name || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm md:col-span-2">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#014582]" />
                Addresses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <span className="font-bold text-gray-700 block mb-1">Billing Address</span>
                  <p className="text-gray-600">
                    {addressText(customer.billingAddress) || addressText(customer.address) || 'No billing address'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <span className="font-bold text-gray-700 block mb-1">Shipping Address</span>
                  <p className="text-gray-600">
                    {addressText(customer.shippingAddress) ||
                      addressText(customer.address) ||
                      'Same as billing address'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <InstallmentAccountSummary
            side="customer"
            partyId={id}
            formatCurrency={(n) =>
              `Rs. ${Number(n || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            }
          />
        </div>
      )}

      {/* Hidden A4 report used by print / JPEG when another tab is active */}
      {tab !== 'report' ? (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: '210mm',
            background: '#fff',
            pointerEvents: 'none',
          }}
        >
          <CustomerAccountReport data={data} branding={branding} ref={reportRef} />
        </div>
      ) : null}
    </div>
  );
}

function OrderDetailPanel({
  order,
  currency,
}: {
  order: CustomerAccountOrder;
  currency: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <div className="text-[10px] font-bold uppercase text-gray-500 mb-1.5 flex items-center gap-1">
          <Package className="w-3.5 h-3.5" /> Items ({order.itemCount})
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[9px]">
                <th className="px-2 py-1.5">Product</th>
                <th className="px-2 py-1.5">SKU</th>
                <th className="px-2 py-1.5 text-right">Qty</th>
                <th className="px-2 py-1.5 text-right">Unit Price</th>
                <th className="px-2 py-1.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-gray-400">
                    No line items
                  </td>
                </tr>
              ) : (
                order.items.map((item, index) => (
                  <tr key={`${item.sku}-${index}`}>
                    <td className="px-2 py-1.5 font-semibold text-gray-800">{item.productName}</td>
                    <td className="px-2 py-1.5 font-mono text-gray-500">{item.sku || '—'}</td>
                    <td className="px-2 py-1.5 text-right text-gray-700">{item.quantity}</td>
                    <td className="px-2 py-1.5 text-right text-gray-700">
                      {money(item.unitPrice, currency)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-bold text-gray-900">
                      {money(item.totalPrice, currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-2 text-[11px]">
        <div className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1">
          <Truck className="w-3.5 h-3.5" /> Linked Documents
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-2.5 space-y-1.5">
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Expected delivery</span>
            <span className="font-semibold text-gray-800">
              {dateLabel(order.expectedDeliveryDate)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Delivery notes</span>
            <span className="font-semibold text-gray-800 text-right">
              {order.deliveryNumbers.length ? order.deliveryNumbers.join(', ') : '—'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Invoices</span>
            <span className="font-semibold text-gray-800 text-right">
              {order.invoiceNumbers.length ? order.invoiceNumbers.join(', ') : '—'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Payment status</span>
            <StatusBadge value={order.paymentStatus} />
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Fulfillment</span>
            <span className="font-semibold text-gray-800">{order.fulfillmentStatus || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveryDetailPanel({ delivery }: { delivery: CustomerAccountDelivery }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[9px]">
            <th className="px-2 py-1.5">Product</th>
            <th className="px-2 py-1.5">SKU</th>
            <th className="px-2 py-1.5">Unit</th>
            <th className="px-2 py-1.5 text-right">Ordered</th>
            <th className="px-2 py-1.5 text-right">Delivered</th>
            <th className="px-2 py-1.5 text-right">Remaining</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {delivery.items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-2 py-4 text-center text-gray-400">
                No line items
              </td>
            </tr>
          ) : (
            delivery.items.map((item, index) => (
              <tr key={`${item.sku}-${index}`}>
                <td className="px-2 py-1.5 font-semibold text-gray-800">{item.productName}</td>
                <td className="px-2 py-1.5 font-mono text-gray-500">{item.sku || '—'}</td>
                <td className="px-2 py-1.5 text-gray-500">{item.unit || '—'}</td>
                <td className="px-2 py-1.5 text-right text-gray-700">{item.orderedQuantity}</td>
                <td className="px-2 py-1.5 text-right font-bold text-emerald-600">
                  {item.deliveredQuantity}
                </td>
                <td className="px-2 py-1.5 text-right text-amber-700 font-bold">
                  {item.remainingQuantity}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
