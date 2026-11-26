'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatCard,
} from '../../../components/business-apps/BusinessAppShell';
import { BizBreakdown, BizCard, BizLoading } from '../../../components/business-apps/bizUi';
import { displayName, noticesApi, type PmUser } from '../../../lib/business-apps-api';

type Counts = Record<string, number>;

type NoticeReport = {
  notices?: {
    total?: number;
    byStatus?: Counts;
    byCategory?: Counts;
    byPriority?: Counts;
    activePublished?: number;
  };
  engagement?: {
    readReceipts?: number;
    comments?: number;
    companyUsers?: number;
    averageReadsPerNotice?: number;
    overallReadRate?: number;
  };
  topRead?: Array<{
    id: string;
    title: string;
    readRate?: number;
    _count?: { readReceipts?: number; comments?: number };
  }>;
  topCommented?: Array<{ id: string; title: string; _count?: { comments?: number } }>;
  topReaders?: Array<{ user?: PmUser; reads?: number }>;
};

const n = (v: unknown) => Number(v || 0);

export default function NoticesReportsPage() {
  const [data, setData] = useState<NoticeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    noticesApi
      .reports()
      .then((d) => {
        if (!cancelled) setData(d as NoticeReport);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load reports');
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
      <BizPageHeader title="Notice Reports" description="Publishing and engagement summary." />
      {loading ? (
        <BizLoading />
      ) : error || !data ? (
        <BizEmptyState title="Unable to load reports" description={error || undefined} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BizStatCard label="Total notices" value={n(data.notices?.total)} />
            <BizStatCard label="Active published" value={n(data.notices?.activePublished)} accent="bg-emerald-500" />
            <BizStatCard label="Read receipts" value={n(data.engagement?.readReceipts)} accent="bg-violet-500" />
            <BizStatCard label="Comments" value={n(data.engagement?.comments)} accent="bg-sky-500" />
            <BizStatCard
              label="Overall read rate"
              value={`${n(data.engagement?.overallReadRate)}%`}
              hint={`${n(data.engagement?.companyUsers)} active users`}
              accent="bg-emerald-500"
            />
            <BizStatCard label="Avg reads / notice" value={n(data.engagement?.averageReadsPerNotice)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <BizBreakdown title="Notices by status" map={data.notices?.byStatus} />
            <BizBreakdown title="Notices by category" map={data.notices?.byCategory} />
            <BizBreakdown title="Notices by priority" map={data.notices?.byPriority} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BizCard title="Most read notices">
              {(data.topRead || []).length === 0 ? (
                <p className="text-sm text-gray-500">No published notices yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {(data.topRead || []).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                      <Link href={`/notices/${r.id}`} className="font-medium text-[#014582] hover:underline">
                        {r.title}
                      </Link>
                      <span className="shrink-0 text-xs text-gray-500">
                        {n(r._count?.readReceipts)} reads · {n(r.readRate)}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </BizCard>
            <BizCard title="Most commented notices">
              {(data.topCommented || []).length === 0 ? (
                <p className="text-sm text-gray-500">No comments yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {(data.topCommented || []).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                      <Link href={`/notices/${r.id}`} className="font-medium text-[#014582] hover:underline">
                        {r.title}
                      </Link>
                      <span className="shrink-0 text-xs text-gray-500">{n(r._count?.comments)} comments</span>
                    </li>
                  ))}
                </ul>
              )}
            </BizCard>
            <BizCard title="Top readers">
              {(data.topReaders || []).length === 0 ? (
                <p className="text-sm text-gray-500">No reads yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {(data.topReaders || []).map((r, i) => (
                    <li key={r.user?.id || i} className="flex items-center justify-between py-2">
                      <span className="text-gray-700">{displayName(r.user)}</span>
                      <span className="tabular-nums font-medium text-gray-900">{n(r.reads)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </BizCard>
          </div>
        </div>
      )}
    </div>
  );
}
