'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wallet,
  CalendarDays,
  Users,
  Banknote,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRStatCard,
  HRStatusBadge,
  HRPayrollNextActionCard,
} from '../../ui';
import PayrollStepper, { getStepNumberForStatus } from '@/components/hr/payroll-stepper';
import { hrWorkforceService } from '@/lib/hr-workforce-service';
import { pkr, formatPayrollDate, formatPayrollRange } from '@/lib/hr-payroll-slip-utils';


function currentPeriodKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function PayrollDashboardPage() {
  const [periodKey] = React.useState(currentPeriodKey());
  const [loading, setLoading] = React.useState(true);
  const [activePeriod, setActivePeriod] = React.useState<any>(null);
  const [summary, setSummary] = React.useState<any>({});
  const [periodLabel, setPeriodLabel] = React.useState('');
  const [headcount, setHeadcount] = React.useState(0);
  const [recentPeriods, setRecentPeriods] = React.useState<any[]>([]);
  const [validation, setValidation] = React.useState<any>(null);

  React.useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const periodList = await hrWorkforceService.listPayPeriods().catch(() => []);
        setRecentPeriods(Array.isArray(periodList) ? periodList.slice(0, 5) : []);

        const activeRow = await hrWorkforceService.ensurePayPeriod(periodKey).catch(() => null);
        setActivePeriod(activeRow);

        if (activeRow?.id) {
          const [payroll, val] = await Promise.all([
            hrWorkforceService.payroll(periodKey).catch(() => ({})),
            hrWorkforceService.getPayPeriodValidation(activeRow.id, 'office').catch(() => null),
          ]);
          setSummary(payroll?.summary || {});
          setPeriodLabel(payroll?.periodLabel || activeRow?.label || periodKey);
          setHeadcount(payroll?.items?.length || activeRow?.headcount || 0);
          setValidation(val);
        }
      } catch (err) {
        console.error('Failed loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [periodKey]);

  const currentStatus = activePeriod?.status || 'OPEN';

  // Compute next action label and hint based on canonical status
  const getNextActionProps = (status: string) => {
    const s = String(status).toUpperCase();
    switch (s) {
      case 'OPEN':
        return {
          title: 'Pay period setup initialized',
          subtitle: 'Verify eligible employees and start pre-calculation validation checks.',
          actionLabel: 'Start Payroll & Validate',
          href: '/hr/payroll/run',
        };
      case 'CALCULATED':
        return {
          title: 'Payroll calculation complete',
          subtitle: 'Employee salary slips have been generated. Review detailed breakdown before approval.',
          actionLabel: 'Review Payroll',
          href: '/hr/payroll/run',
        };
      case 'REVIEW':
        return {
          title: 'Payroll is under review',
          subtitle: 'Verify gross earnings, deductions, and tax withholdings with executive approval.',
          actionLabel: 'Continue Review',
          href: '/hr/payroll/run',
        };
      case 'APPROVED':
        return {
          title: 'Payroll has been approved',
          subtitle: 'Authorization complete. Finalize the period to lock calculations before payment.',
          actionLabel: 'Finalize Payroll',
          href: '/hr/payroll/run',
        };
      case 'FINALIZED':
        return {
          title: 'Payroll is finalized and locked',
          subtitle: 'Calculations locked. Proceed to disburse payments to employee accounts.',
          actionLabel: 'Process Payment',
          href: '/hr/payroll/payments',
        };
      case 'PAID':
        return {
          title: 'Payroll payment processed',
          subtitle: 'Employee payments marked complete. Close the period to archive historical data.',
          actionLabel: 'Close Period',
          href: '/hr/payroll/run',
        };
      case 'CLOSED':
        return {
          title: 'Pay period closed',
          subtitle: 'This period is archived. You can view pay register and historical records.',
          actionLabel: 'View Pay Register',
          href: '/hr/payroll/pay-register',
        };
      default:
        return {
          title: 'Manage current pay period',
          subtitle: 'Click to open the guided payroll processing workspace.',
          actionLabel: 'Continue Payroll',
          href: '/hr/payroll/run',
        };
    }
  };

  const nextAction = getNextActionProps(currentStatus);

  return (
    <HRPage>
      <HRPageHeader
        title="Payroll"
        subtitle="Manage payroll processing, pay periods and employee payments."
        backHref="/hr/dashboard"
      />

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Period Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDE4EE] relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DDE4EE] pb-5 mb-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold text-[#1A1A2E]">
                    {periodLabel || activePeriod?.name || 'Active Payroll Period'}
                  </h2>
                  <HRStatusBadge status={currentStatus} />
                </div>
                <p className="text-xs text-[#7A8FA6] font-medium mt-1">
                  {formatPayrollRange(activePeriod?.startDate, activePeriod?.endDate, 'Current Month')}{' '}
                  • Pay Date: {formatPayrollDate(activePeriod?.payDate, 'TBD')} • {headcount} Eligible Employees
                </p>

              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/hr/payroll/periods"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#DDE4EE] text-[#014582] hover:bg-[#F0F4F8] transition-all"
                >
                  Manage Periods
                </Link>
                <Link
                  href="/hr/payroll/run"
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#014582] text-white hover:bg-[#013a6b] shadow-sm transition-all flex items-center gap-1.5"
                >
                  Open Processing Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <HRStatCard
                label="Employees"
                value={headcount}
                icon={Users}
                color="#014582"
              />
              <HRStatCard
                label="Gross Payroll"
                value={pkr(summary.gross || 0)}
                icon={Wallet}
                color="#2ECC71"
              />
              <HRStatCard
                label="Total Deductions"
                value={pkr(summary.deductions || 0)}
                icon={Banknote}
                color="#E74C3C"
              />
              <HRStatCard
                label="Net Pay"
                value={pkr(summary.net || 0)}
                icon={Wallet}
                color="#F39C12"
              />
            </div>

            {/* Stepper Progress */}
            <div>
              <p className="text-xs font-bold text-[#7A8FA6] uppercase tracking-wider mb-2.5">
                Workflow Progress
              </p>
              <PayrollStepper currentStatus={currentStatus} />
            </div>
          </div>

          {/* Prominent Next Action Card */}
          <HRPayrollNextActionCard
            title={nextAction.title}
            subtitle={nextAction.subtitle}
            actionLabel={nextAction.actionLabel}
            href={nextAction.href}
          />

          {/* Grid layout: Pre-check Warnings & Recent Periods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warnings & Checks */}
            <HRCard title="Pre-calculation Pre-checks & Issues">
              {validation ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#F0F4F8]">
                    <span className="text-xs font-bold text-[#1A1A2E]">Eligible Headcount</span>
                    <span className="text-xs font-extrabold text-[#014582]">
                      {validation.eligibleCount || headcount}
                    </span>
                  </div>

                  {validation.warnings && validation.warnings.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                        Warnings ({validation.warnings.length})
                      </p>
                      {validation.warnings.map((w: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900"
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span className="text-xs font-medium">{typeof w === 'string' ? w : w.message || w.reason}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-xs font-medium">No system warnings found for this period.</span>
                    </div>
                  )}

                  {validation.errors && validation.errors.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                        Blocking Errors ({validation.errors.length})
                      </p>
                      {validation.errors.map((e: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-900"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <span className="text-xs font-medium">{typeof e === 'string' ? e : e.message || e.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-[#7A8FA6]">
                  <p>All active employees, attendance, overtime, and leave logs are synced.</p>
                  <p className="mt-1 font-semibold text-[#014582]">
                    Run validation in the processing workspace to verify.
                  </p>
                </div>
              )}
            </HRCard>

            {/* Recent Payroll Periods */}
            <HRCard
              title="Recent Pay Periods"
              action={
                <Link href="/hr/payroll/periods" className="text-xs font-bold text-[#014582] hover:underline">
                  View All
                </Link>
              }
            >
              {recentPeriods.length > 0 ? (
                <div className="space-y-2.5">
                  {recentPeriods.map((p) => (
                    <div
                      key={p.id || p.periodKey}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#DDE4EE] hover:bg-[#F0F4F8] transition-all"
                    >
                      <div>
                        <p className="text-xs font-extrabold text-[#1A1A2E]">{p.name || p.periodKey}</p>
                        <p className="text-[10px] text-[#7A8FA6]">
                          {formatPayrollRange(p.startDate, p.endDate, 'Month')} • Pay Date: {formatPayrollDate(p.payDate, 'N/A')}
                        </p>

                      </div>
                      <div className="flex items-center gap-3">
                        <HRStatusBadge status={p.status || 'OPEN'} />
                        <Link
                          href={`/hr/payroll/run?period=${p.periodKey || p.id}`}
                          className="text-xs text-[#014582] font-bold hover:underline"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-[#7A8FA6]">No previous pay periods recorded.</p>
              )}
            </HRCard>
          </div>
        </div>
      )}
    </HRPage>
  );
}
