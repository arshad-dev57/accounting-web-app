'use client';

import React, { useEffect, useState } from 'react';
import { BizEmptyState, BizPageHeader } from './BusinessAppShell';
import { BizLoading, BizNote } from './bizUi';
import { asList, noticesApi, type NtcNotice } from '../../lib/business-apps-api';

/** Scaffold for notice sub-pages: loads notices (optionally unread only) and renders them via children. */
export default function NoticeFeed({
  title,
  description,
  note,
  unreadOnly,
  emptyTitle,
  emptyDescription,
  children,
}: {
  title: string;
  description: string;
  note?: string;
  unreadOnly?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: (notices: NtcNotice[]) => React.ReactNode;
}) {
  const [items, setItems] = useState<NtcNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    noticesApi
      .list({ limit: 100, unread: unreadOnly ? 1 : undefined })
      .then((data) => {
        if (!cancelled) setItems(asList(data));
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
  }, [unreadOnly]);

  return (
    <div>
      <BizPageHeader title={title} description={description} />
      {note ? (
        <div className="mb-6">
          <BizNote>{note}</BizNote>
        </div>
      ) : null}
      {loading ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load notices" description={error} />
      ) : items.length === 0 ? (
        <BizEmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        children(items)
      )}
    </div>
  );
}
