'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatCard,
} from '../../../components/business-apps/BusinessAppShell';
import { BizBreakdown, BizCard, BizLoading, fmtDate } from '../../../components/business-apps/bizUi';
import { displayName, meetingsApi, type PmUser } from '../../../lib/business-apps-api';

type Counts = Record<string, number>;

type MeetingReport = {
  meetings?: {
    total?: number;
    byStatus?: Counts;
    byType?: Counts;
    completionRate?: number;
    completedWithMinutes?: number;
    minutesCoverage?: number;
    totalCompletedMinutes?: number;
    averageDurationMinutes?: number;
  };
  attendance?: {
    invitations?: Counts;
    attended?: number;
    notAttended?: number;
    attendanceRate?: number;
  };
  actionItems?: {
    total?: number;
    byStatus?: Counts;
    overdue?: number;
    completionRate?: number;
    openByAssignee?: Array<{ user?: PmUser; open?: number }>;
  };
  byOrganizer?: Array<{ user?: PmUser; meetings?: number }>;
  recentCompleted?: Array<{
    id: string;
    title: string;
    meetingType?: string;
    startsAt?: string;
    durationMinutes?: number;
    _count?: { participants?: number; actionItems?: number };
  }>;
};

const n = (v: unknown) => Number(v || 0);

export default function MeetingsReportsPage() {
  const [data, setData] = useState<MeetingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    meetingsApi
      .reports()
      .then((d) => {
        if (!cancelled) setData(d as MeetingReport);
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

  return (
    <div>
      <BizPageHeader title="Meeting Reports" description="Meeting volume, attendance and action item summaries." />
      {loading ? (
        <BizLoading />
      ) : error || !data ? (
        <BizEmptyState title="Unable to load reports" description={error || undefined} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BizStatCard label="Total meetings" value={n(data.meetings?.total)} />
            <BizStatCard
              label="Completion rate"
              value={`${n(data.meetings?.completionRate)}%`}
              accent="bg-emerald-500"
            />
            <BizStatCard
              label="Minutes coverage"
              value={`${n(data.meetings?.minutesCoverage)}%`}
              hint={`${n(data.meetings?.completedWithMinutes)} completed with minutes`}
              accent="bg-sky-500"
            />
            <BizStatCard
              label="Avg duration"
              value={`${n(data.meetings?.averageDurationMinutes)} min`}
              hint={`${n(data.meetings?.totalCompletedMinutes)} min total (completed)`}
            />
            <BizStatCard
              label="Attendance rate"
              value={`${n(data.attendance?.attendanceRate)}%`}
              hint={`${n(data.attendance?.attended)} attended · ${n(data.attendance?.notAttended)} missed`}
              accent="bg-emerald-500"
            />
            <BizStatCard label="Action items" value={n(data.actionItems?.total)} accent="bg-violet-500" />
            <BizStatCard label="Overdue actions" value={n(data.actionItems?.overdue)} accent="bg-red-500" />
            <BizStatCard
              label="Action completion"
              value={`${n(data.actionItems?.completionRate)}%`}
              accent="bg-emerald-500"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BizBreakdown title="Meetings by status" map={data.meetings?.byStatus} />
            <BizBreakdown title="Meetings by type" map={data.meetings?.byType} />
            <BizBreakdown title="Invitation responses" map={data.attendance?.invitations} />
            <BizBreakdown title="Action items by status" map={data.actionItems?.byStatus} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BizCard title="Open actions by assignee">
              {(data.actionItems?.openByAssignee || []).length === 0 ? (
                <p className="text-sm text-gray-500">No open assigned actions.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {(data.actionItems?.openByAssignee || []).map((r, i) => (
                    <li key={r.user?.id || i} className="flex items-center justify-between py-2">
                      <span className="text-gray-700">{displayName(r.user)}</span>
                      <span className="tabular-nums font-medium text-gray-900">{n(r.open)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </BizCard>
            <BizCard title="Meetings by organizer">
              {(data.byOrganizer || []).length === 0 ? (
                <p className="text-sm text-gray-500">No meetings yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {(data.byOrganizer || []).map((r, i) => (
                    <li key={r.user?.id || i} className="flex items-center justify-between py-2">
                      <span className="text-gray-700">{displayName(r.user)}</span>
                      <span className="tabular-nums font-medium text-gray-900">{n(r.meetings)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </BizCard>
          </div>

          <BizCard title="Recently completed">
            {(data.recentCompleted || []).length === 0 ? (
              <p className="text-sm text-gray-500">No completed meetings yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {(data.recentCompleted || []).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <p className="font-medium text-gray-900">{m.title}</p>
                      <p className="text-xs text-gray-500">
                        {fmtDate(m.startsAt)} · {n(m.durationMinutes)} min · {n(m._count?.participants)} participants ·{' '}
                        {n(m._count?.actionItems)} actions
                      </p>
                    </div>
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
