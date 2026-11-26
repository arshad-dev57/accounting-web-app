'use client';

export const dynamic = 'force-dynamic';

import { BizEmptyState, BizStatusBadge } from '../../../components/business-apps/BusinessAppShell';
import MeetingPicker from '../../../components/business-apps/MeetingPicker';
import { displayName } from '../../../lib/business-apps-api';

export default function MeetingsParticipantsPage() {
  return (
    <MeetingPicker title="Participants" description="Attendees and their RSVP responses for a meeting.">
      {(meeting) => {
        const rows = meeting.participants || [];
        if (rows.length === 0) {
          return <BizEmptyState title="No participants" description="This meeting has no invited participants." />;
        }
        return (
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
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.user?.email || p.guestEmail || '—'}</td>
                    <td className="px-4 py-3">
                      <BizStatusBadge
                        status={p.response}
                        tone={p.response === 'accepted' ? 'success' : p.response === 'rejected' ? 'danger' : 'neutral'}
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
        );
      }}
    </MeetingPicker>
  );
}
