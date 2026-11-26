'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BizEmptyState,
  BizPageHeader,
} from '../../../components/business-apps/BusinessAppShell';
import {
  asList,
  projectsApi,
  type PmProject,
  type PmTask,
} from '../../../lib/business-apps-api';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
  { key: 'blocked', label: 'Blocked' },
] as const;

export default function ProjectsBoardPage() {
  const [projects, setProjects] = useState<PmProject[]>([]);
  const [projectId, setProjectId] = useState('');
  const [tasks, setTasks] = useState<PmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await projectsApi.list({ limit: 100, status: 'active' });
        const list = asList(data);
        const all = list.length ? list : asList(await projectsApi.list({ limit: 100 }));
        if (cancelled) return;
        setProjects(all);
        if (all[0]) setProjectId(all[0].id);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await projectsApi.listTasks(projectId);
        if (!cancelled) setTasks(asList(data));
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Failed to load tasks');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const grouped = useMemo(() => {
    const map: Record<string, PmTask[]> = {};
    for (const col of COLUMNS) map[col.key] = [];
    for (const t of tasks) {
      const key = COLUMNS.some((c) => c.key === t.status) ? t.status : 'todo';
      map[key].push(t);
    }
    return map;
  }, [tasks]);

  const moveTask = async (taskId: string, status: string) => {
    try {
      await projectsApi.updateTask(taskId, {
        status,
        progressPercent: status === 'done' ? 100 : undefined,
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Move failed');
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white" />;
  if (error) return <BizEmptyState title="Unable to load board" description={error} />;

  return (
    <div>
      <BizPageHeader
        title="Kanban Board"
        description="Drag-style status transitions for project tasks."
        actions={
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            {projects.length === 0 ? <option value="">No projects</option> : null}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        }
      />

      {!projectId ? (
        <BizEmptyState
          title="Create a project first"
          description="Kanban boards are project-scoped."
          action={
            <Link href="/projects/list?new=1" className="rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white">
              New project
            </Link>
          }
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className="w-72 shrink-0 rounded-2xl border border-gray-200 bg-gray-50/80 p-3"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {col.label}
                </h3>
                <span className="rounded-md bg-white px-2 py-0.5 text-xs tabular-nums text-gray-500">
                  {grouped[col.key]?.length || 0}
                </span>
              </div>
              <div className="space-y-2">
                {(grouped[col.key] || []).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="mt-1 text-xs capitalize text-gray-500">{task.priority} priority</p>
                    <select
                      value={task.status}
                      onChange={(e) => void moveTask(task.id, e.target.value)}
                      className="mt-3 w-full rounded-md border border-gray-200 px-2 py-1 text-xs"
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.key} value={c.key}>
                          Move to {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
