'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import {
  BizCard,
  BizLoading,
  bizBtnSecondary,
  bizSelect,
  fmtDateTime,
  meetingStatusTone,
} from '../../../components/business-apps/bizUi';
import { displayName, meetingsApi, type MtgMeeting } from '../../../lib/business-apps-api';

const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

export default function MeetingDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [meeting, setMeeting] = useState<MtgMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setMeeting(await meetingsApi.get(id));
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

  const updateStatus = async (status: string) => {
    if (!meeting) return;
    setSaving(true);
    try {
      await meetingsApi.update(meeting.id, { status });
      toast.success('Meeting status updated');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <BizLoading height="h-64" />;
  if (error || !meeting) {
    return <BizEmptyState title="Meeting not found" description={error || 'This meeting is unavailable.'} />;
  }

  return (
    <div>
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
            <Link href="/meetings/list" className={bizBtnSecondary}>
              Back to list
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <BizCard title="Details" className="lg:col-span-2">
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
            {meeting.description ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-gray-500">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap text-gray-900">{meeting.description}</dd>
              </div>
            ) : null}
          </dl>
        </BizCard>

        <BizCard title={`Participants (${meeting.participants?.length ?? 0})`}>
          {(meeting.participants || []).length === 0 ? (
            <p className="text-sm text-gray-500">No participants.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {(meeting.participants || []).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="text-gray-800">
                    {p.user ? displayName(p.user) : p.guestName || p.guestEmail || 'Guest'}
                  </span>
                  <BizStatusBadge
                    status={p.response}
                    tone={p.response === 'accepted' ? 'success' : p.response === 'rejected' ? 'danger' : 'neutral'}
                  />
                </li>
              ))}
            </ul>
          )}
        </BizCard>

        <BizCard title={`Agenda (${meeting.agendaItems?.length ?? 0})`}>
          {(meeting.agendaItems || []).length === 0 ? (
            <p className="text-sm text-gray-500">No agenda items.</p>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-800">
              {(meeting.agendaItems || []).map((a) => (
                <li key={a.id}>
                  {a.title}
                  {a.allocatedMinutes ? <span className="text-xs text-gray-500"> · {a.allocatedMinutes} min</span> : null}
                </li>
              ))}
            </ol>
          )}
        </BizCard>

        <BizCard title={`Minutes (${meeting.minutes?.length ?? 0})`}>
          {(meeting.minutes || []).length === 0 ? (
            <p className="text-sm text-gray-500">No minutes recorded.</p>
          ) : (
            <ul className="space-y-3 text-sm text-gray-800">
              {(meeting.minutes || []).map((m) => (
                <li key={m.id}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className="text-xs text-gray-500">{fmtDateTime(m.recordedAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </BizCard>

        <BizCard title={`Action items (${meeting.actionItems?.length ?? 0})`}>
          {(meeting.actionItems || []).length === 0 ? (
            <p className="text-sm text-gray-500">No action items.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {(meeting.actionItems || []).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="text-gray-800">{a.title}</span>
                  <BizStatusBadge status={a.status} tone={a.status === 'done' ? 'success' : 'info'} />
                </li>
              ))}
            </ul>
          )}
        </BizCard>
      </div>
    </div>
  );
}
