'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { settingService } from '../../api/settings/route';
import { useCompanyOptional } from '@/lib/company-context';

type BrandRow = {
  id?: string;
  _id?: string;
  name: string;
  isDefault?: boolean;
  displayOrder?: number;
  isActive?: boolean;
};

function brandId(row: BrandRow) {
  return String(row.id || row._id || '');
}

export function BrandsPage() {
  const companyCtx = useCompanyOptional();
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BrandRow | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await settingService.getSettings('brand');
      setBrands(Array.isArray(rows) ? rows : []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load brands');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, companyCtx?.activeCompanyId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => String(b.name || '').toLowerCase().includes(q));
  }, [brands, search]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setShowForm(true);
  };

  const openEdit = (row: BrandRow) => {
    setEditing(row);
    setName(row.name || '');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setName('');
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Brand name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const id = brandId(editing);
        await settingService.updateSetting(id, { name: trimmed, category: 'brand' });
        toast.success('Brand updated');
      } else {
        await settingService.createSetting({ category: 'brand', name: trimmed });
        toast.success('Brand created — available on products');
      }
      closeForm();
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: BrandRow) => {
    const id = brandId(row);
    if (!id) return;
    setDeletingId(id);
    try {
      await settingService.deleteSetting(id);
      toast.success('Brand removed');
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete brand');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#014582]" />
            Brands
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Manage product brands for this company. Brand is optional on products — pick one
            when creating or editing a product.
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
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#014582] text-white text-sm font-semibold hover:bg-[#01366a]"
          >
            <Plus className="w-4 h-4" />
            Add brand
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 w-full sm:w-48">
        <p className="text-xs text-gray-500">Total brands</p>
        <p className="text-2xl font-bold text-gray-900">{brands.length}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brands…"
          className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-7 h-7 mx-auto animate-spin text-[#014582]" />
            <p className="text-sm text-gray-500 mt-2">Loading brands…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            {search ? 'No brands match your search.' : 'No brands yet. Add your first brand.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => {
                  const id = brandId(row);
                  return (
                    <tr key={id || row.name} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#014582] hover:bg-blue-50"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === id}
                            onClick={() => void handleDelete(row)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                          >
                            {deletingId === id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Delete
                          </button>
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit brand' : 'Add brand'}
              </h2>
              <button type="button" onClick={closeForm} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-xs font-medium text-gray-600">
                Brand name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nike, Samsung, Local Brand"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleSave();
                  }}
                />
              </label>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#014582] hover:bg-[#01366a] disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {editing ? 'Save changes' : 'Create brand'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BrandsPageDefault() {
  return <BrandsPage />;
}
