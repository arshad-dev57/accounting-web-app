'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Printer,
  Download,
  Search,
  Eye,
  X,
  Loader2,
  Users,
  CheckCircle2,
  Building2,
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
import { pkr, slipParts, printPayslip } from '@/lib/hr-payroll-slip-utils';

function currentPeriodKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function PayslipsContent() {
  const searchParams = useSearchParams();
  const periodParam = searchParams.get('period');

  const [periodKey, setPeriodKey] = React.useState(periodParam || currentPeriodKey());
  const [periodList, setPeriodList] = React.useState<any[]>([]);
  const [payPeriod, setPayPeriod] = React.useState<any>(null);

  const [loading, setLoading] = React.useState(true);
  const [slips, setSlips] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [viewingSlip, setViewingSlip] = React.useState<any | null>(null);

  const loadPayslips = React.useCallback(async (pKey = periodKey) => {
    setLoading(true);
    try {
      const list = await hrWorkforceService.listPayPeriods().catch(() => []);
      setPeriodList(Array.isArray(list) ? list : []);

      const periodRow = await hrWorkforceService.ensurePayPeriod(pKey).catch(() => null);
      setPayPeriod(periodRow);

      if (periodRow?.id) {
        const reviewData = await hrWorkforceService.getPayrollReview(periodRow.id).catch(() => null);
        setSlips(reviewData?.items || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  }, [periodKey]);

  React.useEffect(() => {
    loadPayslips(periodKey);
  }, [periodKey, loadPayslips]);

  const filteredSlips = slips.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.employeeName || r.employee || '').toLowerCase().includes(q) ||
      (r.employeeCode || '').toLowerCase().includes(q) ||
      (r.departmentName || r.department || '').toLowerCase().includes(q)
    );
  });

  const handlePrintSlip = (slipRow: any) => {
    try {
      printPayslip(
        slipRow,
        payPeriod?.name || periodKey,
        payPeriod?.payDate
      );
    } catch (err: any) {
      toast.error('Print preview error');
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Payslips"
        subtitle="Document management hub for formal employee salary documents and payslips."
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
          </div>
        }
      />

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Document Header Summary Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#DDE4EE] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-extrabold text-[#1A1A2E]">
                  {payPeriod?.name || periodKey} Employee Payslips
                </h2>
                <HRStatusBadge status={payPeriod?.status || 'FINALIZED'} />
              </div>
              <p className="text-xs text-[#7A8FA6] font-medium mt-1">
                Formal document repository • {slips.length} Payslips generated
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-[#014582]">
                {slips.length} Salary Documents Available
              </span>
            </div>
          </div>

          {/* Payslips Table Card */}
          <HRCard
            title="Generated Employee Salary Documents"
            action={
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#7A8FA6] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter payslips..."
                  className="py-1.5 pl-8 pr-3 bg-white border border-[#DDE4EE] rounded-lg text-xs text-[#1A1A2E] focus:outline-none"
                />
              </div>
            }
          >
            {filteredSlips.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7A8FA6]">
                No payslips available for this period. Calculate payroll first.
              </div>
            ) : (
              <HRTable columns={['Employee', 'Employee Code', 'Department', 'Net Pay', 'Status', 'Document Actions']}>
                {filteredSlips.map((r, idx) => (
                  <HRTableRow key={r.id || r.employeeId || idx}>
                    <HRTableCell>
                      <div className="flex items-center gap-2.5">
                        <HRAvatar name={r.employeeName || r.employee || 'Emp'} />
                        <span className="font-bold text-[#1A1A2E]">{r.employeeName || r.employee}</span>
                      </div>
                    </HRTableCell>
                    <HRTableCell><span className="font-extrabold text-[#014582]">{r.employeeCode || `EMP-${idx + 1}`}</span></HRTableCell>
                    <HRTableCell><span className="text-[#7A8FA6] font-medium">{r.departmentName || r.department || 'General'}</span></HRTableCell>
                    <HRTableCell><span className="font-extrabold text-[#014582]">{pkr(r.netPay || r.netSalary || r.net)}</span></HRTableCell>
                    <HRTableCell><HRStatusBadge status={r.status || payPeriod?.status || 'APPROVED'} /></HRTableCell>
                    <HRTableCell>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingSlip(r)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F0F4F8] text-[#014582] hover:bg-[#014582] hover:text-white transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintSlip(r)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#DDE4EE] text-[#1A1A2E] hover:bg-[#F0F4F8] transition-all inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                      </div>
                    </HRTableCell>
                  </HRTableRow>
                ))}
              </HRTable>
            )}
          </HRCard>
        </div>
      )}

      {/* MODAL: Printable Salary Document Layout */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-[#DDE4EE]">
            {/* Payslip Top Bar */}
            <div className="flex items-center justify-between border-b border-[#DDE4EE] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#014582] flex items-center justify-center text-white font-black text-sm">
                  ERP
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1A1A2E]">Bisonstechs Enterprise</h3>
                  <p className="text-xs text-[#7A8FA6]">Formal Salary Slip Document</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintSlip(viewingSlip)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#014582] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewingSlip(null)}
                  className="p-1 rounded-lg text-[#7A8FA6] hover:bg-[#F0F4F8]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Header */}
            <div className="bg-[#F0F4F8] rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[10px] text-[#7A8FA6] uppercase font-bold">Employee Information</p>
                <p className="font-extrabold text-sm text-[#1A1A2E] mt-0.5">{viewingSlip.employeeName || viewingSlip.employee}</p>
                <p className="text-[#7A8FA6]">ID: {viewingSlip.employeeCode} • Dept: {viewingSlip.departmentName || viewingSlip.department || 'General'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#7A8FA6] uppercase font-bold">Pay Period Details</p>
                <p className="font-extrabold text-sm text-[#014582] mt-0.5">{payPeriod?.name || periodKey}</p>
                <p className="text-[#7A8FA6]">Pay Date: {payPeriod?.payDate || 'TBD'} • Status: {viewingSlip.status || payPeriod?.status}</p>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-xs">
              {/* Earnings Column */}
              <div className="space-y-2">
                <p className="font-extrabold text-[#1A1A2E] uppercase tracking-wider text-[10px] border-b border-[#DDE4EE] pb-1">
                  Earnings & Allowances
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-[#DDE4EE]/60">
                    <span className="text-[#7A8FA6]">Basic Salary</span>
                    <span className="font-bold text-[#1A1A2E]">{pkr(viewingSlip.basicSalary || viewingSlip.base || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DDE4EE]/60">
                    <span className="text-[#7A8FA6]">Allowances</span>
                    <span className="font-bold text-[#1A1A2E]">{pkr(viewingSlip.allowances || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DDE4EE]/60">
                    <span className="text-[#7A8FA6]">Overtime</span>
                    <span className="font-bold text-[#1A1A2E]">{pkr(viewingSlip.overtimePay || viewingSlip.overtime || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DDE4EE]/60">
                    <span className="text-[#7A8FA6]">Bonus / Incentives</span>
                    <span className="font-bold text-[#1A1A2E]">{pkr(viewingSlip.bonusAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-extrabold text-[#1A1A2E]">
                    <span>Total Gross Earnings</span>
                    <span>{pkr(viewingSlip.grossPay || viewingSlip.grossSalary || viewingSlip.basicSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="space-y-2">
                <p className="font-extrabold text-red-600 uppercase tracking-wider text-[10px] border-b border-[#DDE4EE] pb-1">
                  Deductions & Taxes
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-[#DDE4EE]/60">
                    <span className="text-[#7A8FA6]">Income Tax</span>
                    <span className="font-bold text-red-600">{pkr(viewingSlip.taxDeduction || viewingSlip.tax || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DDE4EE]/60">
                    <span className="text-[#7A8FA6]">Attendance / Leave Cut</span>
                    <span className="font-bold text-red-600">{pkr(viewingSlip.attendanceDeduction || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DDE4EE]/60">
                    <span className="text-[#7A8FA6]">Loan Installment</span>
                    <span className="font-bold text-red-600">{pkr(viewingSlip.loanDeduction || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-extrabold text-red-600">
                    <span>Total Deductions</span>
                    <span>{pkr(viewingSlip.totalDeductions || viewingSlip.deductions || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#014582] to-[#015db2] text-white flex items-center justify-between shadow-md mb-8">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/70">Total Net Amount Payable</span>
                <p className="text-xl font-extrabold mt-0.5">{pkr(viewingSlip.netPay || viewingSlip.netSalary || viewingSlip.net)}</p>
              </div>
              <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold">
                {viewingSlip.status || 'APPROVED'}
              </span>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-dashed border-[#DDE4EE] text-center text-xs text-[#7A8FA6]">
              <div>
                <div className="h-10 border-b border-[#DDE4EE] mb-2" />
                <p className="font-bold text-[#1A1A2E]">Authorized HR Signature</p>
              </div>
              <div>
                <div className="h-10 border-b border-[#DDE4EE] mb-2" />
                <p className="font-bold text-[#1A1A2E]">Employee Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </HRPage>
  );
}

export default function PayslipsPage() {
  return (
    <React.Suspense fallback={<div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#014582]" /></div>}>
      <PayslipsContent />
    </React.Suspense>
  );
}
