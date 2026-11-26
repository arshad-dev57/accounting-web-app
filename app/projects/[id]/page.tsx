'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ListPlus, Plus, Trash2, UserPlus } from 'lucide-react';
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
  bizBtnSecondary,
  bizInput,
  bizSelect,
  fmtDate,
  fmtDateTime,
} from '../../../components/business-apps/bizUi';
import CompanyUserSelect from '../../../components/business-apps/CompanyUserSelect';
import {
  asList,
  displayName,
  projectsApi,
  type PmMember,
  type PmMilestone,
  type PmProject,
  type PmTask,
  type PmTimeEntry,
} from '../../../lib/business-apps-api';

const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled'];
const MEMBER_ROLES = ['manager', 'member', 'viewer'];
const TABS = ['overview', 'tasks', 'team', 'milestones', 'time'] as const;
type Tab = (typeof TABS)[number];

function priorityTone(p: string) {
  if (p === 'urgent') return 'danger' as const;
  if (p === 'high') return 'warning' as const;
  if (p === 'low') return 'neutral' as const;
  return 'info' as const;
}

function statusTone(s: string) {
  if (s === 'completed' || s === 'done') return 'success' as const;
  if (s === 'active' || s === 'in_progress') return 'info' as const;
  if (s === 'on_hold' || s === 'blocked' || s === 'review') return 'warning' as const;
  if (s === 'cancelled') return 'danger' as const;
  return 'neutral' as const;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [project, setProject] = useState<PmProject | null>(null);
  const [tasks, setTasks] = useState<PmTask[]>([]);
  const [members, setMembers] = useState<PmMember[]>([]);
  const [milestones, setMilestones] = useState<PmMilestone[]>([]);
  const [entries, setEntries] = useState<PmTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);

  // Task draft
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDue, setTaskDue] = useState('');

  // Member draft
  const [pickUserId, setPickUserId] = useState('');
  const [pickRole, setPickRole] = useState('member');

  // Milestone draft
  const [msTitle, setMsTitle] = useState('');
  const [msDate, setMsDate] = useState('');

  // Time draft
  const [timeMinutes, setTimeMinutes] = useState('60');
  const [timeDesc, setTimeDesc] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [p, t, m, ms, te] = await Promise.all([
        projectsApi.get(id),
        projectsApi.listTasks(id),
        projectsApi.members(id).catch(() => []),
        projectsApi.milestones(id).catch(() => []),
        projectsApi.timeEntries(id, { limit: 40 }).catch(() => ({ items: [] })),
      ]);
      setProject(p);
      setTasks(asList(t));
      setMembers(Array.isArray(m) ? m : []);
      setMilestones(Array.isArray(ms) ? ms : []);
      setEntries(asList(te));
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

  const excludeMemberIds = useMemo(() => members.map((m) => m.userId), [members]);

  const updateStatus = async (status: string) => {
    if (!project) return;
    setSaving(true);
    try {
      await projectsApi.update(project.id, { status });
      toast.success('Project status updated');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const addTask = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!project || !taskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }
    setSaving(true);
    try {
      await projectsApi.createTask(project.id, {
        title: taskTitle.trim(),
        priority: taskPriority,
        status: 'todo',
        assigneeId: taskAssigneeId || undefined,
        dueDate: taskDue || undefined,
      });
      toast.success('Task added');
      setTaskTitle('');
      setTaskPriority('medium');
      setTaskAssigneeId('');
      setTaskDue('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add task');
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
      toast.success('Task updated');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const addMember = async () => {
    if (!project || !pickUserId) {
      toast.error('Select an employee first');
      return;
    }
    setSaving(true);
    try {
      await projectsApi.addMember(project.id, { userId: pickUserId, role: pickRole });
      toast.success('Member added');
      setPickUserId('');
      setPickRole('member');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (memberId: string, label: string) => {
    if (!project) return;
    if (!window.confirm(`Remove ${label} from this project?`)) return;
    try {
      await projectsApi.removeMember(project.id, memberId);
      toast.success('Member removed');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Remove failed');
    }
  };

  const addMilestone = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!project || !msTitle.trim()) {
      toast.error('Milestone title is required');
      return;
    }
    setSaving(true);
    try {
      await projectsApi.createMilestone(project.id, {
        title: msTitle.trim(),
        targetDate: msDate || undefined,
        status: 'pending',
      });
      toast.success('Milestone added');
      setMsTitle('');
      setMsDate('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add milestone');
    } finally {
      setSaving(false);
    }
  };

  const completeMilestone = async (mid: string) => {
    try {
      await projectsApi.updateMilestone(mid, { status: 'completed' });
      toast.success('Milestone completed');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const addTime = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!project) return;
    const mins = parseInt(timeMinutes, 10);
    if (!Number.isFinite(mins) || mins <= 0) {
      toast.error('Enter valid minutes');
      return;
    }
    setSaving(true);
    try {
      const endedAt = new Date();
      const startedAt = new Date(endedAt.getTime() - mins * 60000);
      await projectsApi.createTimeEntry(project.id, {
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMinutes: mins,
        description: timeDesc.trim() || undefined,
        source: 'manual',
      });
      toast.success('Time logged');
      setTimeDesc('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log time');
    } finally {
      setSaving(false);
    }
  };

  const startTimer = async () => {
    if (!project) return;
    setSaving(true);
    try {
      await projectsApi.createTimeEntry(project.id, {
        isRunning: true,
        description: timeDesc.trim() || undefined,
        startedAt: new Date().toISOString(),
      });
      toast.success('Timer started');
      setTimeDesc('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start timer');
    } finally {
      setSaving(false);
    }
  };

  const stopTimer = async (entryId: string) => {
    try {
      await projectsApi.stopTimeEntry(entryId);
      toast.success('Timer stopped');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not stop timer');
    }
  };

  if (loading) return <BizLoading height="h-64" />;
  if (error || !project) {
    return <BizEmptyState title="Project not found" description={error || 'This project is unavailable.'} />;
  }

  const counts: Record<Tab, number | null> = {
    overview: null,
    tasks: tasks.length,
    team: members.length,
    milestones: milestones.length,
    time: entries.length,
  };

  return (
    <div className="space-y-5">
      <BizPageHeader
        title={project.name}
        description={`${project.projectCode} · Manager: ${displayName(project.manager)}`}
        actions={
          <>
            <select
              value={project.status}
              disabled={saving}
              onChange={(e) => void updateStatus(e.target.value)}
              className={bizSelect}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <Link href="/projects/board" className={bizBtnSecondary}>
              Board
            </Link>
            <Link href="/projects/list" className={bizBtnSecondary}>
              Back
            </Link>
          </>
        }
      />

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-[#fafbfc] px-2 pt-2">
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-t-md px-3.5 py-2 text-sm font-medium capitalize transition-colors ${
                  active
                    ? 'border border-b-white border-gray-200 bg-white text-[#014582]'
                    : 'border border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {t}
                {counts[t] !== null ? (
                  <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] tabular-nums text-gray-600">
                    {counts[t]}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {tab === 'overview' ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-3 lg:col-span-2">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <BizStatusBadge status={project.status} tone={statusTone(project.status)} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Priority</dt>
                    <dd className="mt-1">
                      <BizStatusBadge status={project.priority} tone={priorityTone(project.priority)} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Progress</dt>
                    <dd className="mt-1 tabular-nums text-gray-900">{project.progressPercent || 0}%</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Budget</dt>
                    <dd className="mt-1 text-gray-900">
                      {project.budget != null && project.budget !== '' ? String(project.budget) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Start</dt>
                    <dd className="mt-1 text-gray-900">{fmtDate(project.startDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">End</dt>
                    <dd className="mt-1 text-gray-900">{fmtDate(project.endDate)}</dd>
                  </div>
                </dl>
                {project.description ? (
                  <div className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {project.description}
                  </div>
                ) : null}
              </div>
              <div className="space-y-2 rounded-lg border border-gray-200 bg-[#fafbfc] p-3 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Quick jump</p>
                {(['tasks', 'team', 'milestones', 'time'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left capitalize text-[#014582] hover:bg-white"
                  >
                    {t}
                    <span className="text-xs text-gray-500">Open →</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {tab === 'tasks' ? (
            <div className="space-y-4">
              <form
                onSubmit={addTask}
                className="grid gap-2 lg:grid-cols-[1fr_120px_1fr_140px_auto] lg:items-end"
              >
                <BizField label="Task">
                  <input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className={bizInput}
                    placeholder="What needs doing?"
                    required
                  />
                </BizField>
                <BizField label="Priority">
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
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
                    value={taskAssigneeId}
                    onChange={setTaskAssigneeId}
                    emptyLabel="Select assignee…"
                  />
                </BizField>
                <BizField label="Due date">
                  <input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className={bizInput}
                  />
                </BizField>
                <button type="submit" disabled={saving} className={bizBtnPrimary}>
                  <ListPlus className="h-4 w-4" />
                  Add
                </button>
              </form>

              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500">No tasks yet. Use Add above.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {tasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-col gap-2 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{t.title}</p>
                          <p className="text-xs text-gray-500">
                            {displayName(t.assignee)}
                            {t.dueDate ? ` · due ${fmtDate(t.dueDate)}` : ''}
                          </p>
                        </div>
                        <BizStatusBadge status={t.priority} tone={priorityTone(t.priority)} />
                      </div>
                      <select
                        value={t.status}
                        onChange={(e) => void updateTaskStatus(t.id, e.target.value)}
                        className={bizSelect}
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {tab === 'team' ? (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto] sm:items-end">
                <BizField label="Employee">
                  <CompanyUserSelect
                    value={pickUserId}
                    onChange={setPickUserId}
                    excludeIds={excludeMemberIds}
                    emptyLabel="Select employee…"
                  />
                </BizField>
                <BizField label="Role">
                  <select
                    value={pickRole}
                    onChange={(e) => setPickRole(e.target.value)}
                    className={`${bizSelect} w-full`}
                  >
                    {MEMBER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </BizField>
                <button type="button" disabled={saving} onClick={() => void addMember()} className={bizBtnPrimary}>
                  <UserPlus className="h-4 w-4" />
                  Add
                </button>
              </div>

              {members.length === 0 ? (
                <p className="text-sm text-gray-500">No team members yet. Use Add above.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                      <span className="text-gray-800">
                        {displayName(m.user)}
                        <span className="ml-2 text-[11px] uppercase text-gray-400">{m.role}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void removeMember(m.id, displayName(m.user))}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {tab === 'milestones' ? (
            <div className="space-y-4">
              <form onSubmit={addMilestone} className="grid gap-2 sm:grid-cols-[1fr_160px_auto] sm:items-end">
                <BizField label="Milestone">
                  <input
                    value={msTitle}
                    onChange={(e) => setMsTitle(e.target.value)}
                    className={bizInput}
                    placeholder="Delivery checkpoint"
                    required
                  />
                </BizField>
                <BizField label="Target date">
                  <input
                    type="date"
                    value={msDate}
                    onChange={(e) => setMsDate(e.target.value)}
                    className={bizInput}
                  />
                </BizField>
                <button type="submit" disabled={saving} className={bizBtnPrimary}>
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </form>

              {milestones.length === 0 ? (
                <p className="text-sm text-gray-500">No milestones yet. Use Add above.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {milestones.map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-col gap-2 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{m.title}</p>
                        <p className="text-xs text-gray-500">Target {fmtDate(m.targetDate)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <BizStatusBadge
                          status={m.status}
                          tone={m.status === 'completed' ? 'success' : 'info'}
                        />
                        {m.status !== 'completed' ? (
                          <button
                            type="button"
                            onClick={() => void completeMilestone(m.id)}
                            className={bizBtnSecondary}
                          >
                            Complete
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {tab === 'time' ? (
            <div className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Timer</p>
                  <input
                    value={timeDesc}
                    onChange={(e) => setTimeDesc(e.target.value)}
                    placeholder="What are you working on?"
                    className={`${bizInput} mb-2`}
                  />
                  <button type="button" disabled={saving} onClick={() => void startTimer()} className={bizBtnPrimary}>
                    Start timer
                  </button>
                </div>
                <form onSubmit={addTime} className="rounded-lg border border-gray-200 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Manual log</p>
                  <div className="grid gap-2 sm:grid-cols-[100px_1fr_auto] sm:items-end">
                    <BizField label="Minutes">
                      <input
                        type="number"
                        min="1"
                        value={timeMinutes}
                        onChange={(e) => setTimeMinutes(e.target.value)}
                        className={bizInput}
                      />
                    </BizField>
                    <BizField label="Description">
                      <input
                        value={timeDesc}
                        onChange={(e) => setTimeDesc(e.target.value)}
                        className={bizInput}
                        placeholder="Work done"
                      />
                    </BizField>
                    <button type="submit" disabled={saving} className={bizBtnPrimary}>
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                </form>
              </div>

              {entries.length === 0 ? (
                <p className="text-sm text-gray-500">No time logged yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-col gap-2 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {displayName(entry.user)} ·{' '}
                          {entry.isRunning ? 'Running' : `${entry.durationMinutes || 0} min`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {fmtDateTime(entry.startedAt)}
                          {entry.description ? ` · ${entry.description}` : ''}
                        </p>
                      </div>
                      {entry.isRunning ? (
                        <button
                          type="button"
                          onClick={() => void stopTimer(entry.id)}
                          className={bizBtnSecondary}
                        >
                          Stop
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
