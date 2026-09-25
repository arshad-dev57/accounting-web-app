'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Plus,
  ArrowRight,
  Loader2,
  Users,
  Calendar,
  X,
  Play,
  ShieldCheck,
  Lock,
  Banknote,
  Archive,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRStatusBadge,
  HRToolbar,
} from '../../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';
import { pkr, formatPayrollDate, formatPayrollRange } from '@/lib/hr-payroll-slip-utils';


function defaultPeriodKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function PayPeriodsPage() {
  const [periods, setPeriods] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newPeriodKey, setNewPeriodKey] = React.useState(defaultPeriodKey());
  const [newPayDate, setNewPayDate] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const loadPeriods = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await hrWorkforceService.listPayPeriods();
      setPeriods(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load pay periods');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodKey) {
      toast.error('Select a period month');
      return;
    }
    setCreating(true);
    try {
      const created = await hrWorkforceService.ensurePayPeriod(newPeriodKey, newPayDate || undefined);
      toast.success(`Pay period ${created.name || newPeriodKey} created`);
      setShowCreateModal(false);
      await loadPeriods();
    } catch (err: any) {
      toast.error(err.message || 'Could not create pay period');
    } finally {
      setCreating(false);
    }
  };

  const getPrimaryActionForStatus = (periodRow: any) => {
    const status = String(periodRow.status || 'OPEN').toUpperCase();
    const periodId = periodRow.periodKey || periodRow.id;

    switch (status) {
      case 'OPEN':
        return {
          label: 'Start Payroll',
          icon: Play,
          href: `/hr/payroll/run?period=${periodId}&step=period`,
          variant: 'primary' as const,
          stepText: '1. Setup & Pre-check',
        };
      case 'CALCULATING':
        return {
          label: 'In Calculation',
          icon: Loader2,
          href: `/hr/payroll/run?period=${periodId}&step=calculate`,
          variant: 'secondary' as const,
          stepText: '3. Calculating',
        };
      case 'CALCULATED':
        return {
          label: 'Review Payroll',
          icon: ShieldCheck,
          href: `/hr/payroll/run?period=${periodId}&step=review`,
          variant: 'primary' as const,
          stepText: '4. Human Review',
        };
      case 'REVIEW':
        return {
          label: 'Review Payroll',
          icon: ShieldCheck,
          href: `/hr/payroll/run?period=${periodId}&step=review`,
          variant: 'primary' as const,
          stepText: '4. Executive Review',
        };
      case 'APPROVED':
        return {
          label: 'Finalize Payroll',
          icon: Lock,
          href: `/hr/payroll/run?period=${periodId}&step=finalize`,
          variant: 'primary' as const,
          stepText: '6. Finalization Lock',
        };
      case 'FINALIZED':
        return {
          label: 'Process Payment',
          icon: Banknote,
          href: `/hr/payroll/payments?period=${periodId}`,
          variant: 'primary' as const,
          stepText: '7. Payment Ready',
        };
      case 'PAID':
        return {
          label: 'Close Period',
          icon: Archive,
          href: `/hr/payroll/run?period=${periodId}&step=close`,
          variant: 'primary' as const,
          stepText: '8. Ready for Close',
        };
      case 'CLOSED':
        return {
          label: 'View Payroll',
          icon: Eye,
          href: `/hr/payroll/pay-register?period=${periodId}`,
          variant: 'secondary' as const,
          stepText: 'Completed / Archived',
        };
      default:
        return {
          label: 'View Payroll',
          icon: ArrowRight,
          href: `/hr/payroll/run?period=${periodId}`,
          variant: 'primary' as const,
          stepText: 'Processing',
        };
    }
  };

  const filteredPeriods = periods.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.periodKey || '').toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q)
    );
  });

  return (
    <HRPage>
      <HRPageHeader
        title="Pay Periods"
        subtitle="Manage payroll period lifecycles, pay dates, and status transitions."
        backHref="/hr/payroll/dashboard"
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white text-[#014582] font-extrabold text-xs shadow-md hover:bg-white/90 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Pay Period
          </button>
        }
      />

      <HRToolbar
        search={search}
        setSearch={setSearch}
        placeholder="Filter pay periods by name or status..."
      />

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
        </div>
      ) : filteredPeriods.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#DDE4EE] shadow-sm">
          <CalendarDays className="w-12 h-12 text-[#7A8FA6] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-extrabold text-[#1A1A2E]">No Pay Periods Found</h3>
          <p className="text-xs text-[#7A8FA6] mt-1 max-w-sm mx-auto">
            {search
              ? 'No periods match your filter criteria.'
              : 'Initialize a new pay period to start processing monthly payroll.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#014582] text-white text-xs font-bold shadow-sm hover:bg-[#013a6b]"
            >
              <Plus className="w-4 h-4" /> Create Pay Period
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPeriods.map((periodRow) => {
            const action = getPrimaryActionForStatus(periodRow);
            const Icon = action.icon;
            const periodId = periodRow.periodKey || periodRow.id;

            return (
              <div
                key={periodRow.id || periodRow.periodKey}
                className="bg-white rounded-2xl p-5 border border-[#DDE4EE] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-extrabold text-[#1A1A2E]">
                      {periodRow.name || periodRow.label || periodRow.periodKey}
                    </h3>
                    <HRStatusBadge status={periodRow.status || 'OPEN'} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7A8FA6] font-medium pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#014582]" />
                      {formatPayrollRange(periodRow.startDate, periodRow.endDate)}
                    </span>
                    <span>• Pay Date: <strong className="text-[#1A1A2E]">{formatPayrollDate(periodRow.payDate, 'Not set')}</strong></span>

                    <span>• <strong className="text-[#1A1A2E]">{periodRow.headcount || 0}</strong> Employees</span>
                    {periodRow.netPay != null && (
                      <span>• Net Pay: <strong className="text-[#014582]">{pkr(periodRow.netPay)}</strong></span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#7A8FA6] pt-1">
                    Current Stage: <span className="font-extrabold text-[#014582]">{action.stepText}</span>
                  </p>
                </div>

                {/* Right single obvious primary action */}
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={action.href}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all inline-flex items-center gap-2 shadow-sm ${
                      action.variant === 'primary'
                        ? 'bg-[#014582] text-white hover:bg-[#013a6b]'
                        : 'bg-white text-[#014582] border border-[#DDE4EE] hover:bg-[#F0F4F8]'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {action.label}
                  </Link>

                  <Link
                    href={`/hr/payroll/pay-register?period=${periodId}`}
                    className="p-2.5 rounded-xl border border-[#DDE4EE] text-[#7A8FA6] hover:text-[#014582] hover:bg-[#F0F4F8] transition-all"
                    title="View Pay Register"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Pay Period */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EE] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] pb-4 mb-4">
              <h3 className="text-base font-extrabold text-[#1A1A2E]">Create New Pay Period</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1.5">
                  Select Salary Month
                </label>
                <input
                  type="month"
                  value={newPeriodKey}
                  onChange={(e) => setNewPeriodKey(e.target.value)}
                  className="w-full bg-white rounded-xl py-2.5 px-3.5 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                  required
                />
                <p className="text-[11px] text-[#7A8FA6] mt-1">Format: YYYY-MM (e.g. 2026-09)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1.5">
                  Target Pay Date (Optional)
                </label>
                <input
                  type="date"
                  value={newPayDate}
                  onChange={(e) => setNewPayDate(e.target.value)}
                  className="w-full bg-white rounded-xl py-2.5 px-3.5 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#DDE4EE]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6] hover:bg-[#F0F4F8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#014582] text-white hover:bg-[#013a6b] shadow-sm flex items-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HRPage>
  );
}
