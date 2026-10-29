'use client';

import React, { useMemo } from 'react';
import { CalendarDays, Check, RotateCcw } from 'lucide-react';
import { dateLabel } from '@/lib/customer-account';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export type PeriodMode = 'all' | 'month' | 'year' | 'custom';

export type PeriodValue = {
  mode: PeriodMode;
  month: string;
  year: string;
  from: string;
  to: string;
};

export type PeriodRange = {
  fromDate: string;
  toDate: string;
  label: string;
};

export function makePeriodValue(): PeriodValue {
  const now = new Date();
  return {
    mode: 'all',
    month: String(now.getMonth() + 1).padStart(2, '0'),
    year: String(now.getFullYear()),
    from: '',
    to: '',
  };
}

export function resolvePeriod(value: PeriodValue): PeriodRange {
  if (value.mode === 'month') {
    const year = Number(value.year) || new Date().getFullYear();
    const month = Number(value.month) || 1;
    const lastDay = new Date(year, month, 0).getDate();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return {
      fromDate: `${prefix}-01`,
      toDate: `${prefix}-${String(lastDay).padStart(2, '0')}`,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
    };
  }
  if (value.mode === 'year') {
    const year = value.year || String(new Date().getFullYear());
    return { fromDate: `${year}-01-01`, toDate: `${year}-12-31`, label: year };
  }
  if (value.mode === 'custom') {
    return {
      fromDate: value.from,
      toDate: value.to,
      label:
        value.from && value.to
          ? `${dateLabel(value.from)} — ${dateLabel(value.to)}`
          : 'Custom range',
    };
  }
  return { fromDate: '', toDate: '', label: 'All time' };
}

export function isPeriodInvalid(value: PeriodValue): boolean {
  return value.mode === 'custom' && (!value.from || !value.to || value.from > value.to);
}

const fieldClass =
  'px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#014582]/30';

export function PeriodFilter({
  value,
  onChange,
  onApply,
  onReset,
  appliedLabel,
}: {
  value: PeriodValue;
  onChange: (next: PeriodValue) => void;
  onApply: () => void;
  onReset: () => void;
  appliedLabel?: string;
}) {
  const years = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, index) => String(year - index));
  }, []);

  const invalid = isPeriodInvalid(value);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-2 text-[#014582] mr-1">
        <CalendarDays className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wide">Period</span>
      </div>

      <label className="text-[10px] font-bold uppercase text-gray-500 flex flex-col gap-1">
        Filter
        <select
          value={value.mode}
          onChange={(event) => onChange({ ...value, mode: event.target.value as PeriodMode })}
          className={`min-w-[150px] ${fieldClass}`}
        >
          <option value="all">All time</option>
          <option value="month">Single month</option>
          <option value="year">Full year</option>
          <option value="custom">Custom range</option>
        </select>
      </label>

      {value.mode === 'month' ? (
        <label className="text-[10px] font-bold uppercase text-gray-500 flex flex-col gap-1">
          Month
          <select
            value={value.month}
            onChange={(event) => onChange({ ...value, month: event.target.value })}
            className={fieldClass}
          >
            {MONTH_NAMES.map((month, index) => (
              <option key={month} value={String(index + 1).padStart(2, '0')}>
                {month}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {value.mode === 'month' || value.mode === 'year' ? (
        <label className="text-[10px] font-bold uppercase text-gray-500 flex flex-col gap-1">
          Year
          <select
            value={value.year}
            onChange={(event) => onChange({ ...value, year: event.target.value })}
            className={fieldClass}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {value.mode === 'custom' ? (
        <>
          <label className="text-[10px] font-bold uppercase text-gray-500 flex flex-col gap-1">
            From
            <input
              type="date"
              value={value.from}
              onChange={(event) => onChange({ ...value, from: event.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="text-[10px] font-bold uppercase text-gray-500 flex flex-col gap-1">
            To
            <input
              type="date"
              value={value.to}
              onChange={(event) => onChange({ ...value, to: event.target.value })}
              className={fieldClass}
            />
          </label>
        </>
      ) : null}

      <button
        onClick={onApply}
        disabled={invalid}
        className="px-3 py-1.5 bg-[#014582] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Check className="w-3.5 h-3.5" />
        Apply
      </button>
      <button
        onClick={onReset}
        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset
      </button>

      {invalid ? (
        <span className="text-[11px] font-semibold text-rose-600">
          Choose a valid from and to date
        </span>
      ) : (
        <span className="text-[11px] text-gray-500 ml-auto">
          Showing:{' '}
          <span className="font-bold text-gray-700">
            {appliedLabel ?? resolvePeriod(value).label}
          </span>
        </span>
      )}
    </div>
  );
}
