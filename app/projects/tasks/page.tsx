'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import { BizLoading, bizSelect, bizInput, fmtDate } from '../../../components/business-apps/bizUi';
import {
  asList,
  displayName,
  projectsApi,
  type PmProject,
  type PmTask,
} from '../../../lib/business-apps-api';

const STATUSES = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'cancelled', label: 'Cancelled' },
];

function priorityTone(p: string) {
  if (p === 'urgent') return 'danger' as const;
  if (p === 'high') return 'warning' as const;
  if (p === 'low') return 'neutral' as const;
  return 'info' as const;
}

export default function ProjectsTasksPage() {
  const [projects, setProjects] = useState<PmProject[]>([]);
  const [tasks, setTasks] = useState<PmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = asList(await projectsApi.list({ limit: 100 }));
      setProjects(list);
      const results = await Promise.allSettled(list.map((p) => projectsApi.listTasks(p.id)));
      const all: PmTask[] = [];
      results.forEach((r) => {
        if (r.status === 'fulfilled') all.push(...asList(r.value));
      });
      setTasks(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const projectName = useMemo(() => {
    const m = new Map<string, PmProject>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (projectId && t.projectId !== projectId) return false;
      if (status && t.status !== status) return false;
      if (term && !t.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [tasks, projectId, status, q]);

  const changeStatus = async (task: PmTask, next: string) => {
    const prev = task.status;
    setTasks((rows) => rows.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    try {
      await projectsApi.updateTask(task.id, {
        status: next,
        progressPercent: next === 'done' ? 100 : undefined,
      });
      toast.success('Task updated');
    } catch (e) {
      setTasks((rows) => rows.map((t) => (t.id === task.id ? { ...t, status: prev } : t)));
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  return (
    <div>
      <BizPageHeader
        title="Tasks"
        description="All tasks across your projects. Update status inline."
        actions={
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks..."
          className={`${bizInput} sm:flex-1`}
        />
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={bizSelect}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={bizSelect}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load tasks" description={error} />
      ) : filtered.length === 0 ? (
        <BizEmptyState
          title="No tasks found"
          description={
            projects.length === 0
              ? 'Create a project first, then add tasks from the project page.'
              : 'No tasks match the current filters. Add tasks from a project page.'
          }
          action={
            <Link
              href="/projects/list"
              className="rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white"
            >
              Go to projects
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((t) => {
                const proj = projectName.get(t.projectId);
                return (
                  <tr key={t.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                    <td className="px-4 py-3">
                      <Link href={`/projects/${t.projectId}`} className="text-[#014582] hover:underline">
                        {proj?.name || 'Project'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{displayName(t.assignee)}</td>
                    <td className="px-4 py-3">
                      <BizStatusBadge status={t.priority} tone={priorityTone(t.priority)} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">{fmtDate(t.dueDate)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={t.status}
                        onChange={(e) => void changeStatus(t, e.target.value)}
                        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                        {!STATUSES.some((s) => s.key === t.status) ? (
                          <option value={t.status}>{t.status}</option>
                        ) : null}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
