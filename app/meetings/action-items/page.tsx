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
  bizSelect,
  fmtDate,
} from '../../../components/business-apps/bizUi';
import MeetingPicker from '../../../components/business-apps/MeetingPicker';
import {
  displayName,
  meetingsApi,
  type MtgActionItem,
  type MtgMeeting,
} from '../../../lib/business-apps-api';

const STATUSES = ['open', 'in_progress', 'done', 'cancelled'];

function ActionItemsPanel({ meeting }: { meeting: MtgMeeting }) {
  const [items, setItems] = useState<MtgActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await meetingsApi.actionItems(meeting.id);
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load action items');
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
      await meetingsApi.createActionItem(meeting.id, {
        title: title.trim(),
        dueDate: dueDate || undefined,
        assigneeId: assigneeId.trim() || undefined,
      });
      toast.success('Action item created');
      setTitle('');
      setDueDate('');
      setAssigneeId('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create action item');
    } finally {
      setSaving(false);
    }
  };

  const onStatus = async (id: string, status: string) => {
    try {
      await meetingsApi.updateActionItem(id, { status });
      toast.success('Action item updated');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update action item');
    }
  };

  return (
    <div className="space-y-4">
      <BizCard title="New action item">
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-[1fr_170px_200px_auto] sm:items-end">
          <BizField label="Action">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={bizInput} required />
          </BizField>
          <BizField label="Due date">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={bizInput} />
          </BizField>
          <BizField label="Assignee user ID (optional)">
            <input value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={bizInput} />
          </BizField>
          <button type="submit" disabled={saving} className={bizBtnPrimary}>
            {saving ? 'Saving…' : 'Add'}
          </button>
        </form>
      </BizCard>

      {loading ? (
        <BizLoading height="h-32" />
      ) : items.length === 0 ? (
        <BizEmptyState title="No action items" description="Add follow-up actions from this meeting above." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((a) => {
                const overdue = (a as MtgActionItem & { isOverdue?: boolean }).isOverdue;
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                    <td className="px-4 py-3 text-gray-700">{displayName(a.assignee)}</td>
                    <td className={`px-4 py-3 ${overdue ? 'text-red-600' : 'text-gray-700'}`}>
                      {fmtDate(a.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={a.status}
                        onChange={(e) => void onStatus(a.id, e.target.value)}
                        className={bizSelect}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MeetingsActionItemsPage() {
  return (
    <MeetingPicker title="Action Items" description="Follow-up actions assigned from a meeting.">
      {(meeting) => <ActionItemsPanel key={meeting.id} meeting={meeting} />}
    </MeetingPicker>
  );
}
