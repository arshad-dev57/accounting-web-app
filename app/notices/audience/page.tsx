'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import NoticeFeed from '../../../components/business-apps/NoticeFeed';

export default function NoticesAudiencePage() {
  return (
    <NoticeFeed
      title="Audience"
      description="Who each notice is targeted to."
      note="Audience targeting (departments, roles, branches, employees) will be editable here. Notices without a specific audience go to the entire company."
      emptyTitle="No notices yet"
      emptyDescription="Create a notice to set its audience."
    >
      {(notices) => (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Notice</th>
                <th className="px-4 py-3">Audience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notices.map((n) => (
                <tr key={n.id}>
                  <td className="px-4 py-3">
                    <Link href={`/notices/${n.id}`} className="font-medium text-[#014582] hover:underline">
                      {n.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-700">
                    {(n.audiences || []).length === 0
                      ? 'company'
                      : (n.audiences || []).map((a) => a.audienceType).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </NoticeFeed>
  );
}
