'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  Loader2,
  Save,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCurrency } from '@/lib/currency-context';
import {
  bankAccountService,
  BankAccount,
} from '@/app/api/bankAccounts/route';
import { transferService } from '@/lib/transfer-service';

export default function BankTransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedFrom = searchParams.get('from') ?? '';

  const { symbol: currencySymbol } = useCurrency();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fromAccountId, setFromAccountId] = useState(preselectedFrom);
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bankAccountService.getAccounts({ limit: 200, status: 'Active' });
      setAccounts(response.data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load bank accounts';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (preselectedFrom) setFromAccountId(preselectedFrom);
  }, [preselectedFrom]);

  const fromAccount = useMemo(
    () => accounts.find((account) => account.id === fromAccountId) ?? null,
    [accounts, fromAccountId]
  );

  const toAccount = useMemo(
    () => accounts.find((account) => account.id === toAccountId) ?? null,
    [accounts, toAccountId]
  );

  const toAccountOptions = useMemo(
    () => accounts.filter((account) => account.id !== fromAccountId),
    [accounts, fromAccountId]
  );

  const formatCurrency = (value: number, currency?: string) => {
    const prefix = currency && currency !== 'PKR' ? `${currency} ` : `${currencySymbol} `;
    return `${prefix}${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const canTransfer =
    fromAccountId &&
    toAccountId &&
    fromAccountId !== toAccountId &&
    amount > 0 &&
    fromAccount != null &&
    amount <= fromAccount.currentBalance;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canTransfer || !fromAccount || !toAccount) {
      toast.error('Please check From Account, To Account, and Amount');
      return;
    }

    setSubmitting(true);
    try {
      await transferService.createTransfer({
        fromAccountId,
        toAccountId,
        amount,
        date: new Date(`${date}T12:00:00`).toISOString(),
        reference: reference.trim(),
        description:
          description.trim() ||
          `Transfer from ${fromAccount.accountName} to ${toAccount.accountName}`,
      });
      toast.success('Transfer completed successfully');
      router.push('/accounting/bank-Accounts');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Transfer failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/accounting/bank-Accounts"
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
          Transfer Money
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#014582]/10">
            <ArrowLeftRight className="w-5 h-5 text-[#014582]" />
          </div>
          <div>
            <p className="text-sm md:text-base font-bold text-gray-800">
              Transfer Between Accounts
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Move money from one bank account to another
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-7 h-7 mx-auto text-[#014582] animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Loading bank accounts...</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-5"
        >
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
              From Account *
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => {
                setFromAccountId(e.target.value);
                if (e.target.value === toAccountId) setToAccountId('');
              }}
              className="w-full px-3 md:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50"
              required
            >
              <option value="">Select source account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountName} ({account.accountNumber}) —{' '}
                  {formatCurrency(account.currentBalance, account.currency)}
                </option>
              ))}
            </select>
            {fromAccount && (
              <p className="text-xs text-gray-500 mt-1.5">
                Available balance:{' '}
                <span className="font-semibold text-green-600">
                  {formatCurrency(fromAccount.currentBalance, fromAccount.currency)}
                </span>
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <div className="p-2 rounded-full bg-[#014582]/10">
              <ArrowDown className="w-5 h-5 text-[#014582]" />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
              To Account *
            </label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full px-3 md:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50"
              required
            >
              <option value="">Select destination account</option>
              {toAccountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountName} ({account.accountNumber}) —{' '}
                  {formatCurrency(account.currentBalance, account.currency)}
                </option>
              ))}
            </select>
            {toAccount && (
              <p className="text-xs text-gray-500 mt-1.5">
                Current balance:{' '}
                <span className="font-semibold">
                  {formatCurrency(toAccount.currentBalance, toAccount.currency)}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50"
                required
              />
            </div>
            {fromAccount && amount > fromAccount.currentBalance && (
              <p className="text-xs text-red-600 mt-1.5">Insufficient balance in source account</p>
            )}
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
              Transfer Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 md:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
              Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional reference"
              className="w-full px-3 md:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full px-3 md:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50 resize-none"
            />
          </div>

          {fromAccount && toAccount && fromAccount.currency !== toAccount.currency && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Cross-currency transfer: {fromAccount.currency} → {toAccount.currency}. Ensure amounts
              are correct for your books.
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <Link
              href="/accounting/bank-Accounts"
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !canTransfer}
              className="w-full sm:w-auto px-5 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Transfer Money
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
