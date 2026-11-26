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
import { BizCard, fmtDateTime } from '../../../components/business-apps/bizUi';
import { displayName, meetingsApi, type MtgDashboard } from '../../../lib/business-apps-api';

export default function MeetingsDashboardPage() {
  const [data, setData] = useState<MtgDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    meetingsApi
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
        title="Meeting Dashboard"
        description="Upcoming meetings, invitations and follow-up action items."
        actions={
          <Link
            href="/meetings/list?new=1"
            className="inline-flex items-center gap-2 rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013663]"
          >
            <Plus className="h-4 w-4" />
            Schedule Meeting
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
            <BizStatCard label="Today" value={data.meetings.today} />
            <BizStatCard label="Upcoming" value={data.meetings.upcoming} accent="bg-sky-500" hint={`${data.meetings.next7Days} in next 7 days`} />
            <BizStatCard label="In progress" value={data.meetings.inProgress} accent="bg-amber-500" />
            <BizStatCard label="Completed (month)" value={data.meetings.completedThisMonth} accent="bg-emerald-500" />
            <BizStatCard label="Open action items" value={data.actionItems.open} accent="bg-violet-500" />
            <BizStatCard label="Overdue actions" value={data.actionItems.overdue} accent="bg-red-500" />
            <BizStatCard label="My open actions" value={data.actionItems.myOpen} accent="bg-violet-500" />
            <BizStatCard label="My pending invites" value={data.invitations.myPending} accent="bg-amber-500" />
          </div>

          <div className="mt-6">
            <BizCard
              title="Next meetings"
              right={
                <Link href="/meetings/list" className="text-sm font-medium text-[#014582]">
                  View all
                </Link>
              }
            >
              {data.nextMeetings.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming meetings scheduled.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {data.nextMeetings.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <Link href={`/meetings/${m.id}`} className="font-medium text-[#014582] hover:underline">
                          {m.title}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {fmtDateTime(m.startsAt)} · {displayName(m.organizer)}
                        </p>
                      </div>
                      <BizStatusBadge status={m.meetingType} tone="info" />
                    </li>
                  ))}
                </ul>
              )}
            </BizCard>
          </div>
        </>
      )}
    </div>
  );
}
