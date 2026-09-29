'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  DollarSign,
  Loader2,
  Plus,
  RefreshCw,
  Star,
} from 'lucide-react';
import {
  createCurrency,
  fetchBaseCurrency,
  fetchCurrencies,
  setBaseCurrency,
  type CurrencyMaster,
} from '../../../../lib/multi-currency';

export function CurrencyMasterPage() {
  const [currencies, setCurrencies] = useState<CurrencyMaster[]>([]);
  const [base, setBase] = useState<CurrencyMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    code: '',
    name: '',
    symbol: '',
    decimalPlaces: '2',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, baseCurrency] = await Promise.all([
        fetchCurrencies(false),
        fetchBaseCurrency(),
      ]);
      setCurrencies(list);
      setBase(baseCurrency);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load currencies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim() || !form.symbol.trim()) {
      setError('Code, name and symbol are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createCurrency({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        symbol: form.symbol.trim(),
        decimalPlaces: Number(form.decimalPlaces) || 2,
        isActive: true,
      });
      setForm({ code: '', name: '', symbol: '', decimalPlaces: '2' });
      setShowForm(false);
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

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#014582]" />
            Currency Master
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage transaction currencies and the company base currency
            {base ? ` (base: ${base.code})` : ''}
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
            onClick={() => setShowForm((v) => !v)}
            className="px-3 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Currency
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
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5 space-y-4"
        >
          <h2 className="text-sm font-bold text-gray-700">New Currency</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                maxLength={8}
                placeholder="USD"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="US Dollar"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Symbol *</label>
              <input
                value={form.symbol}
                onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))}
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
                value={form.decimalPlaces}
                onChange={(e) => setForm((p) => ({ ...p, decimalPlaces: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
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
              Save
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#014582]" />
            <p className="mt-2 text-sm">Loading currencies...</p>
          </div>
        ) : currencies.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No currencies found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Symbol</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Decimals</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Base</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((c) => {
                  const isBase = base?.id === c.id;
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-800">{c.code}</td>
                      <td className="px-4 py-3 text-gray-700">{c.name}</td>
                      <td className="px-4 py-3 text-gray-700">{c.symbol}</td>
                      <td className="px-4 py-3 text-gray-600">{c.decimalPlaces}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
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
    </div>
  );
}

export default function ModuleRoutePlaceholder() {
  return null;
}
