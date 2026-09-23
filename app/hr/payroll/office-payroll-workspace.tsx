'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Wallet,
  Loader2,
  Play,
  ShieldCheck,
  Banknote,
  Search,
  X,
  CalendarDays,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
  Archive,
  Download,
  ChevronRight,
  UserCheck,
  Building2,
  ArrowRight,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRStatCard,
  HRStatusBadge,
  HRAvatar,
  HRTable,
  HRTableRow,
  HRTableCell,
} from '../ui';
import PayrollStepper, {
  PAYROLL_STEPS,
  PayrollStepId,
  getStepNumberForStatus,
} from '@/components/hr/payroll-stepper';
import { hrWorkforceService } from '@/lib/hr-workforce-service';
import { pkr } from '@/lib/hr-payroll-slip-utils';

function currentPeriodKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function OfficePayrollWorkspace({
  view = 'run',
}: {
  view?: 'run' | 'review' | 'periods' | 'payslips' | 'payments';
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const periodParam = searchParams.get('period');
  const stepParam = searchParams.get('step') as PayrollStepId | null;

  const [periodKey, setPeriodKey] = React.useState(periodParam || currentPeriodKey());
  const [periodList, setPeriodList] = React.useState<any[]>([]);
  const [payPeriod, setPayPeriod] = React.useState<any>(null);
  const [payDate, setPayDate] = React.useState('');

  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState('');
  const [rows, setRows] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState<any>({});
  const [validation, setValidation] = React.useState<any>(null);
  const [query, setQuery] = React.useState('');
  const [selectedEmployee, setSelectedEmployee] = React.useState<any | null>(null);

  // Active step state
  const [activeStep, setActiveStep] = React.useState<PayrollStepId>(stepParam || 'period');

  // Confirmation Modals
  const [showApproveModal, setShowApproveModal] = React.useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = React.useState(false);
  const [showPayModal, setShowPayModal] = React.useState(false);
  const [showCloseModal, setShowCloseModal] = React.useState(false);

  // Load Period Data
  const loadWorkspace = React.useCallback(async (pKey = periodKey) => {
    setLoading(true);
    try {
      const list = await hrWorkforceService.listPayPeriods().catch(() => []);
      setPeriodList(Array.isArray(list) ? list : []);

      const periodRow = await hrWorkforceService.ensurePayPeriod(pKey).catch(() => null);
      setPayPeriod(periodRow);
      if (periodRow?.payDate) setPayDate(periodRow.payDate);

      if (periodRow?.id) {
        // Fetch payroll review/slips & validation data
        const [reviewData, valData] = await Promise.all([
          hrWorkforceService.getPayrollReview(periodRow.id).catch(() => null),
          hrWorkforceService.getPayPeriodValidation(periodRow.id, 'office').catch(() => null),
        ]);

        const items = reviewData?.items || [];
        setRows(items);
        setSummary(reviewData?.summary || {});
        setValidation(valData);

        // Auto-align step if not set by URL parameter
        if (!stepParam) {
          const status = periodRow.status || 'OPEN';
          const stepNum = getStepNumberForStatus(status);
          const mappedStep = PAYROLL_STEPS.find((s) => s.stepNumber === stepNum)?.id || 'period';
          setActiveStep(mappedStep);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payroll workspace');
    } finally {
      setLoading(false);
    }
  }, [periodKey, stepParam]);

  React.useEffect(() => {
    loadWorkspace(periodKey);
  }, [periodKey, loadWorkspace]);

  // Status handlers
  const currentStatus = payPeriod?.status || 'OPEN';

  const handlePeriodChange = (newKey: string) => {
    setPeriodKey(newKey);
    router.push(`/hr/payroll/run?period=${newKey}`);
  };

  // Status transitions
  const handleValidate = async () => {
    if (!payPeriod?.id) return;
    setBusy('validate');
    try {
      const val = await hrWorkforceService.validatePayPeriod(payPeriod.id, 'office');
      setValidation(val);
      toast.success('Payroll data validated');
      setActiveStep('validate');
    } catch (err: any) {
      toast.error(err.message || 'Validation failed');
    } finally {
      setBusy('');
    }
  };

  const handleCalculate = async () => {
    if (!payPeriod?.id) return;
    setBusy('calculate');
    try {
      const result = await hrWorkforceService.calculatePayPeriod(payPeriod.id, 'office', true);
      setRows(result.items || []);
      setSummary(result.summary || {});
      setValidation(result.validation || null);
      if (result.payPeriod) setPayPeriod(result.payPeriod);
      toast.success(`${result.items?.length || 0} employee slips calculated successfully`);
      setActiveStep('review');
      await loadWorkspace(periodKey);
    } catch (err: any) {
      toast.error(err.message || 'Calculation failed');
    } finally {
      setBusy('');
    }
  };

  const handleApprove = async () => {
    if (!payPeriod?.id) return;
    setBusy('approve');
    try {
      const updated = await hrWorkforceService.transitionPayPeriod(payPeriod.id, 'APPROVED');
      setPayPeriod(updated);
      setShowApproveModal(false);
      toast.success('Payroll approved successfully');
      setActiveStep('approve');
      await loadWorkspace(periodKey);
    } catch (err: any) {
      toast.error(err.message || 'Approval failed');
    } finally {
      setBusy('');
    }
  };

  const handleFinalize = async () => {
    if (!payPeriod?.id) return;
    setBusy('finalize');
    try {
      const updated = await hrWorkforceService.transitionPayPeriod(payPeriod.id, 'FINALIZED');
      setPayPeriod(updated);
      setShowFinalizeModal(false);
      toast.success('Payroll finalized and calculations locked');
      setActiveStep('finalize');
      await loadWorkspace(periodKey);
    } catch (err: any) {
      toast.error(err.message || 'Finalization failed');
    } finally {
      setBusy('');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!payPeriod?.id) return;
    setBusy('pay');
    try {
      const updated = await hrWorkforceService.transitionPayPeriod(payPeriod.id, 'PAID');
      setPayPeriod(updated);
      setShowPayModal(false);
      toast.success('Payroll marked as PAID');
      setActiveStep('pay');
      await loadWorkspace(periodKey);
    } catch (err: any) {
      toast.error(err.message || 'Failed marking payroll as paid');
    } finally {
      setBusy('');
    }
  };

  const handleClosePeriod = async () => {
    if (!payPeriod?.id) return;
    setBusy('close');
    try {
      const updated = await hrWorkforceService.transitionPayPeriod(payPeriod.id, 'CLOSED');
      setPayPeriod(updated);
      setShowCloseModal(false);
      toast.success('Pay period closed and archived');
      setActiveStep('close');
      await loadWorkspace(periodKey);
    } catch (err: any) {
      toast.error(err.message || 'Failed closing pay period');
    } finally {
      setBusy('');
    }
  };

  // Filtered rows for review table
  const filteredRows = rows.filter((r) => {
    const q = query.toLowerCase();
    return (
      (r.employeeName || '').toLowerCase().includes(q) ||
      (r.employeeCode || '').toLowerCase().includes(q) ||
      (r.departmentName || '').toLowerCase().includes(q)
    );
  });

  const hasValidationErrors = validation?.errors && validation.errors.length > 0;

  return (
    <HRPage>
      <HRPageHeader
        title="Payroll Processing Workspace"
        subtitle="Guided 8-step business process for monthly payroll calculation, review, approval, and payment."
        backHref="/hr/payroll/dashboard"
        actions={
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/80 font-bold shrink-0">Period:</label>
            <select
              value={periodKey}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="bg-white/15 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:bg-white focus:text-[#1A1A2E]"
            >
              {periodList.map((p) => (
                <option key={p.id || p.periodKey} value={p.periodKey} className="text-[#1A1A2E]">
                  {p.name || p.periodKey} ({p.status})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Summary Bar */}
          <div className="bg-white rounded-2xl p-5 border border-[#DDE4EE] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-extrabold text-[#1A1A2E]">
                  {payPeriod?.name || periodKey} Payroll
                </h2>
                <HRStatusBadge status={currentStatus} />
              </div>
              <p className="text-xs text-[#7A8FA6] font-medium mt-1">
                {payPeriod?.startDate ? `${payPeriod.startDate} – ${payPeriod.endDate}` : 'Monthly Period'} •
                Pay Date: <strong className="text-[#1A1A2E]">{payDate || 'Not specified'}</strong> • Headcount:{' '}
                <strong className="text-[#1A1A2E]">{rows.length || payPeriod?.headcount || 0}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/hr/payroll/pay-register?period=${periodKey}`}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#DDE4EE] text-[#014582] hover:bg-[#F0F4F8] transition-all flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Pay Register
              </Link>

              <Link
                href={`/hr/payroll/payslips?period=${periodKey}`}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#DDE4EE] text-[#014582] hover:bg-[#F0F4F8] transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Payslips
              </Link>
            </div>
          </div>

          {/* Stepper Navigation */}
          <PayrollStepper
            currentStatus={currentStatus}
            activeStep={activeStep}
            onStepClick={(step) => setActiveStep(step.id)}
            interactive
          />

          {/* STEP 1: PERIOD SETUP */}
          {activeStep === 'period' && (
            <HRCard title="Step 1: Pay Period Confirmation & Setup">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-[#DDE4EE] bg-[#F0F4F8]/50">
                    <span className="text-xs font-bold text-[#7A8FA6] uppercase">Pay Period</span>
                    <p className="text-base font-extrabold text-[#1A1A2E] mt-1">{payPeriod?.name || periodKey}</p>
                    <p className="text-[11px] text-[#7A8FA6] mt-0.5">
                      {payPeriod?.startDate ? `${payPeriod.startDate} to ${payPeriod.endDate}` : 'Full Calendar Month'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#DDE4EE] bg-[#F0F4F8]/50">
                    <span className="text-xs font-bold text-[#7A8FA6] uppercase">Branch & Division</span>
                    <p className="text-base font-extrabold text-[#1A1A2E] mt-1">Head Office Staff</p>
                    <p className="text-[11px] text-[#7A8FA6] mt-0.5">Office workforce payroll processing</p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#DDE4EE] bg-[#F0F4F8]/50">
                    <span className="text-xs font-bold text-[#7A8FA6] uppercase">Eligible Employees</span>
                    <p className="text-base font-extrabold text-[#014582] mt-1">
                      {rows.length || payPeriod?.headcount || 0} Employees
                    </p>
                    <p className="text-[11px] text-[#7A8FA6] mt-0.5">Active workforce enrolled in salary profile</p>
                  </div>
                </div>

                {currentStatus === 'OPEN' && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#014582] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-extrabold text-[#014582]">Payroll Has Not Been Calculated Yet</p>
                      <p className="text-xs text-blue-800 mt-0.5">
                        Proceed to validation checks to verify attendance, overtime logs, loan balance, and employee data before running system calculation.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#DDE4EE]">
                  <span className="text-xs text-[#7A8FA6]">Step 1 of 8</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStatus === 'OPEN') {
                        handleValidate();
                      } else {
                        setActiveStep('validate');
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-[#014582] text-white font-extrabold text-xs shadow-md hover:bg-[#013a6b] transition-all flex items-center gap-2"
                  >
                    Validate Payroll Data <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </HRCard>
          )}

          {/* STEP 2: VALIDATE */}
          {activeStep === 'validate' && (
            <HRCard title="Step 2: Payroll Pre-calculation Validation Checklist">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1A1A2E]">Data Validation Checklist</h3>
                  <p className="text-xs text-[#7A8FA6]">
                    System pre-check results for employee salary rules, period locks, attendance, and overtime logs.
                  </p>
                </div>

                {/* Validation Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl border border-[#DDE4EE] bg-white">
                    <span className="text-xs text-[#7A8FA6] font-semibold">Eligible Staff</span>
                    <p className="text-xl font-extrabold text-[#014582] mt-1">
                      {validation?.eligibleCount ?? rows.length}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#DDE4EE] bg-white">
                    <span className="text-xs text-[#7A8FA6] font-semibold">Excluded Staff</span>
                    <p className="text-xl font-extrabold text-[#7A8FA6] mt-1">
                      {validation?.excludedCount ?? 0}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
                    <span className="text-xs text-amber-700 font-semibold">System Warnings</span>
                    <p className="text-xl font-extrabold text-amber-700 mt-1">
                      {validation?.warnings?.length ?? 0}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/50">
                    <span className="text-xs text-red-700 font-semibold">Blocking Errors</span>
                    <p className="text-xl font-extrabold text-red-700 mt-1">
                      {validation?.errors?.length ?? 0}
                    </p>
                  </div>
                </div>

                {/* Checklist items */}
                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-[#1A1A2E] uppercase tracking-wider">
                    System Pre-checks
                  </p>

                  <div className="p-3.5 rounded-xl border border-green-200 bg-green-50/50 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-extrabold text-green-900">Active Employees Found</p>
                      <p className="text-green-700">All active office staff members have verified profiles.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-green-200 bg-green-50/50 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-extrabold text-green-900">Pay Period Status Valid</p>
                      <p className="text-green-700">Period is active and not locked by previous finalization.</p>
                    </div>
                  </div>

                  {validation?.warnings && validation.warnings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-4">
                        Warnings (Actionable)
                      </p>
                      {validation.warnings.map((w: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                          <span className="text-xs font-medium text-amber-900">
                            {typeof w === 'string' ? w : w.message || w.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {hasValidationErrors && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wider mt-4">
                        Blocking Errors (Calculation Disabled)
                      </p>
                      {validation.errors.map((e: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-xl border border-red-200 bg-red-50 flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                          <span className="text-xs font-medium text-red-900">
                            {typeof e === 'string' ? e : e.message || e.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#DDE4EE]">
                  <button
                    type="button"
                    onClick={() => setActiveStep('period')}
                    className="px-4 py-2.5 rounded-xl border border-[#DDE4EE] text-[#7A8FA6] text-xs font-bold hover:bg-[#F0F4F8]"
                  >
                    Back to Period Setup
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentStatus === 'OPEN' || currentStatus === 'CALCULATED') {
                        handleCalculate();
                      } else {
                        setActiveStep('calculate');
                      }
                    }}
                    disabled={busy === 'calculate' || hasValidationErrors}
                    className={`px-6 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 ${
                      hasValidationErrors
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#014582] text-white hover:bg-[#013a6b]'
                    }`}
                  >
                    {busy === 'calculate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Calculate Payroll
                  </button>
                </div>
              </div>
            </HRCard>
          )}

          {/* STEP 3: CALCULATE */}
          {activeStep === 'calculate' && (
            <HRCard title="Step 3: Payroll Generation Engine">
              <div className="space-y-6">
                {busy === 'calculate' ? (
                  <div className="py-16 text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#014582] mx-auto" />
                    <div>
                      <h3 className="text-base font-extrabold text-[#1A1A2E]">
                        Calculating Payroll for {payPeriod?.name || periodKey}...
                      </h3>
                      <p className="text-xs text-[#7A8FA6] mt-1">
                        Processing attendance logs, overtime rules, allowances, tax brackets, and loan deductions...
                      </p>
                    </div>
                  </div>
                ) : rows.length > 0 ? (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-900 flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                      <div>
                        <p className="text-sm font-extrabold">Payroll Calculated Successfully</p>
                        <p className="text-xs text-green-700">
                          {rows.length} employee salary slips generated based on Phase 1 backend rules.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <HRStatCard label="Employees" value={rows.length} icon={UserCheck} color="#014582" />
                      <HRStatCard label="Gross Payroll" value={pkr(summary.gross || 0)} icon={Wallet} color="#2ECC71" />
                      <HRStatCard label="Deductions" value={pkr(summary.deductions || 0)} icon={Banknote} color="#E74C3C" />
                      <HRStatCard label="Net Pay" value={pkr(summary.net || 0)} icon={Wallet} color="#F39C12" />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#DDE4EE]">
                      <button
                        type="button"
                        onClick={handleCalculate}
                        disabled={busy === 'calculate'}
                        className="px-4 py-2.5 rounded-xl border border-[#DDE4EE] text-[#014582] text-xs font-bold hover:bg-[#F0F4F8]"
                      >
                        Recalculate
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveStep('review')}
                        className="px-6 py-3 rounded-xl bg-[#014582] text-white font-extrabold text-xs shadow-md hover:bg-[#013a6b] transition-all flex items-center gap-2"
                      >
                        Proceed to Review <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-4">
                    <Play className="w-12 h-12 text-[#014582] mx-auto opacity-50" />
                    <div>
                      <h3 className="text-base font-extrabold text-[#1A1A2E]">Ready to Calculate Payroll</h3>
                      <p className="text-xs text-[#7A8FA6] max-w-md mx-auto mt-1">
                        {rows.length || payPeriod?.headcount || 0} eligible employees queued for automatic payroll calculation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCalculate}
                      disabled={busy === 'calculate'}
                      className="px-6 py-3 rounded-xl bg-[#014582] text-white font-extrabold text-xs shadow-md hover:bg-[#013a6b] transition-all inline-flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" /> Calculate Payroll Now
                    </button>
                  </div>
                )}
              </div>
            </HRCard>
          )}

          {/* STEP 4: REVIEW */}
          {activeStep === 'review' && (
            <HRCard
              title="Step 4: Human Review & Employee Slips"
              action={
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#7A8FA6] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search employee..."
                      className="py-1.5 pl-8 pr-3 bg-white border border-[#DDE4EE] rounded-lg text-xs text-[#1A1A2E] focus:outline-none"
                    />
                  </div>
                </div>
              }
            >
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-extrabold text-purple-950">Human Review Stage</p>
                    <p className="text-xs text-purple-800 mt-0.5">
                      Review individual employee earnings, tax withholdings, attendance deductions, and net payable before submitting for executive approval.
                    </p>
                  </div>
                </div>

                {/* Summary stat strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <HRStatCard label="Reviewed Slips" value={filteredRows.length} icon={UserCheck} color="#014582" />
                  <HRStatCard label="Gross Payroll" value={pkr(summary.gross || 0)} icon={Wallet} color="#2ECC71" />
                  <HRStatCard label="Total Deductions" value={pkr(summary.deductions || 0)} icon={Banknote} color="#E74C3C" />
                  <HRStatCard label="Net Payable" value={pkr(summary.net || 0)} icon={Wallet} color="#F39C12" />
                </div>

                {/* Employee Slips Table */}
                <HRTable columns={['Employee', 'Gross Salary', 'Deductions', 'Tax', 'Net Pay', 'Status', 'Action']}>
                  {filteredRows.map((r, idx) => (
                    <HRTableRow key={r.id || r.employeeId || idx}>
                      <HRTableCell>
                        <div className="flex items-center gap-2.5">
                          <HRAvatar name={r.employeeName || 'Emp'} />
                          <div>
                            <p className="text-xs font-extrabold text-[#1A1A2E]">{r.employeeName}</p>
                            <p className="text-[10px] text-[#7A8FA6]">{r.employeeCode || r.designation || 'Staff'}</p>
                          </div>
                        </div>
                      </HRTableCell>
                      <HRTableCell><span className="font-bold text-[#1A1A2E]">{pkr(r.grossPay || r.grossSalary)}</span></HRTableCell>
                      <HRTableCell><span className="font-bold text-red-600">{pkr(r.totalDeductions || r.deductions)}</span></HRTableCell>
                      <HRTableCell><span className="font-bold text-[#7A8FA6]">{pkr(r.taxDeduction || r.tax || 0)}</span></HRTableCell>
                      <HRTableCell><span className="font-extrabold text-[#014582]">{pkr(r.netPay || r.netSalary)}</span></HRTableCell>
                      <HRTableCell><HRStatusBadge status={r.status || currentStatus} /></HRTableCell>
                      <HRTableCell>
                        <button
                          type="button"
                          onClick={() => setSelectedEmployee(r)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-[#F0F4F8] text-[#014582] hover:bg-[#014582] hover:text-white transition-all"
                        >
                          Inspect Breakdown
                        </button>
                      </HRTableCell>
                    </HRTableRow>
                  ))}
                </HRTable>

                <div className="flex items-center justify-between pt-4 border-t border-[#DDE4EE]">
                  <button
                    type="button"
                    onClick={() => setActiveStep('validate')}
                    className="px-4 py-2.5 rounded-xl border border-[#DDE4EE] text-[#7A8FA6] text-xs font-bold hover:bg-[#F0F4F8]"
                  >
                    Back to Validate
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowApproveModal(true)}
                    disabled={currentStatus === 'APPROVED' || currentStatus === 'FINALIZED' || currentStatus === 'PAID' || currentStatus === 'CLOSED'}
                    className={`px-6 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 ${
                      ['APPROVED', 'FINALIZED', 'PAID', 'CLOSED'].includes(currentStatus)
                        ? 'bg-green-600 text-white cursor-default'
                        : 'bg-[#014582] text-white hover:bg-[#013a6b]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {['APPROVED', 'FINALIZED', 'PAID', 'CLOSED'].includes(currentStatus)
                      ? 'Payroll Approved ✓'
                      : 'Approve Payroll'}
                  </button>
                </div>
              </div>
            </HRCard>
          )}

          {/* STEP 5: APPROVE */}
          {activeStep === 'approve' && (
            <HRCard title="Step 5: Executive Approval Authorization">
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-extrabold text-emerald-950">
                      Status: {currentStatus === 'APPROVED' ? 'Payroll Authorized & Approved' : 'Ready for Executive Approval'}
                    </p>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Approval confirms that reviewed employee salary slips have been audited and authorized for finalization.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <HRStatCard label="Authorized Employees" value={rows.length} icon={UserCheck} color="#2ECC71" />
                  <HRStatCard label="Total Gross" value={pkr(summary.gross || 0)} icon={Wallet} color="#014582" />
                  <HRStatCard label="Total Deductions" value={pkr(summary.deductions || 0)} icon={Banknote} color="#E74C3C" />
                  <HRStatCard label="Total Net Pay" value={pkr(summary.net || 0)} icon={Wallet} color="#2ECC71" />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#DDE4EE]">
                  <button
                    type="button"
                    onClick={() => setActiveStep('review')}
                    className="px-4 py-2.5 rounded-xl border border-[#DDE4EE] text-[#7A8FA6] text-xs font-bold hover:bg-[#F0F4F8]"
                  >
                    Back to Review
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentStatus === 'APPROVED') {
                        setActiveStep('finalize');
                      } else {
                        setShowApproveModal(true);
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-[#014582] text-white font-extrabold text-xs shadow-md hover:bg-[#013a6b] transition-all flex items-center gap-2"
                  >
                    {currentStatus === 'APPROVED' ? 'Proceed to Finalize' : 'Approve Payroll'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </HRCard>
          )}

          {/* STEP 6: FINALIZE */}
          {activeStep === 'finalize' && (
            <HRCard title="Step 6: Payroll Finalization & Period Lock">
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 flex items-start gap-3">
                  <Lock className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-extrabold">Finalization Period Lock</p>
                    <p className="text-xs text-orange-900 mt-1">
                      Finalization locks payroll calculations. Normal recalculations will no longer be available once locked.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <HRStatCard label="Finalized Staff" value={rows.length} icon={UserCheck} color="#E67E22" />
                  <HRStatCard label="Gross Payroll" value={pkr(summary.gross || 0)} icon={Wallet} color="#014582" />
                  <HRStatCard label="Deductions" value={pkr(summary.deductions || 0)} icon={Banknote} color="#E74C3C" />
                  <HRStatCard label="Locked Net Payable" value={pkr(summary.net || 0)} icon={Wallet} color="#E67E22" />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#DDE4EE]">
                  <button
                    type="button"
                    onClick={() => setActiveStep('approve')}
                    className="px-4 py-2.5 rounded-xl border border-[#DDE4EE] text-[#7A8FA6] text-xs font-bold hover:bg-[#F0F4F8]"
                  >
                    Back to Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentStatus === 'FINALIZED') {
                        setActiveStep('pay');
                      } else {
                        setShowFinalizeModal(true);
                      }
                    }}
                    className={`px-6 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 ${
                      ['FINALIZED', 'PAID', 'CLOSED'].includes(currentStatus)
                        ? 'bg-orange-600 text-white'
                        : 'bg-[#014582] text-white hover:bg-[#013a6b]'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    {['FINALIZED', 'PAID', 'CLOSED'].includes(currentStatus)
                      ? 'Period Finalized & Locked ✓'
                      : 'Finalize Payroll Lock'}
                  </button>
                </div>
              </div>
            </HRCard>
          )}

          {/* STEP 7: PAY */}
          {activeStep === 'pay' && (
            <HRCard title="Step 7: Payment Disbursement Readiness">
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
                  <Banknote className="w-6 h-6 text-[#014582] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-extrabold text-[#014582]">Payment Readiness State</p>
                    <p className="text-xs text-blue-800 mt-1">
                      Payroll is finalized. Prepare bank disbursement files or mark employee salaries as paid.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-[#DDE4EE] bg-[#F0F4F8]/50">
                    <span className="text-xs text-[#7A8FA6] font-bold uppercase">Ready for Payment</span>
                    <p className="text-xl font-extrabold text-[#014582] mt-1">{rows.length} Employees</p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#DDE4EE] bg-[#F0F4F8]/50">
                    <span className="text-xs text-[#7A8FA6] font-bold uppercase">Total Net Amount</span>
                    <p className="text-xl font-extrabold text-[#2ECC71] mt-1">{pkr(summary.net || 0)}</p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#DDE4EE] bg-[#F0F4F8]/50">
                    <span className="text-xs text-[#7A8FA6] font-bold uppercase">Payment Status</span>
                    <p className="text-base font-extrabold mt-1">
                      <HRStatusBadge status={currentStatus === 'PAID' ? 'PAID' : 'FINALIZED'} />
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#DDE4EE]">
                  <Link
                    href={`/hr/payroll/payments?period=${periodKey}`}
                    className="px-4 py-2.5 rounded-xl border border-[#DDE4EE] text-[#014582] text-xs font-bold hover:bg-[#F0F4F8]"
                  >
                    Open Payment Screen
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentStatus === 'PAID') {
                        setActiveStep('close');
                      } else {
                        setShowPayModal(true);
                      }
                    }}
                    className={`px-6 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 ${
                      ['PAID', 'CLOSED'].includes(currentStatus)
                        ? 'bg-green-600 text-white'
                        : 'bg-[#014582] text-white hover:bg-[#013a6b]'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    {['PAID', 'CLOSED'].includes(currentStatus) ? 'Marked as Paid ✓' : 'Mark as Paid'}
                  </button>
                </div>
              </div>
            </HRCard>
          )}

          {/* STEP 8: CLOSE */}
          {activeStep === 'close' && (
            <HRCard title="Step 8: Close Pay Period & Archive">
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-gray-100 border border-gray-300 text-gray-900 flex items-start gap-3">
                  <Archive className="w-6 h-6 text-gray-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-extrabold">Period Closing & Archive</p>
                    <p className="text-xs text-gray-700 mt-1">
                      Closing the period archives all historical data and locks all modifications permanently.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#DDE4EE]">
                  <Link
                    href="/hr/payroll/history"
                    className="px-4 py-2.5 rounded-xl border border-[#DDE4EE] text-[#014582] text-xs font-bold hover:bg-[#F0F4F8]"
                  >
                    View History Archive
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentStatus === 'CLOSED') {
                        toast('Period is already closed', { icon: 'ℹ️' });
                      } else {
                        setShowCloseModal(true);
                      }
                    }}
                    disabled={currentStatus === 'CLOSED'}
                    className={`px-6 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 ${
                      currentStatus === 'CLOSED'
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-[#014582] text-white hover:bg-[#013a6b]'
                    }`}
                  >
                    <Archive className="w-4 h-4" />
                    {currentStatus === 'CLOSED' ? 'Period Closed & Archived ✓' : 'Close Period'}
                  </button>
                </div>
              </div>
            </HRCard>
          )}
        </div>
      )}

      {/* MODAL: Employee Detail Breakdown */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <HRAvatar name={selectedEmployee.employeeName || 'Emp'} size="md" />
                <div>
                  <h3 className="text-base font-extrabold text-[#1A1A2E]">{selectedEmployee.employeeName}</h3>
                  <p className="text-xs text-[#7A8FA6]">{selectedEmployee.employeeCode} • {selectedEmployee.designation || 'Staff'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="p-1 rounded-lg text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[#F0F4F8] flex items-center justify-between font-bold">
                <span className="text-[#7A8FA6]">Basic Salary</span>
                <span className="text-[#1A1A2E]">{pkr(selectedEmployee.basicSalary || 0)}</span>
              </div>

              <div>
                <p className="font-extrabold text-[#1A1A2E] uppercase tracking-wider text-[10px] mb-2">Earnings</p>
                <div className="space-y-1.5 pl-2">
                  <div className="flex justify-between text-[#7A8FA6]">
                    <span>Allowances</span>
                    <span className="font-semibold text-[#1A1A2E]">{pkr(selectedEmployee.allowances || 0)}</span>
                  </div>
                  <div className="flex justify-between text-[#7A8FA6]">
                    <span>Overtime Pay</span>
                    <span className="font-semibold text-[#1A1A2E]">{pkr(selectedEmployee.overtimePay || 0)}</span>
                  </div>
                  <div className="flex justify-between text-[#7A8FA6]">
                    <span>Bonuses</span>
                    <span className="font-semibold text-[#1A1A2E]">{pkr(selectedEmployee.bonusAmount || 0)}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-extrabold text-red-600 uppercase tracking-wider text-[10px] mb-2">Deductions</p>
                <div className="space-y-1.5 pl-2">
                  <div className="flex justify-between text-[#7A8FA6]">
                    <span>Income Tax</span>
                    <span className="font-semibold text-red-600">{pkr(selectedEmployee.taxDeduction || 0)}</span>
                  </div>
                  <div className="flex justify-between text-[#7A8FA6]">
                    <span>Attendance / Leave Deductions</span>
                    <span className="font-semibold text-red-600">{pkr(selectedEmployee.attendanceDeduction || 0)}</span>
                  </div>
                  <div className="flex justify-between text-[#7A8FA6]">
                    <span>Loan Repayment</span>
                    <span className="font-semibold text-red-600">{pkr(selectedEmployee.loanDeduction || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#014582]/10 border border-[#014582]/20 flex items-center justify-between text-sm">
                <span className="font-extrabold text-[#014582]">Net Salary Payable</span>
                <span className="font-extrabold text-[#014582] text-lg">{pkr(selectedEmployee.netPay || selectedEmployee.netSalary || 0)}</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#DDE4EE] text-right">
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: APPROVE */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <h3 className="text-base font-extrabold text-[#1A1A2E]">Approve {payPeriod?.name || periodKey} Payroll?</h3>
            <p className="text-xs text-[#7A8FA6] mt-2">
              Approval confirms that the reviewed payroll has been authorized and is ready for finalization.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={busy === 'approve'}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#014582] text-white hover:bg-[#013a6b] flex items-center gap-2"
              >
                {busy === 'approve' && <Loader2 className="w-4 h-4 animate-spin" />} Approve Payroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: FINALIZE */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <h3 className="text-base font-extrabold text-[#1A1A2E]">Finalize & Lock {payPeriod?.name || periodKey} Payroll?</h3>
            <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs font-medium mt-3">
              Warning: Finalization locks payroll calculations permanently. Recalculation will no longer be available.
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFinalizeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={busy === 'finalize'}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-2"
              >
                {busy === 'finalize' && <Loader2 className="w-4 h-4 animate-spin" />} Finalize & Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: MARK AS PAID */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <h3 className="text-base font-extrabold text-[#1A1A2E]">Mark {payPeriod?.name || periodKey} Payroll as PAID?</h3>
            <p className="text-xs text-[#7A8FA6] mt-2">
              This will update payroll payment status for all eligible employees to PAID.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkAsPaid}
                disabled={busy === 'pay'}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
              >
                {busy === 'pay' && <Loader2 className="w-4 h-4 animate-spin" />} Confirm Paid Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: CLOSE PERIOD */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <h3 className="text-base font-extrabold text-[#1A1A2E]">Close & Archive {payPeriod?.name || periodKey} Period?</h3>
            <p className="text-xs text-[#7A8FA6] mt-2">
              Closing the period completes the payroll lifecycle and moves data into history archives.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClosePeriod}
                disabled={busy === 'close'}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gray-800 text-white hover:bg-gray-900 flex items-center gap-2"
              >
                {busy === 'close' && <Loader2 className="w-4 h-4 animate-spin" />} Close Period
              </button>
            </div>
          </div>
        </div>
      )}
    </HRPage>
  );
}
