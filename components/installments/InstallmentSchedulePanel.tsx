'use client';

import Link from 'next/link';
import { CalendarClock, CreditCard, AlertTriangle } from 'lucide-react';

export type InstallmentLine = {
  id?: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount?: number;
  status: string;
};

type Props = {
  isInstallment: boolean;
  downPaymentAmount?: number;
  installmentCount?: number | null;
  installmentFrequency?: string | null;
  installmentAmount?: number | null;
  lines?: InstallmentLine[];
  /** Invoice-level outstanding — used when schedule lines are still loading */
  invoiceOutstanding?: number;
  formatCurrency: (n: number) => string;
  /** sales → receive payment; purchase → pay supplier */
  collectHref?: string;
  collectLabel?: string;
  /** Dedicated installment schedule page */
  scheduleHref?: string;
  side?: 'sales' | 'purchase';
};

function statusClass(status: string) {
  const s = String(status || '').toLowerCase();
  if (s === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'overdue') return 'bg-red-50 text-red-700 border-red-200';
  if (s === 'partial') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (s === 'cancelled') return 'bg-zinc-100 text-zinc-500 border-zinc-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
}

export default function InstallmentSchedulePanel({
  isInstallment,
  downPaymentAmount = 0,
  installmentCount,
  installmentFrequency,
  installmentAmount,
  lines = [],
  invoiceOutstanding,
  formatCurrency,
  collectHref,
  collectLabel = 'Collect payment',
  scheduleHref,
  side = 'sales',
}: Props) {
  if (!isInstallment) return null;

  const scheduled = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const paid = lines.reduce((s, l) => s + (Number(l.paidAmount) || 0), 0);
  const outstandingFromSchedule = Math.max(0, scheduled - paid);
  const outstanding =
    lines.length > 0
      ? outstandingFromSchedule
      : Math.max(0, Number(invoiceOutstanding) || 0);
  const overdue = lines
    .filter((l) => String(l.status).toLowerCase() === 'overdue')
    .reduce(
      (s, l) => s + Math.max(0, (Number(l.amount) || 0) - (Number(l.paidAmount) || 0)),
      0
    );
  const next = lines.find((l) => {
    const st = String(l.status).toLowerCase();
    return st === 'pending' || st === 'partial' || st === 'overdue';
  });

  return (
    <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#014582]" />
            {side === 'purchase' ? 'Supplier installment schedule' : 'Installment schedule'}
          </h3>
          <p className="mt-1 text-xs text-gray-600">
            {installmentCount || lines.length} × {installmentFrequency || 'monthly'}
            {installmentAmount != null
              ? ` · ~${formatCurrency(Number(installmentAmount))}/period`
              : ''}
            {downPaymentAmount > 0
              ? ` · Down payment ${formatCurrency(Number(downPaymentAmount))}`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {scheduleHref && (
            <Link
              href={scheduleHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-[#014582] hover:bg-blue-50"
            >
              Full schedule
            </Link>
          )}
          {collectHref && outstanding > 0.001 && (
            <Link
              href={collectHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#014582] px-3 py-2 text-xs font-semibold text-white hover:bg-[#01366a]"
            >
              <CreditCard className="h-3.5 w-3.5" />
              {collectLabel}
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="rounded-lg bg-white border border-gray-100 p-2.5">
          <p className="text-gray-500">Scheduled</p>
          <p className="font-semibold text-gray-900">{formatCurrency(scheduled)}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 p-2.5">
          <p className="text-gray-500">Collected / Paid</p>
          <p className="font-semibold text-emerald-700">{formatCurrency(paid)}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 p-2.5">
          <p className="text-gray-500">Outstanding</p>
          <p className="font-semibold text-gray-900">{formatCurrency(outstanding)}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 p-2.5">
          <p className="text-gray-500">Next due</p>
          <p className="font-semibold text-gray-900">
            {next
              ? `${new Date(next.dueDate).toLocaleDateString()} · ${formatCurrency(
                  Math.max(0, Number(next.amount) - Number(next.paidAmount || 0))
                )}`
              : '—'}
          </p>
        </div>
      </div>

      {overdue > 0.001 && (
        <p className="flex items-center gap-1.5 text-xs text-red-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          Overdue installment balance: {formatCurrency(overdue)}
        </p>
      )}

      {lines.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">#</th>
                <th className="px-3 py-2 text-left font-semibold">Due date</th>
                <th className="px-3 py-2 text-right font-semibold">Amount</th>
                <th className="px-3 py-2 text-right font-semibold">Paid</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id || line.installmentNumber} className="border-t border-gray-100">
                  <td className="px-3 py-2">{line.installmentNumber}</td>
                  <td className="px-3 py-2">
                    {new Date(line.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-right">{formatCurrency(Number(line.amount))}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(Number(line.paidAmount || 0))}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 font-medium ${statusClass(
                        line.status
                      )}`}
                    >
                      {line.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-gray-500">
          Loading installment lines… If this stays empty, close and reopen the invoice.
        </p>
      )}
    </div>
  );
}
