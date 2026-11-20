'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCompanyOptional } from '@/lib/company-context';
import {
  unitsService,
  type UnitOfMeasure,
  type UomConversion,
} from '@/lib/units-service';

export function UnitsSettingsPage() {
  const companyCtx = useCompanyOptional();
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [conversions, setConversions] = useState<UomConversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    symbol: '',
    decimalPlaces: '0',
    isBase: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await unitsService.list();
      setUoms(data.uoms || []);
      setConversions(data.conversions || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load units');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, companyCtx?.activeCompanyId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return uoms;
    return uoms.filter(
      (u) =>
        u.code.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        String(u.symbol || '')
          .toLowerCase()
          .includes(q)
    );
  }, [uoms, search]);

  const resetForm = () => {
    setForm({ code: '', name: '', symbol: '', decimalPlaces: '0', isBase: false });
    setShowAdd(false);
  };

  const handleCreate = async () => {
    const code = form.code.trim();
    const name = form.name.trim();
    if (!code || !name) {
      toast.error('Code and name are required');
      return;
    }
    setSaving(true);
    try {
      await unitsService.create({
        code,
        name,
        symbol: form.symbol.trim() || name,
        decimalPlaces: Number(form.decimalPlaces) || 0,
        isBase: form.isBase,
      });
      toast.success('Unit added — available on products across the ERP');
      resetForm();
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create unit');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (unit: UnitOfMeasure) => {
    if (unit.code === 'PCS') {
      toast.error('Cannot remove the default Pieces unit');
      return;
    }
    setDeletingId(unit.id);
    try {
      await unitsService.deactivate(unit.id);
      toast.success(`${unit.name} removed`);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove unit');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-[#014582]" />
            Units of Measure
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Default units are created automatically for this company. Add more anytime — they
            appear in product stock, purchase, and sales unit pickers across the ERP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#014582] text-white text-sm font-semibold hover:bg-[#01366a]"
          >
            <Plus className="w-4 h-4" />
            Add unit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">Active units</p>
          <p className="text-2xl font-bold text-gray-900">{uoms.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">Base units</p>
          <p className="text-2xl font-bold text-gray-900">
            {uoms.filter((u) => u.isBase).length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500">Conversions</p>
          <p className="text-2xl font-bold text-gray-900">{conversions.length}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search code, name, symbol…"
          className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-7 h-7 mx-auto animate-spin text-[#014582]" />
            <p className="text-sm text-gray-500 mt-2">Loading units…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">No units match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Symbol</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Decimals</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#014582]">
                      {unit.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{unit.name}</td>
                    <td className="px-4 py-3 text-gray-600">{unit.symbol || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{unit.decimalPlaces ?? 0}</td>
                    <td className="px-4 py-3">
                      {unit.isBase ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          Base
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          Derived
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={deletingId === unit.id || unit.code === 'PCS'}
                        onClick={() => void handleDeactivate(unit)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                        title={unit.code === 'PCS' ? 'Default unit' : 'Deactivate'}
                      >
                        {deletingId === unit.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {conversions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Common conversions</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Used when converting between related units (e.g. Box → Pcs).
            </p>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">From</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">To</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-600">Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {conversions.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 text-gray-800">
                      {c.fromUom?.symbol || c.fromUom?.code || c.fromUomId}
                    </td>
                    <td className="px-4 py-2 text-gray-800">
                      {c.toUom?.symbol || c.toUom?.code || c.toUomId}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-gray-700">
                      {c.conversionFactor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add unit</h2>
              <button
                type="button"
                onClick={resetForm}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-xs font-medium text-gray-600">
                Code
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                  }
                  placeholder="e.g. BAG"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Bag"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Symbol (shown on products)
                <input
                  value={form.symbol}
                  onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))}
                  placeholder="e.g. Bag"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Decimal places
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={form.decimalPlaces}
                  onChange={(e) => setForm((p) => ({ ...p, decimalPlaces: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isBase}
                  onChange={(e) => setForm((p) => ({ ...p, isBase: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Base unit
              </label>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleCreate()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#014582] hover:bg-[#01366a] disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save unit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnitsSettingsPageDefault() {
  return <UnitsSettingsPage />;
}
