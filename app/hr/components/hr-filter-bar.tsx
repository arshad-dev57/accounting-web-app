'use client';

// The filters the list endpoint actually implements: status, the document's own
// date column, and the department column when the document has one.

import React from 'react';
import { HRFilterChips } from '../ui';
import type { HrDescriptor, HrLinkOption } from '../../../lib/hr-workspace-service';

const inputClass =
  'rounded-lg border border-[#DDE4EE] bg-white px-2.5 py-1.5 text-xs text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#014582]/20';

const ANY = 'Any';

export function HrFilterBar({
  descriptor,
  options,
  status,
  setStatus,
  from,
  setFrom,
  to,
  setTo,
  department,
  setDepartment
}: {
  descriptor: HrDescriptor;
  options: Record<string, HrLinkOption[]>;
  status: string;
  setStatus: (value: string) => void;
  from: string;
  setFrom: (value: string) => void;
  to: string;
  setTo: (value: string) => void;
  department: string;
  setDepartment: (value: string) => void;
}) {
  if (!(descriptor.filters.status || descriptor.filters.dateField || descriptor.filters.department)) return null;

  const departmentOptions = options.department || [];
  const filtered = Boolean(status || from || to || department);

  return (
    <div className="mb-4 space-y-3">
      {descriptor.filters.status && descriptor.statuses && descriptor.statuses.length > 0 && (
        <HRFilterChips
          options={[ANY, ...descriptor.statuses]}
          value={status || ANY}
          onChange={(value) => setStatus(value === ANY ? '' : value)}
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        {descriptor.filters.dateField && (
          <>
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-[#52677E]">
              From
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} />
            </label>
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-[#52677E]">
              To
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={inputClass} />
            </label>
          </>
        )}
        {descriptor.filters.department && departmentOptions.length > 0 && (
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-[#52677E]">
            Department
            <select value={department} onChange={(event) => setDepartment(event.target.value)} className={inputClass}>
              <option value="">Any</option>
              {departmentOptions.map((option) => (
                <option key={option.id} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setStatus('');
              setFrom('');
              setTo('');
              setDepartment('');
            }}
            className="text-[11px] font-bold text-[#014582] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
