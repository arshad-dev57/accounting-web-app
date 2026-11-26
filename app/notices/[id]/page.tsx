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
  fmtDateTime,
  noticeStatusTone,
} from '../../../components/business-apps/bizUi';
import { displayName, noticesApi, type NtcNotice } from '../../../lib/business-apps-api';

export default function NoticeDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [notice, setNotice] = useState<NtcNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const n = await noticesApi.get(id);
        if (cancelled) return;
        setNotice(n);
        // Mark as read when a published notice is opened.
        if (n.status === 'published' && !n.isRead) {
          try {
            await noticesApi.markRead(id);
            if (!cancelled) setNotice((prev) => (prev ? { ...prev, isRead: true, readAt: new Date().toISOString() } : prev));
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not mark notice as read');
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load notice');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <BizLoading height="h-64" />;
  if (error || !notice) {
    return <BizEmptyState title="Notice not found" description={error || 'This notice is unavailable.'} />;
  }

  return (
    <div>
      <BizPageHeader
        title={notice.title}
        description={`${notice.category} · by ${displayName(notice.creator)} · ${fmtDateTime(notice.publishedAt || notice.createdAt)}`}
        actions={
          <Link href="/notices/list" className={bizBtnSecondary}>
            Back to list
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <BizCard className="lg:col-span-2">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{notice.body}</p>
        </BizCard>
        <div className="space-y-4">
          <BizCard title="Details">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <BizStatusBadge status={notice.status} tone={noticeStatusTone(notice.status)} />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Priority</dt>
                <dd>
                  <BizStatusBadge
                    status={notice.priority}
                    tone={notice.priority === 'urgent' ? 'danger' : notice.priority === 'high' ? 'warning' : 'info'}
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Read by</dt>
                <dd className="tabular-nums text-gray-900">{notice._count?.readReceipts ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Comments</dt>
                <dd className="tabular-nums text-gray-900">{notice._count?.comments ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Expires</dt>
                <dd className="text-gray-900">{notice.expireAt ? fmtDateTime(notice.expireAt) : '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">You</dt>
                <dd className="text-gray-900">{notice.isRead ? 'Read' : 'Unread'}</dd>
              </div>
            </dl>
          </BizCard>
          <BizCard title="Audience">
            {(notice.audiences || []).length === 0 ? (
              <p className="text-sm text-gray-500">Entire company.</p>
            ) : (
              <ul className="space-y-1 text-sm text-gray-800">
                {(notice.audiences || []).map((a, i) => (
                  <li key={a.id || i} className="capitalize">
                    {a.audienceType}
                    {a.audienceId ? ` · ${a.audienceId}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </BizCard>
        </div>
      </div>
    </div>
  );
}
