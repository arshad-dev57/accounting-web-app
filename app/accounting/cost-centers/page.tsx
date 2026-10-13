'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
} from 'lucide-react';
import { costCenterService, CostCenter } from '@/lib/cost-center-service';

const inputCls =
  'w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20';

export default function AccountingCostCentersPage() {
  const [rows, setRows] = React.useState<CostCenter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    code: '',
    name: '',
    description: '',
  });

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const centers = await costCenterService.list({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        includeInactive: statusFilter !== 'active',
      });
      setRows(centers);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load cost centers');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ code: '', name: '', description: '' });
  };

  const startEdit = (row: CostCenter) => {
    setEditingId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      description: row.description || '',
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
      };
      if (editingId) {
        await costCenterService.update(editingId, payload);
        toast.success('Cost center updated');
      } else {
        await costCenterService.create(payload);
        toast.success('Cost center created');
      }
      resetForm();
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row: CostCenter) => {
    try {
      const next = row.status === 'active' ? 'inactive' : 'active';
      await costCenterService.setStatus(row.id, next);
      toast.success(next === 'active' ? 'Cost center activated' : 'Cost center deactivated');
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/accounting/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Layers className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
              Cost Centers
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Company-scoped dimensions for Expenses, Budgets, Journal Entries, and Payroll
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-[#E8EEF5] bg-[#F7FAFC] px-4 py-3 text-sm text-[#5A6B7D]">
        Create cost centers here so they appear in Expense and Budget dropdowns. Same master data is
        shared with HR — entries stay company-scoped.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#014582]" />
            {editingId ? 'Edit Cost Center' : 'Create Cost Center'}
          </h3>
          <form className="space-y-3" onSubmit={submit}>
            <label className="block text-xs font-bold text-[#7A8FA6]">
              Code
              <input
                required
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="CC-SALES"
                className={`mt-1 ${inputCls}`}
              />
            </label>
            <label className="block text-xs font-bold text-[#7A8FA6]">
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Sales"
                className={`mt-1 ${inputCls}`}
              />
            </label>
            <label className="block text-xs font-bold text-[#7A8FA6]">
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className={`mt-1 ${inputCls} resize-none`}
                placeholder="Optional"
              />
            </label>
            <div className="flex gap-2 pt-1">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#014582] text-white text-sm font-semibold hover:bg-[#01366a] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-2 p-4 border-b border-gray-100">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or name…"
              className={`flex-1 ${inputCls}`}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={inputCls + ' sm:w-40'}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              No cost centers yet. Create one to use on Expenses and Budgets.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#014582]">
                        {row.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{row.name}</div>
                        {row.description ? (
                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{row.description}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            row.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="inline-flex p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleStatus(row)}
                          className="inline-flex p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                          title={row.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
