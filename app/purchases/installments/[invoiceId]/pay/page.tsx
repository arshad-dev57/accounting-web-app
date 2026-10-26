'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  fetchPurchaseInstallmentSchedule,
  type InstallmentLine,
} from '@/api/installments/route';
import { purchasePaymentService, BankAccount } from '@/api/purchasepayments/route';
import { useCompanyBusinessConfig } from '@/lib/company-business-config';
import { useCurrency } from '@/lib/currency-context';
import { apiClient } from '@/lib/api-client';
import InstallmentStatusBadge from '@/components/installments/InstallmentStatusBadge';
import InstallmentAccountingNotes from '@/components/installments/InstallmentAccountingNotes';

const METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Other'];

function lineBalance(line: InstallmentLine) {
  return Math.max(0, Number(line.amount || 0) - Number(line.paidAmount || 0));
}

export default function PayPurchaseInstallmentPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <PayPurchaseInstallmentPageContent />
    </React.Suspense>
  );
}

function PayPurchaseInstallmentPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceId = String(params?.invoiceId || '');
  const preselectLineId = searchParams.get('lineId') || '';
  const { showInstallmentPurchaseUi } = useCompanyBusinessConfig();
  const { formatAmount } = useCurrency();
  const formatCurrency = (value: number) => formatAmount(Number(value) || 0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ paymentNumber?: string } | null>(null);
  const [invoice, setInvoice] = useState<{
    id: string;
    invoiceNumber: string;
    supplierId: string;
    supplierName: string;
    outstanding: number;
  } | null>(null);
  const [lines, setLines] = useState<InstallmentLine[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
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

  const load = useCallback(async () => {
    if (!invoiceId) return;
    setLoading(true);
    setError('');
    try {
      const [sched, invRes, banks] = await Promise.all([
        fetchPurchaseInstallmentSchedule(invoiceId),
        apiClient.get(`/api/purchase/invoices/${invoiceId}`),
        purchasePaymentService.getBankAccounts().catch(() => [] as BankAccount[]),
      ]);
      setLines(sched?.lines || []);
      setBankAccounts(banks || []);
      const inv = invRes.data?.data || invRes.data;
      if (!inv?.id) throw new Error('Invoice not found');
      setInvoice({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        supplierId: inv.supplierId,
        supplierName: inv.supplierName || inv.supplier?.name || '',
        outstanding: Number(inv.outstanding) || 0,
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
    if (!invoice) return;
    const payAmt = parseFloat(amount);
    if (selectedIds.length === 0) {
      setError('Select at least one installment line.');
      return;
    }
    if (!(payAmt > 0)) {
      setError('Enter a valid amount.');
      return;
    }
    if (
      (paymentMethod === 'Bank Transfer' || paymentMethod === 'Cheque') &&
      !bankAccountId
    ) {
      setError('Select a bank account.');
      return;
    }
    const bank = bankAccounts.find((b) => b.id === bankAccountId);
    setSubmitting(true);
    setError('');
    try {
      const payment = await purchasePaymentService.makePayment({
        supplierId: invoice.supplierId,
        supplierName: invoice.supplierName,
        amount: payAmt,
        paymentMethod,
        reference: reference || `INST-${invoice.invoiceNumber}`,
        notes:
          notes ||
          `Installment payment for ${invoice.invoiceNumber}`,
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
      setSuccess({ paymentNumber: payment?.paymentNumber });
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Payment failed'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!showInstallmentPurchaseUi) {
    return <div className="p-8 text-sm">Purchase installments disabled.</div>;
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
      <div className="p-6 max-w-lg mx-auto space-y-4 text-center">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 space-y-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h1 className="text-xl font-bold text-emerald-900">Installment paid</h1>
          <p className="text-sm text-emerald-800">
            {success.paymentNumber || 'Payment'} recorded. Schedule and AP updated.
          </p>
        </div>
        <Link
          href={`/purchases/installments/${invoiceId}`}
          className="inline-block rounded-lg bg-[#014582] px-4 py-2 text-xs font-semibold text-white"
        >
          Back to schedule
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.push(`/purchases/installments/${invoiceId}`)}
        className="flex items-center gap-1 text-sm text-zinc-500"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <CreditCard className="h-7 w-7 text-[#014582]" />
        Pay installment
      </h1>
      <p className="text-sm text-zinc-500">
        {invoice?.invoiceNumber} · {invoice?.supplierName} · Outstanding{' '}
        {formatCurrency(invoice?.outstanding || 0)}
      </p>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 flex gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-white overflow-hidden">
        <ul className="divide-y">
          {openLines.map((line) => (
            <li key={line.id}>
              <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(line.id)}
                  onChange={() => toggleLine(line.id)}
                />
                <div className="flex-1">
                  <div className="flex gap-2 text-sm items-center">
                    <span className="font-semibold">#{line.installmentNumber}</span>
                    <span className="text-zinc-500">
                      {new Date(line.dueDate).toLocaleDateString()}
                    </span>
                    <InstallmentStatusBadge status={line.status} />
                  </div>
                </div>
                <span className="font-bold text-sm">{formatCurrency(lineBalance(line))}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs space-y-1 block">
            <span className="font-medium text-zinc-600">Amount</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs space-y-1 block">
            <span className="font-medium text-zinc-600">Method</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              {METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          {(paymentMethod === 'Bank Transfer' || paymentMethod === 'Cheque') && (
            <label className="text-xs space-y-1 block sm:col-span-2">
              <span className="font-medium text-zinc-600">Bank account</span>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.accountName}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-xs space-y-1 block sm:col-span-2">
            <span className="font-medium text-zinc-600">Reference</span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs space-y-1 block sm:col-span-2">
            <span className="font-medium text-zinc-600">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleSubmit()}
          className="w-full rounded-lg bg-[#014582] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? 'Posting…' : 'Pay installment'}
        </button>
      </div>

      <InstallmentAccountingNotes side="purchase" invoiceNumber={invoice?.invoiceNumber} />
    </div>
  );
}
