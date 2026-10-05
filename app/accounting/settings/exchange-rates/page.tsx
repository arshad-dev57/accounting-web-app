'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import {
  createExchangeRate,
  deleteExchangeRate,
  fetchBaseCurrency,
  fetchCurrencies,
  fetchExchangeRates,
  updateExchangeRate,
  type CurrencyMaster,
  type ExchangeRateRow,
} from '../../../../lib/multi-currency';

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<ExchangeRateRow[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyMaster[]>([]);
  const [base, setBase] = useState<CurrencyMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExchangeRateRow | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
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
        fetchCurrencies(true),
        fetchBaseCurrency(),
      ]);
      setRates(list);
      setCurrencies(currencyList);
      setBase(baseCurrency);
      setForm((prev) => ({
        ...prev,
        toCurrencyId: prev.toCurrencyId || baseCurrency?.id || '',
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load exchange rates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      fromCurrencyId: '',
      toCurrencyId: base?.id || '',
      rate: '',
      effectiveDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setShowForm(true);
  };

  const openEdit = (row: ExchangeRateRow) => {
    setEditing(row);
    setForm({
      fromCurrencyId: row.fromCurrencyId,
      toCurrencyId: row.toCurrencyId,
      rate: String(row.rate),
      effectiveDate: String(row.effectiveDate).slice(0, 10),
      notes: row.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = Number(form.rate);
    if (!editing && (!form.fromCurrencyId || !form.toCurrencyId)) {
      setError('Select both currencies');
      return;
    }
    if (!Number.isFinite(rateNum) || rateNum <= 0) {
      setError('Enter a valid exchange rate greater than zero');
      return;
    }
    if (!form.effectiveDate) {
      setError('Effective date is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateExchangeRate(editing.id, {
          rate: rateNum,
          effectiveDate: form.effectiveDate,
          notes: form.notes || null,
        });
      } else {
        await createExchangeRate({
          fromCurrencyId: form.fromCurrencyId,
          toCurrencyId: form.toCurrencyId,
          rate: rateNum,
          effectiveDate: form.effectiveDate,
          notes: form.notes || undefined,
        });
      }
      setShowForm(false);
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

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-[#014582]" />
            Exchange Rates
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Company rates: 1 foreign unit = rate × {base?.code || 'base'}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            onClick={openCreate}
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

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">
              {editing ? 'Edit Exchange Rate' : 'New Exchange Rate'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">From Currency *</label>
              <select
                value={form.fromCurrencyId}
                disabled={!!editing}
                onChange={(e) => setForm((p) => ({ ...p, fromCurrencyId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582] bg-gray-50 disabled:opacity-60"
              >
                <option value="">Select...</option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">To Currency *</label>
              <select
                value={form.toCurrencyId}
                disabled={!!editing}
                onChange={(e) => setForm((p) => ({ ...p, toCurrencyId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582] bg-gray-50 disabled:opacity-60"
              >
                <option value="">Select...</option>
                {currencies.map((c) => (
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
                value={form.rate}
                onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))}
                placeholder="e.g. 278.50"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Effective Date *</label>
              <input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm((p) => ({ ...p, effectiveDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#014582]" />
            <p className="mt-2 text-sm">Loading rates...</p>
          </div>
        ) : rates.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No exchange rates yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">From</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">To</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Effective</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
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
                      {Number(row.rate).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {String(row.effectiveDate).slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {row.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
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



export { ExchangeRatesPage };
