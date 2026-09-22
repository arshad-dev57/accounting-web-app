'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Banknote, Loader2, Save, X } from 'lucide-react';
import { useCurrency } from '@/lib/currency-context';
import { chartOfAccountService } from '@/lib/chart-of-accounts-service';

interface CreateBankAccountFormProps {
  onCancel: () => void;
  onSave: (data: Record<string, unknown>) => void | Promise<void>;
  submitting?: boolean;
}

export default function CreateBankAccountForm({
  onCancel,
  onSave,
  submitting = false,
}: CreateBankAccountFormProps) {
  const { symbol: currencySymbol } = useCurrency();
  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchCode: '',
    accountType: 'Current',
    currency: 'PKR',
    openingBalance: 0,
    offsetType: 'source_account',
    sourceAccountId: '',
  });

  const [sourceAccounts, setSourceAccounts] = useState<{ id: string; code: string; name: string }[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [sourcesLoaded, setSourcesLoaded] = useState(false);
  const [error, setError] = useState('');

  const accountTypes = ['Current', 'Savings', 'Business', 'Islamic'];
  const currencies = ['PKR', 'USD', 'EUR', 'GBP', 'AED'];

  useEffect(() => {
    if (formData.openingBalance <= 0 || sourcesLoaded) return;

    setLoadingSources(true);
    chartOfAccountService
      .getAccounts({ type: 'Asset', limit: 200 })
      .then((res) => {
        const accounts = (res.data || []).filter(
          (a: { type?: string }) => (a.type ?? 'Asset') === 'Asset'
        );
        setSourceAccounts(accounts);
        setSourcesLoaded(true);
      })
      .catch(() => setSourceAccounts([]))
      .finally(() => setLoadingSources(false));
  }, [formData.openingBalance, sourcesLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountName.trim()) {
      setError('Account name is required');
      return;
    }
    if (!formData.accountNumber.trim()) {
      setError('Account number is required');
      return;
    }
    if (!formData.bankName.trim()) {
      setError('Bank name is required');
      return;
    }
    if (
      formData.openingBalance > 0 &&
      formData.offsetType === 'source_account' &&
      !formData.sourceAccountId
    ) {
      setError('Select the cash/source account for this opening balance');
      return;
    }

    const payload: Record<string, unknown> = {
      accountName: formData.accountName.trim(),
      accountNumber: formData.accountNumber.trim(),
      bankName: formData.bankName.trim(),
      branchCode: formData.branchCode,
      accountType: formData.accountType,
      currency: formData.currency,
      openingBalance: formData.openingBalance,
    };

    if (formData.openingBalance > 0) {
      payload.offsetType = formData.offsetType;
      if (formData.offsetType === 'source_account') {
        payload.sourceAccountId = formData.sourceAccountId;
      }
    }

    setError('');
    onSave(payload);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <Banknote className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Add Bank Account</h2>
        </div>
        <button onClick={onCancel} type="button" className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Account Name *</label>
              <input
                type="text"
                placeholder="e.g., HBL Current Account"
                value={formData.accountName}
                onChange={(e) => setFormData((prev) => ({ ...prev, accountName: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Account Number *</label>
              <input
                type="text"
                placeholder="e.g., 1234-5678-9012"
                value={formData.accountNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Bank Name *</label>
              <input
                type="text"
                placeholder="e.g., Habib Bank Limited"
                value={formData.bankName}
                onChange={(e) => setFormData((prev) => ({ ...prev, bankName: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Branch Code</label>
              <input
                type="text"
                placeholder="e.g., 0123"
                value={formData.branchCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, branchCode: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Account Type</label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData((prev) => ({ ...prev, accountType: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                {accountTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Opening Balance</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.openingBalance || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    openingBalance: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              />
            </div>
          </div>

          {formData.openingBalance > 0 && (
            <div className="rounded-xl border border-[#014582]/15 bg-[#014582]/5 p-4 space-y-3">
              <p className="text-sm font-bold text-gray-800">Where is this opening balance from?</p>

              <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 bg-white p-3 hover:border-[#014582]/30 transition-colors">
                <input
                  type="radio"
                  name="offsetType"
                  value="source_account"
                  checked={formData.offsetType === 'source_account'}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      offsetType: 'source_account',
                    }))
                  }
                  className="mt-1 accent-[#014582]"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-800">Existing cash / another account</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Dr Bank / Cr source account</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 bg-white p-3 hover:border-[#014582]/30 transition-colors">
                <input
                  type="radio"
                  name="offsetType"
                  value="owner_capital"
                  checked={formData.offsetType === 'owner_capital'}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      offsetType: 'owner_capital',
                      sourceAccountId: '',
                    }))
                  }
                  className="mt-1 accent-[#014582]"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-800">Owner capital / new investment</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Dr Bank / Cr Capital</span>
                </span>
              </label>

              {formData.offsetType === 'source_account' && (
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                    Source account (Cash, etc.) *
                  </label>
                  {loadingSources ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-[#014582]" />
                    </div>
                  ) : (
                    <select
                      value={formData.sourceAccountId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          sourceAccountId: e.target.value,
                        }))
                      }
                      className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white"
                    >
                      <option value="">Select source account</option>
                      {sourceAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} — {account.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 md:pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Add Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
