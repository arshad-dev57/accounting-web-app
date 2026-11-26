'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import {
  BizCard,
  BizField,
  BizLoading,
  bizBtnPrimary,
  bizInput,
  bizSelect,
  fmtDate,
} from '../../../components/business-apps/bizUi';
import {
  appointmentsApi,
  displayName,
  type ApptAvailabilitySlot,
  type ApptHoliday,
} from '../../../lib/business-apps-api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const deleteBtn =
  'rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50';

export default function AppointmentsAvailabilityPage() {
  const [slots, setSlots] = useState<ApptAvailabilitySlot[]>([]);
  const [holidays, setHolidays] = useState<ApptHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isBreak, setIsBreak] = useState(false);
  const [savingSlot, setSavingSlot] = useState(false);

  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [savingHoliday, setSavingHoliday] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await appointmentsApi.availability();
      if (Array.isArray(data)) {
        setSlots(data);
      } else {
        setSlots(data?.availability || []);
        setHolidays(data?.holidays || []);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byDay = useMemo(
    () =>
      DAYS.map((label, idx) => ({
        label,
        rows: slots.filter((s) => s.dayOfWeek === idx),
      })),
    [slots]
  );

  const onAddSlot = async (e: FormEvent) => {
    e.preventDefault();
    if (endTime <= startTime) {
      toast.error('End time must be after start time');
      return;
    }
    setSavingSlot(true);
    try {
      await appointmentsApi.createAvailability({ dayOfWeek, startTime, endTime, isBreak });
      toast.success(isBreak ? 'Break added' : 'Working hours added');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add slot');
    } finally {
      setSavingSlot(false);
    }
  };

  const onDeleteSlot = async (id: string) => {
    try {
      await appointmentsApi.deleteAvailability(id);
      toast.success('Slot removed');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove slot');
    }
  };

  const onAddHoliday = async (e: FormEvent) => {
    e.preventDefault();
    if (!holidayDate) return;
    setSavingHoliday(true);
    try {
      await appointmentsApi.createHoliday({ date: holidayDate, name: holidayName.trim() || undefined });
      toast.success('Holiday added');
      setHolidayDate('');
      setHolidayName('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add holiday');
    } finally {
      setSavingHoliday(false);
    }
  };

  const onDeleteHoliday = async (id: string) => {
    try {
      await appointmentsApi.deleteHoliday(id);
      toast.success('Holiday removed');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove holiday');
    }
  };

  return (
    <div>
      <BizPageHeader title="Availability" description="Working hours, breaks and upcoming holidays." />

      {loading ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load availability" description={error} />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <BizCard title="Add hours or break">
              <form onSubmit={onAddSlot} className="grid gap-3 sm:grid-cols-3">
                <BizField label="Day" className="sm:col-span-3">
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className={`${bizSelect} w-full`}
                  >
                    {DAYS.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </BizField>
                <BizField label="Start">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={bizInput}
                    required
                  />
                </BizField>
                <BizField label="End">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={bizInput}
                    required
                  />
                </BizField>
                <label className="flex items-center gap-2 pt-6 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={isBreak}
                    onChange={(e) => setIsBreak(e.target.checked)}
                    className="h-4 w-4 accent-[#014582]"
                  />
                  Break
                </label>
                <div className="sm:col-span-3">
                  <button type="submit" disabled={savingSlot} className={bizBtnPrimary}>
                    {savingSlot ? 'Saving…' : 'Add slot'}
                  </button>
                </div>
              </form>
            </BizCard>

            <BizCard title="Add holiday">
              <form onSubmit={onAddHoliday} className="grid gap-3 sm:grid-cols-2">
                <BizField label="Date">
                  <input
                    type="date"
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className={bizInput}
                    required
                  />
                </BizField>
                <BizField label="Name (optional)">
                  <input
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    className={bizInput}
                  />
                </BizField>
                <div className="sm:col-span-2">
                  <button type="submit" disabled={savingHoliday} className={bizBtnPrimary}>
                    {savingHoliday ? 'Saving…' : 'Add holiday'}
                  </button>
                </div>
              </form>
            </BizCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BizCard title="Weekly hours">
              <ul className="divide-y divide-gray-100">
                {byDay.map((d) => (
                  <li key={d.label} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <span className="w-24 shrink-0 font-medium text-gray-800">{d.label}</span>
                    <div className="flex-1 space-y-1 text-right">
                      {d.rows.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        d.rows.map((r) => (
                          <div key={r.id} className="flex items-center justify-end gap-2 text-gray-700">
                            <span className="tabular-nums">
                              {r.startTime} – {r.endTime}
                            </span>
                            {r.isBreak ? <BizStatusBadge status="break" tone="warning" /> : null}
                            {r.user ? <span className="text-xs text-gray-500">{displayName(r.user)}</span> : null}
                            <button type="button" onClick={() => void onDeleteSlot(r.id)} className={deleteBtn}>
                              Delete
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </BizCard>
            <BizCard title="Upcoming holidays">
              {holidays.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming holidays.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {holidays.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="text-gray-800">{h.name || 'Holiday'}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{fmtDate(h.date)}</span>
                        <button type="button" onClick={() => void onDeleteHoliday(h.id)} className={deleteBtn}>
                          Delete
                        </button>
                      </div>
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
