'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';

type Props = {
  side: 'sales' | 'purchase';
  invoiceNumber?: string;
  paymentJournalEntryId?: string | null;
  paymentEntryNumber?: string | null;
};

/**
 * Explains standard accounting for installment invoices:
 * - Invoice post: Dr AR (or AP) / Cr Revenue (or Inventory/Expense) for full amount
 * - Each collection: Dr Cash|Bank / Cr AR (or Dr AP / Cr Cash|Bank)
 * Schedule tracks due dates; G/L uses normal invoice + payment JEs.
 */
export default function InstallmentAccountingNotes({
  side,
  invoiceNumber,
  paymentJournalEntryId,
  paymentEntryNumber,
}: Props) {
  const isSales = side === 'sales';
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 space-y-2 text-xs text-zinc-700">
      <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#014582]" />
        Accounting treatment
      </h4>
      <ol className="list-decimal pl-4 space-y-1">
        <li>
          {isSales
            ? 'On invoice post: Debit Accounts Receivable / Credit Sales Revenue for the full invoice total (including future installments).'
            : 'On invoice post: Debit inventory/expense / Credit Accounts Payable for the full invoice total.'}
        </li>
        <li>
          {isSales
            ? 'On each installment collection: Debit Cash or Bank / Credit Accounts Receivable for the amount collected.'
            : 'On each installment payment: Debit Accounts Payable / Credit Cash or Bank for the amount paid.'}
        </li>
        <li>
          The installment schedule is operational tracking (due dates & balances). It stays in sync when you collect/pay from this module.
        </li>
      </ol>
      {invoiceNumber && (
        <p className="text-zinc-500">
          Invoice reference: <span className="font-medium text-zinc-800">{invoiceNumber}</span>
        </p>
      )}
      {paymentJournalEntryId && (
        <p>
          Latest payment JE:{' '}
          <Link
            href={`/accounting/journal-entries?search=${encodeURIComponent(
              paymentEntryNumber || paymentJournalEntryId
            )}`}
            className="font-semibold text-[#014582] hover:underline"
          >
            {paymentEntryNumber || paymentJournalEntryId}
          </Link>
        </p>
      )}
      <p>
        <Link href="/accounting/installments" className="text-[#014582] hover:underline font-medium">
          Open installment overview in Accounting →
        </Link>
      </p>
    </div>
  );
}
