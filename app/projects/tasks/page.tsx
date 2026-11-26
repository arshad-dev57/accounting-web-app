'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ListPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import {
  BizField,
  BizLoading,
  bizBtnPrimary,
  bizInput,
  bizSelect,
  fmtDate,
} from '../../../components/business-apps/bizUi';
import CompanyUserSelect from '../../../components/business-apps/CompanyUserSelect';
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
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

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
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [createFor, setCreateFor] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = asList(await projectsApi.list({ limit: 100 }));
      setProjects(list);
      if (!createFor && list[0]) setCreateFor(list[0].id);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    const pid = createFor || projectId;
    if (!pid) {
      toast.error('Select a project first');
      return;
    }
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }
    setSaving(true);
    try {
      await projectsApi.createTask(pid, {
        title: title.trim(),
        priority,
        status: 'todo',
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
      });
      toast.success('Task added');
      setTitle('');
      setPriority('medium');
      setAssigneeId('');
      setDueDate('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setSaving(false);
    }
  };

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
        description="Add tasks directly here — select project, assignee, then Add."
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

      {projects.length > 0 ? (
        <form
          onSubmit={onAdd}
          className="mb-5 overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <div className="grid gap-2 lg:grid-cols-[1fr_1fr_120px_1fr_140px_auto] lg:items-end">
            <BizField label="Project">
              <select
                value={createFor}
                onChange={(e) => setCreateFor(e.target.value)}
                className={`${bizSelect} w-full`}
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </BizField>
            <BizField label="Task">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={bizInput}
                placeholder="What needs doing?"
                required
              />
            </BizField>
            <BizField label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`${bizSelect} w-full`}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </BizField>
            <BizField label="Assignee">
              <CompanyUserSelect
                value={assigneeId}
                onChange={setAssigneeId}
                emptyLabel="Select assignee…"
              />
            </BizField>
            <BizField label="Due">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={bizInput}
              />
            </BizField>
            <button type="submit" disabled={saving} className={bizBtnPrimary}>
              <ListPlus className="h-4 w-4" />
              Add
            </button>
          </div>
        </form>
      ) : null}

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
              ? 'Create a project first, then add tasks above.'
              : 'No tasks match the current filters. Use Add above.'
          }
          action={
            <Link
              href="/projects/list?new=1"
              className="rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white"
            >
              Go to projects
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-[#fafbfc] text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
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
