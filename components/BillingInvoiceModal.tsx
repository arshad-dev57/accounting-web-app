'use client';

import { X, Printer } from 'lucide-react';
import { formatUsd, PRICING } from '../lib/subscription-pricing';
import type { BillingInvoice, CompanyBilling } from '../lib/subscription-service';

const BRAND = '#014582';

type Props = {
  invoice: BillingInvoice;
  company: CompanyBilling['company'];
  onClose: () => void;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function planLabel(invoice: BillingInvoice) {
  const tier =
    invoice.productTier === 'pos' ? PRICING.pos.label : PRICING.erp_pos.label;
  if (invoice.plan === 'trial') return '14-day Trial';
  const cycle = invoice.plan === 'yearly' ? 'Yearly' : 'Monthly';
  return `${tier} · ${cycle}`;
}

function statusTone(status: string) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-800';
  if (status === 'cancelled') return 'bg-neutral-100 text-neutral-600';
  return 'bg-amber-100 text-amber-800';
}

export default function BillingInvoiceModal({ invoice, company, onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4 print:bg-white print:p-0">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl print:max-h-none print:shadow-none">
        <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-4 print:hidden">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Invoice</h2>
            <p className="text-sm text-neutral-500">{invoice.invoiceNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div id="billing-invoice-print" className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Bisonstechs ERP
              </p>
              <h3 className="mt-1 text-2xl font-bold" style={{ color: BRAND }}>
                {invoice.invoiceNumber}
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                Issued {formatDate(invoice.createdAt)}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusTone(invoice.status)}`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Bill to</p>
              <p className="mt-2 font-semibold text-neutral-900">{company.name}</p>
              {company.email && <p className="text-sm text-neutral-600">{company.email}</p>}
              {company.phone && <p className="text-sm text-neutral-600">{company.phone}</p>}
              {company.address && <p className="text-sm text-neutral-600">{company.address}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Billing period
              </p>
              <p className="mt-2 text-sm text-neutral-700">
                {formatDate(invoice.startDate)} — {formatDate(invoice.endDate)}
              </p>
              {invoice.paidBy?.email && (
                <p className="mt-3 text-sm text-neutral-500">
                  Paid by {invoice.paidBy.name || invoice.paidBy.email}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-neutral-100">
                  <td className="px-4 py-4">
                    <p className="font-medium text-neutral-900">{planLabel(invoice)}</p>
                    <p className="mt-1 text-neutral-500">
                      {invoice.type === 'upgrade' ? 'Subscription upgrade' : 'Subscription payment'}
                      {invoice.licensedUsers != null && (
                        <> · {invoice.licensedUsers} user(s)</>
                      )}
                      {invoice.productTier === 'erp_pos' && invoice.licensedBranches != null && (
                        <> · {invoice.licensedBranches} branch(es)</>
                      )}
                    </p>
                    {invoice.transactionId && (
                      <p className="mt-1 text-xs text-neutral-400">
                        Ref: {invoice.transactionId}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-neutral-900">
                    {formatUsd(invoice.amount, invoice.currency)}
                  </td>
                </tr>
                {invoice.type === 'upgrade' && invoice.delta != null && invoice.delta > 0 && (
                  <tr className="border-t border-neutral-100 bg-neutral-50/50">
                    <td className="px-4 py-3 text-neutral-600">Upgrade adjustment</td>
                    <td className="px-4 py-3 text-right text-neutral-600">
                      +{formatUsd(invoice.delta!, invoice.currency)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t border-neutral-200 bg-neutral-50">
                <tr>
                  <td className="px-4 py-3 font-semibold text-neutral-900">Total paid</td>
                  <td className="px-4 py-3 text-right text-lg font-bold" style={{ color: BRAND }}>
                    {formatUsd(invoice.amount, invoice.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="mt-6 text-center text-xs text-neutral-400">
            Thank you for subscribing to Bisonstechs ERP Suite.
          </p>
        </div>
      </div>
    </div>
  );
}
