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
  fmtDateTime,
  meetingStatusTone,
  toLocalInput,
} from '../../../components/business-apps/bizUi';
import CompanyUserSelect, {
  type CompanyUserOption,
} from '../../../components/business-apps/CompanyUserSelect';
import { asList, displayName, meetingsApi, type MtgMeeting } from '../../../lib/business-apps-api';

const MEETING_TYPES = ['internal', 'client', 'board', 'standup', 'review', 'training', 'other'];
const MEETING_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

type DraftParticipant =
  | { kind: 'user'; userId: string; label: string }
  | { kind: 'guest'; guestName: string; guestEmail: string };

type DraftAgenda = { title: string; allocatedMinutes: string; presenterId: string };

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
    description: '',
    meetingType: 'internal',
    startsAt: '',
    durationMinutes: '60',
    location: '',
    meetingLink: '',
  });
  const [participants, setParticipants] = useState<DraftParticipant[]>([]);
  const [pickUserId, setPickUserId] = useState('');
  const [pickUser, setPickUser] = useState<CompanyUserOption | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [agenda, setAgenda] = useState<DraftAgenda[]>([]);
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaMinutes, setAgendaMinutes] = useState('10');
  const [agendaPresenterId, setAgendaPresenterId] = useState('');

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

  const resetComposer = () => {
    setForm({
      title: '',
      description: '',
      meetingType: 'internal',
      startsAt: defaultStart(),
      durationMinutes: '60',
      location: '',
      meetingLink: '',
    });
    setParticipants([]);
    setPickUserId('');
    setPickUser(null);
    setGuestName('');
    setGuestEmail('');
    setAgenda([]);
    setAgendaTitle('');
    setAgendaMinutes('10');
    setAgendaPresenterId('');
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
      (m) =>
        m.title.toLowerCase().includes(term) ||
        (m.location || '').toLowerCase().includes(term)
    );
  }, [items, q]);

  const excludeParticipantIds = participants
    .filter((p): p is Extract<DraftParticipant, { kind: 'user' }> => p.kind === 'user')
    .map((p) => p.userId);

  const addEmployee = () => {
    if (!pickUserId) {
      toast.error('Select an employee first');
      return;
    }
    if (excludeParticipantIds.includes(pickUserId)) {
      toast.error('Employee already added');
      return;
    }
    setParticipants((prev) => [
      ...prev,
      { kind: 'user', userId: pickUserId, label: pickUser?.label || 'Employee' },
    ]);
    setPickUserId('');
    setPickUser(null);
  };

  const addGuest = () => {
    if (!guestName.trim() && !guestEmail.trim()) {
      toast.error('Enter guest name or email');
      return;
    }
    setParticipants((prev) => [
      ...prev,
      { kind: 'guest', guestName: guestName.trim(), guestEmail: guestEmail.trim() },
    ]);
    setGuestName('');
    setGuestEmail('');
  };

  const addAgendaItem = () => {
    if (!agendaTitle.trim()) {
      toast.error('Agenda title is required');
      return;
    }
    setAgenda((prev) => [
      ...prev,
      {
        title: agendaTitle.trim(),
        allocatedMinutes: agendaMinutes,
        presenterId: agendaPresenterId,
      },
    ]);
    setAgendaTitle('');
    setAgendaMinutes('10');
    setAgendaPresenterId('');
  };

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
        description: form.description.trim() || undefined,
        meetingType: form.meetingType,
        startsAt: new Date(form.startsAt).toISOString(),
        durationMinutes: Number(form.durationMinutes) || 60,
        location: form.location || undefined,
        meetingLink: form.meetingLink || undefined,
        participantIds: participants.filter((p) => p.kind === 'user').map((p) => p.userId),
        guests: participants
          .filter((p): p is Extract<DraftParticipant, { kind: 'guest' }> => p.kind === 'guest')
          .map((p) => ({ name: p.guestName, email: p.guestEmail })),
        agendaItems: agenda.map((a, i) => ({
          title: a.title,
          allocatedMinutes: a.allocatedMinutes ? Number(a.allocatedMinutes) : undefined,
          presenterId: a.presenterId || undefined,
          sortOrder: i,
        })),
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
        description="Schedule meetings with participants, agenda, minutes and action items."
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
        <form
          onSubmit={onCreate}
          className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <div className="border-b border-gray-100 bg-[#fafbfc] px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Schedule Meeting</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Add participants and agenda lines with the Add buttons — then manage minutes and actions on the meeting page.
            </p>
          </div>

          <div className="space-y-6 p-5">
            <section>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                Meeting Details
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <BizField label="Title" className="sm:col-span-2">
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className={bizInput}
                    placeholder="e.g. Weekly operations review"
                  />
                </BizField>
                <BizField label="Description" className="sm:col-span-2">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className={bizInput}
                    placeholder="Purpose / notes"
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
                    placeholder="Conference room / Office"
                  />
                </BizField>
                <BizField label="Meeting link" className="sm:col-span-2">
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={form.meetingLink}
                    onChange={(e) => setForm((f) => ({ ...f, meetingLink: e.target.value }))}
                    className={bizInput}
                  />
                </BizField>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                Participants
              </h3>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                  <BizField label="Company employee">
                    <CompanyUserSelect
                      value={pickUserId}
                      onChange={(id, opt) => {
                        setPickUserId(id);
                        setPickUser(opt || null);
                      }}
                      excludeIds={excludeParticipantIds}
                      emptyLabel="Select employee…"
                    />
                  </BizField>
                  <button type="button" onClick={addEmployee} className={bizBtnPrimary}>
                    <UserPlus className="h-4 w-4" />
                    Add
                  </button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <BizField label="External guest name">
                    <input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className={bizInput}
                      placeholder="Guest name"
                    />
                  </BizField>
                  <BizField label="Guest email">
                    <input
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className={bizInput}
                      placeholder="guest@company.com"
                      type="email"
                    />
                  </BizField>
                  <button type="button" onClick={addGuest} className={bizBtnSecondary}>
                    <Plus className="h-4 w-4" />
                    Add Guest
                  </button>
                </div>

                {participants.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No participants added yet.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-gray-100">
                    {participants.map((p, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-2 py-2 text-sm">
                        <span className="text-gray-800">
                          {p.kind === 'user'
                            ? p.label
                            : `${p.guestName || 'Guest'}${p.guestEmail ? ` · ${p.guestEmail}` : ''}`}
                          <span className="ml-2 text-[11px] uppercase text-gray-400">
                            {p.kind === 'user' ? 'Employee' : 'Guest'}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setParticipants((prev) => prev.filter((_, i) => i !== idx))}
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
                Agenda
              </h3>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="grid gap-2 lg:grid-cols-[1fr_110px_1fr_auto] lg:items-end">
                  <BizField label="Topic">
                    <input
                      value={agendaTitle}
                      onChange={(e) => setAgendaTitle(e.target.value)}
                      className={bizInput}
                      placeholder="Discussion topic"
                    />
                  </BizField>
                  <BizField label="Minutes">
                    <input
                      type="number"
                      min="1"
                      value={agendaMinutes}
                      onChange={(e) => setAgendaMinutes(e.target.value)}
                      className={bizInput}
                    />
                  </BizField>
                  <BizField label="Presenter">
                    <CompanyUserSelect
                      value={agendaPresenterId}
                      onChange={(id) => setAgendaPresenterId(id)}
                      emptyLabel="Optional presenter…"
                    />
                  </BizField>
                  <button type="button" onClick={addAgendaItem} className={bizBtnPrimary}>
                    <ListPlus className="h-4 w-4" />
                    Add
                  </button>
                </div>

                {agenda.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No agenda items yet.</p>
                ) : (
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-800">
                    {agenda.map((a, idx) => (
                      <li key={idx} className="flex items-start justify-between gap-2">
                        <span>
                          {a.title}
                          {a.allocatedMinutes ? (
                            <span className="text-xs text-gray-500"> · {a.allocatedMinutes} min</span>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAgenda((prev) => prev.filter((_, i) => i !== idx))}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 bg-[#fafbfc] px-5 py-3">
            <button type="submit" disabled={saving} className={bizBtnPrimary}>
              {saving ? 'Scheduling…' : 'Schedule Meeting'}
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
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-[#fafbfc] text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
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
