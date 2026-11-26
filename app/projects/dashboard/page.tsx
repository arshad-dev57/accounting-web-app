'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckSquare,
  Flag,
  FolderKanban,
  GanttChart,
  LayoutDashboard,
  Plus,
  Timer,
  Users,
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
import { displayName, projectsApi, type PmDashboard } from '../../../lib/business-apps-api';

export default function ProjectsDashboardPage() {
  const [data, setData] = useState<PmDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    projectsApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const projectStatusRows = useMemo(() => {
    const map = data?.projects.byStatus || {};
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [data]);

  const taskStatusRows = useMemo(() => {
    const map = data?.tasks.byStatus || {};
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [data]);

  if (loading) return <DeskLoading />;
  if (error) return <DeskError message={error} onRetry={fetchData} />;
  if (!data) return null;

  const shortcuts = [
    {
      href: '/projects/dashboard',
      label: 'Dashboard',
      sub: 'Overview',
      icon: LayoutDashboard,
    },
    {
      href: '/projects/list',
      label: 'Projects',
      sub: `${data.projects.total} total`,
      icon: FolderKanban,
    },
    {
      href: '/projects/board',
      label: 'Kanban',
      sub: `${data.tasks.open} open tasks`,
      icon: GanttChart,
    },
    {
      href: '/projects/time',
      label: 'Time',
      sub: `${Number(data.time.hoursLast7Days || 0).toFixed(1)}h / 7d`,
      icon: Timer,
    },
    {
      href: '/projects/reports',
      label: 'Reports',
      sub: 'Analytics',
      icon: BarChart3,
    },
  ];

  return (
    <div className="w-full space-y-5">
      <DeskHeader
        title="Project Management"
        subtitle="Delivery workspace · portfolio, tasks and time"
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
              href="/projects/list?new=1"
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
          label="Total Projects"
          value={data.projects.total}
          icon={FolderKanban}
          href="/projects/list"
          accent="#014582"
          sub={`${data.projects.active} active`}
        />
        <DeskStatCard
          label="Open Tasks"
          value={data.tasks.open}
          icon={CheckSquare}
          href="/projects/tasks"
          accent="#0ea5e9"
          sub={`${data.tasks.myOpen} assigned to me`}
        />
        <DeskStatCard
          label="Overdue"
          value={data.projects.overdue + data.tasks.overdue}
          icon={AlertTriangle}
          href="/projects/list"
          accent="#ef4444"
          sub={`${data.tasks.overdue} tasks · ${data.projects.overdue} projects`}
        />
        <DeskStatCard
          label="Hours (7 days)"
          value={Number(data.time.hoursLast7Days || 0).toFixed(1)}
          icon={Timer}
          href="/projects/time"
          accent="#10b981"
          sub={`${data.time.myRunningTimers} running timer(s)`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DeskPanel title="Project Status">
          <div className="space-y-3.5">
            {projectStatusRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No Data</p>
            ) : (
              projectStatusRows.map(({ status, count }) => (
                <DeskBar
                  key={status}
                  label={status}
                  count={count}
                  total={data.projects.total || 1}
                  color={STATUS_COLORS[status] || '#6b7280'}
                />
              ))
            )}
          </div>
        </DeskPanel>

        <DeskPanel title="Task Pipeline">
          <div className="space-y-3.5">
            {taskStatusRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No Data</p>
            ) : (
              taskStatusRows.map(({ status, count }) => (
                <DeskBar
                  key={status}
                  label={status}
                  count={count}
                  total={data.tasks.total || 1}
                  color={STATUS_COLORS[status] || '#6b7280'}
                />
              ))
            )}
          </div>
        </DeskPanel>

        <DeskPanel
          title="Milestones & Budget"
          action={
            <Link href="/projects/milestones" className="text-xs font-medium text-[#014582]">
              View
            </Link>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Flag className="h-4 w-4 text-[#014582]" />
                Upcoming milestones
              </div>
              <span className="text-lg font-semibold tabular-nums text-gray-900">
                {data.milestones.upcoming}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Overdue milestones
              </div>
              <span className="text-lg font-semibold tabular-nums text-red-700">
                {data.milestones.overdue}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Budget</p>
                <p className="mt-1 text-base font-semibold tabular-nums text-gray-900">
                  {Number(data.budget.totalBudget || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Estimated</p>
                <p className="mt-1 text-base font-semibold tabular-nums text-gray-900">
                  {Number(data.budget.totalEstimatedCost || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </DeskPanel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <LinkGroupWork />
        <DeskLinkGroup
          title="People & Time"
          items={[
            { href: '/projects/teams', label: 'Teams & Resources' },
            { href: '/projects/time', label: 'Time Tracking' },
            { href: '/projects/communication', label: 'Communication' },
            { href: '/projects/settings', label: 'Settings' },
          ]}
        />
        <DeskPanel
          title="Recent Activity"
          action={
            <Link href="/projects/communication" className="text-xs font-medium text-[#014582]">
              All
            </Link>
          }
        >
          {(data.recentActivity || []).length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No activity yet</p>
          ) : (
            <ul className="space-y-2.5">
              {data.recentActivity.slice(0, 6).map((row, idx) => (
                <li key={String(row.id || idx)} className="flex gap-2.5 text-sm">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#014582]/10 text-[#014582]">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-gray-800">
                      {row.message || row.action || 'Activity'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {displayName(row.user)}
                      {row.createdAt
                        ? ` · ${new Date(row.createdAt).toLocaleString()}`
                        : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DeskPanel>
        <DeskPanel title="Quick Actions">
          <div className="space-y-2">
            <Link
              href="/projects/list?new=1"
              className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 text-[#014582]" />
              Create project
            </Link>
            <Link
              href="/projects/board"
              className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <GanttChart className="h-4 w-4 text-[#014582]" />
              Open kanban board
            </Link>
            <Link
              href="/projects/teams"
              className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Users className="h-4 w-4 text-[#014582]" />
              Manage teams
            </Link>
          </div>
        </DeskPanel>
      </div>
    </div>
  );
}

function LinkGroupWork() {
  return (
    <DeskLinkGroup
      title="Work"
      items={[
        { href: '/projects/list', label: 'Projects' },
        { href: '/projects/tasks', label: 'Tasks & Subtasks' },
        { href: '/projects/board', label: 'Kanban Board' },
        { href: '/projects/calendar', label: 'Calendar' },
        { href: '/projects/milestones', label: 'Milestones' },
      ]}
    />
  );
}
