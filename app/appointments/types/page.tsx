'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import {
  BizField,
  BizLoading,
  bizBtnPrimary,
  bizBtnSecondary,
  bizInput,
} from '../../../components/business-apps/bizUi';
import { appointmentsApi, type ApptType } from '../../../lib/business-apps-api';

const EMPTY = { name: '', description: '', durationMinutes: '30', color: '#014582' };

export default function AppointmentTypesPage() {
  const [items, setItems] = useState<ApptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems((await appointmentsApi.types()) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load appointment types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Type name is required');
      return;
    }
    setSaving(true);
    try {
      await appointmentsApi.createType({
        name: form.name.trim(),
        description: form.description || undefined,
        durationMinutes: Number(form.durationMinutes) || 30,
        color: form.color || undefined,
      });
      toast.success('Appointment type created');
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BizPageHeader
        title="Appointment Types"
        description="Categories of appointments with default durations."
        actions={
          <button type="button" onClick={() => setShowForm(true)} className={bizBtnPrimary}>
            <Plus className="h-4 w-4" />
            New Type
          </button>
        }
      />

      {showForm ? (
        <form onSubmit={onCreate} className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Create appointment type</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <BizField label="Name" className="sm:col-span-2">
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Description" className="sm:col-span-2">
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Default duration (minutes)">
              <input
                type="number"
                min="5"
                step="5"
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Color">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-10 w-20 rounded-lg border border-gray-200 bg-white p-1"
              />
            </BizField>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className={bizBtnPrimary}>
              {saving ? 'Saving…' : 'Create type'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={bizBtnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load appointment types" description={error} />
      ) : items.length === 0 ? (
        <BizEmptyState
          title="No appointment types yet"
          description="Create types to categorise your bookings."
          action={
            <button type="button" onClick={() => setShowForm(true)} className={bizBtnPrimary}>
              Create type
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full border border-gray-200"
                        style={{ backgroundColor: t.color || '#e5e7eb' }}
                      />
                      <span className="font-medium text-gray-900">{t.name}</span>
                    </div>
                    {t.description ? <p className="ml-5 text-xs text-gray-500">{t.description}</p> : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{t.durationMinutes} min</td>
                  <td className="px-4 py-3">
                    <BizStatusBadge
                      status={t.isActive ? 'active' : 'inactive'}
                      tone={t.isActive ? 'success' : 'neutral'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
