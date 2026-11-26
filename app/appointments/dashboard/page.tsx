'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatCard,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import { BizCard, bookingStatusTone, fmtDateTime } from '../../../components/business-apps/bizUi';
import { appointmentsApi, displayName, type ApptBooking, type ApptDashboard } from '../../../lib/business-apps-api';

function BookingList({ rows, empty }: { rows: ApptBooking[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-gray-500">{empty}</p>;
  return (
    <ul className="divide-y divide-gray-100">
      {rows.map((b) => (
        <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
          <div>
            <p className="font-medium text-gray-900">{b.customerName}</p>
            <p className="text-xs text-gray-500">
              {fmtDateTime(b.startsAt)} · {b.service?.name || 'No service'} · {displayName(b.assignee)}
            </p>
          </div>
          <BizStatusBadge status={b.status} tone={bookingStatusTone(b.status)} />
        </li>
      ))}
    </ul>
  );
}

export default function AppointmentsDashboardPage() {
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
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <BizPageHeader
        title="Appointment Dashboard"
        description="Today's schedule, upcoming bookings and monthly outcomes."
        actions={
          <Link
            href="/appointments/bookings?new=1"
            className="inline-flex items-center gap-2 rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013663]"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white" />
          ))}
        </div>
      ) : error || !data ? (
        <BizEmptyState title="Unable to load dashboard" description={error || undefined} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BizStatCard label="Today" value={data.bookings.today} hint={`${data.bookings.todayActive} active`} />
            <BizStatCard label="Upcoming" value={data.bookings.upcoming} accent="bg-sky-500" hint={`${data.bookings.next7Days} in next 7 days`} />
            <BizStatCard label="Pending approval" value={data.bookings.pendingApproval} accent="bg-amber-500" />
            <BizStatCard label="This month" value={data.bookings.thisMonth.total} accent="bg-violet-500" />
            <BizStatCard label="Completed (month)" value={data.bookings.thisMonth.completed} accent="bg-emerald-500" />
            <BizStatCard label="Cancelled (month)" value={data.bookings.thisMonth.cancelled} accent="bg-red-500" />
            <BizStatCard label="No-show (month)" value={data.bookings.thisMonth.noShow} accent="bg-red-500" />
            <BizStatCard
              label="Active services"
              value={data.catalog.activeServices}
              hint={`${data.catalog.activeTypes} active type(s)`}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <BizCard title="Today's schedule">
              <BookingList rows={data.todaysSchedule} empty="No bookings scheduled for today." />
            </BizCard>
            <BizCard
              title="Next bookings"
              right={
                <Link href="/appointments/bookings" className="text-sm font-medium text-[#014582]">
                  View all
                </Link>
              }
            >
              <BookingList rows={data.nextBookings} empty="No upcoming bookings." />
            </BizCard>
          </div>
        </>
      )}
    </div>
  );
}
