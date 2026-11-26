'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { appointmentsApi } from '../../../lib/business-apps-api';

type Service = { id: string; name: string; durationMinutes: number; price?: string | number | null };
type Slot = { startsAt: string; endsAt: string };

export default function PublicBookingPage() {
  const params = useParams();
  const slug = String(params?.slug || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Book an appointment');
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
  });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await appointmentsApi.publicPage(slug);
        if (cancelled) return;
        const business = data.business as { name?: string } | undefined;
        setCompanyName(business?.name || 'Book an appointment');
        const svc = (data.services as Service[]) || [];
        setServices(svc);
        if (svc[0]) setServiceId(svc[0].id);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Booking page unavailable');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug || !serviceId || !date) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await appointmentsApi.publicPage(slug, { serviceId, date });
        if (cancelled) return;
        const openSlots = (data.slots as Slot[]) || [];
        setSlots(openSlots);
        setSelectedSlot('');
      } catch {
        if (!cancelled) setSlots([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, serviceId, date]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !form.customerName.trim()) {
      toast.error('Name and time slot are required');
      return;
    }
    setSaving(true);
    try {
      await appointmentsApi.publicBook(slug, {
        serviceId,
        startsAt: selectedSlot,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail || undefined,
        customerPhone: form.customerPhone || undefined,
        notes: form.notes || undefined,
      });
      setDone(true);
      toast.success('Booking submitted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6]">
        <div className="h-40 w-full max-w-lg animate-pulse rounded-2xl bg-white border border-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6] px-4">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Booking unavailable</h1>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6] px-4">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Request received</h1>
          <p className="mt-2 text-sm text-gray-500">
            Your appointment request was submitted. You may receive a confirmation shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#014582]">Appointment booking</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">{companyName}</h1>
        <p className="mt-1 text-sm text-gray-500">Select a service and available time slot.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-gray-600">Service</span>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
              required
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes} min)
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-gray-600">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
              required
            />
          </label>

          <div>
            <p className="mb-2 text-sm text-gray-600">
              Available slots{selectedService ? ` · ${selectedService.durationMinutes} min` : ''}
            </p>
            {slots.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500">
                No open slots for this date.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((slot) => {
                  const value = slot.startsAt;
                  const label = new Date(slot.startsAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const active = selectedSlot === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedSlot(value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                        active
                          ? 'border-[#014582] bg-[#014582] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-gray-600">Your name</span>
            <input
              required
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">Email</span>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">Phone</span>
              <input
                value={form.customerPhone}
                onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-600">Notes</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
            />
          </label>

          <button
            type="submit"
            disabled={saving || !selectedSlot}
            className="w-full rounded-lg bg-[#014582] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Submitting…' : 'Request booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
