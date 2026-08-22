'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Loader2,
  X,
  Save,
  ArrowLeftRight,
  RefreshCw,
} from 'lucide-react';
import {
  locationService,
  type Location,
} from '@/lib/location-service';
import { useLocation } from '@/lib/location-context';

const LOCATION_TYPES = ['Warehouse', 'Shop', 'POS_Store'] as const;

type FormState = {
  name: string;
  code: string;
  type: string;
  address: string;
  phone: string;
  notes: string;
  isDefault: boolean;
};

const emptyForm: FormState = {
  name: '',
  code: '',
  type: 'Shop',
  address: '',
  phone: '',
  notes: '',
  isDefault: false,
};

export default function LocationsPage() {
  const { refresh: refreshContext } = useLocation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [migrating, setMigrating] = useState(false);

  const [showTransfer, setShowTransfer] = useState(false);
  const [transfer, setTransfer] = useState({
    productId: '',
    fromLocationId: '',
    toLocationId: '',
    quantity: '',
    notes: '',
  });
  const [transferring, setTransferring] = useState(false);

  const load = useCallback(async (fromApi = false) => {
    setError('');
    try {
      const list = fromApi
        ? await locationService.list()
        : await locationService.listCached();
      setLocations(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  };

  const openEdit = (loc: Location) => {
    setEditing(loc);
    setForm({
      name: loc.name,
      code: loc.code,
      type: loc.type || 'Shop',
      address: loc.address || '',
      phone: loc.phone || '',
      notes: loc.notes || '',
      isDefault: !!loc.isDefault,
    });
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      setError('Name and code are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await locationService.update(editing.id, {
          name: form.name.trim(),
          code: form.code.trim(),
          type: form.type,
          address: form.address.trim(),
          phone: form.phone.trim(),
          notes: form.notes.trim(),
          isDefault: form.isDefault,
        });
      } else {
        await locationService.create({
          name: form.name.trim(),
          code: form.code.trim(),
          type: form.type,
          address: form.address.trim() || undefined,
          phone: form.phone.trim() || undefined,
          notes: form.notes.trim() || undefined,
          isDefault: form.isDefault,
        });
      }
      setShowForm(false);
      await load();
      await refreshContext();
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (loc: Location) => {
    if (loc.isDefault) {
      alert('Cannot delete the default location. Set another as default first.');
      return;
    }
    if (!confirm(`Delete location "${loc.name}"?`)) return;
    try {
      await locationService.remove(loc.id);
      await load();
      await refreshContext();
    } catch (e: any) {
      alert(e?.message || 'Delete failed');
    }
  };

  const handleMigrate = async () => {
    if (
      !confirm(
        'Migrate existing product stock into the default location? Safe to run once for each company.'
      )
    ) {
      return;
    }
    setMigrating(true);
    try {
      await locationService.migrate();
      alert('Stock migrated to default location.');
      await load();
      await refreshContext();
    } catch (e: any) {
      alert(e?.message || 'Migrate failed');
    } finally {
      setMigrating(false);
    }
  };

  const handleTransfer = async () => {
    const qty = parseInt(transfer.quantity, 10);
    if (
      !transfer.productId.trim() ||
      !transfer.fromLocationId ||
      !transfer.toLocationId ||
      !qty ||
      qty <= 0
    ) {
      setError('Product, from/to locations, and quantity are required');
      return;
    }
    if (transfer.fromLocationId === transfer.toLocationId) {
      setError('From and to locations must differ');
      return;
    }
    setTransferring(true);
    setError('');
    try {
      await locationService.transfer({
        productId: transfer.productId.trim(),
        fromLocationId: transfer.fromLocationId,
        toLocationId: transfer.toLocationId,
        quantity: qty,
        notes: transfer.notes || undefined,
      });
      setShowTransfer(false);
      setTransfer({
        productId: '',
        fromLocationId: '',
        toLocationId: '',
        quantity: '',
        notes: '',
      });
      alert('Stock transferred successfully');
    } catch (e: any) {
      setError(e?.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const filtered = locations.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#014582]" />
          Locations / Shops ({locations.length})
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleMigrate}
            disabled={migrating}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            {migrating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Migrate legacy stock
          </button>
          <button
            type="button"
            onClick={() => {
              setShowTransfer(true);
              setError('');
              setTransfer((t) => ({
                ...t,
                fromLocationId: locations[0]?.id || '',
                toLocationId: locations[1]?.id || locations[0]?.id || '',
              }));
            }}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Transfer stock
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Each shop/warehouse keeps its own stock. Product master is shared; totals
        on products are the sum across all locations.
      </p>

      {error && !showForm && !showTransfer && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Code
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Default
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No locations found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((loc) => (
                  <tr
                    key={loc.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {loc.name}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {loc.code}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{loc.type}</td>
                    <td className="px-6 py-3">
                      {loc.isDefault ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          Default
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          loc.isActive
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {loc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(loc)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(loc)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h4 className="font-semibold text-gray-800">
                {editing ? 'Edit Location' : 'Add Location'}
              </h4>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-500">Name</label>
                <input
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Shop A / Main Warehouse"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Code</label>
                  <input
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase"
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                    placeholder="SHOP1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Type</label>
                  <select
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {LOCATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Address</label>
                <input
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Phone</label>
                <input
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Notes</label>
                <textarea
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm({ ...form, isDefault: e.target.checked })
                  }
                />
                Set as default location
              </label>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#014582] text-white rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h4 className="font-semibold text-gray-800">Transfer stock</h4>
              <button type="button" onClick={() => setShowTransfer(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Product ID
                </label>
                <input
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={transfer.productId}
                  onChange={(e) =>
                    setTransfer({ ...transfer, productId: e.target.value })
                  }
                  placeholder="Paste product UUID"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">From</label>
                  <select
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={transfer.fromLocationId}
                    onChange={(e) =>
                      setTransfer({
                        ...transfer,
                        fromLocationId: e.target.value,
                      })
                    }
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">To</label>
                  <select
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={transfer.toLocationId}
                    onChange={(e) =>
                      setTransfer({ ...transfer, toLocationId: e.target.value })
                    }
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={transfer.quantity}
                  onChange={(e) =>
                    setTransfer({ ...transfer, quantity: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Notes</label>
                <input
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={transfer.notes}
                  onChange={(e) =>
                    setTransfer({ ...transfer, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t">
              <button
                type="button"
                onClick={() => setShowTransfer(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={transferring}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#014582] text-white rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                {transferring ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowLeftRight className="w-4 h-4" />
                )}
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
