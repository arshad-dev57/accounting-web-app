'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatCard,
} from '../../../components/business-apps/BusinessAppShell';
import { BizCard, BizLoading } from '../../../components/business-apps/bizUi';
import { appointmentsApi, type ApptDashboard } from '../../../lib/business-apps-api';

export default function AppointmentsReportsPage() {
  const [data, setData] = useState<ApptDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    appointmentsApi
      .dashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load reports');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const byStatus = Object.entries(data?.bookings.thisMonth.byStatus || {});

  return (
    <div>
      <BizPageHeader title="Appointment Reports" description="Booking outcomes for the current month." />
      {loading ? (
        <BizLoading />
      ) : error || !data ? (
        <BizEmptyState title="Unable to load reports" description={error || undefined} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BizStatCard label="Bookings this month" value={data.bookings.thisMonth.total} />
            <BizStatCard label="Completed" value={data.bookings.thisMonth.completed} accent="bg-emerald-500" />
            <BizStatCard label="Cancelled" value={data.bookings.thisMonth.cancelled} accent="bg-red-500" />
            <BizStatCard label="No-show" value={data.bookings.thisMonth.noShow} accent="bg-amber-500" />
          </div>
          <BizCard title="This month by status">
            {byStatus.length === 0 ? (
              <p className="text-sm text-gray-500">No bookings this month.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {byStatus.map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between py-2 text-sm">
                    <span className="capitalize text-gray-700">{k.replace(/_/g, ' ')}</span>
                    <span className="tabular-nums font-medium text-gray-900">{v}</span>
                  </li>
                ))}
              </ul>
            )}
          </BizCard>
        </div>
      )}
    </div>
  );
}
