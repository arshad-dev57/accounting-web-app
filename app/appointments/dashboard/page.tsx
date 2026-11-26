'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  Clock3,
  LayoutDashboard,
  Link2,
  Plus,
} from 'lucide-react';
import {
  DeskBar,
  DeskError,
  DeskHeader,
  DeskLinkGroup,
  DeskLoading,
  DeskPanel,
  DeskShortcut,
  DeskStatCard,
  STATUS_COLORS,
} from '../../../components/business-apps/DeskWidgets';
import { appointmentsApi, displayName, type ApptDashboard } from '../../../lib/business-apps-api';

export default function AppointmentsDashboardPage() {
  const [data, setData] = useState<ApptDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    appointmentsApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusRows = useMemo(() => {
    const map = data?.bookings.thisMonth.byStatus || {};
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [data]);

  if (loading) return <DeskLoading />;
  if (error) return <DeskError message={error} onRetry={fetchData} />;
  if (!data) return null;

  const shortcuts = [
    { href: '/appointments/dashboard', label: 'Dashboard', sub: 'Overview', icon: LayoutDashboard },
    { href: '/appointments/bookings', label: 'Bookings', sub: `${data.bookings.today} today`, icon: CalendarClock },
    { href: '/appointments/calendar', label: 'Calendar', sub: `${data.bookings.upcoming} upcoming`, icon: CalendarDays },
    { href: '/appointments/services', label: 'Services', sub: `${data.catalog.activeServices} active`, icon: BriefcaseBusiness },
    { href: '/appointments/reports', label: 'Reports', sub: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="w-full space-y-5">
      <DeskHeader
        title="Appointment Booking"
        subtitle="Scheduling workspace · services, slots and reservations"
        actions={
          <>
            <button
              type="button"
              onClick={fetchData}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
            <Link
              href="/appointments/bookings?new=1"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#014582] px-4 py-2 text-sm font-semibold text-white hover:bg-[#01366a]"
            >
              <Plus className="h-4 w-4" />
              New
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shortcuts.map((s) => (
          <DeskShortcut key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DeskStatCard
          label="Today"
          value={data.bookings.today}
          icon={CalendarClock}
          href="/appointments/bookings"
          accent="#014582"
          sub={`${data.bookings.todayActive} active now`}
        />
        <DeskStatCard
          label="Upcoming"
          value={data.bookings.upcoming}
          icon={CalendarDays}
          href="/appointments/calendar"
          accent="#0ea5e9"
          sub={`${data.bookings.next7Days} in next 7 days`}
        />
        <DeskStatCard
          label="Pending"
          value={data.bookings.pendingApproval}
          icon={Clock3}
          href="/appointments/bookings"
          accent="#f59e0b"
          sub="Awaiting confirmation"
        />
        <DeskStatCard
          label="Completed (month)"
          value={data.bookings.thisMonth.completed}
          icon={BarChart3}
          href="/appointments/reports"
          accent="#10b981"
          sub={`${data.bookings.thisMonth.noShow} no-shows`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DeskPanel title="This Month by Status">
          <div className="space-y-3.5">
            {statusRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No Data</p>
            ) : (
              statusRows.map(({ status, count }) => (
                <DeskBar
                  key={status}
                  label={status}
                  count={count}
                  total={data.bookings.thisMonth.total || 1}
                  color={STATUS_COLORS[status] || '#6b7280'}
                />
              ))
            )}
          </div>
        </DeskPanel>

        <DeskPanel
          title="Today's Schedule"
          action={
            <Link href="/appointments/calendar" className="text-xs font-medium text-[#014582]">
              Calendar
            </Link>
          }
        >
          {(data.todaysSchedule || []).length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No appointments today</p>
          ) : (
            <ul className="space-y-2.5">
              {data.todaysSchedule.slice(0, 6).map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-3 rounded-md px-2 py-1.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{b.customerName}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {new Date(b.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {b.service?.name ? ` · ${b.service.name}` : ''}
                      {` · ${displayName(b.assignee)}`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] capitalize text-gray-600">
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DeskPanel>

        <DeskPanel
          title="Next Bookings"
          action={
            <Link href="/appointments/bookings" className="text-xs font-medium text-[#014582]">
              All
            </Link>
          }
        >
          {(data.nextBookings || []).length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No upcoming bookings</p>
          ) : (
            <ul className="space-y-2.5">
              {data.nextBookings.slice(0, 6).map((b) => (
                <li key={b.id} className="rounded-md px-2 py-1.5">
                  <p className="truncate text-sm font-medium text-gray-900">{b.customerName}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {new Date(b.startsAt).toLocaleString()}
                    {b.service?.name ? ` · ${b.service.name}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DeskPanel>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DeskLinkGroup
          title="Booking"
          items={[
            { href: '/appointments/bookings', label: 'Bookings' },
            { href: '/appointments/calendar', label: 'Calendar' },
            { href: '/appointments/services', label: 'Services' },
            { href: '/appointments/types', label: 'Appointment Types' },
          ]}
        />
        <DeskLinkGroup
          title="Operations"
          items={[
            { href: '/appointments/availability', label: 'Availability' },
            { href: '/appointments/public', label: 'Public Booking Page' },
            { href: '/appointments/reports', label: 'Reports' },
            { href: '/appointments/settings', label: 'Settings' },
          ]}
        />
        <DeskPanel title="Catalog">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
              <span className="text-sm text-gray-700">Active services</span>
              <span className="text-lg font-semibold tabular-nums">{data.catalog.activeServices}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
              <span className="text-sm text-gray-700">Active types</span>
              <span className="text-lg font-semibold tabular-nums">{data.catalog.activeTypes}</span>
            </div>
          </div>
        </DeskPanel>
        <DeskPanel title="Quick Actions">
          <div className="space-y-2">
            <Link href="/appointments/bookings?new=1" className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Plus className="h-4 w-4 text-[#014582]" /> Create booking
            </Link>
            <Link href="/appointments/availability" className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Clock3 className="h-4 w-4 text-[#014582]" /> Set availability
            </Link>
            <Link href="/appointments/public" className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Link2 className="h-4 w-4 text-[#014582]" /> Public booking link
            </Link>
          </div>
        </DeskPanel>
      </div>
    </div>
  );
}
