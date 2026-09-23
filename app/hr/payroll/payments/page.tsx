'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Banknote,
  CheckCircle2,
  Download,
  Loader2,
  Users,
  Wallet,
  Building2,
  FileSpreadsheet,
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
} from '../../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';
import { pkr } from '@/lib/hr-payroll-slip-utils';

function currentPeriodKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function PayrollPaymentsContent() {
  const searchParams = useSearchParams();
  const periodParam = searchParams.get('period');

  const [periodKey, setPeriodKey] = React.useState(periodParam || currentPeriodKey());
  const [periodList, setPeriodList] = React.useState<any[]>([]);
  const [payPeriod, setPayPeriod] = React.useState<any>(null);

  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [rows, setRows] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState<any>({});
  const [showPayModal, setShowPayModal] = React.useState(false);

  const loadPayments = React.useCallback(async (pKey = periodKey) => {
    setLoading(true);
    try {
      const list = await hrWorkforceService.listPayPeriods().catch(() => []);
      setPeriodList(Array.isArray(list) ? list : []);

      const periodRow = await hrWorkforceService.ensurePayPeriod(pKey).catch(() => null);
      setPayPeriod(periodRow);

      if (periodRow?.id) {
        const reviewData = await hrWorkforceService.getPayrollReview(periodRow.id).catch(() => null);
        setRows(reviewData?.items || []);
        setSummary(reviewData?.summary || {});
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payroll payment data');
    } finally {
      setLoading(false);
    }
  }, [periodKey]);

  React.useEffect(() => {
    loadPayments(periodKey);
  }, [periodKey, loadPayments]);

  const currentStatus = payPeriod?.status || 'FINALIZED';
  const isPaid = currentStatus === 'PAID' || currentStatus === 'CLOSED';

  const handleMarkAsPaid = async () => {
    if (!payPeriod?.id) return;
    setBusy(true);
    try {
      const updated = await hrWorkforceService.transitionPayPeriod(payPeriod.id, 'PAID');
      setPayPeriod(updated);
      setShowPayModal(false);
      toast.success(`${payPeriod?.name || periodKey} payroll marked as PAID`);
      await loadPayments(periodKey);
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark as paid');
    } finally {
      setBusy(false);
    }
  };

  const exportBankFile = () => {
    try {
      const header = 'Employee ID,Employee Name,Bank Name,Account Number,Net Pay (PKR)\n';
      const lines = rows
        .map(
          (r) =>
            `"${r.employeeCode || ''}","${r.employeeName || r.employee}","${r.bankName || 'Default Bank'}","${
              r.bankAccount || 'N/A'
            }",${r.netPay || r.netSalary || r.net || 0}`
        )
        .join('\n');

      const blob = new Blob([header + lines], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bank_Disbursement_${periodKey}.csv`;
      a.click();
      toast.success('Bank export CSV downloaded');
    } catch {
      toast.error('Failed to download bank export');
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Payroll Payment Stage"
        subtitle="Manage payment readiness state and disburse finalized employee payroll."
        backHref="/hr/payroll/dashboard"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={periodKey}
              onChange={(e) => setPeriodKey(e.target.value)}
              className="bg-white/15 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:bg-white focus:text-[#1A1A2E]"
            >
              {periodList.map((p) => (
                <option key={p.id || p.periodKey} value={p.periodKey} className="text-[#1A1A2E]">
                  {p.name || p.periodKey} ({p.status})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={exportBankFile}
              className="px-3.5 py-1.5 rounded-xl bg-white text-[#014582] text-xs font-extrabold shadow-sm hover:bg-white/90 transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Bank Export (CSV)
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Readiness Status Banner */}
          <div className="bg-white rounded-2xl p-6 border border-[#DDE4EE] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-[#1A1A2E]">
                  {payPeriod?.name || periodKey} Payment Stage
                </h2>
                <HRStatusBadge status={currentStatus} />
              </div>
              <p className="text-xs text-[#7A8FA6] font-medium mt-1">
                Payroll Status: <strong className="text-[#1A1A2E]">{currentStatus}</strong> • Payment State:{' '}
                <strong className={isPaid ? 'text-green-600' : 'text-[#014582]'}>
                  {isPaid ? 'PAID' : 'READY FOR PAYMENT'}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isPaid ? (
                <Link
                  href={`/hr/payroll/run?period=${periodKey}&step=close`}
                  className="px-5 py-2.5 rounded-xl bg-[#014582] text-white font-extrabold text-xs shadow-md hover:bg-[#013a6b] transition-all flex items-center gap-2"
                >
                  Close Pay Period
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPayModal(true)}
                  className="px-6 py-3 rounded-xl bg-green-600 text-white font-extrabold text-xs shadow-md hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <Banknote className="w-4 h-4" /> Mark as Paid
                </button>
              )}
            </div>
          </div>

          {/* Payment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HRStatCard
              label="Employees Ready for Payment"
              value={rows.length}
              icon={Users}
              color="#014582"
            />
            <HRStatCard
              label="Total Net Pay"
              value={pkr(summary.net || 0)}
              icon={Wallet}
              color="#2ECC71"
            />
            <HRStatCard
              label="Payment Readiness State"
              value={isPaid ? 'Disbursed' : 'Ready'}
              icon={CheckCircle2}
              color={isPaid ? '#2ECC71' : '#014582'}
            />
          </div>

          {/* Employee Bank Disbursement List */}
          <HRCard title="Employee Disbursement Schedule">
            {rows.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7A8FA6]">
                No payment entries found for this period.
              </div>
            ) : (
              <HRTable columns={['Employee ID', 'Employee Name', 'Department', 'Bank Account', 'Net Pay', 'Payment Status']}>
                {rows.map((r, idx) => (
                  <HRTableRow key={r.id || r.employeeId || idx}>
                    <HRTableCell><span className="font-extrabold text-[#014582]">{r.employeeCode || `EMP-${idx + 1}`}</span></HRTableCell>
                    <HRTableCell>
                      <div className="flex items-center gap-2.5">
                        <HRAvatar name={r.employeeName || r.employee || 'Emp'} />
                        <span className="font-bold text-[#1A1A2E]">{r.employeeName || r.employee}</span>
                      </div>
                    </HRTableCell>
                    <HRTableCell><span className="text-[#7A8FA6] font-medium">{r.departmentName || r.department || 'General'}</span></HRTableCell>
                    <HRTableCell><span className="text-[#7A8FA6] font-mono text-xs">{r.bankAccount || 'Direct Deposit'}</span></HRTableCell>
                    <HRTableCell><span className="font-extrabold text-[#2ECC71]">{pkr(r.netPay || r.netSalary || r.net)}</span></HRTableCell>
                    <HRTableCell><HRStatusBadge status={isPaid ? 'PAID' : 'READY FOR PAYMENT'} /></HRTableCell>
                  </HRTableRow>
                ))}
              </HRTable>
            )}
          </HRCard>
        </div>
      )}

      {/* CONFIRMATION MODAL: MARK AS PAID */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <h3 className="text-base font-extrabold text-[#1A1A2E]">
              Mark {payPeriod?.name || periodKey} Payroll as Paid?
            </h3>
            <p className="text-xs text-[#7A8FA6] mt-2">
              This action will mark all employee net salary entries as PAID and transition period status to PAID.
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
                disabled={busy}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </HRPage>
  );
}

export default function PayrollPaymentsPage() {
  return (
    <React.Suspense fallback={<div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#014582]" /></div>}>
      <PayrollPaymentsContent />
    </React.Suspense>
  );
}
