'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BizEmptyState } from '../../../components/business-apps/BusinessAppShell';
import {
  BizCard,
  BizField,
  BizLoading,
  bizBtnPrimary,
  bizInput,
} from '../../../components/business-apps/bizUi';
import MeetingPicker from '../../../components/business-apps/MeetingPicker';
import {
  displayName,
  meetingsApi,
  type MtgAgendaItem,
  type MtgMeeting,
} from '../../../lib/business-apps-api';

function AgendaPanel({ meeting }: { meeting: MtgMeeting }) {
  const [items, setItems] = useState<MtgAgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await meetingsApi.agenda(meeting.id);
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load agenda');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [meeting.id]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await meetingsApi.createAgendaItem(meeting.id, {
        title: title.trim(),
        allocatedMinutes: minutes ? Number(minutes) : undefined,
        notes: notes.trim() || undefined,
      });
      toast.success('Agenda item added');
      setTitle('');
      setMinutes('');
      setNotes('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add agenda item');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this agenda item?')) return;
    try {
      await meetingsApi.deleteAgendaItem(id);
      toast.success('Agenda item deleted');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete agenda item');
    }
  };

  const allocated = items.reduce((s, i) => s + (i.allocatedMinutes || 0), 0);

  return (
    <div className="space-y-4">
      <BizCard title="Add agenda item">
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <BizField label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={bizInput} required />
          </BizField>
          <BizField label="Minutes">
            <input
              type="number"
              min={0}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className={bizInput}
            />
          </BizField>
          <BizField label="Notes" className="sm:col-span-2">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={bizInput} />
          </BizField>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className={bizBtnPrimary}>
              {saving ? 'Saving…' : 'Add item'}
            </button>
          </div>
        </form>
      </BizCard>

      {meeting.agendaSummary ? (
        <BizCard title="Summary">
          <p className="whitespace-pre-wrap text-sm text-gray-700">{meeting.agendaSummary}</p>
        </BizCard>
      ) : null}

      {loading ? (
        <BizLoading height="h-32" />
      ) : items.length === 0 ? (
        <BizEmptyState title="No agenda items" description="Add the first agenda item for this meeting above." />
      ) : (
        <BizCard
          title={`${meeting.title} — agenda`}
          right={
            <span className="text-xs text-gray-500">
              {allocated} of {meeting.durationMinutes} min allocated
            </span>
          }
        >
          <ol className="divide-y divide-gray-100">
            {items.map((a, i) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">
                    {i + 1}. {a.title}
                  </p>
                  {a.presenter ? (
                    <p className="text-xs text-gray-500">Presenter: {displayName(a.presenter)}</p>
                  ) : null}
                  {a.notes ? <p className="mt-1 text-xs text-gray-600">{a.notes}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-gray-500">{a.allocatedMinutes ? `${a.allocatedMinutes} min` : ''}</span>
                  <button
                    type="button"
                    onClick={() => void onDelete(a.id)}
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </BizCard>
      )}
    </div>
  );
}

export default function MeetingsAgendaPage() {
  return (
    <MeetingPicker title="Agenda" description="Agenda items and presenters for a meeting.">
      {(meeting) => <AgendaPanel key={meeting.id} meeting={meeting} />}
    </MeetingPicker>
  );
}
