'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
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
  bookingStatusTone,
  fmtDateTime,
  toLocalInput,
} from '../../../components/business-apps/bizUi';
import {
  appointmentsApi,
  asList,
  displayName,
  type ApptBooking,
  type ApptService,
} from '../../../lib/business-apps-api';

const STATUSES = ['pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];

function defaultStart() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toLocalInput(d);
}

function BookingsInner() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ApptBooking[]>([]);
  const [services, setServices] = useState<ApptService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceId: '',
    startsAt: '',
    endsAt: '',
    durationMinutes: '30',
    status: 'confirmed',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentsApi.bookings({ status: statusFilter || undefined, limit: 100 });
      setItems(asList(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    appointmentsApi
      .services()
      .then((s) => setServices((s || []).filter((x) => x.isActive)))
      .catch(() => setServices([]));
  }, []);

  const openForm = () => {
    setForm((f) => (f.startsAt ? f : { ...f, startsAt: defaultStart() }));
    setShowForm(true);
  };

  useEffect(() => {
    if (searchParams.get('new') === '1') openForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (b) =>
        b.customerName.toLowerCase().includes(term) ||
        (b.customerEmail || '').toLowerCase().includes(term) ||
        (b.customerPhone || '').toLowerCase().includes(term)
    );
  }, [items, q]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!form.startsAt) {
      toast.error('Start time is required');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail || undefined,
        customerPhone: form.customerPhone || undefined,
        serviceId: form.serviceId || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        status: form.status,
      };
      if (form.endsAt) body.endsAt = new Date(form.endsAt).toISOString();
      else body.durationMinutes = Number(form.durationMinutes) || undefined;
      await appointmentsApi.createBooking(body);
      toast.success('Booking created');
      setShowForm(false);
      setForm((f) => ({ ...f, customerName: '', customerEmail: '', customerPhone: '', endsAt: '', startsAt: '' }));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (b: ApptBooking, status: string) => {
    const prev = b.status;
    setItems((rows) => rows.map((r) => (r.id === b.id ? { ...r, status } : r)));
    try {
      await appointmentsApi.updateBooking(b.id, { status });
      toast.success('Booking updated');
    } catch (e) {
      setItems((rows) => rows.map((r) => (r.id === b.id ? { ...r, status: prev } : r)));
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  return (
    <div>
      <BizPageHeader
        title="Bookings"
        description="Create and manage customer appointments."
        actions={
          <button type="button" onClick={openForm} className={bizBtnPrimary}>
            <Plus className="h-4 w-4" />
            New Booking
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer..."
            className={`${bizInput} pl-9`}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={bizSelect}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void load()} className={bizBtnSecondary}>
          Refresh
        </button>
      </div>

      {showForm ? (
        <form onSubmit={onCreate} className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">New booking</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <BizField label="Customer name" className="sm:col-span-2">
              <input
                required
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Email">
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Phone">
              <input
                value={form.customerPhone}
                onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Service">
              <select
                value={form.serviceId}
                onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
                className={`${bizSelect} w-full`}
              >
                <option value="">No service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} min)
                  </option>
                ))}
              </select>
            </BizField>
            <BizField label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={`${bizSelect} w-full`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </BizField>
            <BizField label="Starts at">
              <input
                type="datetime-local"
                required
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Ends at (optional)">
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            {!form.endsAt ? (
              <BizField label="Duration (minutes, if no end time)">
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                  className={bizInput}
                />
              </BizField>
            ) : null}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className={bizBtnPrimary}>
              {saving ? 'Saving…' : 'Create booking'}
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
        <BizEmptyState title="Unable to load bookings" description={error} />
      ) : filtered.length === 0 ? (
        <BizEmptyState
          title="No bookings yet"
          description="Create the first booking to start filling your calendar."
          action={
            <button type="button" onClick={openForm} className={bizBtnPrimary}>
              New booking
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.customerName}</p>
                    <p className="text-xs text-gray-500">{b.customerEmail || b.customerPhone || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {fmtDateTime(b.startsAt)}
                    <p className="text-xs text-gray-500">until {fmtDateTime(b.endsAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{b.service?.name || b.type?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{displayName(b.assignee)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BizStatusBadge status={b.status} tone={bookingStatusTone(b.status)} />
                      <select
                        value={b.status}
                        onChange={(e) => void changeStatus(b, e.target.value)}
                        className="rounded-md border border-gray-200 bg-white px-1 py-0.5 text-xs"
                        aria-label="Change status"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
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

export default function AppointmentBookingsPage() {
  return (
    <Suspense fallback={<BizLoading />}>
      <BookingsInner />
    </Suspense>
  );
}
