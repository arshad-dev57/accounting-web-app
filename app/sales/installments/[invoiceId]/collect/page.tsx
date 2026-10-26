'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchSalesInstallmentSchedule,
  type InstallmentLine,
} from '@/api/installments/route';
import { salesPaymentService, BankAccount } from '@/api/salespayment/route';
import { useCompanyBusinessConfig } from '@/lib/company-business-config';
import { useCurrency } from '@/lib/currency-context';
import { apiClient } from '@/lib/api-client';
import InstallmentStatusBadge from '@/components/installments/InstallmentStatusBadge';
import InstallmentAccountingNotes from '@/components/installments/InstallmentAccountingNotes';

const METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online', 'Other'];

function lineBalance(line: InstallmentLine) {
  return Math.max(0, Number(line.amount || 0) - Number(line.paidAmount || 0));
}

export default function CollectInstallmentPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <CollectInstallmentPageContent />
    </React.Suspense>
  );
}

function CollectInstallmentPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceId = String(params?.invoiceId || '');
  const preselectLineId = searchParams.get('lineId') || '';
  const { showInstallmentSalesUi } = useCompanyBusinessConfig();
  const { formatAmount } = useCurrency();
  const formatCurrency = (value: number) => formatAmount(Number(value) || 0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    paymentNumber?: string;
    journalEntryId?: string;
    entryNumber?: string;
  } | null>(null);

  const [invoice, setInvoice] = useState<{
    id: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    outstanding: number;
    grandTotal?: number;
  } | null>(null);
  const [lines, setLines] = useState<InstallmentLine[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankAccountId, setBankAccountId] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const openLines = useMemo(
    () =>
      lines.filter(
        (l) =>
          lineBalance(l) > 0.001 &&
          !['Paid', 'Cancelled'].includes(String(l.status))
      ),
    [lines]
  );

  const selectedBalance = useMemo(() => {
    const set = new Set(selectedIds);
    return openLines
      .filter((l) => set.has(l.id))
      .reduce((s, l) => s + lineBalance(l), 0);
  }, [openLines, selectedIds]);

  const load = useCallback(async () => {
    if (!invoiceId) return;
    setLoading(true);
    setError('');
    try {
      const [sched, invRes, banks] = await Promise.all([
        fetchSalesInstallmentSchedule(invoiceId),
        apiClient.get(`/api/sales/invoices/${invoiceId}`),
        salesPaymentService.getBankAccounts().catch(() => [] as BankAccount[]),
      ]);
      setLines(sched?.lines || []);
      setBankAccounts(banks || []);

      const inv = invRes.data?.data || invRes.data;
      if (!inv?.id) throw new Error(invRes.message || 'Invoice not found');
      setInvoice({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId,
        customerName: inv.customerName || inv.customer?.name || '',
        outstanding: Number(inv.outstanding) || 0,
        grandTotal: Number(inv.grandTotal) || 0,
      });

      const open = (sched?.lines || []).filter(
        (l: InstallmentLine) =>
          lineBalance(l) > 0.001 &&
          !['Paid', 'Cancelled'].includes(String(l.status))
      );
      let pick = open[0];
      if (preselectLineId) {
        pick = open.find((l: InstallmentLine) => l.id === preselectLineId) || pick;
      }
      if (pick) {
        setSelectedIds([pick.id]);
        setAmount(lineBalance(pick).toFixed(2));
      }
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load'
      );
    } finally {
      setLoading(false);
    }
  }, [invoiceId, preselectLineId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleLine = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      const bal = openLines
        .filter((l) => next.includes(l.id))
        .reduce((s, l) => s + lineBalance(l), 0);
      setAmount(bal > 0 ? bal.toFixed(2) : '');
      return next;
    });
  };

  const handleSubmit = async () => {
    setError('');
    if (!invoice) return;
    if (selectedIds.length === 0) {
      setError('Select at least one installment line to collect against.');
      return;
    }
    const payAmt = parseFloat(amount);
    if (!(payAmt > 0)) {
      setError('Enter a valid collection amount.');
      return;
    }
    if (payAmt > invoice.outstanding + 0.01) {
      setError(
        `Amount cannot exceed invoice outstanding (${formatCurrency(invoice.outstanding)}).`
      );
      return;
    }
    if (
      (paymentMethod === 'Bank Transfer' || paymentMethod === 'Cheque') &&
      !bankAccountId
    ) {
      setError('Select a bank account for this payment method.');
      return;
    }

    const bank = bankAccounts.find((b) => b.id === bankAccountId);
    setSubmitting(true);
    try {
      const payment = await salesPaymentService.receivePayment({
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        amount: payAmt,
        paymentMethod,
        paymentDate,
        reference: reference || `INST-${invoice.invoiceNumber}`,
        notes:
          notes ||
          `Installment collection for ${invoice.invoiceNumber} (lines: ${selectedIds.length})`,
        ...(paymentMethod !== 'Cash' && bank
          ? { bankAccountId: bank.id, bankAccountName: bank.accountName || '' }
          : {}),
        invoicePayments: [
          {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amountPaid: payAmt,
            preferredInstallmentIds: selectedIds,
          },
        ],
      });

      setSuccess({
        paymentNumber: payment?.paymentNumber,
        journalEntryId: payment?.journalEntry?.id,
        entryNumber: payment?.journalEntry?.entryNumber,
      });
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Collection failed'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!showInstallmentSalesUi) {
    return (
      <div className="p-8 text-sm text-zinc-600">Installment sales UI is disabled.</div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-6 max-w-lg mx-auto space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h1 className="text-xl font-bold text-emerald-900">Installment collected</h1>
          <p className="text-sm text-emerald-800">
            Payment {success.paymentNumber || 'recorded'}. Schedule and AR have been updated.
          </p>
          {success.journalEntryId && (
            <p className="text-xs text-emerald-700">
              Journal:{' '}
              <Link
                href={`/accounting/journal-entries?search=${encodeURIComponent(
                  success.entryNumber || success.journalEntryId
                )}`}
                className="font-semibold underline"
              >
                {success.entryNumber || success.journalEntryId}
              </Link>
              {' · '}Dr Cash/Bank · Cr Accounts Receivable
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link
            href={`/sales/installments/${invoiceId}`}
            className="rounded-lg bg-[#014582] px-4 py-2 text-xs font-semibold text-white"
          >
            Back to schedule
          </Link>
          <Link
            href="/sales/installments"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700"
          >
            All installments
          </Link>
          <button
            type="button"
            onClick={() => {
              setSuccess(null);
              void load();
            }}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700"
          >
            Collect another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <button
          type="button"
          onClick={() => router.push(`/sales/installments/${invoiceId}`)}
          className="flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-[#014582] mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to schedule
        </button>
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-[#014582]" />
          Collect installment
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {invoice?.invoiceNumber} · {invoice?.customerName} · Invoice outstanding{' '}
          {formatCurrency(invoice?.outstanding || 0)}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 flex gap-2 items-start">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 text-sm font-semibold">
          Select installment line(s)
        </div>
        {openLines.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">No open installment lines to collect.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {openLines.map((line) => {
              const bal = lineBalance(line);
              const checked = selectedIds.includes(line.id);
              return (
                <li key={line.id}>
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLine(line.id)}
                      className="rounded border-zinc-300 text-[#014582] focus:ring-[#014582]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold">#{line.installmentNumber}</span>
                        <span className="text-zinc-500">
                          Due {new Date(line.dueDate).toLocaleDateString()}
                        </span>
                        <InstallmentStatusBadge status={line.status} />
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {formatCurrency(Number(line.amount))} scheduled ·{' '}
                        {formatCurrency(Number(line.paidAmount || 0))} paid
                      </p>
                    </div>
                    <span className="text-sm font-bold text-zinc-900">
                      {formatCurrency(bal)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        {selectedIds.length > 0 && (
          <div className="px-4 py-2 bg-blue-50/60 text-xs text-blue-900 border-t border-blue-100">
            Selected balance {formatCurrency(selectedBalance)}. Amount applies to selected lines
            first, then remaining open lines in order (FIFO).
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">Payment details</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-xs space-y-1">
            <span className="font-medium text-zinc-600">Amount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs space-y-1">
            <span className="font-medium text-zinc-600">Payment date</span>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs space-y-1">
            <span className="font-medium text-zinc-600">Method</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          {(paymentMethod === 'Bank Transfer' || paymentMethod === 'Cheque') && (
            <label className="block text-xs space-y-1">
              <span className="font-medium text-zinc-600">Bank account</span>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                <option value="">Select account</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.accountName} ({b.bankName})
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-xs space-y-1 sm:col-span-2">
            <span className="font-medium text-zinc-600">Reference</span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Cheque no / transfer ref"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs space-y-1 sm:col-span-2">
            <span className="font-medium text-zinc-600">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={submitting || openLines.length === 0}
          onClick={() => void handleSubmit()}
          className="w-full rounded-lg bg-[#014582] py-2.5 text-sm font-semibold text-white hover:bg-[#01366a] disabled:opacity-50"
        >
          {submitting ? 'Posting collection…' : `Collect ${amount ? formatCurrency(parseFloat(amount) || 0) : ''}`}
        </button>
      </div>

      <InstallmentAccountingNotes
        side="sales"
        invoiceNumber={invoice?.invoiceNumber}
      />
    </div>
  );
}
