'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
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
  fmtDateTime,
  noticeStatusTone,
} from '../../../components/business-apps/bizUi';
import {
  asList,
  noticesApi,
  type NtcCategory,
  type NtcNotice,
} from '../../../lib/business-apps-api';

const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const STATUS_FILTERS = ['draft', 'pending_approval', 'scheduled', 'published', 'expired', 'archived'];

function priorityTone(p: string) {
  if (p === 'urgent') return 'danger' as const;
  if (p === 'high') return 'warning' as const;
  if (p === 'low') return 'neutral' as const;
  return 'info' as const;
}

function NoticesListInner() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<NtcNotice[]>([]);
  const [categories, setCategories] = useState<NtcCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    category: 'general',
    priority: 'normal',
    status: 'draft',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await noticesApi.list({ status: status || undefined, limit: 100 });
      setItems(asList(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    noticesApi
      .categories()
      .then((c) => setCategories(c || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowForm(true);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((n) => n.title.toLowerCase().includes(term) || n.body.toLowerCase().includes(term));
  }, [items, q]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    setSaving(true);
    try {
      await noticesApi.create({
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
        priority: form.priority,
        status: form.status,
      });
      toast.success(form.status === 'published' ? 'Notice published' : 'Notice saved as draft');
      setShowForm(false);
      setForm({ title: '', body: '', category: 'general', priority: 'normal', status: 'draft' });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BizPageHeader
        title="Notices"
        description="Create, publish and track company announcements."
        actions={
          <button type="button" onClick={() => setShowForm(true)} className={bizBtnPrimary}>
            <Plus className="h-4 w-4" />
            New Notice
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notices..."
            className={`${bizInput} pl-9`}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={bizSelect}>
          <option value="">All statuses</option>
          {STATUS_FILTERS.map((s) => (
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
        <form onSubmit={onCreate} className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Create notice</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <BizField label="Title" className="sm:col-span-3">
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Body" className="sm:col-span-3">
              <textarea
                required
                rows={5}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={`${bizSelect} w-full`}
              >
                <option value="general">General</option>
                {categories
                  .filter((c) => c.slug !== 'general')
                  .map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </select>
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
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </BizField>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className={bizBtnPrimary}>
              {saving ? 'Saving…' : form.status === 'published' ? 'Publish notice' : 'Save draft'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={bizBtnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load notices" description={error} />
      ) : filtered.length === 0 ? (
        <BizEmptyState
          title="No notices yet"
          description="Create an announcement to share with your company."
          action={
            <button type="button" onClick={() => setShowForm(true)} className={bizBtnPrimary}>
              Create notice
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Notice</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reads</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/notices/${n.id}`} className="font-medium text-[#014582] hover:underline">
                      {n.title}
                    </Link>
                    {n.status === 'published' && n.isRead === false ? (
                      <span className="ml-2 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                        NEW
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-700">{n.category}</td>
                  <td className="px-4 py-3">
                    <BizStatusBadge status={n.priority} tone={priorityTone(n.priority)} />
                  </td>
                  <td className="px-4 py-3">
                    <BizStatusBadge status={n.status} tone={noticeStatusTone(n.status)} />
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{n._count?.readReceipts ?? 0}</td>
                  <td className="px-4 py-3 text-gray-700">{fmtDateTime(n.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function NoticesListPage() {
  return (
    <Suspense fallback={<BizLoading />}>
      <NoticesListInner />
    </Suspense>
  );
}
