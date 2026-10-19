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

export default function SalesInstallmentsPage() {
  const { showInstallmentSalesUi, loading: configLoading } = useCompanyBusinessConfig();
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
      const data = await fetchInstallmentReport({
        side: 'sales',
        status,
      });
      setLines(data?.lines || []);
      setSummary(data?.summary || null);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load installments';
      setError(msg);
      setLines([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (!showInstallmentSalesUi) return;
    void load();
  }, [load, showInstallmentSalesUi]);

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
        const st = String(l.status);
        if (!['Pending', 'Partial'].includes(st)) return false;
        const d = new Date(l.dueDate);
        return d >= now && d <= in30;
      });
    }
    return lines;
  }, [lines, tab]);

  // Group by invoice for work-queue readability
  const byInvoice = useMemo(() => {
    const map = new Map<
      string,
      { invoiceId: string; invoiceNumber: string; customerName: string; rows: InstallmentLine[] }
    >();
    for (const line of filtered) {
      const invId = line.invoiceId || line.invoice?.id || '';
      if (!invId) continue;
      if (!map.has(invId)) {
        map.set(invId, {
          invoiceId: invId,
          invoiceNumber: line.invoice?.invoiceNumber || '—',
          customerName: line.invoice?.customerName || '—',
          rows: [],
        });
      }
      map.get(invId)!.rows.push(line);
    }
    return Array.from(map.values());
  }, [filtered]);

  const handleMarkOverdue = async () => {
    setMarking(true);
    try {
      await markInstallmentsOverdue();
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to mark overdue';
      setError(msg);
    } finally {
      setMarking(false);
    }
  };

  if (configLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (!showInstallmentSalesUi) {
    return (
      <div className="p-8 max-w-xl">
        <h1 className="text-xl font-bold text-zinc-900">Sales Installments</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Installment sales are not enabled for this company. Enable them under{' '}
          <Link href="/companies/profile" className="text-[#014582] font-medium hover:underline">
            Company Profile → Business config
          </Link>{' '}
          (Sales model: Installment or Both).
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
            Sales Installments
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Work queue for installment receivables — collect against schedule, track overdue, and
            post Cash/Bank vs AR.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            disabled={marking}
            onClick={() => void handleMarkOverdue()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {marking ? 'Updating…' : 'Mark overdue'}
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Scheduled', value: summary.scheduledTotal, color: 'text-zinc-900' },
            { label: 'Collected', value: summary.paidTotal, color: 'text-emerald-700' },
            { label: 'Outstanding', value: summary.outstandingTotal, color: 'text-zinc-900' },
            { label: 'Overdue', value: summary.overdueTotal, color: 'text-red-700' },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-zinc-200 bg-white p-3">
              <p className="text-xs text-zinc-500">{c.label}</p>
              <p className={`text-lg font-bold ${c.color}`}>{formatCurrency(c.value || 0)}</p>
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
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.id
                ? 'bg-[#014582] text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
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
        <div className="flex items-center gap-2 text-zinc-500 py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading schedule…
        </div>
      ) : byInvoice.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
          No installment lines for this filter. Create an installment sales invoice to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {byInvoice.map((group) => {
            const openAmt = group.rows.reduce((s, r) => s + lineOutstanding(r), 0);
            const next = group.rows.find((r) =>
              ['Pending', 'Partial', 'Overdue'].includes(String(r.status))
            );
            return (
              <div
                key={group.invoiceId}
                className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-zinc-50 border-b border-zinc-100">
                  <div>
                    <Link
                      href={`/sales/installments/${group.invoiceId}`}
                      className="font-semibold text-[#014582] hover:underline"
                    >
                      {group.invoiceNumber}
                    </Link>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {group.customerName}
                      {next
                        ? ` · Next #${next.installmentNumber} due ${new Date(
                            next.dueDate
                          ).toLocaleDateString()} · ${formatCurrency(lineOutstanding(next))}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-600">
                      Open {formatCurrency(openAmt)}
                    </span>
                    {openAmt > 0.001 && (
                      <Link
                        href={`/sales/installments/${group.invoiceId}/collect`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#014582] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#01366a]"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Collect
                      </Link>
                    )}
                    <Link
                      href={`/sales/installments/${group.invoiceId}`}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Schedule
                    </Link>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="text-zinc-500 bg-white">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">#</th>
                        <th className="px-4 py-2 text-left font-semibold">Due</th>
                        <th className="px-4 py-2 text-right font-semibold">Amount</th>
                        <th className="px-4 py-2 text-right font-semibold">Paid</th>
                        <th className="px-4 py-2 text-right font-semibold">Balance</th>
                        <th className="px-4 py-2 text-left font-semibold">Status</th>
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
                          <td className="px-4 py-2 text-right text-emerald-700">
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { SalesInstallmentsPage };
