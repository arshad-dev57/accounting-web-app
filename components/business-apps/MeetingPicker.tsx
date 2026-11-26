'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BizEmptyState, BizPageHeader } from './BusinessAppShell';
import { BizLoading, bizSelect, fmtDateTime } from './bizUi';
import { asList, meetingsApi, type MtgMeeting } from '../../lib/business-apps-api';

/**
 * Page scaffold for meeting sub-pages (participants, agenda, minutes, action items):
 * loads recent meetings, lets the user pick one, loads full detail and renders children.
 */
export default function MeetingPicker({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: (meeting: MtgMeeting) => React.ReactNode;
}) {
  const [meetings, setMeetings] = useState<MtgMeeting[]>([]);
  const [meetingId, setMeetingId] = useState('');
  const [detail, setDetail] = useState<MtgMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = asList(await meetingsApi.list({ limit: 100 }));
        if (cancelled) return;
        setMeetings(rows);
        if (rows[0]) setMeetingId(rows[0].id);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load meetings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!meetingId) return;
    let cancelled = false;
    setLoadingDetail(true);
    setError(null);
    meetingsApi
      .get(meetingId)
      .then((m) => {
        if (!cancelled) setDetail(m);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load meeting');
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  return (
    <div>
      <BizPageHeader
        title={title}
        description={description}
        actions={
          meetings.length > 0 ? (
            <select value={meetingId} onChange={(e) => setMeetingId(e.target.value)} className={bizSelect}>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} — {fmtDateTime(m.startsAt)}
                </option>
              ))}
            </select>
          ) : null
        }
      />

      {loading || loadingDetail ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load data" description={error} />
      ) : meetings.length === 0 ? (
        <BizEmptyState
          title="No meetings yet"
          description="Schedule a meeting first."
          action={
            <Link href="/meetings/list?new=1" className="rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white">
              Schedule meeting
            </Link>
          }
        />
      ) : detail ? (
        children(detail)
      ) : null}
    </div>
  );
}
