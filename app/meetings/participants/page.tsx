'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { BizEmptyState, BizStatusBadge } from '../../../components/business-apps/BusinessAppShell';
import {
  BizCard,
  BizField,
  bizBtnPrimary,
  bizBtnSecondary,
  bizInput,
} from '../../../components/business-apps/bizUi';
import CompanyUserSelect from '../../../components/business-apps/CompanyUserSelect';
import MeetingPicker from '../../../components/business-apps/MeetingPicker';
import { displayName, meetingsApi, type MtgMeeting, type MtgParticipant } from '../../../lib/business-apps-api';

function ParticipantsPanel({
  meeting,
  onChanged,
}: {
  meeting: MtgMeeting;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<MtgParticipant[]>(meeting.participants || []);
  const [pickUserId, setPickUserId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const excludeIds = rows.map((p) => p.userId).filter(Boolean) as string[];

  const refresh = async () => {
    const list = await meetingsApi.participants(meeting.id);
    setRows(Array.isArray(list) ? list : []);
    onChanged();
  };

  const addEmployee = async () => {
    if (!pickUserId) {
      toast.error('Select an employee first');
      return;
    }
    setSaving(true);
    try {
      await meetingsApi.addParticipants(meeting.id, { participantIds: [pickUserId] });
      toast.success('Participant added');
      setPickUserId('');
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add participant');
    } finally {
      setSaving(false);
    }
  };

  const addGuest = async () => {
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
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add guest');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <BizCard title="Add participants">
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <BizField label="Company employee">
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
        </div>
      </BizCard>

      {rows.length === 0 ? (
        <BizEmptyState title="No participants" description="Use Add above to invite employees or guests." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Response</th>
                <th className="px-4 py-3">Attended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.user ? displayName(p.user) : p.guestName || 'Guest'}
                    {!p.userId ? (
                      <span className="ml-2 text-[11px] uppercase text-gray-400">Guest</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.user?.email || p.guestEmail || '—'}</td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {p.attended === null || p.attended === undefined ? '—' : p.attended ? 'Yes' : 'No'}
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

export default function MeetingsParticipantsPage() {
  return (
    <MeetingPicker title="Participants" description="Invite employees or guests and track RSVP responses.">
      {(meeting, { reload }) => (
        <ParticipantsPanel key={meeting.id} meeting={meeting} onChanged={reload} />
      )}
    </MeetingPicker>
  );
}
