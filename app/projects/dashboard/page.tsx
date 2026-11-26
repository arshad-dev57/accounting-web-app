'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatCard,
} from '../../../components/business-apps/BusinessAppShell';
import { projectsApi, type PmDashboard } from '../../../lib/business-apps-api';

export default function ProjectsDashboardPage() {
  const [data, setData] = useState<PmDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dash = await projectsApi.dashboard();
        if (!cancelled) setData(dash);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <BizPageHeader
        title="Project Dashboard"
        description="Track portfolio health, deadlines, workload and delivery progress."
        actions={
          <Link
            href="/projects/list?new=1"
            className="inline-flex items-center gap-2 rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013663]"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white border border-gray-200" />
          ))}
        </div>
      ) : error ? (
        <BizEmptyState title="Unable to load dashboard" description={error} />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BizStatCard label="Total Projects" value={data.projects.total} />
            <BizStatCard label="Active" value={data.projects.active} accent="bg-emerald-500" />
            <BizStatCard label="Completed" value={data.projects.completed} accent="bg-sky-500" />
            <BizStatCard label="Overdue" value={data.projects.overdue} accent="bg-red-500" hint="Past end date, not completed" />
            <BizStatCard label="Open Tasks" value={data.tasks.open} />
            <BizStatCard label="Overdue Tasks" value={data.tasks.overdue} accent="bg-amber-500" />
            <BizStatCard label="My Open Tasks" value={data.tasks.myOpen} accent="bg-violet-500" />
            <BizStatCard
              label="Hours (7 days)"
              value={Number(data.time.hoursLast7Days || 0).toFixed(1)}
              hint={`${data.time.myRunningTimers} running timer(s)`}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Upcoming milestones</h2>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-gray-900">
                {data.milestones.upcoming}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {data.milestones.overdue} overdue milestone(s)
              </p>
              <Link href="/projects/milestones" className="mt-4 inline-block text-sm font-medium text-[#014582]">
                View milestones →
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Budget overview</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Total budget</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {Number(data.budget.totalBudget || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estimated cost</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {Number(data.budget.totalEstimatedCost || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <Link href="/projects/reports" className="mt-4 inline-block text-sm font-medium text-[#014582]">
                Open reports →
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Recent activity</h2>
              <Link href="/projects/communication" className="text-sm font-medium text-[#014582]">
                View all
              </Link>
            </div>
            {(data.recentActivity || []).length === 0 ? (
              <p className="text-sm text-gray-500">No project activity yet. Create a project to get started.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.recentActivity.slice(0, 8).map((row, idx) => (
                  <li key={String((row as { id?: string }).id || idx)} className="py-3 text-sm text-gray-700">
                    {String((row as { message?: string }).message || (row as { action?: string }).action || 'Activity')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
