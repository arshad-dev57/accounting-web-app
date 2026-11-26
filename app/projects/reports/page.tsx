'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatCard,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import { BizBreakdown, BizCard, BizLoading, fmtDate } from '../../../components/business-apps/bizUi';
import { displayName, projectsApi, type PmUser } from '../../../lib/business-apps-api';

type Counts = Record<string, number>;
type ProjectRef = { id: string; name?: string; projectCode?: string };

type ProjectReport = {
  projects?: { total?: number; byStatus?: Counts; byPriority?: Counts; overdue?: number; averageProgress?: number };
  tasks?: {
    total?: number;
    completed?: number;
    open?: number;
    overdue?: number;
    completionRate?: number;
    byStatus?: Counts;
    byPriority?: Counts;
  };
  milestones?: { byStatus?: Counts; overdue?: number };
  budget?: { totalBudget?: number | string; totalEstimatedCost?: number | string };
  time?: {
    totalHours?: number;
    entries?: number;
    byUser?: Array<{ user?: PmUser; hours?: number }>;
    byProject?: Array<{ project?: ProjectRef; hours?: number }>;
  };
  workload?: Array<{ user?: PmUser; openTasks?: number }>;
  upcomingProjects?: Array<{
    id: string;
    name: string;
    projectCode?: string;
    status?: string;
    progressPercent?: number;
    endDate?: string | null;
    manager?: PmUser | null;
  }>;
  overdueTasks?: Array<{
    id: string;
    title: string;
    dueDate?: string | null;
    priority?: string;
    assignee?: PmUser | null;
    project?: ProjectRef | null;
  }>;
};

const n = (v: unknown) => Number(v || 0);

export default function ProjectsReportsPage() {
  const [data, setData] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    projectsApi
      .reports()
      .then((d) => {
        if (!cancelled) setData(d as ProjectReport);
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
      <BizPageHeader title="Project Reports" description="Portfolio, task, time, workload and budget summaries." />
      {loading ? (
        <BizLoading />
      ) : error || !data ? (
        <BizEmptyState title="Unable to load reports" description={error || undefined} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BizStatCard label="Projects" value={n(data.projects?.total)} />
            <BizStatCard
              label="Average progress"
              value={`${n(data.projects?.averageProgress)}%`}
              accent="bg-emerald-500"
            />
            <BizStatCard label="Overdue projects" value={n(data.projects?.overdue)} accent="bg-red-500" />
            <BizStatCard label="Overdue milestones" value={n(data.milestones?.overdue)} accent="bg-red-500" />
            <BizStatCard label="Total tasks" value={n(data.tasks?.total)} />
            <BizStatCard label="Open tasks" value={n(data.tasks?.open)} accent="bg-sky-500" />
            <BizStatCard
              label="Task completion"
              value={`${n(data.tasks?.completionRate)}%`}
              hint={`${n(data.tasks?.completed)} completed`}
              accent="bg-emerald-500"
            />
            <BizStatCard label="Overdue tasks" value={n(data.tasks?.overdue)} accent="bg-amber-500" />
            <BizStatCard label="Hours logged" value={n(data.time?.totalHours).toFixed(1)} hint={`${n(data.time?.entries)} entries`} />
            <BizStatCard label="Total budget" value={n(data.budget?.totalBudget).toLocaleString()} />
            <BizStatCard label="Estimated cost" value={n(data.budget?.totalEstimatedCost).toLocaleString()} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BizBreakdown title="Projects by status" map={data.projects?.byStatus} />
            <BizBreakdown title="Projects by priority" map={data.projects?.byPriority} />
            <BizBreakdown title="Tasks by status" map={data.tasks?.byStatus} />
            <BizBreakdown title="Tasks by priority" map={data.tasks?.byPriority} />
            <BizBreakdown title="Milestones by status" map={data.milestones?.byStatus} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BizCard title="Hours by user">
              {(data.time?.byUser || []).length === 0 ? (
                <p className="text-sm text-gray-500">No time logged yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {(data.time?.byUser || []).map((r, i) => (
                    <li key={r.user?.id || i} className="flex items-center justify-between py-2">
                      <span className="text-gray-700">{displayName(r.user)}</span>
                      <span className="tabular-nums font-medium text-gray-900">{n(r.hours).toFixed(1)} h</span>
                    </li>
                  ))}
                </ul>
              )}
            </BizCard>
            <BizCard title="Hours by project">
              {(data.time?.byProject || []).length === 0 ? (
                <p className="text-sm text-gray-500">No time logged yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {(data.time?.byProject || []).map((r, i) => (
                    <li key={r.project?.id || i} className="flex items-center justify-between py-2">
                      <span className="text-gray-700">{r.project?.name || '—'}</span>
                      <span className="tabular-nums font-medium text-gray-900">{n(r.hours).toFixed(1)} h</span>
                    </li>
                  ))}
                </ul>
              )}
            </BizCard>
            <BizCard title="Open tasks per assignee">
              {(data.workload || []).length === 0 ? (
                <p className="text-sm text-gray-500">No assigned open tasks.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {(data.workload || []).map((r, i) => (
                    <li key={r.user?.id || i} className="flex items-center justify-between py-2">
                      <span className="text-gray-700">{displayName(r.user)}</span>
                      <span className="tabular-nums font-medium text-gray-900">{n(r.openTasks)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </BizCard>
            <BizCard title="Overdue tasks">
              {(data.overdueTasks || []).length === 0 ? (
                <p className="text-sm text-gray-500">No overdue tasks.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {(data.overdueTasks || []).map((t) => (
                    <li key={t.id} className="flex items-start justify-between gap-3 py-2">
                      <div>
                        <p className="font-medium text-gray-900">{t.title}</p>
                        <p className="text-xs text-gray-500">
                          {t.project?.name || '—'} · {displayName(t.assignee)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-red-600">Due {fmtDate(t.dueDate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </BizCard>
          </div>

          <BizCard title="Active projects by end date">
            {(data.upcomingProjects || []).length === 0 ? (
              <p className="text-sm text-gray-500">No active projects.</p>
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {(data.upcomingProjects || []).map((p) => (
                  <li key={p.id} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link href={`/projects/${p.id}`} className="font-medium text-[#014582] hover:underline">
                        {p.name}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {p.projectCode || ''} {p.manager ? `· ${displayName(p.manager)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {p.status ? <BizStatusBadge status={p.status} tone="info" /> : null}
                      <span className="tabular-nums">{n(p.progressPercent)}%</span>
                      <span>End {fmtDate(p.endDate)}</span>
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
