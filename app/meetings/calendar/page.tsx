'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import { BizLoading, dayKey, meetingStatusTone } from '../../../components/business-apps/bizUi';
import { asList, displayName, meetingsApi, type MtgMeeting } from '../../../lib/business-apps-api';

export default function MeetingsCalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [items, setItems] = useState<MtgMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    meetingsApi
      .list({ from: from.toISOString(), to: to.toISOString(), sortDir: 'asc', limit: 200 })
      .then((data) => {
        if (!cancelled) setItems(asList(data));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load meetings');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cursor]);

  const grouped = useMemo(() => {
    const map = new Map<string, MtgMeeting[]>();
    items.forEach((m) => {
      const k = dayKey(m.startsAt);
      if (!k) return;
      map.set(k, [...(map.get(k) || []), m]);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const shift = (delta: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div>
      <BizPageHeader
        title="Meeting Calendar"
        description="Meetings by date."
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
        <BizEmptyState title="No meetings this month" description="Scheduled meetings will appear here by date." />
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
                {rows.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <Link href={`/meetings/${m.id}`} className="font-medium text-[#014582] hover:underline">
                        {m.title}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {new Date(m.startsAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ·{' '}
                        {m.durationMinutes} min · {displayName(m.organizer)}
                      </p>
                    </div>
                    <BizStatusBadge status={m.status} tone={meetingStatusTone(m.status)} />
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
