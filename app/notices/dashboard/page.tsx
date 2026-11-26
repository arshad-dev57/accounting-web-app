'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  Eye,
  FolderOpen,
  LayoutDashboard,
  Megaphone,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import {
  DeskBar,
  DeskError,
  DeskHeader,
  DeskLinkGroup,
  DeskLoading,
  DeskPanel,
  DeskShortcut,
  DeskStatCard,
  STATUS_COLORS,
} from '../../../components/business-apps/DeskWidgets';
import { noticesApi, type NtcDashboard } from '../../../lib/business-apps-api';

export default function NoticesDashboardPage() {
  const [data, setData] = useState<NtcDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    noticesApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusRows = useMemo(() => {
    const map = data?.notices.byStatus || {};
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [data]);

  if (loading) return <DeskLoading />;
  if (error) return <DeskError message={error} onRetry={fetchData} />;
  if (!data) return null;

  const shortcuts = [
    { href: '/notices/dashboard', label: 'Dashboard', sub: 'Overview', icon: LayoutDashboard },
    { href: '/notices/list', label: 'Notices', sub: `${data.notices.total} total`, icon: Megaphone },
    { href: '/notices/categories', label: 'Categories', sub: 'Taxonomy', icon: FolderOpen },
    { href: '/notices/reads', label: 'Read Receipts', sub: `${data.engagement.readReceipts} reads`, icon: Eye },
    { href: '/notices/reports', label: 'Reports', sub: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="w-full space-y-5">
      <DeskHeader
        title="Notice Board"
        subtitle="Corporate announcements · publish, track and archive"
        actions={
          <>
            <button
              type="button"
              onClick={fetchData}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
            <Link
              href="/notices/list?new=1"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#014582] px-4 py-2 text-sm font-semibold text-white hover:bg-[#01366a]"
            >
              <Plus className="h-4 w-4" />
              New
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shortcuts.map((s) => (
          <DeskShortcut key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DeskStatCard
          label="Published"
          value={data.notices.published}
          icon={Megaphone}
          href="/notices/list"
          accent="#10b981"
          sub={`${data.notices.publishedToday} today`}
        />
        <DeskStatCard
          label="Drafts"
          value={data.notices.draft}
          icon={FolderOpen}
          href="/notices/list"
          accent="#64748b"
          sub={`${data.notices.pendingApproval} pending approval`}
        />
        <DeskStatCard
          label="Unread for me"
          value={data.me.unread}
          icon={Bell}
          href="/notices/list"
          accent="#f59e0b"
          sub={`${data.notices.scheduled} scheduled`}
        />
        <DeskStatCard
          label="Urgent Active"
          value={data.notices.urgentActive}
          icon={AlertTriangle}
          href="/notices/list"
          accent="#ef4444"
          sub={`${data.notices.expiringSoon} expiring soon`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DeskPanel title="Notice Status">
          <div className="space-y-3.5">
            {statusRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No Data</p>
            ) : (
              statusRows.map(({ status, count }) => (
                <DeskBar
                  key={status}
                  label={status}
                  count={count}
                  total={data.notices.total || 1}
                  color={STATUS_COLORS[status] || '#6b7280'}
                />
              ))
            )}
          </div>
        </DeskPanel>

        <DeskPanel
          title="Recent Notices"
          action={
            <Link href="/notices/list" className="text-xs font-medium text-[#014582]">
              All
            </Link>
          }
        >
          {(data.recent || []).length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No notices yet</p>
          ) : (
            <ul className="space-y-2.5">
              {data.recent.slice(0, 6).map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/notices/${n.id}`}
                    className="flex items-start justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 capitalize">
                        {n.category} · {n.priority}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] capitalize text-gray-600">
                      {n.status.replace(/_/g, ' ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DeskPanel>

        <DeskPanel title="Engagement">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
              <span className="text-sm text-gray-700">Read receipts</span>
              <span className="text-lg font-semibold tabular-nums">{data.engagement.readReceipts}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
              <span className="text-sm text-gray-700">Comments</span>
              <span className="text-lg font-semibold tabular-nums">{data.engagement.comments}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
              <span className="text-sm text-gray-700">Expired</span>
              <span className="text-lg font-semibold tabular-nums">{data.notices.expired}</span>
            </div>
          </div>
        </DeskPanel>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DeskLinkGroup
          title="Notices"
          items={[
            { href: '/notices/list', label: 'All Notices' },
            { href: '/notices/categories', label: 'Categories' },
            { href: '/notices/audience', label: 'Audience' },
            { href: '/notices/reads', label: 'Read Receipts' },
          ]}
        />
        <DeskLinkGroup
          title="Engagement"
          items={[
            { href: '/notices/comments', label: 'Comments' },
            { href: '/notices/reports', label: 'Reports' },
            { href: '/notices/settings', label: 'Settings' },
            { href: '/notices/notifications', label: 'Notifications' },
          ]}
        />
        <DeskPanel title="Quick Actions">
          <div className="space-y-2">
            <Link href="/notices/list?new=1" className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Plus className="h-4 w-4 text-[#014582]" /> Create notice
            </Link>
            <Link href="/notices/categories" className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <FolderOpen className="h-4 w-4 text-[#014582]" /> Manage categories
            </Link>
            <Link href="/notices/reads" className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Eye className="h-4 w-4 text-[#014582]" /> Review read receipts
            </Link>
          </div>
        </DeskPanel>
      </div>
    </div>
  );
}
