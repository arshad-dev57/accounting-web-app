'use client';

import Link from 'next/link';
import { CalendarRange, Settings2 } from 'lucide-react';
import { useFiscalYear } from '../lib/fiscal-year-context';

export default function FiscalYearSelect({
  compact = true,
  showManageLink = true,
  className = '',
}: {
  compact?: boolean;
  showManageLink?: boolean;
  className?: string;
}) {
  const {
    fiscalYears,
    selectedFiscalYearId,
    selectedFiscalYear,
    loading,
    setSelectedFiscalYearId,
  } = useFiscalYear();

  if (loading && fiscalYears.length === 0) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-400 ${className}`}>
        <CalendarRange className="w-4 h-4" />
        <span>Loading year…</span>
      </div>
    );
  }

  if (fiscalYears.length === 0) {
    return (
      <Link
        href="/accounting/fiscal-years"
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 ${className}`}
      >
        <CalendarRange className="w-4 h-4" />
        Set up fiscal year
      </Link>
    );
  }

  const status = selectedFiscalYear?.status || '';
  const isClosed = String(status).toLowerCase() === 'closed';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white">
        <CalendarRange className="w-4 h-4 text-[#014582] flex-shrink-0" />
        <div className="min-w-0">
          {!compact && (
            <p className="text-[10px] uppercase tracking-wide text-gray-400 leading-none mb-0.5">
              Fiscal year
            </p>
          )}
          <select
            value={selectedFiscalYearId}
            onChange={(e) => setSelectedFiscalYearId(e.target.value)}
            className="text-sm font-medium text-gray-800 bg-transparent border-0 outline-none max-w-[180px] cursor-pointer"
            title={
              selectedFiscalYear
                ? `${selectedFiscalYear.name} (${status})`
                : 'Select fiscal year'
            }
          >
            {fiscalYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
                {String(y.status).toLowerCase() === 'closed' ? ' · Closed' : ''}
              </option>
            ))}
          </select>
        </div>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            isClosed ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {isClosed ? 'Closed' : 'Open'}
        </span>
      </div>
      {showManageLink && (
        <Link
          href="/accounting/fiscal-years"
          className="p-1.5 rounded-lg text-gray-400 hover:text-[#014582] hover:bg-gray-100"
          title="Manage fiscal years"
        >
          <Settings2 className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
