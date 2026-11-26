'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import {
  asList,
  displayName,
  projectsApi,
  type PmProject,
  type PmTask,
} from '../../../lib/business-apps-api';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [project, setProject] = useState<PmProject | null>(null);
  const [tasks, setTasks] = useState<PmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [p, t] = await Promise.all([projectsApi.get(id), projectsApi.listTasks(id)]);
      setProject(p);
      setTasks(asList(t));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setSaving(true);
    try {
      await projectsApi.createTask(id, { title: taskTitle.trim(), status: 'todo', priority: 'medium' });
      setTaskTitle('');
      toast.success('Task created');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await projectsApi.updateTask(taskId, {
        status,
        progressPercent: status === 'done' ? 100 : undefined,
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white" />;
  }

  if (error || !project) {
    return <BizEmptyState title="Project not found" description={error || 'This project is unavailable.'} />;
  }

  return (
    <div>
      <BizPageHeader
        title={project.name}
        description={`${project.projectCode} · Manager: ${displayName(project.manager)}`}
        actions={
          <Link
            href="/projects/board"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
          >
            Open board
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Status</p>
          <div className="mt-2">
            <BizStatusBadge status={project.status} tone="info" />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Priority</p>
          <div className="mt-2">
            <BizStatusBadge status={project.priority} tone="warning" />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Progress</p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{project.progressPercent || 0}%</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Team members</p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{project.members?.length || project._count?.members || 0}</p>
        </div>
      </div>

      {project.description ? (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
          {project.description}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Tasks</h2>
          <form onSubmit={addTask} className="flex flex-1 gap-2 sm:max-w-md">
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Add a task..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-[#014582] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </form>
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500">No tasks yet. Add the first task to start tracking work.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {tasks.map((t) => (
              <li key={t.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-500">
                    Assignee: {displayName(t.assignee)} · Due:{' '}
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <BizStatusBadge status={t.status} tone={t.status === 'done' ? 'success' : 'neutral'} />
                  <select
                    value={t.status}
                    onChange={(e) => void updateTaskStatus(t.id, e.target.value)}
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs"
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
