'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BizCard,
  BizField,
  BizLoading,
  bizBtnPrimary,
  bizInput,
  fmtDateTime,
} from '../../../components/business-apps/bizUi';
import MeetingPicker from '../../../components/business-apps/MeetingPicker';
import { meetingsApi, type MtgMeeting, type MtgMinute } from '../../../lib/business-apps-api';

/** Backend returns `{ minute, history, minutesSummary }`; tolerate a `latest` alias too. */
type MinutesPayload = {
  minute?: MtgMinute | null;
  latest?: MtgMinute | null;
  history?: MtgMinute[];
  minutesSummary?: string | null;
};

function MinutesPanel({ meeting }: { meeting: MtgMeeting }) {
  const [current, setCurrent] = useState<MtgMinute | null>(null);
  const [history, setHistory] = useState<MtgMinute[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [decisions, setDecisions] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = (await meetingsApi.minutes(meeting.id)) as MinutesPayload;
      const latest = res?.minute ?? res?.latest ?? null;
      setCurrent(latest);
      setHistory(Array.isArray(res?.history) ? res.history : []);
      setContent(latest?.content || '');
      setDecisions(latest?.decisions || '');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load minutes');
    } finally {
      setLoading(false);
    }
  }, [meeting.id]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await meetingsApi.saveMinutes(meeting.id, {
        content: content.trim(),
        decisions: decisions.trim(),
      });
      toast.success(current ? 'Minutes updated' : 'Minutes recorded');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save minutes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <BizLoading />;

  const older = history.filter((h) => h.id !== current?.id);

  return (
    <div className="space-y-4">
      <BizCard
        title={current ? `${meeting.title} — minutes` : 'Record minutes'}
        right={current ? <span className="text-xs text-gray-500">Last saved {fmtDateTime(current.recordedAt)}</span> : null}
      >
        <form onSubmit={onSave} className="space-y-3">
          <BizField label="Minutes">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className={bizInput}
              required
            />
          </BizField>
          <BizField label="Decisions">
            <textarea
              value={decisions}
              onChange={(e) => setDecisions(e.target.value)}
              rows={3}
              className={bizInput}
            />
          </BizField>
          <button type="submit" disabled={saving} className={bizBtnPrimary}>
            {saving ? 'Saving…' : current ? 'Update minutes' : 'Save minutes'}
          </button>
        </form>
      </BizCard>

      {meeting.minutesSummary && !current ? (
        <BizCard title="Summary">
          <p className="whitespace-pre-wrap text-sm text-gray-700">{meeting.minutesSummary}</p>
        </BizCard>
      ) : null}

      {older.length > 0
        ? older.map((m) => (
            <BizCard key={m.id} title={`Earlier version — ${fmtDateTime(m.recordedAt)}`}>
              <p className="whitespace-pre-wrap text-sm text-gray-800">{m.content}</p>
              {m.decisions ? (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Decisions</p>
                  <p className="mt-1 whitespace-pre-wrap">{m.decisions}</p>
                </div>
              ) : null}
            </BizCard>
          ))
        : null}
    </div>
  );
}

export default function MeetingsMinutesPage() {
  return (
    <MeetingPicker title="Minutes" description="Recorded minutes and decisions for a meeting.">
      {(meeting) => <MinutesPanel key={meeting.id} meeting={meeting} />}
    </MeetingPicker>
  );
}
