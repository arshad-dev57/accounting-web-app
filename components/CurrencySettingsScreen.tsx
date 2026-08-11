'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, DollarSign, Loader2, Search } from 'lucide-react';
import CurrencyList from 'currency-list';
import countryToCurrency from 'country-to-currency';
import {
  FAVORITE_CURRENCY_CODES,
  loadCurrencyLocal,
  setCurrency,
  type AppCurrency,
} from '../lib/currency-service';

const currencyToCountry: Record<string, string> = {};
for (const [countryCode, currencyCode] of Object.entries(countryToCurrency)) {
  if (!currencyToCountry[currencyCode as string]) {
    currencyToCountry[currencyCode as string] = countryCode;
  }
}

function getFlagEmoji(countryCode?: string) {
  if (!countryCode) return '🏳️';
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🏳️';
  }
}

type ListCurrency = {
  code: string;
  name: string;
  symbol: string;
  symbol_native?: string;
};

export default function CurrencySettingsScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<AppCurrency | null>(null);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const allCurrencies = useMemo(() => {
    try {
      return Object.values(CurrencyList.getAll('en_US')) as ListCurrency[];
    } catch {
      return [];
    }
  }, []);

  const favorites = useMemo(() => {
    return FAVORITE_CURRENCY_CODES.map((code) =>
      allCurrencies.find((c) => c.code === code)
    ).filter(Boolean) as ListCurrency[];
  }, [allCurrencies]);

  useEffect(() => {
    setSelected(loadCurrencyLocal());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return allCurrencies;
    return allCurrencies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.symbol || '').toLowerCase().includes(q) ||
        (c.symbol_native || '').toLowerCase().includes(q)
    );
  }, [allCurrencies, searchTerm]);

  const handleSelect = async (currency: ListCurrency) => {
    if (savingCode) return;
    setSavingCode(currency.code);

    const payload = {
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol || currency.symbol_native || currency.code,
      symbolNative: currency.symbol_native || currency.symbol,
      countryCode: currencyToCountry[currency.code],
    };

    // Optimistic local update (Flutter also writes prefs first)
    setSelected(payload);

    const result = await setCurrency(payload);

    if (result.success) {
      setToast({
        type: 'success',
        text: `Default currency changed to ${currency.name} (${payload.symbol})`,
      });
    } else {
      setToast({
        type: 'error',
        text: result.message || 'Saved locally but failed to sync with server',
      });
    }

    setSavingCode(null);
  };

  const isSearching = searchTerm.trim().length > 0;

  const renderRow = (currency: ListCurrency) => {
    const isSelected = selected?.code === currency.code;
    const isSaving = savingCode === currency.code;
    const countryCode = currencyToCountry[currency.code];

    return (
      <button
        key={currency.code}
        type="button"
        onClick={() => handleSelect(currency)}
        disabled={!!savingCode}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-60 ${
          isSelected ? 'bg-[#1088dd]/5' : 'hover:bg-gray-50'
        }`}
      >
        <span className="text-2xl w-9 text-center shrink-0">{getFlagEmoji(countryCode)}</span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold ${
              isSelected ? 'text-[#0b6bb3]' : 'text-gray-800'
            }`}
          >
            {currency.code}
          </p>
          <p className="text-xs text-gray-500 truncate">{currency.name}</p>
        </div>
        <span
          className={`text-base font-semibold shrink-0 ${
            isSelected ? 'text-[#1088dd]' : 'text-gray-700'
          }`}
        >
          {currency.symbol || currency.symbol_native}
        </span>
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin text-[#1088dd] shrink-0" />
        ) : isSelected ? (
          <span className="w-7 h-7 rounded-full bg-[#1088dd] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Check className="w-3.5 h-3.5" />
          </span>
        ) : (
          <span className="w-7 shrink-0" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-[#1088dd] text-white shadow-sm">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Currency Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Set your default currency for reports and transactions. Selection is saved to your
            account and restored on login.
          </p>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          {toast.text}
        </div>
      )}

      {selected && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">Selected Currency</h2>
            <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
              Active
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#1088dd]/10 rounded-xl flex items-center justify-center text-3xl">
              {getFlagEmoji(selected.countryCode || currencyToCountry[selected.code])}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{selected.name}</p>
              <p className="text-sm text-gray-500">
                {selected.code} · {selected.symbol}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h2 className="font-bold text-gray-800">All Currencies</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Showing {filtered.length} of {allCurrencies.length}
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search currency"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1088dd]/30 focus:border-[#1088dd] outline-none w-full sm:w-64"
            />
          </div>
        </div>

        <div className="max-h-[560px] overflow-y-auto divide-y divide-gray-50">
          {!isSearching && favorites.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Favorites
              </p>
              {favorites.map(renderRow)}
              <div className="mx-4 border-t border-gray-200" />
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                All
              </p>
            </>
          )}

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No currencies found</div>
          ) : (
            filtered.map(renderRow)
          )}
        </div>
      </div>
    </div>
  );
}
