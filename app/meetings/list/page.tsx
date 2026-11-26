'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
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
  BizField,
  BizLoading,
  bizBtnPrimary,
  bizBtnSecondary,
  bizInput,
  bizSelect,
  fmtDateTime,
  meetingStatusTone,
  toLocalInput,
} from '../../../components/business-apps/bizUi';
import { asList, displayName, meetingsApi, type MtgMeeting } from '../../../lib/business-apps-api';

const MEETING_TYPES = ['internal', 'client', 'board', 'standup', 'review', 'training', 'other'];
const MEETING_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

function defaultStart() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toLocalInput(d);
}

function MeetingsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<MtgMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    meetingType: 'internal',
    startsAt: '',
    durationMinutes: '60',
    location: '',
    meetingLink: '',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await meetingsApi.list({ status: status || undefined, limit: 100 });
      setItems(asList(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowForm(true);
      setForm((f) => (f.startsAt ? f : { ...f, startsAt: defaultStart() }));
    }
  }, [searchParams]);

  const openForm = () => {
    setForm((f) => (f.startsAt ? f : { ...f, startsAt: defaultStart() }));
    setShowForm(true);
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (m) =>
        m.title.toLowerCase().includes(term) ||
        (m.location || '').toLowerCase().includes(term)
    );
  }, [items, q]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Meeting title is required');
      return;
    }
    if (!form.startsAt) {
      toast.error('Start time is required');
      return;
    }
    setSaving(true);
    try {
      const created = await meetingsApi.create({
        title: form.title.trim(),
        meetingType: form.meetingType,
        startsAt: new Date(form.startsAt).toISOString(),
        durationMinutes: Number(form.durationMinutes) || 60,
        location: form.location || undefined,
        meetingLink: form.meetingLink || undefined,
      });
      toast.success('Meeting scheduled');
      setShowForm(false);
      router.push(`/meetings/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BizPageHeader
        title="Meetings"
        description="Schedule and manage internal and client meetings."
        actions={
          <button type="button" onClick={openForm} className={bizBtnPrimary}>
            <Plus className="h-4 w-4" />
            New Meeting
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search meetings..."
            className={`${bizInput} pl-9`}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={bizSelect}>
          <option value="">All statuses</option>
          {MEETING_STATUSES.map((s) => (
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
          <h2 className="text-sm font-semibold text-gray-900">Schedule meeting</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <BizField label="Title" className="sm:col-span-2">
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Type">
              <select
                value={form.meetingType}
                onChange={(e) => setForm((f) => ({ ...f, meetingType: e.target.value }))}
                className={`${bizSelect} w-full`}
              >
                {MEETING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </BizField>
            <BizField label="Starts at">
              <input
                type="datetime-local"
                required
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Duration (minutes)">
              <input
                type="number"
                min="5"
                step="5"
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Location">
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className={bizInput}
              />
            </BizField>
            <BizField label="Meeting link" className="sm:col-span-2">
              <input
                type="url"
                placeholder="https://"
                value={form.meetingLink}
                onChange={(e) => setForm((f) => ({ ...f, meetingLink: e.target.value }))}
                className={bizInput}
              />
            </BizField>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className={bizBtnPrimary}>
              {saving ? 'Scheduling…' : 'Schedule meeting'}
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
        <BizEmptyState title="Unable to load meetings" description={error} />
      ) : filtered.length === 0 ? (
        <BizEmptyState
          title="No meetings yet"
          description="Schedule your first meeting to invite participants and track action items."
          action={
            <button type="button" onClick={openForm} className={bizBtnPrimary}>
              Schedule meeting
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Meeting</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Organizer</th>
                <th className="px-4 py-3">Attendees</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/meetings/${m.id}`} className="font-medium text-[#014582] hover:underline">
                      {m.title}
                    </Link>
                    {m.location ? <div className="text-xs text-gray-500">{m.location}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{fmtDateTime(m.startsAt)}</td>
                  <td className="px-4 py-3">
                    <BizStatusBadge status={m.meetingType} tone="neutral" />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{displayName(m.organizer)}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{m._count?.participants ?? 0}</td>
                  <td className="px-4 py-3">
                    <BizStatusBadge status={m.status} tone={meetingStatusTone(m.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MeetingsListPage() {
  return (
    <Suspense fallback={<BizLoading />}>
      <MeetingsListInner />
    </Suspense>
  );
}
