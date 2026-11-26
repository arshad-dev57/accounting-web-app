'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BizEmptyState, BizPageHeader } from '../../../components/business-apps/BusinessAppShell';
import {
  BizCard,
  BizField,
  BizLoading,
  bizBtnPrimary,
  bizInput,
} from '../../../components/business-apps/bizUi';
import { appointmentsApi } from '../../../lib/business-apps-api';

export default function AppointmentsSettingsPage() {
  const [form, setForm] = useState({
    bufferMinutes: '0',
    slotIntervalMinutes: '30',
    reminderMinutesBefore: '60',
    requireApproval: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    appointmentsApi
      .settings()
      .then((s) => {
        if (cancelled) return;
        setForm({
          bufferMinutes: String(s.bufferMinutes ?? 0),
          slotIntervalMinutes: String(s.slotIntervalMinutes ?? 30),
          reminderMinutesBefore: String(s.reminderMinutesBefore ?? 60),
          requireApproval: !!s.requireApproval,
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load settings');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await appointmentsApi.updateSettings({
        bufferMinutes: Number(form.bufferMinutes),
        slotIntervalMinutes: Number(form.slotIntervalMinutes),
        reminderMinutesBefore: Number(form.reminderMinutesBefore),
        requireApproval: form.requireApproval,
      });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BizPageHeader title="Appointment Settings" description="Buffers, slot interval, approval and reminders." />
      {loading ? (
        <BizLoading height="h-48" />
      ) : error ? (
        <BizEmptyState title="Unable to load settings" description={error} />
      ) : (
        <form onSubmit={onSave} className="max-w-xl">
          <BizCard title="Booking rules">
            <div className="grid gap-4 sm:grid-cols-2">
              <BizField label="Buffer between bookings (minutes)">
                <input
                  type="number"
                  min="0"
                  value={form.bufferMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, bufferMinutes: e.target.value }))}
                  className={bizInput}
                />
              </BizField>
              <BizField label="Slot interval (minutes)">
                <input
                  type="number"
                  min="5"
                  value={form.slotIntervalMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, slotIntervalMinutes: e.target.value }))}
                  className={bizInput}
                />
              </BizField>
              <BizField label="Reminder before (minutes)">
                <input
                  type="number"
                  min="0"
                  value={form.reminderMinutesBefore}
                  onChange={(e) => setForm((f) => ({ ...f, reminderMinutesBefore: e.target.value }))}
                  className={bizInput}
                />
              </BizField>
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.requireApproval}
                  onChange={(e) => setForm((f) => ({ ...f, requireApproval: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Require approval for new bookings
              </label>
            </div>
            <button type="submit" disabled={saving} className={`${bizBtnPrimary} mt-5`}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </BizCard>
        </form>
      )}
    </div>
  );
}
