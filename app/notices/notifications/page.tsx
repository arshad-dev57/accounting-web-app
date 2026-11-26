'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { BizStatusBadge } from '../../../components/business-apps/BusinessAppShell';
import { BizCard, fmtDateTime } from '../../../components/business-apps/bizUi';
import NoticeFeed from '../../../components/business-apps/NoticeFeed';

export default function NoticesNotificationsPage() {
  return (
    <NoticeFeed
      title="Notifications"
      description="Published notices you have not read yet."
      note="Email and push notification preferences will be configurable later."
      unreadOnly
      emptyTitle="You're all caught up"
      emptyDescription="There are no unread notices."
    >
      {(notices) => (
        <BizCard title={`${notices.length} unread`}>
          <ul className="divide-y divide-gray-100">
            {notices.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <Link href={`/notices/${n.id}`} className="font-medium text-[#014582] hover:underline">
                    {n.title}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {n.category} · {fmtDateTime(n.publishedAt || n.createdAt)}
                  </p>
                </div>
                <BizStatusBadge
                  status={n.priority}
                  tone={n.priority === 'urgent' ? 'danger' : n.priority === 'high' ? 'warning' : 'info'}
                />
              </li>
            ))}
          </ul>
        </BizCard>
      )}
    </NoticeFeed>
  );
}
