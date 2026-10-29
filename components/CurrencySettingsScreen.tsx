'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  CloudDownload,
  Database,
  DollarSign,
  Eye,
  EyeOff,
  Globe2,
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
import { useCompany } from '../lib/company-context';
import { usePermissions } from '../lib/usePermissions';
import {
  createCurrency,
  createExchangeRate,
  deleteExchangeRate,
  ensureCompanyBaseMatchesAppCurrency,
  fetchCurrencies,
  fetchCurrencyOverview,
  fetchExchangeRates,
  initializeCompanyCurrencies,
  refreshRatesFromProvider,
  setBaseCurrency,
  updateCurrency,
  updateExchangeRate,
  type CompanyCurrencyOverview,
  type CurrencyMaster,
  type CurrencyOverviewRow,
  type ExchangeRateRow,
  type ProviderStatus,
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
    <div className="space-y-6 max-w-6xl">
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

/* ─── Tab 2: Company currency overview + rates ─── */

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRate(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function sourceLabel(source?: string | null) {
  if (!source) return 'Legacy / existing';
  if (source === 'MANUAL') return 'Manual';
  if (source === 'IDENTITY') return 'Identity';
  if (source.startsWith('PROVIDER:')) return source.slice('PROVIDER:'.length);
  return source;
}

function providerName(provider?: ProviderStatus | null) {
  if (!provider?.configured) return 'Not configured';
  return provider.provider || provider.name || 'Provider';
}

type Notice = { type: 'success' | 'warning' | 'error'; text: string } | null;

const EMPTY_CURRENCY_FORM = { code: '', name: '', symbol: '', decimalPlaces: '2' };

function ConversionRatesPanel() {
  const { activeCompany, activeCompanyId, isAllCompanies, loading: companyLoading } =
    useCompany();
  const { can } = usePermissions();

  const canCreateCurrency = can('accounting.currencies', 'create');
  const canEditCurrency = can('accounting.currencies', 'edit');
  const canCreateRate = can('accounting.exchange_rates', 'create');
  const canEditRate = can('accounting.exchange_rates', 'edit');
  const canDeleteRate = can('accounting.exchange_rates', 'delete');
  const canManageBase = canEditCurrency || canEditRate;
  const canRepair = canCreateRate || canEditRate;
  const canUseProvider = canRepair;

  const [overview, setOverview] = useState<CompanyCurrencyOverview | null>(null);
  const [rates, setRates] = useState<ExchangeRateRow[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showAllRates, setShowAllRates] = useState(false);
  const [overwriteOnRefresh, setOverwriteOnRefresh] = useState(false);

  const [showCurrencyForm, setShowCurrencyForm] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [currencyForm, setCurrencyForm] = useState(EMPTY_CURRENCY_FORM);
  const [rateForm, setRateForm] = useState({
    fromCurrencyId: '',
    toCurrencyId: '',
    rate: '',
    effectiveDate: todayIso(),
    notes: '',
  });

  const base = overview?.baseCurrency || null;
  const rows = overview?.currencies || [];

  const load = useCallback(async () => {
    if (companyLoading) return;
    if (isAllCompanies) {
      setOverview(null);
      setRates([]);
      setCurrencies([]);
      setLoading(false);
      setError('Select a specific company from the top bar to manage currencies and exchange rates.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [overviewData, rateRows, currencyList] = await Promise.all([
        fetchCurrencyOverview(showInactive),
        fetchExchangeRates(),
        fetchCurrencies(false),
      ]);
      setOverview(overviewData);
      setRates(rateRows);
      setCurrencies(currencyList);
      setRateForm((prev) => ({
        ...prev,
        toCurrencyId: prev.toCurrencyId || overviewData?.baseCurrency?.id || '',
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load conversion data');
    } finally {
      setLoading(false);
    }
  }, [companyLoading, isAllCompanies, showInactive, activeCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      `${row.code} ${row.name} ${row.symbol}`.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const currencyMap = useMemo(() => {
    const map = new Map<string, CurrencyMaster>();
    currencies.forEach((c) => map.set(c.id, c));
    return map;
  }, [currencies]);

  const currencyLabel = (id: string, fallback?: CurrencyMaster | null) => {
    const c = currencyMap.get(id) || fallback;
    return c ? `${c.code} (${c.symbol})` : id.slice(0, 8);
  };

  const closeForms = () => {
    setShowCurrencyForm(false);
    setShowRateForm(false);
    setEditingRateId(null);
  };

  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currencyForm.code.trim() || !currencyForm.name.trim() || !currencyForm.symbol.trim()) {
      setError('Code, name and symbol are required');
      return;
    }
    setBusy('currency');
    setError('');
    try {
      await createCurrency({
        code: currencyForm.code.trim().toUpperCase(),
        name: currencyForm.name.trim(),
        symbol: currencyForm.symbol.trim(),
        decimalPlaces: Number(currencyForm.decimalPlaces) || 2,
        isActive: true,
      });
      setCurrencyForm(EMPTY_CURRENCY_FORM);
      setShowCurrencyForm(false);
      setNotice({ type: 'success', text: 'Currency added. Add a rate to use it in transactions.' });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create currency');
    } finally {
      setBusy(null);
    }
  };

  const handleToggleCurrency = async (row: CurrencyOverviewRow) => {
    const next = !row.isActive;
    if (
      !next &&
      !confirm(`Deactivate ${row.code}? It stays in history but cannot be used in new documents.`)
    ) {
      return;
    }
    setBusy(`currency-${row.id}`);
    setError('');
    try {
      await updateCurrency(row.id, { isActive: next });
      setNotice({
        type: 'success',
        text: `${row.code} ${next ? 'activated' : 'deactivated'}.`,
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update currency');
    } finally {
      setBusy(null);
    }
  };

  const handleSetBase = async (row: CurrencyOverviewRow) => {
    if (!canManageBase) return;
    if (
      !confirm(
        `Set ${row.code} as the company base currency? Existing rates are preserved and missing rates will be initialized from the provider.`
      )
    ) {
      return;
    }
    setBusy(`base-${row.id}`);
    setError('');
    setNotice(null);
    try {
      await setBaseCurrency(row.id);
      setNotice({
        type: 'success',
        text: `${row.code} is now the company base currency.`,
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set base currency');
    } finally {
      setBusy(null);
    }
  };

  const openCreateRate = () => {
    setEditingRateId(null);
    setRateForm({
      fromCurrencyId: '',
      toCurrencyId: base?.id || '',
      rate: '',
      effectiveDate: todayIso(),
      notes: '',
    });
    setShowCurrencyForm(false);
    setShowRateForm(true);
  };

  const openOverviewRate = (row: CurrencyOverviewRow) => {
    if (!base || row.isBase) return;
    setEditingRateId(row.rateId);
    setRateForm({
      fromCurrencyId: row.id,
      toCurrencyId: base.id,
      rate: row.rate || '',
      effectiveDate: row.effectiveDate || todayIso(),
      notes: row.notes || '',
    });
    setShowCurrencyForm(false);
    setShowRateForm(true);
  };

  const openEditRateRecord = (row: ExchangeRateRow) => {
    setEditingRateId(row.id);
    setRateForm({
      fromCurrencyId: row.fromCurrencyId,
      toCurrencyId: row.toCurrencyId,
      rate: String(row.rate),
      effectiveDate: String(row.effectiveDate).slice(0, 10),
      notes: row.notes || '',
    });
    setShowCurrencyForm(false);
    setShowRateForm(true);
  };

  const handleSubmitRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRateId && (!rateForm.fromCurrencyId || !rateForm.toCurrencyId)) {
      setError('Select both currencies');
      return;
    }
    if (!editingRateId && rateForm.fromCurrencyId === rateForm.toCurrencyId) {
      setError('From and to currencies must differ');
      return;
    }
    const rateNum = Number(rateForm.rate);
    if (!Number.isFinite(rateNum) || rateNum <= 0) {
      setError('Enter a valid exchange rate greater than zero');
      return;
    }
    if (!rateForm.effectiveDate) {
      setError('Effective date is required');
      return;
    }
    if (rateForm.effectiveDate > todayIso()) {
      setError('Effective date cannot be in the future');
      return;
    }

    setBusy('rate');
    setError('');
    try {
      if (editingRateId) {
        await updateExchangeRate(editingRateId, {
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
      setEditingRateId(null);
      setNotice({
        type: 'success',
        text: editingRateId
          ? 'Exchange rate updated. Historical transactions keep their original rate.'
          : 'Exchange rate saved.',
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save exchange rate');
    } finally {
      setBusy(null);
    }
  };

  const handleDeactivateRate = async (id: string) => {
    if (!confirm('Deactivate this exchange rate? Historical rates remain auditable.')) return;
    setBusy(`rate-${id}`);
    setError('');
    try {
      await deleteExchangeRate(id);
      setNotice({ type: 'success', text: 'Exchange rate deactivated.' });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate rate');
    } finally {
      setBusy(null);
    }
  };

  const handleRefreshProvider = async () => {
    if (!overview?.provider?.configured) {
      setError(
        'Live exchange-rate provider is not configured on the server. Enter rates manually or set FX_PROVIDER on the backend.'
      );
      return;
    }
    setBusy('provider');
    setError('');
    setNotice(null);
    try {
      const report = await refreshRatesFromProvider({ overwrite: overwriteOnRefresh });
      const parts: string[] = [];
      if (report?.updated.length) parts.push(`${report.updated.length} updated`);
      if (report?.skipped.length) parts.push(`${report.skipped.length} preserved`);
      if (report?.missing.length) parts.push(`${report.missing.length} unavailable`);
      setNotice({
        type: report?.missing.length ? 'warning' : 'success',
        text: `Provider refresh complete — ${parts.join(', ') || 'no changes'}.${
          report?.missing.length
            ? ` Unavailable: ${report.missing.slice(0, 8).join(', ')}${
                report.missing.length > 8 ? '…' : ''
              }`
            : ''
        }`,
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Provider refresh failed');
    } finally {
      setBusy(null);
    }
  };

  const handleInitialize = async () => {
    setBusy('initialize');
    setError('');
    setNotice(null);
    try {
      const report = await initializeCompanyCurrencies({ fetchRates: true, overwrite: false });
      const parts: string[] = [];
      if (report?.created.length) parts.push(`${report.created.length} created`);
      if (report?.updated.length) parts.push(`${report.updated.length} updated`);
      if (report?.preserved.length) parts.push(`${report.preserved.length} preserved`);
      if (report?.missing.length) parts.push(`${report.missing.length} still missing`);
      setNotice({
        type: report?.missing.length ? 'warning' : 'success',
        text: `Initialization complete — ${parts.join(', ') || 'nothing to initialize'}.`,
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to initialize currencies');
    } finally {
      setBusy(null);
    }
  };

  const renderOverviewStatus = (row: CurrencyOverviewRow) => {
    if (row.isBase) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          Base
        </span>
      );
    }
    if (row.isMissing) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">
          <AlertTriangle className="w-3.5 h-3.5" />
          Missing rate
        </span>
      );
    }
    if (row.isStale) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
          <AlertTriangle className="w-3.5 h-3.5" />
          Stale{row.ageDays !== null ? ` · ${row.ageDays}d` : ''}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Verified
      </span>
    );
  };

  const counts = overview?.counts;
  const providerConfigured = Boolean(overview?.provider?.configured);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Conversion Rates</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {base
              ? `1 foreign unit = rate × ${base.code} · Company base: ${base.code}`
              : 'Company base currency is not configured yet'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Company: <span className="font-semibold text-gray-600">{activeCompany?.name || '—'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void load()}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh data
          </button>
          {canRepair && (
            <button
              type="button"
              onClick={() => void handleInitialize()}
              disabled={busy !== null || isAllCompanies}
              title="Resolve the base currency and add only missing rates"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
            >
              {busy === 'initialize' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CloudDownload className="w-4 h-4" />
              )}
              Initialize missing
            </button>
          )}
          {canUseProvider && (
            <button
              type="button"
              onClick={() => void handleRefreshProvider()}
              disabled={busy !== null || isAllCompanies || !providerConfigured}
              title={
                providerConfigured
                  ? 'Fetch current rates from the configured provider'
                  : 'Provider not configured on the backend'
              }
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
            >
              {busy === 'provider' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Globe2 className="w-4 h-4" />
              )}
              Refresh from provider
            </button>
          )}
          {canCreateCurrency && (
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
          )}
          {canCreateRate && (
            <button
              type="button"
              onClick={openCreateRate}
              className="px-3 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Rate
            </button>
          )}
        </div>
      </div>

      {isAllCompanies && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            All Companies mode shows aggregated data only. Select a specific company in the top
            bar to view or manage its base currency and exchange rates.
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div
          className={`p-3 rounded-lg text-sm border ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : notice.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      {showCurrencyForm && canCreateCurrency && (
        <form
          onSubmit={handleCreateCurrency}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">New Transaction Currency</h3>
            <button
              type="button"
              onClick={() => setShowCurrencyForm(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
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
              disabled={busy !== null}
              className="px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              {busy === 'currency' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
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
              {editingRateId ? 'Edit Conversion Rate' : 'New Conversion Rate'}
            </h3>
            <button
              type="button"
              onClick={closeForms}
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
                disabled={!!editingRateId}
                onChange={(e) =>
                  setRateForm((p) => ({ ...p, fromCurrencyId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582] bg-gray-50 disabled:opacity-60"
              >
                <option value="">Select...</option>
                {currencies
                  .filter((c) => c.isActive)
                  .map((c) => (
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
                disabled={!!editingRateId}
                onChange={(e) => setRateForm((p) => ({ ...p, toCurrencyId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582] bg-gray-50 disabled:opacity-60"
              >
                <option value="">Select...</option>
                {currencies
                  .filter((c) => c.isActive)
                  .map((c) => (
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
              <p className="text-[11px] text-gray-400 mt-1">
                1 {currencyMap.get(rateForm.fromCurrencyId)?.code || 'foreign'} = rate ×{' '}
                {currencyMap.get(rateForm.toCurrencyId)?.code || 'target'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Effective Date *
              </label>
              <input
                type="date"
                max={todayIso()}
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
                placeholder="Optional — e.g. bank rate on invoice date"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeForms}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy !== null}
              className="px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              {busy === 'rate' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {editingRateId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center text-gray-500">
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#014582]" />
          <p className="mt-2 text-sm">Loading company currency configuration...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#014582]/10 text-[#014582] flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                  Company base
                </p>
                <p className="text-lg font-bold text-gray-800">{base ? base.code : '—'}</p>
                <p className="text-xs text-gray-500 truncate">{base?.name || 'Not resolved'}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  providerConfigured
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Globe2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                  Rate provider
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {providerName(overview?.provider)}
                </p>
                <p className="text-xs text-gray-500">
                  {providerConfigured
                    ? `Live rates${overview?.asOfDate ? ` · as of ${overview.asOfDate}` : ''}`
                    : 'Live rates unavailable — manual rates only'}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                Rate coverage
              </p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-lg font-bold text-gray-800">
                  {counts ? `${counts.rateAvailable}/${counts.currencies}` : '—'}
                </span>
                {counts?.missing ? (
                  <span className="text-xs font-semibold text-red-600">
                    {counts.missing} missing
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600">all covered</span>
                )}
                {counts?.stale ? (
                  <span className="text-xs font-semibold text-amber-600">
                    {counts.stale} stale
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Stale after {overview?.staleDays ?? 7} day{overview?.staleDays === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {canUseProvider && (
            <label className="inline-flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={overwriteOnRefresh}
                onChange={(e) => setOverwriteOnRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              Overwrite existing rates for the provider date (manual edits are replaced)
            </label>
          )}

          {counts?.missing ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {counts.missing} currenc{counts.missing === 1 ? 'y has' : 'ies have'} no rate
                  against {base?.code || 'the base currency'}.
                </p>
                <p className="text-xs mt-1">
                  Transactions in these currencies stay blocked until a rate is added or the
                  provider supplies one. Currencies are never marked verified without a valid
                  rate.
                </p>
                <p className="text-xs mt-1 font-mono">
                  {rows
                    .filter((r) => r.isMissing)
                    .slice(0, 10)
                    .map((r) => r.code)
                    .join(', ')}
                  {counts.missing > 10 ? '…' : ''}
                </p>
              </div>
            </div>
          ) : null}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Company Currencies</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  One effective rate per currency against the company base.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  {showInactive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  Show inactive
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search code, name or symbol"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582] w-full sm:w-60"
                  />
                </div>
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                {rows.length === 0
                  ? 'No currencies configured for this company yet.'
                  : 'No currencies match your search.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Currency
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Current rate
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Source
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Effective
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Last updated
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
                    {filteredRows.map((row) => {
                      const isBusy = busy === `currency-${row.id}` || busy === `base-${row.id}`;
                      return (
                        <tr
                          key={row.id}
                          className="border-b border-gray-50 hover:bg-gray-50/80 align-top"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-2.5">
                              <span className="text-xl leading-6">
                                {getFlagEmoji(currencyToCountry[row.code])}
                              </span>
                              <div>
                                <p className="font-mono font-semibold text-gray-800">
                                  {row.code}
                                  {!row.isActive && (
                                    <span className="ml-2 text-[10px] font-sans font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                      Inactive
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">{row.name}</p>
                                <p className="text-xs text-gray-400">{row.symbol}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {row.isBase ? (
                              <span className="text-gray-500">Base currency</span>
                            ) : row.isMissing ? (
                              <span className="text-red-600 font-medium">Not configured</span>
                            ) : (
                              <div>
                                <p className="font-mono text-gray-800">
                                  1 {row.code} = {formatRate(row.rate)} {base?.code}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  1 {base?.code} = {formatRate(
                                    row.rate && Number(row.rate) > 0
                                      ? 1 / Number(row.rate)
                                      : null
                                  )}{' '}
                                  {row.code}
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {row.isBase ? '—' : sourceLabel(row.source)}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {row.effectiveDate || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {formatDateTime(row.lastUpdated)}
                          </td>
                          <td className="px-4 py-3">{renderOverviewStatus(row)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1 flex-wrap justify-end">
                              {!row.isBase && canCreateRate && row.isMissing && (
                                <button
                                  type="button"
                                  onClick={() => openOverviewRate(row)}
                                  className="text-xs font-semibold text-[#014582] hover:underline px-1.5 py-1"
                                >
                                  Add rate
                                </button>
                              )}
                              {!row.isBase && canEditRate && !row.isMissing && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => openOverviewRate(row)}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-40"
                                  title="Edit current rate"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              {!row.isBase && canManageBase && row.isActive && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleSetBase(row)}
                                  className="text-xs font-semibold text-[#014582] hover:underline px-1.5 py-1 disabled:opacity-40"
                                  title="Set as company base"
                                >
                                  Set base
                                </button>
                              )}
                              {!row.isBase && canEditCurrency && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleToggleCurrency(row)}
                                  className={`p-1.5 rounded-lg disabled:opacity-40 ${
                                    row.isActive
                                      ? 'hover:bg-red-50 text-red-500'
                                      : 'hover:bg-emerald-50 text-emerald-600'
                                  }`}
                                  title={row.isActive ? 'Deactivate currency' : 'Activate currency'}
                                >
                                  {isBusy ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : row.isActive ? (
                                    <Trash2 className="w-4 h-4" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAllRates((v) => !v)}
              className="w-full px-4 py-3 border-b border-gray-100 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div>
                <h3 className="text-sm font-bold text-gray-800">All rate records</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Effective-dated rates and other currency pairs ({rates.length})
                </p>
              </div>
              <span className="text-xs font-semibold text-[#014582]">
                {showAllRates ? 'Hide' : 'Show'}
              </span>
            </button>

            {showAllRates &&
              (rates.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  No rate records yet — add a rate to start.
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
                          Source
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
                        <tr
                          key={row.id}
                          className="border-b border-gray-50 hover:bg-gray-50/80"
                        >
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {currencyLabel(row.fromCurrencyId, row.fromCurrency)}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {currencyLabel(row.toCurrencyId, row.toCurrency)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-800">
                            {formatRate(row.rate)}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{sourceLabel(row.source)}</td>
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
                              {canEditRate && (
                                <button
                                  type="button"
                                  onClick={() => openEditRateRecord(row)}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              {canDeleteRate && row.isActive && (
                                <button
                                  type="button"
                                  disabled={busy === `rate-${row.id}`}
                                  onClick={() => void handleDeactivateRate(row.id)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 disabled:opacity-40"
                                  title="Deactivate"
                                >
                                  {busy === `rate-${row.id}` ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
