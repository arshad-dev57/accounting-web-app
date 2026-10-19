'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, CalendarClock } from 'lucide-react';
import {
  fetchCustomerInstallmentSummary,
  fetchSupplierInstallmentSummary,
} from '@/api/installments/route';
import { useCompanyBusinessConfig } from '@/lib/company-business-config';

type Props = {
  side: 'customer' | 'supplier';
  partyId: string;
  formatCurrency: (n: number) => string;
};

export default function InstallmentAccountSummary({
  side,
  partyId,
  formatCurrency,
}: Props) {
  const { showInstallmentSalesUi, showInstallmentPurchaseUi } =
    useCompanyBusinessConfig();
  const enabled =
    side === 'customer' ? showInstallmentSalesUi : showInstallmentPurchaseUi;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    summary?: {
      scheduledTotal: number;
      paidTotal: number;
      outstandingTotal: number;
      overdueTotal: number;
      nextDueDate?: string | null;
      nextDueAmount?: number;
      lineCount?: number;
    };
    invoices?: Array<{ id: string; invoiceNumber: string; outstanding: number }>;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !partyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result =
          side === 'customer'
            ? await fetchCustomerInstallmentSummary(partyId)
            : await fetchSupplierInstallmentSummary(partyId);
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, partyId, side]);

  if (!enabled) return null;

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading installment summary…
      </div>
    );
  }

  if (!data?.summary || !(data.summary.lineCount || data.invoices?.length)) {
    return null;
  }

  const s = data.summary;
  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-[#014582]" />
        {side === 'customer' ? 'Installment receivables' : 'Installment payables'}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="rounded-lg bg-white border p-2.5">
          <p className="text-gray-500">Scheduled</p>
          <p className="font-semibold">{formatCurrency(s.scheduledTotal || 0)}</p>
        </div>
        <div className="rounded-lg bg-white border p-2.5">
          <p className="text-gray-500">Paid</p>
          <p className="font-semibold text-emerald-700">
            {formatCurrency(s.paidTotal || 0)}
          </p>
        </div>
        <div className="rounded-lg bg-white border p-2.5">
          <p className="text-gray-500">Outstanding</p>
          <p className="font-semibold">{formatCurrency(s.outstandingTotal || 0)}</p>
        </div>
        <div className="rounded-lg bg-white border p-2.5">
          <p className="text-gray-500">Overdue</p>
          <p className="font-semibold text-red-700">
            {formatCurrency(s.overdueTotal || 0)}
          </p>
        </div>
      </div>
      {s.nextDueDate && (
        <p className="text-xs text-gray-600">
          Next due {new Date(s.nextDueDate).toLocaleDateString()}
          {s.nextDueAmount != null ? ` · ${formatCurrency(s.nextDueAmount)}` : ''}
        </p>
      )}
      {!!data.invoices?.length && (
        <ul className="text-xs text-gray-700 space-y-1">
          {data.invoices.slice(0, 5).map((inv) => (
            <li key={inv.id} className="flex justify-between gap-2">
              <Link
                href={
                  side === 'customer'
                    ? `/sales/installments/${inv.id}`
                    : `/purchases/installments/${inv.id}`
                }
                className="text-[#014582] font-medium hover:underline"
              >
                {inv.invoiceNumber}
              </Link>
              <span className="font-medium">{formatCurrency(inv.outstanding || 0)}</span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={side === 'customer' ? '/sales/installments' : '/purchases/installments'}
        className="inline-block text-xs font-semibold text-[#014582] hover:underline"
      >
        Open installment work queue →
      </Link>
    </section>
  );
}
