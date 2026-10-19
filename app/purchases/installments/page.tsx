'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CalendarClock,
  Loader2,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import {
  fetchInstallmentReport,
  markInstallmentsOverdue,
  type InstallmentLine,
  type InstallmentSummary,
} from '@/api/installments/route';
import { useCompanyBusinessConfig } from '@/lib/company-business-config';
import { useCurrency } from '@/lib/currency-context';
import InstallmentStatusBadge from '@/components/installments/InstallmentStatusBadge';

type FilterTab = 'all_open' | 'overdue' | 'upcoming' | 'paid';

function lineOutstanding(line: InstallmentLine) {
  return Math.max(0, Number(line.amount || 0) - Number(line.paidAmount || 0));
}

export default function PurchaseInstallmentsPage() {
  const { showInstallmentPurchaseUi, loading: configLoading } =
    useCompanyBusinessConfig();
  const { formatAmount } = useCurrency();
  const formatCurrency = (value: number) => formatAmount(Number(value) || 0);
  const [tab, setTab] = useState<FilterTab>('all_open');
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<InstallmentLine[]>([]);
  const [summary, setSummary] = useState<InstallmentSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status =
        tab === 'overdue' ? 'Overdue' : tab === 'paid' ? 'Paid' : undefined;
      const data = await fetchInstallmentReport({ side: 'purchase', status });
      setLines(data?.lines || []);
      setSummary(data?.summary || null);
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load installments'
      );
      setLines([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (!showInstallmentPurchaseUi) return;
    void load();
  }, [load, showInstallmentPurchaseUi]);

  const filtered = useMemo(() => {
    if (tab === 'all_open') {
      return lines.filter((l) =>
        ['Pending', 'Partial', 'Overdue'].includes(String(l.status))
      );
    }
    if (tab === 'upcoming') {
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return lines.filter((l) => {
        if (!['Pending', 'Partial'].includes(String(l.status))) return false;
        const d = new Date(l.dueDate);
        return d >= now && d <= in30;
      });
    }
    return lines;
  }, [lines, tab]);

  const byInvoice = useMemo(() => {
    const map = new Map<
      string,
      {
        invoiceId: string;
        invoiceNumber: string;
        supplierName: string;
        rows: InstallmentLine[];
      }
    >();
    for (const line of filtered) {
      const invId = line.invoiceId || line.invoice?.id || '';
      if (!invId) continue;
      if (!map.has(invId)) {
        map.set(invId, {
          invoiceId: invId,
          invoiceNumber: line.invoice?.invoiceNumber || '—',
          supplierName: line.invoice?.supplierName || '—',
          rows: [],
        });
      }
      map.get(invId)!.rows.push(line);
    }
    return Array.from(map.values());
  }, [filtered]);

  if (configLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (!showInstallmentPurchaseUi) {
    return (
      <div className="p-8 max-w-xl">
        <h1 className="text-xl font-bold text-zinc-900">Purchase Installments</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Enable installment purchases under{' '}
          <Link href="/companies/profile" className="text-[#014582] font-medium hover:underline">
            Company Profile → Business config
          </Link>
          .
        </p>
      </div>
    );
  }

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all_open', label: 'Open' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'upcoming', label: 'Due in 30 days' },
    { id: 'paid', label: 'Paid' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-[#014582]" />
            Purchase Installments
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Supplier installment payables — pay against schedule and post AP vs Cash/Bank.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            disabled={marking}
            onClick={async () => {
              setMarking(true);
              try {
                await markInstallmentsOverdue();
                await load();
              } finally {
                setMarking(false);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {marking ? 'Updating…' : 'Mark overdue'}
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Scheduled', value: summary.scheduledTotal },
            { label: 'Paid', value: summary.paidTotal },
            { label: 'Outstanding', value: summary.outstandingTotal },
            { label: 'Overdue', value: summary.overdueTotal },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border bg-white p-3">
              <p className="text-xs text-zinc-500">{c.label}</p>
              <p className="text-lg font-bold">{formatCurrency(c.value || 0)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              tab === t.id ? 'bg-[#014582] text-white' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12 text-zinc-500 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : byInvoice.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-zinc-500">
          No purchase installment lines for this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {byInvoice.map((group) => {
            const openAmt = group.rows.reduce((s, r) => s + lineOutstanding(r), 0);
            return (
              <div
                key={group.invoiceId}
                className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-zinc-50 border-b">
                  <div>
                    <Link
                      href={`/purchases/installments/${group.invoiceId}`}
                      className="font-semibold text-[#014582] hover:underline"
                    >
                      {group.invoiceNumber}
                    </Link>
                    <p className="text-xs text-zinc-500">{group.supplierName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Open {formatCurrency(openAmt)}</span>
                    {openAmt > 0.001 && (
                      <Link
                        href={`/purchases/installments/${group.invoiceId}/pay`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#014582] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Pay
                      </Link>
                    )}
                  </div>
                </div>
                <table className="min-w-full text-xs">
                  <thead className="text-zinc-500">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Due</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-right">Paid</th>
                      <th className="px-4 py-2 text-right">Balance</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.id} className="border-t border-zinc-100">
                        <td className="px-4 py-2">{row.installmentNumber}</td>
                        <td className="px-4 py-2">
                          {new Date(row.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(Number(row.amount))}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(Number(row.paidAmount || 0))}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatCurrency(lineOutstanding(row))}
                        </td>
                        <td className="px-4 py-2">
                          <InstallmentStatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { PurchaseInstallmentsPage };
