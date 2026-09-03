'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarRange,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Unlock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useFiscalYear } from '../../../lib/fiscal-year-context';
import { fiscalYearService, type FiscalYear } from '../../../lib/fiscal-year-service';
import { calculateFiscalYearDates } from '../../../lib/business-options';

/** Parse YYYY-MM-DD as local calendar date (avoid UTC midnight shift). */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function fmt(date?: string | null) {
  if (!date) return '—';
  const raw = String(date).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return parseLocalDate(raw).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return new Date(date).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const PERIOD_TO_PREF: Record<string, string> = {
  Calendar: 'January - December',
  April: 'April - March',
  July: 'July - June',
  Custom: 'Custom',
};

/** Suggest the next non-overlapping range after existing years. */
function suggestNextRange(
  periodKey: string,
  years: FiscalYear[]
): { name: string; startDate: string; endDate: string; periodType: string } {
  const pref = PERIOD_TO_PREF[periodKey] || 'Custom';
  let anchor = new Date();
  if (years.length) {
    const maxEnd = Math.max(...years.map((y) => new Date(y.endDate).getTime()));
    // Day after latest end — calculateFiscalYearDates uses "now" month/year
    anchor = new Date(maxEnd);
    anchor.setDate(anchor.getDate() + 1);
  }

  if (periodKey === 'Custom' || !PERIOD_TO_PREF[periodKey]) {
    const y = anchor.getFullYear();
    return {
      name: `FY ${y}`,
      startDate: `${y}-01-01`,
      endDate: `${y}-12-31`,
      periodType: 'Custom',
    };
  }

  const calc = calculateFiscalYearDates(pref, anchor);
  // If suggested range still overlaps the latest year, jump one year forward
  const latestEnd = years.length
    ? Math.max(...years.map((y) => new Date(y.endDate).getTime()))
    : 0;
  if (latestEnd && parseLocalDate(calc.startDate).getTime() < latestEnd) {
    const bumped = new Date(anchor);
    bumped.setFullYear(bumped.getFullYear() + 1);
    const calc2 = calculateFiscalYearDates(pref, bumped);
    return { ...calc2, periodType: periodKey };
  }
  return { ...calc, periodType: periodKey };
}

export function FiscalYearsPage() {
  const { fiscalYears, selectedFiscalYearId, setSelectedFiscalYearId, refresh, loading } =
    useFiscalYear();
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    periodType: 'Calendar',
  });

  useEffect(() => {
    if (!fiscalYears.length) void refresh();
  }, [fiscalYears.length, refresh]);

  const sorted = useMemo(
    () =>
      [...fiscalYears].sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      ),
    [fiscalYears]
  );

  const openForm = () => {
    const suggested = suggestNextRange('Calendar', fiscalYears);
    setForm(suggested);
    setFormError('');
    setShowForm(true);
  };

  const onPeriodChange = (periodType: string) => {
    if (periodType === 'Custom') {
      setForm((f) => ({ ...f, periodType }));
      return;
    }
    const suggested = suggestNextRange(periodType, fiscalYears);
    setForm(suggested);
    setFormError('');
  };

  const createYear = async () => {
    setFormError('');
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      const msg = 'Name, start date and end date are required';
      setFormError(msg);
      toast.error(msg);
      return;
    }
    if (parseLocalDate(form.startDate) >= parseLocalDate(form.endDate)) {
      const msg = 'Start date must be before end date';
      setFormError(msg);
      toast.error(msg);
      return;
    }

    setSaving(true);
    try {
      const created = await fiscalYearService.create({
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        periodType: PERIOD_TO_PREF[form.periodType] || form.periodType,
      });
      toast.success('Fiscal year created');
      setShowForm(false);
      setForm({ name: '', startDate: '', endDate: '', periodType: 'Calendar' });
      setFormError('');
      await refresh();
      if (created?.id) setSelectedFiscalYearId(created.id);
    } catch (e: any) {
      const msg = e?.message || 'Could not create fiscal year';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const closeYear = async (year: FiscalYear) => {
    if (!confirm(`Close fiscal year "${year.name}"? Posting into closed years will be blocked.`)) {
      return;
    }
    setSaving(true);
    try {
      await fiscalYearService.close(year.id);
      toast.success('Fiscal year closed');
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Could not close fiscal year');
    } finally {
      setSaving(false);
    }
  };

  const reopenYear = async (year: FiscalYear) => {
    setSaving(true);
    try {
      await fiscalYearService.reopen(year.id);
      toast.success('Fiscal year reopened');
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Could not reopen fiscal year');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/accounting/dashboard"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-[#014582]" />
            Fiscal years
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Selected year filters reports, ledgers, invoices, bills and accounting dashboards.
            Closed years block new postings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => (showForm ? setShowForm(false) : openForm())}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#014582] text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> New fiscal year
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Create fiscal year</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Name (FY 2027)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={form.periodType}
              onChange={(e) => onPeriodChange(e.target.value)}
            >
              <option value="Custom">Custom</option>
              <option value="Calendar">Calendar (Jan–Dec)</option>
              <option value="April">April–March</option>
              <option value="July">July–June</option>
            </select>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start date</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.startDate}
                onChange={(e) => {
                  setForm((f) => ({ ...f, startDate: e.target.value }));
                  setFormError('');
                }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End date</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.endDate}
                onChange={(e) => {
                  setForm((f) => ({ ...f, endDate: e.target.value }));
                  setFormError('');
                }}
              />
            </div>
          </div>
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={createYear}
              className="px-4 py-2 rounded-lg bg-[#014582] text-white text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormError('');
              }}
              className="px-4 py-2 rounded-lg border text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading && sorted.length === 0 ? (
          <div className="p-10 flex justify-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No fiscal years yet. Create one to start filtering books by year.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Period</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((y) => {
                const closed = String(y.status).toLowerCase() === 'closed';
                const selected = y.id === selectedFiscalYearId;
                return (
                  <tr key={y.id} className={`border-t ${selected ? 'bg-[#014582]/5' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{y.name}</div>
                      {selected && (
                        <div className="text-xs text-[#014582] font-medium">Active selection</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {fmt(y.startDate)} → {fmt(y.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          closed ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {y.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {!selected && (
                          <button
                            type="button"
                            onClick={() => setSelectedFiscalYearId(y.id)}
                            className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-gray-50"
                          >
                            Use
                          </button>
                        )}
                        {closed ? (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => reopenYear(y)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-gray-50"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Reopen
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => closeYear(y)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-50"
                          >
                            <Lock className="w-3.5 h-3.5" /> Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
/** Next.js route shell — real UI mounts via ModuleViewHost. */
export default function ModuleRoutePlaceholder() {
  return null;
}
