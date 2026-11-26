'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Plus,
  Video,
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
import { displayName, meetingsApi, type MtgDashboard } from '../../../lib/business-apps-api';

export default function MeetingsDashboardPage() {
  const [data, setData] = useState<MtgDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    meetingsApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusRows = useMemo(() => {
    const map = data?.meetings.byStatus || {};
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [data]);

  if (loading) return <DeskLoading />;
  if (error) return <DeskError message={error} onRetry={fetchData} />;
  if (!data) return null;

  const shortcuts = [
    { href: '/meetings/dashboard', label: 'Dashboard', sub: 'Overview', icon: LayoutDashboard },
    { href: '/meetings/list', label: 'Meetings', sub: `${data.meetings.total} total`, icon: Video },
    { href: '/meetings/calendar', label: 'Calendar', sub: `${data.meetings.upcoming} upcoming`, icon: CalendarDays },
    { href: '/meetings/action-items', label: 'Actions', sub: `${data.actionItems.open} open`, icon: CheckSquare },
    { href: '/meetings/reports', label: 'Reports', sub: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="w-full space-y-5">
      <DeskHeader
        title="Meeting Management"
        subtitle="Corporate meetings · agenda, minutes and follow-ups"
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
              href="/meetings/list?new=1"
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
        <DeskStatCard label="Today" value={data.meetings.today} icon={Video} href="/meetings/list" accent="#014582" />
        <DeskStatCard
          label="Upcoming"
          value={data.meetings.upcoming}
          icon={CalendarDays}
          href="/meetings/calendar"
          accent="#0ea5e9"
          sub={`${data.meetings.next7Days} in next 7 days`}
        />
        <DeskStatCard
          label="Open Actions"
          value={data.actionItems.open}
          icon={CheckSquare}
          href="/meetings/action-items"
          accent="#f59e0b"
          sub={`${data.actionItems.overdue} overdue`}
        />
        <DeskStatCard
          label="Pending Invites"
          value={data.invitations.myPending}
          icon={ClipboardList}
          href="/meetings/participants"
          accent="#8b5cf6"
          sub={`${data.actionItems.myOpen} my actions`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DeskPanel title="Meeting Status">
          <div className="space-y-3.5">
            {statusRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No Data</p>
            ) : (
              statusRows.map(({ status, count }) => (
                <DeskBar
                  key={status}
                  label={status}
                  count={count}
                  total={data.meetings.total || 1}
                  color={STATUS_COLORS[status] || '#6b7280'}
                />
              ))
            )}
          </div>
        </DeskPanel>

        <DeskPanel
          title="Next Meetings"
          action={
            <Link href="/meetings/list" className="text-xs font-medium text-[#014582]">
              All
            </Link>
          }
        >
          {(data.nextMeetings || []).length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No upcoming meetings</p>
          ) : (
            <ul className="space-y-2.5">
              {data.nextMeetings.slice(0, 6).map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/meetings/${m.id}`}
                    className="flex items-start justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{m.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {new Date(m.startsAt).toLocaleString()} · {displayName(m.organizer)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] capitalize text-gray-600">
                      {m.status.replace(/_/g, ' ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DeskPanel>

        <DeskPanel title="This Month">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
              <span className="text-sm text-gray-700">Completed</span>
              <span className="text-lg font-semibold tabular-nums">{data.meetings.completedThisMonth}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
              <span className="text-sm text-gray-700">In progress</span>
              <span className="text-lg font-semibold tabular-nums">{data.meetings.inProgress}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
              <span className="text-sm text-gray-700">Cancelled</span>
              <span className="text-lg font-semibold tabular-nums">{data.meetings.cancelled}</span>
            </div>
          </div>
        </DeskPanel>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DeskLinkGroup
          title="Meetings"
          items={[
            { href: '/meetings/list', label: 'All Meetings' },
            { href: '/meetings/calendar', label: 'Calendar' },
            { href: '/meetings/participants', label: 'Participants' },
            { href: '/meetings/agenda', label: 'Agenda' },
          ]}
        />
        <DeskLinkGroup
          title="Follow-up"
          items={[
            { href: '/meetings/minutes', label: 'Minutes' },
            { href: '/meetings/action-items', label: 'Action Items' },
            { href: '/meetings/reports', label: 'Reports' },
            { href: '/meetings/settings', label: 'Settings' },
          ]}
        />
        <DeskPanel title="Quick Actions">
          <div className="space-y-2">
            <Link href="/meetings/list?new=1" className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Plus className="h-4 w-4 text-[#014582]" /> Schedule meeting
            </Link>
            <Link href="/meetings/minutes" className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <FileText className="h-4 w-4 text-[#014582]" /> Record minutes
            </Link>
            <Link href="/meetings/action-items" className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Activity className="h-4 w-4 text-[#014582]" /> Track actions
            </Link>
          </div>
        </DeskPanel>
        <DeskPanel title="Workspace Tips">
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Invite participants before the meeting starts.</li>
            <li>Capture minutes while the discussion is fresh.</li>
            <li>Convert decisions into action items with owners.</li>
          </ul>
        </DeskPanel>
      </div>
    </div>
  );
}
