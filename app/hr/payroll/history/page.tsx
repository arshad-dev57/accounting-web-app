'use client';

import React from 'react';
import Link from 'next/link';
import {
  History,
  Loader2,
  Calendar,
  Eye,
  Search,
  Archive,
  Users,
  Wallet,
  Banknote,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRStatusBadge,
  HRToolbar,
  HRTable,
  HRTableRow,
  HRTableCell,
  HRFilterChips,
} from '../../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';
import { pkr, formatPayrollDate, formatPayrollRange } from '@/lib/hr-payroll-slip-utils';


export default function PayrollHistoryPage() {
  const [periods, setPeriods] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [yearFilter, setYearFilter] = React.useState('All');

  const loadHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await hrWorkforceService.listPayPeriods();
      setPeriods(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payroll history');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const years = Array.from(
    new Set(
      periods
        .map((p) => (p.periodKey || p.name || '').substring(0, 4))
        .filter((y) => /^\d{4}$/.test(y))
    )
  );
  years.unshift('All');

  const statusOptions = ['All', 'CLOSED', 'PAID', 'FINALIZED', 'APPROVED'];

  const filteredPeriods = periods.filter((p) => {
    const q = search.toLowerCase();
    const matchesQuery =
      (p.name || '').toLowerCase().includes(q) ||
      (p.periodKey || '').toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'All' || String(p.status).toUpperCase() === statusFilter;

    const pYear = (p.periodKey || p.name || '').substring(0, 4);
    const matchesYear = yearFilter === 'All' || pYear === yearFilter;

    return matchesQuery && matchesStatus && matchesYear;
  });

  return (
    <HRPage>
      <HRPageHeader
        title="Payroll History & Archive"
        subtitle="Historical archive of completed and finalized payroll periods."
        backHref="/hr/payroll/dashboard"
      />

      <HRToolbar
        search={search}
        setSearch={setSearch}
        placeholder="Search historical pay periods..."
        filters={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7A8FA6]">Year:</span>
              <HRFilterChips
                options={years}
                value={yearFilter}
                onChange={setYearFilter}
              />
            </div>
            <div className="flex items-center gap-2 border-l border-[#DDE4EE] pl-3">
              <span className="text-xs font-bold text-[#7A8FA6]">Status:</span>
              <HRFilterChips
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
          </div>
        }
      />

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
        </div>
      ) : filteredPeriods.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#DDE4EE] shadow-sm">
          <Archive className="w-12 h-12 text-[#7A8FA6] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-extrabold text-[#1A1A2E]">No Historical Records Found</h3>
          <p className="text-xs text-[#7A8FA6] mt-1">
            No past pay periods match your filter selection.
          </p>
        </div>
      ) : (
        <HRCard title="Historical Pay Period Archives">
          <HRTable columns={['Pay Period', 'Date Range', 'Employees', 'Net Pay', 'Status', 'Closed Date', 'Read-only View']}>
            {filteredPeriods.map((p, idx) => (
              <HRTableRow key={p.id || p.periodKey || idx}>
                <HRTableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#014582]/10 text-[#014582] font-extrabold text-xs flex items-center justify-center">
                      <Archive className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#1A1A2E]">{p.name || p.periodKey}</p>
                      <p className="text-[10px] text-[#7A8FA6]">Pay Date: {formatPayrollDate(p.payDate, 'N/A')}</p>
                    </div>
                  </div>
                </HRTableCell>
                <HRTableCell><span className="text-xs text-[#7A8FA6]">{formatPayrollRange(p.startDate, p.endDate, 'Monthly')}</span></HRTableCell>

                <HRTableCell><span className="font-bold text-[#1A1A2E]">{p.headcount || 0} Staff</span></HRTableCell>
                <HRTableCell><span className="font-extrabold text-[#014582]">{p.netPay != null ? pkr(p.netPay) : 'N/A'}</span></HRTableCell>
                <HRTableCell><HRStatusBadge status={p.status || 'CLOSED'} /></HRTableCell>
                <HRTableCell><span className="text-xs text-[#7A8FA6]">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'N/A'}</span></HRTableCell>
                <HRTableCell>
                  <Link
                    href={`/hr/payroll/pay-register?period=${p.periodKey || p.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F0F4F8] text-[#014582] hover:bg-[#014582] hover:text-white transition-all inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Payroll
                  </Link>
                </HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      )}
    </HRPage>
  );
}
