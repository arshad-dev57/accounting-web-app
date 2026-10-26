'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  DollarSign,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import CurrencyList from 'currency-list';
import countryToCurrency from 'country-to-currency';
import {
  FAVORITE_CURRENCY_CODES,
  loadCurrencyLocal,
  setCurrency,
  type AppCurrency,
} from '../lib/currency-service';
import {
  createCurrency,
  createExchangeRate,
  deleteExchangeRate,
  ensureCompanyBaseMatchesAppCurrency,
  fetchBaseCurrency,
  fetchCurrencies,
  fetchExchangeRates,
  setBaseCurrency,
  updateExchangeRate,
  type CurrencyMaster,
  type ExchangeRateRow,
} from '../lib/multi-currency';

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

export type CurrencySettingsTab = 'app' | 'rates';

type Props = {
  /** Which tab to open first (also used by old deep links). */
  initialTab?: CurrencySettingsTab;
};

export default function CurrencySettingsScreen({ initialTab = 'app' }: Props) {
  const [tab, setTab] = useState<CurrencySettingsTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-[#1088dd] text-white shadow-sm">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Currency Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the app currency used everywhere locally (also the Import FX conversion
            base), and conversion rates — all from this one page.
          </p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab('app')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'app'
              ? 'bg-white text-[#0b6bb3] shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          App Currency
        </button>
        <button
          type="button"
          onClick={() => setTab('rates')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            tab === 'rates'
              ? 'bg-white text-[#0b6bb3] shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          Conversion Rates
        </button>
      </div>

      {tab === 'app' ? <AppCurrencyPanel /> : <ConversionRatesPanel />}
    </div>
  );
}

/* ─── Tab 1: App / display currency (local everywhere) ─── */

function AppCurrencyPanel() {
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
    const local = loadCurrencyLocal();
    setSelected(local);
    // Heal existing selection: company FX base may still be PKR from defaults.
    void ensureCompanyBaseMatchesAppCurrency(local.code, {
      name: local.name,
      symbol: local.symbol,
    });
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

    setSelected(payload);

    const result = await setCurrency(payload);

    if (result.success) {
      setToast({
        type: 'success',
        text: `App currency set to ${currency.name} (${payload.symbol}) — used across the app and for Import conversion`,
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
    <div className="space-y-6">
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
            <h2 className="font-bold text-gray-800">App Currency</h2>
            <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
              Active locally
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#1088dd]/10 rounded-xl flex items-center justify-center text-3xl">
              {getFlagEmoji(selected.countryCode || currencyToCountry[selected.code])}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{selected.name}</p>
              <p className="text-sm text-gray-500">
                {selected.code} · {selected.symbol} — used for amounts across Sales,
                Purchases, Accounting & more
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h2 className="font-bold text-gray-800">Select Currency</h2>
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

/* ─── Tab 2: Currency master + conversion rates ─── */

function ConversionRatesPanel() {
  const [rates, setRates] = useState<ExchangeRateRow[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyMaster[]>([]);
  const [base, setBase] = useState<CurrencyMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCurrencyForm, setShowCurrencyForm] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);
  const [editing, setEditing] = useState<ExchangeRateRow | null>(null);
  const [currencyForm, setCurrencyForm] = useState({
    code: '',
    name: '',
    symbol: '',
    decimalPlaces: '2',
  });
  const [rateForm, setRateForm] = useState({
    fromCurrencyId: '',
    toCurrencyId: '',
    rate: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const currencyMap = useMemo(() => {
    const map = new Map<string, CurrencyMaster>();
    currencies.forEach((c) => map.set(c.id, c));
    return map;
  }, [currencies]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, currencyList, baseCurrency] = await Promise.all([
        fetchExchangeRates(),
        fetchCurrencies(false),
        fetchBaseCurrency(),
      ]);
      setRates(list);
      setCurrencies(currencyList);
      setBase(baseCurrency);
      setRateForm((prev) => ({
        ...prev,
        toCurrencyId: prev.toCurrencyId || baseCurrency?.id || '',
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load conversion data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currencyForm.code.trim() || !currencyForm.name.trim() || !currencyForm.symbol.trim()) {
      setError('Code, name and symbol are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createCurrency({
        code: currencyForm.code.trim().toUpperCase(),
        name: currencyForm.name.trim(),
        symbol: currencyForm.symbol.trim(),
        decimalPlaces: Number(currencyForm.decimalPlaces) || 2,
        isActive: true,
      });
      setCurrencyForm({ code: '', name: '', symbol: '', decimalPlaces: '2' });
      setShowCurrencyForm(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create currency');
    } finally {
      setSaving(false);
    }
  };

  const handleSetBase = async (currencyId: string) => {
    if (base?.id === currencyId) return;
    setSaving(true);
    setError('');
    try {
      const updated = await setBaseCurrency(currencyId);
      setBase(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set base currency');
    } finally {
      setSaving(false);
    }
  };

  const openCreateRate = () => {
    setEditing(null);
    setRateForm({
      fromCurrencyId: '',
      toCurrencyId: base?.id || '',
      rate: '',
      effectiveDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setShowRateForm(true);
  };

  const openEditRate = (row: ExchangeRateRow) => {
    setEditing(row);
    setRateForm({
      fromCurrencyId: row.fromCurrencyId,
      toCurrencyId: row.toCurrencyId,
      rate: String(row.rate),
      effectiveDate: String(row.effectiveDate).slice(0, 10),
      notes: row.notes || '',
    });
    setShowRateForm(true);
  };

  const handleSubmitRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = Number(rateForm.rate);
    if (!editing && (!rateForm.fromCurrencyId || !rateForm.toCurrencyId)) {
      setError('Select both currencies');
      return;
    }
    if (!Number.isFinite(rateNum) || rateNum <= 0) {
      setError('Enter a valid exchange rate greater than zero');
      return;
    }
    if (!rateForm.effectiveDate) {
      setError('Effective date is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateExchangeRate(editing.id, {
          rate: rateNum,
          effectiveDate: rateForm.effectiveDate,
          notes: rateForm.notes || null,
        });
      } else {
        await createExchangeRate({
          fromCurrencyId: rateForm.fromCurrencyId,
          toCurrencyId: rateForm.toCurrencyId,
          rate: rateNum,
          effectiveDate: rateForm.effectiveDate,
          notes: rateForm.notes || undefined,
        });
      }
      setShowRateForm(false);
      setEditing(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save exchange rate');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this exchange rate?')) return;
    setSaving(true);
    setError('');
    try {
      await deleteExchangeRate(id);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate rate');
    } finally {
      setSaving(false);
    }
  };

  const labelFor = (id: string, fallback?: CurrencyMaster | null) => {
    const c = currencyMap.get(id) || fallback;
    return c ? `${c.code} (${c.symbol})` : id.slice(0, 8);
  };

  const activeCurrencies = currencies.filter((c) => c.isActive);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Conversion Rates</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            1 foreign unit = rate × {base?.code || 'base currency'}
            {base ? ` · Company base: ${base.code}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void load()}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCurrencyForm((v) => !v);
              setShowRateForm(false);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Currency
          </button>
          <button
            type="button"
            onClick={() => {
              openCreateRate();
              setShowCurrencyForm(false);
            }}
            className="px-3 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Rate
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {showCurrencyForm && (
        <form
          onSubmit={handleCreateCurrency}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5 space-y-4"
        >
          <h3 className="text-sm font-bold text-gray-700">New Transaction Currency</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Code *</label>
              <input
                value={currencyForm.code}
                onChange={(e) =>
                  setCurrencyForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                }
                maxLength={8}
                placeholder="USD"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
              <input
                value={currencyForm.name}
                onChange={(e) => setCurrencyForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="US Dollar"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Symbol *</label>
              <input
                value={currencyForm.symbol}
                onChange={(e) => setCurrencyForm((p) => ({ ...p, symbol: e.target.value }))}
                placeholder="$"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Decimals</label>
              <input
                type="number"
                min={0}
                max={8}
                value={currencyForm.decimalPlaces}
                onChange={(e) =>
                  setCurrencyForm((p) => ({ ...p, decimalPlaces: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCurrencyForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save
            </button>
          </div>
        </form>
      )}

      {showRateForm && (
        <form
          onSubmit={handleSubmitRate}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">
              {editing ? 'Edit Conversion Rate' : 'New Conversion Rate'}
            </h3>
            <button
              type="button"
              onClick={() => setShowRateForm(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                From Currency *
              </label>
              <select
                value={rateForm.fromCurrencyId}
                disabled={!!editing}
                onChange={(e) =>
                  setRateForm((p) => ({ ...p, fromCurrencyId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582] bg-gray-50 disabled:opacity-60"
              >
                <option value="">Select...</option>
                {activeCurrencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                To Currency *
              </label>
              <select
                value={rateForm.toCurrencyId}
                disabled={!!editing}
                onChange={(e) => setRateForm((p) => ({ ...p, toCurrencyId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582] bg-gray-50 disabled:opacity-60"
              >
                <option value="">Select...</option>
                {activeCurrencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Rate *</label>
              <input
                type="number"
                step="any"
                min="0"
                value={rateForm.rate}
                onChange={(e) => setRateForm((p) => ({ ...p, rate: e.target.value }))}
                placeholder="e.g. 278.50"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Effective Date *
              </label>
              <input
                type="date"
                value={rateForm.effectiveDate}
                onChange={(e) =>
                  setRateForm((p) => ({ ...p, effectiveDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <input
                value={rateForm.notes}
                onChange={(e) => setRateForm((p) => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRateForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Company currencies + base */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Company Currencies</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Currencies available for invoices &amp; payments. Set one as company base.
          </p>
        </div>
        {loading ? (
          <div className="py-10 text-center text-gray-500">
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#014582]" />
          </div>
        ) : currencies.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            No currencies yet — add one to start setting rates
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Symbol
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Base
                  </th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((c) => {
                  const isBase = base?.id === c.id;
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-800">
                        {c.code}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.name}</td>
                      <td className="px-4 py-3 text-gray-700">{c.symbol}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            c.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isBase ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            Base
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={saving || !c.isActive}
                            onClick={() => void handleSetBase(c.id)}
                            className="text-xs font-semibold text-[#014582] hover:underline disabled:opacity-40"
                          >
                            Set as base
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exchange rates table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Exchange Rates</h3>
        </div>
        {loading ? (
          <div className="py-10 text-center text-gray-500">
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#014582]" />
            <p className="mt-2 text-sm">Loading rates...</p>
          </div>
        ) : rates.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            No conversion rates yet — click Add Rate
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    From
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    To
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Rate
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Effective
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rates.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {labelFor(row.fromCurrencyId, row.fromCurrency)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {labelFor(row.toCurrencyId, row.toCurrency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800">
                      {Number(row.rate).toLocaleString(undefined, {
                        maximumFractionDigits: 8,
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {String(row.effectiveDate).slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          row.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {row.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditRate(row)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {row.isActive && (
                          <button
                            type="button"
                            onClick={() => void handleDeactivate(row.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                            title="Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
