'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import { BizLoading, bookingStatusTone, dayKey } from '../../../components/business-apps/bizUi';
import {
  appointmentsApi,
  asList,
  displayName,
  type ApptBooking,
} from '../../../lib/business-apps-api';

export default function AppointmentsCalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [items, setItems] = useState<ApptBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    appointmentsApi
      .bookings({ from: from.toISOString(), to: to.toISOString(), sortDir: 'asc', limit: 200 })
      .then((data) => {
        if (!cancelled) setItems(asList(data));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load bookings');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cursor]);

  const grouped = useMemo(() => {
    const map = new Map<string, ApptBooking[]>();
    items.forEach((b) => {
      const k = dayKey(b.startsAt);
      if (!k) return;
      map.set(k, [...(map.get(k) || []), b]);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const shift = (delta: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div>
      <BizPageHeader
        title="Booking Calendar"
        description="Bookings by day."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shift(-1)}
              aria-label="Previous month"
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-36 text-center text-sm font-semibold text-gray-900">
              {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label="Next month"
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {loading ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load calendar" description={error} />
      ) : grouped.length === 0 ? (
        <BizEmptyState title="No bookings this month" description="Bookings will appear here grouped by day." />
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, rows]) => (
            <div key={day} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-900">
                {new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <ul className="divide-y divide-gray-100">
                {rows.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{b.customerName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(b.startsAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {new Date(b.endsAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ·{' '}
                        {b.service?.name || 'No service'} · {displayName(b.assignee)}
                      </p>
                    </div>
                    <BizStatusBadge status={b.status} tone={bookingStatusTone(b.status)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
