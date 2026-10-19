'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Loader2, BookOpen, RefreshCw } from 'lucide-react';
import {
  fetchInstallmentReport,
  type InstallmentSummary,
} from '@/api/installments/route';
import { useCompanyBusinessConfig } from '@/lib/company-business-config';
import { useCurrency } from '@/lib/currency-context';
import InstallmentAccountingNotes from '@/components/installments/InstallmentAccountingNotes';

export default function AccountingInstallmentsPage() {
  const { showInstallmentSalesUi, showInstallmentPurchaseUi, config, loading: cfgLoading } =
    useCompanyBusinessConfig();
  const { formatAmount } = useCurrency();
  const formatCurrency = (value: number) => formatAmount(Number(value) || 0);
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<InstallmentSummary | null>(null);
  const [purchase, setPurchase] = useState<InstallmentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tasks: Promise<void>[] = [];
      if (showInstallmentSalesUi) {
        tasks.push(
          fetchInstallmentReport({ side: 'sales' }).then((d) => setSales(d?.summary || null))
        );
      } else setSales(null);
      if (showInstallmentPurchaseUi) {
        tasks.push(
          fetchInstallmentReport({ side: 'purchase' }).then((d) =>
            setPurchase(d?.summary || null)
          )
        );
      } else setPurchase(null);
      await Promise.all(tasks);
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load installment overview'
      );
    } finally {
      setLoading(false);
    }
  }, [showInstallmentSalesUi, showInstallmentPurchaseUi]);

  useEffect(() => {
    if (cfgLoading) return;
    if (!showInstallmentSalesUi && !showInstallmentPurchaseUi) return;
    void load();
  }, [cfgLoading, load, showInstallmentSalesUi, showInstallmentPurchaseUi]);

  if (cfgLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (!showInstallmentSalesUi && !showInstallmentPurchaseUi) {
    return (
      <div className="p-8 max-w-xl space-y-2">
        <h1 className="text-xl font-bold">Installments</h1>
        <p className="text-sm text-zinc-600">
          No installment models enabled. Configure under{' '}
          <Link href="/companies/profile" className="text-[#014582] font-medium hover:underline">
            Company Profile → Business config
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-[#014582]" />
            Installment accounting overview
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Revenue policy:{' '}
            <span className="font-medium text-zinc-800">
              {config.installmentRevenuePolicy || 'full_on_sale'}
            </span>
            {' · '}
            Schedule tracks dues; G/L uses standard invoice + payment journal entries.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {showInstallmentSalesUi && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-[#014582]" />
                Sales receivables
              </h2>
              <Link
                href="/sales/installments"
                className="text-xs font-semibold text-[#014582] hover:underline"
              >
                Open sales module →
              </Link>
            </div>
            {loading && !sales ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-zinc-50 p-2.5">
                  <p className="text-zinc-500">Scheduled</p>
                  <p className="font-bold">{formatCurrency(sales?.scheduledTotal || 0)}</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-2.5">
                  <p className="text-zinc-500">Collected</p>
                  <p className="font-bold text-emerald-700">
                    {formatCurrency(sales?.paidTotal || 0)}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-2.5">
                  <p className="text-zinc-500">Outstanding</p>
                  <p className="font-bold">{formatCurrency(sales?.outstandingTotal || 0)}</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-2.5">
                  <p className="text-zinc-500">Overdue</p>
                  <p className="font-bold text-red-700">
                    {formatCurrency(sales?.overdueTotal || 0)}
                  </p>
                </div>
              </div>
            )}
            <p className="text-[11px] text-zinc-500">
              Collect from Sales → Installments. Each collection posts Dr Cash/Bank · Cr AR.
            </p>
          </section>
        )}

        {showInstallmentPurchaseUi && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-[#014582]" />
                Purchase payables
              </h2>
              <Link
                href="/purchases/installments"
                className="text-xs font-semibold text-[#014582] hover:underline"
              >
                Open purchases module →
              </Link>
            </div>
            {loading && !purchase ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-zinc-50 p-2.5">
                  <p className="text-zinc-500">Scheduled</p>
                  <p className="font-bold">{formatCurrency(purchase?.scheduledTotal || 0)}</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-2.5">
                  <p className="text-zinc-500">Paid</p>
                  <p className="font-bold text-emerald-700">
                    {formatCurrency(purchase?.paidTotal || 0)}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-2.5">
                  <p className="text-zinc-500">Outstanding</p>
                  <p className="font-bold">
                    {formatCurrency(purchase?.outstandingTotal || 0)}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-2.5">
                  <p className="text-zinc-500">Overdue</p>
                  <p className="font-bold text-red-700">
                    {formatCurrency(purchase?.overdueTotal || 0)}
                  </p>
                </div>
              </div>
            )}
            <p className="text-[11px] text-zinc-500">
              Pay from Purchases → Installments. Each payment posts Dr AP · Cr Cash/Bank.
            </p>
          </section>
        )}
      </div>

      <InstallmentAccountingNotes side="sales" />

      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600 space-y-2">
        <h3 className="text-sm font-semibold text-zinc-900">Where to work</h3>
        <ul className="list-disc pl-4 space-y-1">
          {showInstallmentSalesUi && (
            <li>
              <Link href="/sales/installments" className="text-[#014582] font-medium hover:underline">
                Sales → Installments
              </Link>{' '}
              — collect receivables against schedule
            </li>
          )}
          {showInstallmentPurchaseUi && (
            <li>
              <Link
                href="/purchases/installments"
                className="text-[#014582] font-medium hover:underline"
              >
                Purchases → Installments
              </Link>{' '}
              — pay supplier schedule
            </li>
          )}
          <li>
            <Link
              href="/accounting/journal-entries"
              className="text-[#014582] font-medium hover:underline"
            >
              Journal Entries
            </Link>{' '}
            — view invoice and payment postings
          </li>
          <li>
            <Link
              href="/accounting/accounts-receivable"
              className="text-[#014582] font-medium hover:underline"
            >
              Accounts Receivable
            </Link>{' '}
            /{' '}
            <Link
              href="/accounting/accounts-payable"
              className="text-[#014582] font-medium hover:underline"
            >
              Accounts Payable
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export { AccountingInstallmentsPage };
