'use client';

import { useEffect, useMemo, useState } from 'react';
import { Banknote, Loader2, X } from 'lucide-react';
import {
  purchasePaymentService,
  type BankAccount,
} from '../../api/purchasepayments/route';
import type { PurchaseInvoiceModel } from '../../api/purchaseinvoice/route';

interface CreatePaymentFromInvoiceModalProps {
  invoice: PurchaseInvoiceModel;
  onClose: () => void;
  onCreated: () => void;
  formatCurrency: (amount: number) => string;
}

const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Cheque',
  'Online Payment',
  'Credit Card',
] as const;

function needsBankAccount(method: string) {
  return (
    method === 'Bank Transfer' ||
    method === 'Cheque' ||
    method === 'Online Payment' ||
    method === 'Credit Card'
  );
}

export default function CreatePaymentFromInvoiceModal({
  invoice,
  onClose,
  onCreated,
  formatCurrency,
}: CreatePaymentFromInvoiceModalProps) {
  const outstanding = Number(invoice.outstanding) || 0;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [bankAccountId, setBankAccountId] = useState('');
  const [amount, setAmount] = useState(String(outstanding));
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (outstanding <= 0) {
          setError('This invoice has no outstanding balance to pay.');
          return;
        }
        if (invoice.invoiceStatus === 'Draft' || invoice.invoiceStatus === 'Cancelled') {
          setError('Post the invoice before recording a payment.');
          return;
        }
        const accounts = await purchasePaymentService.getBankAccounts();
        if (!cancelled) {
          setBankAccounts(accounts || []);
          setAmount(String(outstanding));
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load payment form');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invoice.id, invoice.invoiceStatus, outstanding]);

  const selectedBank = useMemo(
    () => bankAccounts.find((a) => a.id === bankAccountId) || null,
    [bankAccounts, bankAccountId]
  );

  const handleSubmit = async () => {
    const payAmount = Number(amount);
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      setError('Enter a valid payment amount');
      return;
    }
    if (payAmount > outstanding + 0.01) {
      setError(`Amount cannot exceed outstanding ${formatCurrency(outstanding)}`);
      return;
    }
    if (needsBankAccount(paymentMethod) && !selectedBank) {
      setError(`Select a bank account for ${paymentMethod}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await purchasePaymentService.makePayment({
        supplierId: invoice.supplierId,
        supplierName: invoice.supplierName,
        amount: payAmount,
        paymentMethod,
        bankAccountId: selectedBank?.id,
        bankAccountName: selectedBank?.accountName || '',
        reference: reference || undefined,
        notes: notes || undefined,
        currencyId: invoice.currencyId || invoice.currency?.id || undefined,
        exchangeRate: Number(invoice.exchangeRate) || 1,
        exchangeRateDate: new Date().toISOString().split('T')[0],
        invoicePayments: [
          {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amountPaid: payAmount,
          },
        ],
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !loading && outstanding > 0 && !['Draft', 'Cancelled'].includes(invoice.invoiceStatus);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[#014582]" />
              Record payment
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {invoice.invoiceNumber} · {invoice.supplierName}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {loading ? (
            <div className="py-10 text-center">
              <Loader2 className="w-7 h-7 mx-auto animate-spin text-[#014582]" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Invoice total</span>
                  <span>{formatCurrency(invoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 mt-1">
                  <span>Already paid</span>
                  <span>{formatCurrency(invoice.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 mt-1 pt-1 border-t border-gray-200">
                  <span>Outstanding</span>
                  <span className="text-[#014582]">{formatCurrency(outstanding)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-600 sm:col-span-2">
                  Amount to pay
                  <input
                    type="number"
                    min={0}
                    max={outstanding}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600 sm:col-span-2">
                  Payment method
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                {needsBankAccount(paymentMethod) && (
                  <label className="text-xs font-medium text-gray-600 sm:col-span-2">
                    Bank account
                    <select
                      value={bankAccountId}
                      onChange={(e) => setBankAccountId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Select bank account</option>
                      {bankAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.accountName} · {a.bankName}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="text-xs font-medium text-gray-600 sm:col-span-2">
                  Reference
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Cheque / txn reference"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600 sm:col-span-2">
                  Notes
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              {error && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 md:px-6 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => void handleSubmit()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#014582] hover:bg-[#01366a] disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Record payment
          </button>
        </div>
      </div>
    </div>
  );
}
