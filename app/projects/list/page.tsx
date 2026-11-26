'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ListPlus, Plus, Search, Trash2, UserPlus } from 'lucide-react';
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
} from '../../../components/business-apps/bizUi';
import CompanyUserSelect, {
  type CompanyUserOption,
} from '../../../components/business-apps/CompanyUserSelect';
import { asList, displayName, projectsApi, type PmProject } from '../../../lib/business-apps-api';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

type DraftMember = { userId: string; label: string; role: string };
type DraftTask = { title: string; priority: string; assigneeId: string; dueDate: string };

function priorityTone(p: string) {
  if (p === 'urgent') return 'danger' as const;
  if (p === 'high') return 'warning' as const;
  if (p === 'low') return 'neutral' as const;
  return 'info' as const;
}

function statusTone(s: string) {
  if (s === 'completed') return 'success' as const;
  if (s === 'active') return 'info' as const;
  if (s === 'on_hold') return 'warning' as const;
  if (s === 'cancelled') return 'danger' as const;
  return 'neutral' as const;
}

function ProjectsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<PmProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: 'medium',
    status: 'planning',
    startDate: '',
    endDate: '',
    budget: '',
    managerId: '',
  });
  const [members, setMembers] = useState<DraftMember[]>([]);
  const [pickUserId, setPickUserId] = useState('');
  const [pickUser, setPickUser] = useState<CompanyUserOption | null>(null);
  const [pickRole, setPickRole] = useState('member');
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDue, setTaskDue] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectsApi.list({
        status: status || undefined,
        page: 1,
        limit: 100,
      });
      setItems(asList(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const resetComposer = () => {
    setForm({
      name: '',
      description: '',
      priority: 'medium',
      status: 'planning',
      startDate: '',
      endDate: '',
      budget: '',
      managerId: '',
    });
    setMembers([]);
    setPickUserId('');
    setPickUser(null);
    setPickRole('member');
    setTasks([]);
    setTaskTitle('');
    setTaskPriority('medium');
    setTaskAssigneeId('');
    setTaskDue('');
  };

  const openForm = () => {
    resetComposer();
    setShowForm(true);
  };

  useEffect(() => {
    if (searchParams.get('new') === '1') openForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.projectCode?.toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term)
    );
  }, [items, q]);

  const excludeMemberIds = members.map((m) => m.userId);

  const addMember = () => {
    if (!pickUserId) {
      toast.error('Select an employee first');
      return;
    }
    if (excludeMemberIds.includes(pickUserId)) {
      toast.error('Employee already added');
      return;
    }
    setMembers((prev) => [
      ...prev,
      { userId: pickUserId, label: pickUser?.label || 'Employee', role: pickRole },
    ]);
    setPickUserId('');
    setPickUser(null);
    setPickRole('member');
  };

  const addTask = () => {
    if (!taskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }
    setTasks((prev) => [
      ...prev,
      {
        title: taskTitle.trim(),
        priority: taskPriority,
        assigneeId: taskAssigneeId,
        dueDate: taskDue,
      },
    ]);
    setTaskTitle('');
    setTaskPriority('medium');
    setTaskAssigneeId('');
    setTaskDue('');
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    setSaving(true);
    try {
      const created = await projectsApi.create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        managerId: form.managerId || undefined,
        memberIds: members.map((m) => m.userId),
      });

      // Apply roles that aren't plain "member" (manager already handled by managerId)
      for (const m of members) {
        if (m.role !== 'member' && m.userId !== form.managerId) {
          await projectsApi.addMember(created.id, { userId: m.userId, role: m.role }).catch(() => null);
        }
      }

      for (const t of tasks) {
        await projectsApi
          .createTask(created.id, {
            title: t.title,
            priority: t.priority,
            status: 'todo',
            assigneeId: t.assigneeId || undefined,
            dueDate: t.dueDate || undefined,
          })
          .catch(() => null);
      }

      toast.success('Project created');
      setShowForm(false);
      router.push(`/projects/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BizPageHeader
        title="Projects"
        description="Create projects with manager, team and starter tasks — then manage delivery from the project workspace."
        actions={
          <button type="button" onClick={openForm} className={bizBtnPrimary}>
            <Plus className="h-4 w-4" />
            New Project
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects..."
            className={`${bizInput} pl-9`}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={bizSelect}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void load()} className={bizBtnSecondary}>
          Refresh
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={onCreate}
          className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <div className="border-b border-gray-100 bg-[#fafbfc] px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Create Project</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Select people and tasks, then use Add — same pattern as Odoo one2many lines.
            </p>
          </div>

          <div className="space-y-6 p-5">
            <section>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                Project Details
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <BizField label="Project name" className="sm:col-span-2">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={bizInput}
                    placeholder="e.g. Website redesign Q2"
                  />
                </BizField>
                <BizField label="Description" className="sm:col-span-2">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className={bizInput}
                    placeholder="Scope / goals"
                  />
                </BizField>
                <BizField label="Project manager">
                  <CompanyUserSelect
                    value={form.managerId}
                    onChange={(id) => setForm((f) => ({ ...f, managerId: id }))}
                    emptyLabel="Select manager…"
                  />
                </BizField>
                <BizField label="Priority">
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className={`${bizSelect} w-full`}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </BizField>
                <BizField label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className={`${bizSelect} w-full`}
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On hold</option>
                  </select>
                </BizField>
                <BizField label="Budget">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.budget}
                    onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                    className={bizInput}
                  />
                </BizField>
                <BizField label="Start date">
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className={bizInput}
                  />
                </BizField>
                <BizField label="End date">
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className={bizInput}
                  />
                </BizField>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                Team Members
              </h3>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto] sm:items-end">
                  <BizField label="Employee">
                    <CompanyUserSelect
                      value={pickUserId}
                      onChange={(id, opt) => {
                        setPickUserId(id);
                        setPickUser(opt || null);
                      }}
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
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </BizField>
                  <button type="button" onClick={addMember} className={bizBtnPrimary}>
                    <UserPlus className="h-4 w-4" />
                    Add
                  </button>
                </div>
                {members.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No team members added yet.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-gray-100">
                    {members.map((m) => (
                      <li key={m.userId} className="flex items-center justify-between gap-2 py-2 text-sm">
                        <span className="text-gray-800">
                          {m.label}
                          <span className="ml-2 text-[11px] uppercase text-gray-400">{m.role}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setMembers((prev) => prev.filter((x) => x.userId !== m.userId))}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                Starter Tasks
              </h3>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="grid gap-2 lg:grid-cols-[1fr_120px_1fr_140px_auto] lg:items-end">
                  <BizField label="Task">
                    <input
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className={bizInput}
                      placeholder="What needs doing?"
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
                      emptyLabel="Optional…"
                    />
                  </BizField>
                  <BizField label="Due">
                    <input
                      type="date"
                      value={taskDue}
                      onChange={(e) => setTaskDue(e.target.value)}
                      className={bizInput}
                    />
                  </BizField>
                  <button type="button" onClick={addTask} className={bizBtnPrimary}>
                    <ListPlus className="h-4 w-4" />
                    Add
                  </button>
                </div>
                {tasks.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">Optional — add tasks now or later from the project page.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-gray-100">
                    {tasks.map((t, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-2 py-2 text-sm">
                        <span className="text-gray-800">
                          {t.title}
                          <span className="ml-2 text-[11px] uppercase text-gray-400">{t.priority}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setTasks((prev) => prev.filter((_, i) => i !== idx))}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-[#fafbfc] px-5 py-3">
            <button type="submit" disabled={saving} className={bizBtnPrimary}>
              {saving ? 'Creating…' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className={bizBtnSecondary}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <BizLoading height="h-48" />
      ) : error ? (
        <BizEmptyState title="Unable to load projects" description={error} />
      ) : filtered.length === 0 ? (
        <BizEmptyState
          title="No projects yet"
          description="Create your first project with team members and starter tasks."
          action={
            <button type="button" onClick={openForm} className={bizBtnPrimary}>
              Create project
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-[#fafbfc] text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="font-medium text-[#014582] hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-xs text-gray-500">{p.projectCode}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{displayName(p.manager)}</td>
                  <td className="px-4 py-3">
                    <BizStatusBadge status={p.priority} tone={priorityTone(p.priority)} />
                  </td>
                  <td className="px-4 py-3">
                    <BizStatusBadge status={p.status} tone={statusTone(p.status)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#014582]"
                          style={{ width: `${Math.min(100, p.progressPercent || 0)}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-xs text-gray-600">{p.progressPercent || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{p._count?.tasks ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ProjectsListPage() {
  return (
    <Suspense fallback={<BizLoading />}>
      <ProjectsListInner />
    </Suspense>
  );
}
