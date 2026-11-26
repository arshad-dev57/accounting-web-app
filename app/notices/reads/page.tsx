'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BizEmptyState, BizStatCard } from '../../../components/business-apps/BusinessAppShell';
import { BizLoading, fmtDateTime } from '../../../components/business-apps/bizUi';
import NoticePicker from '../../../components/business-apps/NoticePicker';
import { displayName, noticesApi, type NtcNotice, type PmUser } from '../../../lib/business-apps-api';

type Read = { id?: string; readAt?: string; user?: PmUser | null };

function ReadsPanel({ notice }: { notice: NtcNotice }) {
  const [reads, setReads] = useState<Read[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    noticesApi
      .reads(notice.id)
      .then((rows) => {
        if (!cancelled) setReads(Array.isArray(rows) ? (rows as unknown as Read[]) : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load read receipts');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [notice.id]);

  const total = notice._count?.readReceipts ?? reads.length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <BizStatCard label="Total reads" value={total} accent="bg-emerald-500" />
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Notice</p>
          <Link href={`/notices/${notice.id}`} className="mt-2 block font-medium text-[#014582] hover:underline">
            {notice.title}
          </Link>
        </div>
      </div>

      {loading ? (
        <BizLoading height="h-32" />
      ) : error ? (
        <BizEmptyState title="Unable to load read receipts" description={error} />
      ) : reads.length === 0 ? (
        <BizEmptyState title="No reads yet" description="Read receipts appear once people open this notice." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Reader</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Read at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reads.map((r, i) => (
                <tr key={r.id || i}>
                  <td className="px-4 py-3 font-medium text-gray-900">{displayName(r.user)}</td>
                  <td className="px-4 py-3 text-gray-600">{r.user?.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{fmtDateTime(r.readAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > reads.length ? (
            <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
              Showing the {reads.length} most recent of {total} reads.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function NoticesReadsPage() {
  return (
    <NoticePicker title="Read Receipts" description="Who has read each notice.">
      {(notice) => <ReadsPanel key={notice.id} notice={notice} />}
    </NoticePicker>
  );
}
