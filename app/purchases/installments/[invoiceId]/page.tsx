'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarClock, CreditCard, Loader2 } from 'lucide-react';
import {
  fetchPurchaseInstallmentSchedule,
  type InstallmentLine,
  type InstallmentSummary,
} from '@/api/installments/route';
import { useCompanyBusinessConfig } from '@/lib/company-business-config';
import { useCurrency } from '@/lib/currency-context';
import { apiClient } from '@/lib/api-client';
import InstallmentStatusBadge from '@/components/installments/InstallmentStatusBadge';
import InstallmentAccountingNotes from '@/components/installments/InstallmentAccountingNotes';

export default function PurchaseInstallmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = String(params?.invoiceId || '');
  const { showInstallmentPurchaseUi } = useCompanyBusinessConfig();
  const { formatAmount } = useCurrency();
  const formatCurrency = (value: number) => formatAmount(Number(value) || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<{
    id: string;
    invoiceNumber: string;
    supplierId?: string;
    supplierName?: string;
    grandTotal?: number;
    paidAmount?: number;
    outstanding?: number;
    downPaymentAmount?: number;
    installmentCount?: number;
    installmentFrequency?: string;
  } | null>(null);
  const [lines, setLines] = useState<InstallmentLine[]>([]);
  const [summary, setSummary] = useState<InstallmentSummary | null>(null);

  const load = useCallback(async () => {
    if (!invoiceId) return;
    setLoading(true);
    setError(null);
    try {
      const [sched, invRes] = await Promise.all([
        fetchPurchaseInstallmentSchedule(invoiceId),
        apiClient.get(`/api/purchase/invoices/${invoiceId}`),
      ]);
      setLines(sched?.lines || []);
      setSummary(sched?.summary || null);
      const inv = invRes.data?.data || invRes.data;
      if (inv?.id) setInvoice(inv);
      else {
        const first = sched?.lines?.[0]?.invoice;
        setInvoice({
          id: invoiceId,
          invoiceNumber: first?.invoiceNumber || invoiceId,
          supplierId: first?.supplierId,
          supplierName: first?.supplierName,
          outstanding: first?.outstanding,
          grandTotal: first?.grandTotal,
        });
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
  }, [invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!showInstallmentPurchaseUi) {
    return <div className="p-8 text-sm text-zinc-600">Purchase installments disabled.</div>;
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  const open = Number(summary?.outstandingTotal || invoice?.outstanding || 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.push('/purchases/installments')}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-[#014582]"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-[#014582]" />
            {invoice?.invoiceNumber}
          </h1>
          <p className="text-sm text-zinc-500">{invoice?.supplierName}</p>
        </div>
        {open > 0.001 && (
          <Link
            href={`/purchases/installments/${invoiceId}/pay`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#014582] px-3 py-2 text-xs font-semibold text-white"
          >
            <CreditCard className="h-3.5 w-3.5" /> Pay installment
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs text-zinc-500">Total</p>
          <p className="font-bold">{formatCurrency(Number(invoice?.grandTotal || 0))}</p>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs text-zinc-500">Paid</p>
          <p className="font-bold text-emerald-700">
            {formatCurrency(Number(invoice?.paidAmount || 0))}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs text-zinc-500">Outstanding</p>
          <p className="font-bold">{formatCurrency(Number(invoice?.outstanding || 0))}</p>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs text-zinc-500">Schedule open</p>
          <p className="font-bold">{formatCurrency(Number(summary?.outstandingTotal || 0))}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="min-w-full text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Due</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-right">Paid</th>
              <th className="px-4 py-2 text-right">Balance</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const bal = Math.max(0, Number(line.amount) - Number(line.paidAmount || 0));
              const canPay =
                bal > 0.001 && !['Paid', 'Cancelled'].includes(String(line.status));
              return (
                <tr key={line.id} className="border-t">
                  <td className="px-4 py-2">{line.installmentNumber}</td>
                  <td className="px-4 py-2">{new Date(line.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(Number(line.amount))}</td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(Number(line.paidAmount || 0))}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(bal)}</td>
                  <td className="px-4 py-2">
                    <InstallmentStatusBadge status={line.status} />
                  </td>
                  <td className="px-4 py-2">
                    {canPay ? (
                      <Link
                        href={`/purchases/installments/${invoiceId}/pay?lineId=${line.id}`}
                        className="font-semibold text-[#014582] hover:underline"
                      >
                        Pay
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <InstallmentAccountingNotes side="purchase" invoiceNumber={invoice?.invoiceNumber} />
    </div>
  );
}
