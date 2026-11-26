'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  ListPlus,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react';
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
} from '../../../components/business-apps/bizUi';
import CompanyUserSelect from '../../../components/business-apps/CompanyUserSelect';
import {
  displayName,
  meetingsApi,
  type MtgActionItem,
  type MtgAgendaItem,
  type MtgMeeting,
  type MtgMinute,
  type MtgParticipant,
} from '../../../lib/business-apps-api';

const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
const ACTION_STATUSES = ['open', 'in_progress', 'done', 'cancelled'];
const TABS = ['overview', 'participants', 'agenda', 'minutes', 'actions'] as const;
type Tab = (typeof TABS)[number];

export default function MeetingDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [meeting, setMeeting] = useState<MtgMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);

  // Participants draft
  const [pickUserId, setPickUserId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Agenda draft
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaMinutes, setAgendaMinutes] = useState('10');
  const [agendaPresenterId, setAgendaPresenterId] = useState('');

  // Minutes
  const [minuteContent, setMinuteContent] = useState('');
  const [minuteDecisions, setMinuteDecisions] = useState('');
  const [latestMinute, setLatestMinute] = useState<MtgMinute | null>(null);

  // Actions draft
  const [actionTitle, setActionTitle] = useState('');
  const [actionDue, setActionDue] = useState('');
  const [actionAssigneeId, setActionAssigneeId] = useState('');
  const [actionItems, setActionItems] = useState<MtgActionItem[]>([]);
  const [agendaItems, setAgendaItems] = useState<MtgAgendaItem[]>([]);
  const [participants, setParticipants] = useState<MtgParticipant[]>([]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const m = await meetingsApi.get(id);
      setMeeting(m);
      setParticipants(m.participants || []);
      setAgendaItems(m.agendaItems || []);
      setActionItems(m.actionItems || []);

      const minutesRes = (await meetingsApi.minutes(id).catch(() => null)) as
        | { minute?: MtgMinute | null; latest?: MtgMinute | null }
        | null;
      const latest = minutesRes?.minute ?? minutesRes?.latest ?? null;
      setLatestMinute(latest);
      setMinuteContent(latest?.content || m.minutesSummary || '');
      setMinuteDecisions(latest?.decisions || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load meeting');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const excludeIds = useMemo(
    () => participants.map((p) => p.userId).filter(Boolean) as string[],
    [participants]
  );

  const updateStatus = async (status: string) => {
    if (!meeting) return;
    setSaving(true);
    try {
      if (status === 'completed') {
        await meetingsApi.complete(meeting.id);
      } else {
        await meetingsApi.update(meeting.id, { status });
      }
      toast.success('Meeting status updated');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const addEmployee = async () => {
    if (!meeting || !pickUserId) {
      toast.error('Select an employee first');
      return;
    }
    setSaving(true);
    try {
      await meetingsApi.addParticipants(meeting.id, { participantIds: [pickUserId] });
      toast.success('Participant added');
      setPickUserId('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add participant');
    } finally {
      setSaving(false);
    }
  };

  const addGuest = async () => {
    if (!meeting) return;
    if (!guestName.trim() && !guestEmail.trim()) {
      toast.error('Enter guest name or email');
      return;
    }
    setSaving(true);
    try {
      await meetingsApi.addParticipants(meeting.id, {
        guests: [{ name: guestName.trim(), email: guestEmail.trim() }],
      });
      toast.success('Guest added');
      setGuestName('');
      setGuestEmail('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add guest');
    } finally {
      setSaving(false);
    }
  };

  const addAgenda = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!meeting || !agendaTitle.trim()) {
      toast.error('Agenda title is required');
      return;
    }
    setSaving(true);
    try {
      await meetingsApi.createAgendaItem(meeting.id, {
        title: agendaTitle.trim(),
        allocatedMinutes: agendaMinutes ? Number(agendaMinutes) : undefined,
        presenterId: agendaPresenterId || undefined,
      });
      toast.success('Agenda item added');
      setAgendaTitle('');
      setAgendaMinutes('10');
      setAgendaPresenterId('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add agenda');
    } finally {
      setSaving(false);
    }
  };

  const removeAgenda = async (itemId: string) => {
    if (!window.confirm('Remove this agenda item?')) return;
    try {
      await meetingsApi.deleteAgendaItem(itemId);
      toast.success('Agenda item removed');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const saveMinutes = async (e: FormEvent) => {
    e.preventDefault();
    if (!meeting || !minuteContent.trim()) {
      toast.error('Minutes content is required');
      return;
    }
    setSaving(true);
    try {
      await meetingsApi.saveMinutes(meeting.id, {
        content: minuteContent.trim(),
        decisions: minuteDecisions.trim(),
      });
      toast.success(latestMinute ? 'Minutes updated' : 'Minutes recorded');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save minutes');
    } finally {
      setSaving(false);
    }
  };

  const addAction = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!meeting || !actionTitle.trim()) {
      toast.error('Action title is required');
      return;
    }
    setSaving(true);
    try {
      await meetingsApi.createActionItem(meeting.id, {
        title: actionTitle.trim(),
        dueDate: actionDue || undefined,
        assigneeId: actionAssigneeId || undefined,
      });
      toast.success('Action item added');
      setActionTitle('');
      setActionDue('');
      setActionAssigneeId('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add action');
    } finally {
      setSaving(false);
    }
  };

  const updateActionStatus = async (itemId: string, status: string) => {
    try {
      await meetingsApi.updateActionItem(itemId, { status });
      toast.success('Action updated');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  if (loading) return <BizLoading height="h-64" />;
  if (error || !meeting) {
    return <BizEmptyState title="Meeting not found" description={error || 'This meeting is unavailable.'} />;
  }

  return (
    <div className="space-y-5">
      <BizPageHeader
        title={meeting.title}
        description={`${fmtDateTime(meeting.startsAt)} · ${meeting.durationMinutes} min · Organizer: ${displayName(meeting.organizer)}`}
        actions={
          <>
            <select
              value={meeting.status}
              disabled={saving}
              onChange={(e) => void updateStatus(e.target.value)}
              className={bizSelect}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            {meeting.status !== 'completed' ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void updateStatus('completed')}
                className={bizBtnPrimary}
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete
              </button>
            ) : null}
            <Link href="/meetings/list" className={bizBtnSecondary}>
              Back
            </Link>
          </>
        }
      />

      {/* Odoo-style notebook tabs */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-[#fafbfc] px-2 pt-2">
          {TABS.map((t) => {
            const counts: Record<Tab, number | null> = {
              overview: null,
              participants: participants.length,
              agenda: agendaItems.length,
              minutes: latestMinute ? 1 : 0,
              actions: actionItems.length,
            };
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
                      <BizStatusBadge status={meeting.status} tone={meetingStatusTone(meeting.status)} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Type</dt>
                    <dd className="mt-1">
                      <BizStatusBadge status={meeting.meetingType} tone="neutral" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Starts</dt>
                    <dd className="mt-1 text-gray-900">{fmtDateTime(meeting.startsAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Ends</dt>
                    <dd className="mt-1 text-gray-900">{fmtDateTime(meeting.endsAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Location</dt>
                    <dd className="mt-1 text-gray-900">{meeting.location || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Meeting link</dt>
                    <dd className="mt-1">
                      {meeting.meetingLink ? (
                        <a
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#014582] hover:underline"
                        >
                          Join meeting
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                </dl>
                {meeting.description ? (
                  <div className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {meeting.description}
                  </div>
                ) : null}
              </div>
              <div className="space-y-2 rounded-lg border border-gray-200 bg-[#fafbfc] p-3 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Quick jump</p>
                {(['participants', 'agenda', 'minutes', 'actions'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[#014582] hover:bg-white capitalize"
                  >
                    {t}
                    <span className="text-xs text-gray-500">Open →</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {tab === 'participants' ? (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <BizField label="Add company employee">
                  <CompanyUserSelect
                    value={pickUserId}
                    onChange={setPickUserId}
                    excludeIds={excludeIds}
                    emptyLabel="Select employee…"
                  />
                </BizField>
                <button type="button" disabled={saving} onClick={() => void addEmployee()} className={bizBtnPrimary}>
                  <UserPlus className="h-4 w-4" />
                  Add
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <BizField label="Guest name">
                  <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className={bizInput} />
                </BizField>
                <BizField label="Guest email">
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className={bizInput}
                  />
                </BizField>
                <button type="button" disabled={saving} onClick={() => void addGuest()} className={bizBtnSecondary}>
                  <Plus className="h-4 w-4" />
                  Add Guest
                </button>
              </div>

              {participants.length === 0 ? (
                <p className="text-sm text-gray-500">No participants yet. Use Add above.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {participants.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                      <span className="text-gray-800">
                        {p.user ? displayName(p.user) : p.guestName || p.guestEmail || 'Guest'}
                        {!p.userId ? (
                          <span className="ml-2 text-[11px] uppercase text-gray-400">Guest</span>
                        ) : null}
                      </span>
                      <BizStatusBadge
                        status={p.response}
                        tone={
                          p.response === 'accepted'
                            ? 'success'
                            : p.response === 'rejected'
                              ? 'danger'
                              : 'neutral'
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {tab === 'agenda' ? (
            <div className="space-y-4">
              <form onSubmit={addAgenda} className="grid gap-2 lg:grid-cols-[1fr_110px_1fr_auto] lg:items-end">
                <BizField label="Topic">
                  <input
                    value={agendaTitle}
                    onChange={(e) => setAgendaTitle(e.target.value)}
                    className={bizInput}
                    placeholder="Discussion topic"
                    required
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
                    onChange={setAgendaPresenterId}
                    emptyLabel="Optional presenter…"
                  />
                </BizField>
                <button type="submit" disabled={saving} className={bizBtnPrimary}>
                  <ListPlus className="h-4 w-4" />
                  Add
                </button>
              </form>

              {agendaItems.length === 0 ? (
                <p className="text-sm text-gray-500">No agenda items. Add topics above.</p>
              ) : (
                <ol className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {agendaItems.map((a, idx) => (
                    <li key={a.id} className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">
                          {idx + 1}. {a.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {a.allocatedMinutes ? `${a.allocatedMinutes} min` : 'No time set'}
                          {a.presenter ? ` · ${displayName(a.presenter)}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeAgenda(a.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : null}

          {tab === 'minutes' ? (
            <form onSubmit={saveMinutes} className="space-y-3">
              <BizField label="Discussion minutes">
                <textarea
                  value={minuteContent}
                  onChange={(e) => setMinuteContent(e.target.value)}
                  rows={8}
                  className={bizInput}
                  placeholder="Record what was discussed…"
                  required
                />
              </BizField>
              <BizField label="Decisions taken">
                <textarea
                  value={minuteDecisions}
                  onChange={(e) => setMinuteDecisions(e.target.value)}
                  rows={3}
                  className={bizInput}
                  placeholder="Key decisions…"
                />
              </BizField>
              <div className="flex flex-wrap items-center gap-2">
                <button type="submit" disabled={saving} className={bizBtnPrimary}>
                  {latestMinute ? 'Update Minutes' : 'Save Minutes'}
                </button>
                {latestMinute ? (
                  <span className="text-xs text-gray-500">
                    Last saved {fmtDateTime(latestMinute.recordedAt)}
                  </span>
                ) : null}
              </div>
            </form>
          ) : null}

          {tab === 'actions' ? (
            <div className="space-y-4">
              <form
                onSubmit={addAction}
                className="grid gap-2 lg:grid-cols-[1fr_160px_1fr_auto] lg:items-end"
              >
                <BizField label="Action item">
                  <input
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    className={bizInput}
                    placeholder="What needs to be done?"
                    required
                  />
                </BizField>
                <BizField label="Due date">
                  <input
                    type="date"
                    value={actionDue}
                    onChange={(e) => setActionDue(e.target.value)}
                    className={bizInput}
                  />
                </BizField>
                <BizField label="Assign to">
                  <CompanyUserSelect
                    value={actionAssigneeId}
                    onChange={setActionAssigneeId}
                    emptyLabel="Select assignee…"
                  />
                </BizField>
                <button type="submit" disabled={saving} className={bizBtnPrimary}>
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </form>

              {actionItems.length === 0 ? (
                <p className="text-sm text-gray-500">No action items yet. Add follow-ups above.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {actionItems.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-col gap-2 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{a.title}</p>
                        <p className="text-xs text-gray-500">
                          {a.assignee ? displayName(a.assignee) : 'Unassigned'}
                          {a.dueDate ? ` · due ${new Date(a.dueDate).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <select
                        value={a.status}
                        onChange={(e) => void updateActionStatus(a.id, e.target.value)}
                        className={bizSelect}
                      >
                        {ACTION_STATUSES.map((s) => (
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
        </div>
      </div>
    </div>
  );
}
