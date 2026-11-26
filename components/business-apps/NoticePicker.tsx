'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BizEmptyState, BizPageHeader } from './BusinessAppShell';
import { BizLoading, bizSelect } from './bizUi';
import { asList, noticesApi, type NtcNotice } from '../../lib/business-apps-api';

/**
 * Page scaffold for notice sub-pages (comments, read receipts): loads recent notices,
 * lets the user pick one and renders children for the selected notice.
 */
export default function NoticePicker({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: (notice: NtcNotice) => React.ReactNode;
}) {
  const [notices, setNotices] = useState<NtcNotice[]>([]);
  const [noticeId, setNoticeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    noticesApi
      .list({ limit: 100 })
      .then((data) => {
        if (cancelled) return;
        const rows = asList(data);
        setNotices(rows);
        if (rows[0]) setNoticeId(rows[0].id);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load notices');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = notices.find((n) => n.id === noticeId) || null;

  return (
    <div>
      <BizPageHeader
        title={title}
        description={description}
        actions={
          notices.length > 0 ? (
            <select value={noticeId} onChange={(e) => setNoticeId(e.target.value)} className={bizSelect}>
              {notices.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          ) : null
        }
      />
      {loading ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load notices" description={error} />
      ) : notices.length === 0 ? (
        <BizEmptyState
          title="No notices yet"
          description="Create a notice first."
          action={
            <Link href="/notices/list?new=1" className="rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white">
              New notice
            </Link>
          }
        />
      ) : selected ? (
        children(selected)
      ) : null}
    </div>
  );
}
