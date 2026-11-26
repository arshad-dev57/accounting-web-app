'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatCard,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import { BizCard, fmtDateTime, noticeStatusTone } from '../../../components/business-apps/bizUi';
import { noticesApi, type NtcDashboard } from '../../../lib/business-apps-api';

export default function NoticesDashboardPage() {
  const [data, setData] = useState<NtcDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    noticesApi
      .dashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <BizPageHeader
        title="Notice Board"
        description="Company announcements, publishing status and engagement."
        actions={
          <Link
            href="/notices/list?new=1"
            className="inline-flex items-center gap-2 rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013663]"
          >
            <Plus className="h-4 w-4" />
            New Notice
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white" />
          ))}
        </div>
      ) : error || !data ? (
        <BizEmptyState title="Unable to load dashboard" description={error || undefined} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BizStatCard label="Total notices" value={data.notices.total} />
            <BizStatCard label="Published" value={data.notices.published} accent="bg-emerald-500" />
            <BizStatCard label="Drafts" value={data.notices.draft} accent="bg-gray-400" />
            <BizStatCard label="Scheduled" value={data.notices.scheduled} accent="bg-sky-500" />
            <BizStatCard label="Pending approval" value={data.notices.pendingApproval} accent="bg-amber-500" />
            <BizStatCard label="Expiring soon" value={data.notices.expiringSoon} accent="bg-amber-500" hint="Within 7 days" />
            <BizStatCard label="Urgent active" value={data.notices.urgentActive} accent="bg-red-500" />
            <BizStatCard label="My unread" value={data.me.unread} accent="bg-violet-500" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <BizCard
              title="Recent notices"
              className="lg:col-span-2"
              right={
                <Link href="/notices/list" className="text-sm font-medium text-[#014582]">
                  View all
                </Link>
              }
            >
              {data.recent.length === 0 ? (
                <p className="text-sm text-gray-500">No notices yet. Create the first announcement.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {data.recent.map((n) => (
                    <li key={n.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <Link href={`/notices/${n.id}`} className="font-medium text-[#014582] hover:underline">
                          {n.title}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {n.category} · {fmtDateTime(n.createdAt)}
                        </p>
                      </div>
                      <BizStatusBadge status={n.status} tone={noticeStatusTone(n.status)} />
                    </li>
                  ))}
                </ul>
              )}
            </BizCard>
            <BizCard title="Engagement">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-600">Read receipts</dt>
                  <dd className="tabular-nums font-semibold text-gray-900">{data.engagement.readReceipts}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-600">Comments</dt>
                  <dd className="tabular-nums font-semibold text-gray-900">{data.engagement.comments}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-600">Published today</dt>
                  <dd className="tabular-nums font-semibold text-gray-900">{data.notices.publishedToday}</dd>
                </div>
              </dl>
            </BizCard>
          </div>
        </>
      )}
    </div>
  );
}
