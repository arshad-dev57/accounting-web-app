'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarClock,
  CreditCard,
  Loader2,
  Mail,
  Receipt,
} from 'lucide-react';
import {
  fetchSalesInstallmentSchedule,
  sendInstallmentReminder,
  type InstallmentLine,
  type InstallmentSummary,
} from '@/api/installments/route';
import { useCompanyBusinessConfig } from '@/lib/company-business-config';
import { useCurrency } from '@/lib/currency-context';
import { apiClient } from '@/lib/api-client';
import InstallmentStatusBadge from '@/components/installments/InstallmentStatusBadge';
import InstallmentAccountingNotes from '@/components/installments/InstallmentAccountingNotes';

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  invoiceDate?: string;
  dueDate?: string;
  grandTotal?: number;
  paidAmount?: number;
  outstanding?: number;
  invoiceStatus?: string;
  paymentStatus?: string;
  downPaymentAmount?: number;
  installmentCount?: number;
  installmentFrequency?: string;
  installmentAmount?: number;
  journalEntryId?: string | null;
  journalEntry?: { id: string; entryNumber?: string } | null;
};

export default function SalesInstallmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = String(params?.invoiceId || '');
  const { showInstallmentSalesUi } = useCompanyBusinessConfig();
  const { formatAmount } = useCurrency();
  const formatCurrency = (value: number) => formatAmount(Number(value) || 0);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [lines, setLines] = useState<InstallmentLine[]>([]);
  const [summary, setSummary] = useState<InstallmentSummary | null>(null);

  const load = useCallback(async () => {
    if (!invoiceId) {
      setLoading(false);
      setError('Missing invoice id');
      return;
    }
    setLoading(true);
    setError(null);
    let sched: { lines?: InstallmentLine[]; summary?: InstallmentSummary } | null =
      null;
    let inv: InvoiceDetail | null = null;
    const errors: string[] = [];

    try {
      sched = await fetchSalesInstallmentSchedule(invoiceId);
      setLines(sched?.lines || []);
      setSummary(sched?.summary || null);
    } catch (err: unknown) {
      errors.push(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load schedule'
      );
      setLines([]);
      setSummary(null);
    }

    try {
      // Backend path via Next rewrite: /api/sales/invoices/:id
      const invRes = await apiClient.get(`/api/sales/invoices/${invoiceId}`);
      const data = invRes.data?.data || invRes.data;
      if (invRes.success && data?.id) {
        inv = data;
      } else {
        errors.push(invRes.message || 'Invoice not found');
      }
    } catch (err: unknown) {
      errors.push(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load invoice'
      );
    }

    if (!inv) {
      const first = sched?.lines?.[0]?.invoice;
      inv = {
        id: invoiceId,
        invoiceNumber: first?.invoiceNumber || '—',
        customerId: first?.customerId,
        customerName: first?.customerName,
        grandTotal: first?.grandTotal,
        outstanding: first?.outstanding,
      };
    }
    setInvoice(inv);
    if (errors.length && !(sched?.lines?.length)) {
      setError(errors.join(' · '));
    }
    setLoading(false);
  }, [invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openOutstanding = Math.max(
    0,
    Number(summary?.outstandingTotal ?? invoice?.outstanding ?? 0)
  );

  const handleRemind = async () => {
    setSending(true);
    setNotice(null);
    setError(null);
    try {
      const res = await sendInstallmentReminder(invoiceId);
      setNotice(res?.message || 'Reminder sent (or queued).');
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to send reminder'
      );
    } finally {
      setSending(false);
    }
  };

  if (!showInstallmentSalesUi) {
    return (
      <div className="p-8 text-sm text-zinc-600">
        Installment sales UI is disabled for this company.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading schedule…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <button
          type="button"
          onClick={() => router.push('/sales/installments')}
          className="flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-[#014582] mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to installments
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <CalendarClock className="h-7 w-7 text-[#014582]" />
              {invoice?.invoiceNumber || 'Installment schedule'}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {invoice?.customerName || '—'}
              {invoice?.installmentCount
                ? ` · ${invoice.installmentCount} × ${invoice.installmentFrequency || 'monthly'}`
                : ''}
              {invoice?.downPaymentAmount
                ? ` · Down payment ${formatCurrency(Number(invoice.downPaymentAmount))}`
                : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {openOutstanding > 0.001 && (
              <Link
                href={`/sales/installments/${invoiceId}/collect`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#014582] px-3 py-2 text-xs font-semibold text-white hover:bg-[#01366a]"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Collect installment
              </Link>
            )}
            <button
              type="button"
              disabled={sending}
              onClick={() => void handleRemind()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5" />
              {sending ? 'Sending…' : 'Send reminder'}
            </button>
            <Link
              href="/sales/invoices"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <Receipt className="h-3.5 w-3.5" />
              Invoices
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs text-zinc-500">Invoice total</p>
          <p className="font-bold">{formatCurrency(Number(invoice?.grandTotal || 0))}</p>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs text-zinc-500">Invoice paid</p>
          <p className="font-bold text-emerald-700">
            {formatCurrency(Number(invoice?.paidAmount || 0))}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs text-zinc-500">Invoice outstanding</p>
          <p className="font-bold">{formatCurrency(Number(invoice?.outstanding || 0))}</p>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs text-zinc-500">Schedule outstanding</p>
          <p className="font-bold">
            {formatCurrency(Number(summary?.outstandingTotal || 0))}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 font-semibold text-sm text-zinc-900">
          Installment schedule
        </div>
        {lines.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">No schedule lines found for this invoice.</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">#</th>
                <th className="px-4 py-2 text-left font-semibold">Due date</th>
                <th className="px-4 py-2 text-right font-semibold">Amount</th>
                <th className="px-4 py-2 text-right font-semibold">Paid</th>
                <th className="px-4 py-2 text-right font-semibold">Balance</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const bal = Math.max(
                  0,
                  Number(line.amount) - Number(line.paidAmount || 0)
                );
                const canCollect =
                  bal > 0.001 &&
                  !['Paid', 'Cancelled'].includes(String(line.status));
                return (
                  <tr key={line.id} className="border-t border-zinc-100">
                    <td className="px-4 py-2.5">{line.installmentNumber}</td>
                    <td className="px-4 py-2.5">
                      {new Date(line.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {formatCurrency(Number(line.amount))}
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-700">
                      {formatCurrency(Number(line.paidAmount || 0))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {formatCurrency(bal)}
                    </td>
                    <td className="px-4 py-2.5">
                      <InstallmentStatusBadge status={line.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      {canCollect ? (
                        <Link
                          href={`/sales/installments/${invoiceId}/collect?lineId=${line.id}`}
                          className="font-semibold text-[#014582] hover:underline"
                        >
                          Collect
                        </Link>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <InstallmentAccountingNotes
        side="sales"
        invoiceNumber={invoice?.invoiceNumber}
        paymentJournalEntryId={invoice?.journalEntryId || invoice?.journalEntry?.id}
        paymentEntryNumber={invoice?.journalEntry?.entryNumber}
      />

      {invoice?.customerId && (
        <p className="text-xs text-zinc-500">
          Customer ledger:{' '}
          <Link
            href={`/warehouse/customers/${invoice.customerId}`}
            className="text-[#014582] hover:underline font-medium"
          >
            View customer installment summary
          </Link>
        </p>
      )}
    </div>
  );
}
