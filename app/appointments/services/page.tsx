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
  bizSelect,
} from '../../../components/business-apps/bizUi';
import {
  appointmentsApi,
  type ApptService,
  type ApptType,
} from '../../../lib/business-apps-api';

const EMPTY = { name: '', description: '', durationMinutes: '30', price: '', typeId: '' };

export default function AppointmentServicesPage() {
  const [items, setItems] = useState<ApptService[]>([]);
  const [types, setTypes] = useState<ApptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, t] = await Promise.all([
        appointmentsApi.services(),
        appointmentsApi.types().catch(() => [] as ApptType[]),
      ]);
      setItems(s || []);
      setTypes((t || []).filter((x) => x.isActive));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load services');
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
      toast.error('Service name is required');
      return;
    }
    setSaving(true);
    try {
      await appointmentsApi.createService({
        name: form.name.trim(),
        description: form.description || undefined,
        durationMinutes: Number(form.durationMinutes) || 30,
        price: form.price === '' ? undefined : Number(form.price),
        typeId: form.typeId || undefined,
      });
      toast.success('Service created');
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
        title="Services"
        description="Bookable services with duration and pricing."
        actions={
          <button type="button" onClick={() => setShowForm(true)} className={bizBtnPrimary}>
            <Plus className="h-4 w-4" />
            New Service
          </button>
        }
      />

      {showForm ? (
        <form onSubmit={onCreate} className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Create service</h2>
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
            <BizField label="Duration (minutes)">
              <input
                type="number"
                min="5"
                step="5"
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Price">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Appointment type">
              <select
                value={form.typeId}
                onChange={(e) => setForm((f) => ({ ...f, typeId: e.target.value }))}
                className={`${bizSelect} w-full`}
              >
                <option value="">None</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </BizField>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className={bizBtnPrimary}>
              {saving ? 'Saving…' : 'Create service'}
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
        <BizEmptyState title="Unable to load services" description={error} />
      ) : items.length === 0 ? (
        <BizEmptyState
          title="No services yet"
          description="Add services customers can book."
          action={
            <button type="button" onClick={() => setShowForm(true)} className={bizBtnPrimary}>
              Create service
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    {s.description ? <p className="text-xs text-gray-500">{s.description}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{s.type?.name || '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{s.durationMinutes} min</td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">
                    {s.price === null || s.price === undefined ? '—' : Number(s.price).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <BizStatusBadge
                      status={s.isActive ? 'active' : 'inactive'}
                      tone={s.isActive ? 'success' : 'neutral'}
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
