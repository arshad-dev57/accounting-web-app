'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
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
} from '../../../lib/business-apps-api';

function priorityTone(p: string) {
  if (p === 'urgent') return 'danger';
  if (p === 'high') return 'warning';
  if (p === 'low') return 'neutral';
  return 'info';
}

function statusTone(s: string) {
  if (s === 'completed') return 'success';
  if (s === 'active') return 'info';
  if (s === 'on_hold') return 'warning';
  if (s === 'cancelled') return 'danger';
  return 'neutral';
}

export default function ProjectsListPage() {
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
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectsApi.list({
        q: q || undefined,
        status: status || undefined,
        page: 1,
        limit: 50,
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
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowForm(true);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.projectCode?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
    );
  }, [items, q]);

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
        description: form.description || undefined,
        priority: form.priority,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
      });
      toast.success('Project created');
      setShowForm(false);
      setForm({
        name: '',
        description: '',
        priority: 'medium',
        status: 'planning',
        startDate: '',
        endDate: '',
        budget: '',
      });
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
        description="Create and manage company projects, teams, budgets and delivery status."
        actions={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013663]"
          >
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
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#014582]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={onCreate}
          className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-gray-900">Create project</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-gray-600">Project name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-gray-600">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">Priority</span>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">Start date</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">End date</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">Budget</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create project'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl border border-gray-200 bg-white" />
      ) : error ? (
        <BizEmptyState title="Unable to load projects" description={error} />
      ) : filtered.length === 0 ? (
        <BizEmptyState
          title="No projects yet"
          description="Create your first project to start assigning tasks, milestones and teams."
          action={
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white"
            >
              Create project
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
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
