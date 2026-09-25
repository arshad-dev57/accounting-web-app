'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Download,
  Printer,
  Loader2,
  Users,
  Wallet,
  Banknote,
  Search,
  Eye,
  X,
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
import { pkr, formatPayrollDate } from '@/lib/hr-payroll-slip-utils';
import { downloadPayRegisterCsv, printPayRegister } from '@/lib/hr-pay-register-export';


function currentPeriodKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function PayRegisterContent() {
  const searchParams = useSearchParams();
  const periodParam = searchParams.get('period');

  const [periodKey, setPeriodKey] = React.useState(periodParam || currentPeriodKey());
  const [periodList, setPeriodList] = React.useState<any[]>([]);
  const [payPeriod, setPayPeriod] = React.useState<any>(null);

  const [loading, setLoading] = React.useState(true);
  const [registerData, setRegisterData] = React.useState<any>(null);
  const [search, setSearch] = React.useState('');
  const [selectedEmp, setSelectedEmp] = React.useState<any | null>(null);

  const loadRegister = React.useCallback(async (pKey = periodKey) => {
    setLoading(true);
    try {
      const list = await hrWorkforceService.listPayPeriods().catch(() => []);
      setPeriodList(Array.isArray(list) ? list : []);

      const periodRow = await hrWorkforceService.ensurePayPeriod(pKey).catch(() => null);
      setPayPeriod(periodRow);

      if (periodRow?.id) {
        // Authoritative backend pay register fetch
        const data = await hrWorkforceService.getPayRegister(periodRow.id);
        setRegisterData(data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load pay register');
    } finally {
      setLoading(false);
    }
  }, [periodKey]);

  React.useEffect(() => {
    loadRegister(periodKey);
  }, [periodKey, loadRegister]);

  const items = registerData?.items || registerData?.slips || [];
  const totals = registerData?.totals || registerData?.summary || {
    count: items.length,
    basic: 0,
    allowances: 0,
    overtime: 0,
    bonus: 0,
    commission: 0,
    gross: registerData?.summary?.gross || 0,
    tax: 0,
    deductions: registerData?.summary?.deductions || 0,
    net: registerData?.summary?.net || 0,
  };

  const filteredItems = items.filter((r: any) => {
    const q = search.toLowerCase();
    return (
      (r.employeeName || r.employee || '').toLowerCase().includes(q) ||
      (r.employeeCode || '').toLowerCase().includes(q) ||
      (r.departmentName || r.department || '').toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    try {
      downloadPayRegisterCsv(
        items,
        {
          period: periodKey,
          periodLabel: payPeriod?.name || periodKey,
          payDate: payPeriod?.payDate,
          stage: payPeriod?.status,
        },
        totals
      );
      toast.success('Pay Register exported to CSV');
    } catch (err: any) {
      toast.error('Failed exporting CSV');
    }
  };

  const handlePrint = () => {
    try {
      printPayRegister(
        items,
        {
          period: periodKey,
          periodLabel: payPeriod?.name || periodKey,
          payDate: payPeriod?.payDate,
          stage: payPeriod?.status,
        },
        totals
      );
    } catch (err: any) {
      toast.error('Failed to open print preview');
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Pay Register"
        subtitle="Consolidated, authoritative salary register record for audited pay periods."
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
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-xl bg-white text-[#014582] text-xs font-extrabold shadow-sm hover:bg-white/90 transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
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
          {/* Header Record Summary Banner */}
          <div className="bg-white rounded-2xl p-5 border border-[#DDE4EE] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-extrabold text-[#1A1A2E]">
                  {payPeriod?.name || periodKey} Pay Register Record
                </h2>
                <HRStatusBadge status={payPeriod?.status || 'FINALIZED'} />
              </div>
              <p className="text-xs text-[#7A8FA6] font-medium mt-1">
                Authoritative register calculated by Phase 1 backend • Pay Date: {formatPayrollDate(payPeriod?.payDate, 'N/A')}
              </p>

            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7A8FA6] font-semibold">
                Total Employees: <strong className="text-[#014582]">{items.length}</strong>
              </span>
            </div>
          </div>

          {/* Stat row using authoritative totals */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <HRStatCard
              label="Total Employees"
              value={items.length}
              icon={Users}
              color="#014582"
            />
            <HRStatCard
              label="Gross Payroll"
              value={pkr(totals.gross || totals.grossPay || 0)}
              icon={Wallet}
              color="#2ECC71"
            />
            <HRStatCard
              label="Total Deductions"
              value={pkr(totals.deductions || totals.totalDeductions || 0)}
              icon={Banknote}
              color="#E74C3C"
            />
            <HRStatCard
              label="Net Pay"
              value={pkr(totals.net || totals.netPay || 0)}
              icon={Wallet}
              color="#F39C12"
            />
          </div>

          {/* Pay Register Table Card */}
          <HRCard
            title="Employee Register Records"
            action={
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#7A8FA6] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter register..."
                  className="py-1.5 pl-8 pr-3 bg-white border border-[#DDE4EE] rounded-lg text-xs text-[#1A1A2E] focus:outline-none"
                />
              </div>
            }
          >
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7A8FA6]">
                No pay register records found for this period.
              </div>
            ) : (
              <HRTable columns={['Employee ID', 'Employee Name', 'Department', 'Gross Salary', 'Deductions', 'Net Pay', 'Payment Status', 'Action']}>
                {filteredItems.map((r: any, idx: number) => (
                  <HRTableRow key={r.id || r.employeeId || idx}>
                    <HRTableCell><span className="font-extrabold text-[#014582]">{r.employeeCode || `EMP-${idx + 1}`}</span></HRTableCell>
                    <HRTableCell>
                      <div className="flex items-center gap-2.5">
                        <HRAvatar name={r.employeeName || r.employee || 'Emp'} />
                        <span className="font-bold text-[#1A1A2E]">{r.employeeName || r.employee}</span>
                      </div>
                    </HRTableCell>
                    <HRTableCell><span className="text-[#7A8FA6] font-medium">{r.departmentName || r.department || 'General'}</span></HRTableCell>
                    <HRTableCell><span className="font-bold text-[#1A1A2E]">{pkr(r.grossPay || r.grossSalary || r.basicSalary)}</span></HRTableCell>
                    <HRTableCell><span className="font-bold text-red-600">{pkr(r.totalDeductions || r.deductions || 0)}</span></HRTableCell>
                    <HRTableCell><span className="font-extrabold text-[#014582]">{pkr(r.netPay || r.netSalary)}</span></HRTableCell>
                    <HRTableCell><HRStatusBadge status={r.status || payPeriod?.status || 'FINALIZED'} /></HRTableCell>
                    <HRTableCell>
                      <button
                        type="button"
                        onClick={() => setSelectedEmp(r)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-[#F0F4F8] text-[#014582] hover:bg-[#014582] hover:text-white transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </HRTableCell>
                  </HRTableRow>
                ))}
              </HRTable>
            )}
          </HRCard>
        </div>
      )}

      {/* Modal: View Employee Register Row */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <HRAvatar name={selectedEmp.employeeName || selectedEmp.employee || 'Emp'} size="md" />
                <div>
                  <h3 className="text-base font-extrabold text-[#1A1A2E]">
                    {selectedEmp.employeeName || selectedEmp.employee}
                  </h3>
                  <p className="text-xs text-[#7A8FA6]">
                    {selectedEmp.employeeCode} • {selectedEmp.departmentName || selectedEmp.department || 'Department'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmp(null)}
                className="p-1 rounded-lg text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Basic Salary</span>
                <span className="font-bold text-[#1A1A2E]">{pkr(selectedEmp.basicSalary || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Allowances</span>
                <span className="font-bold text-[#1A1A2E]">{pkr(selectedEmp.allowances || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Overtime</span>
                <span className="font-bold text-[#1A1A2E]">{pkr(selectedEmp.overtimePay || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-red-600">Total Deductions</span>
                <span className="font-bold text-red-600">{pkr(selectedEmp.totalDeductions || selectedEmp.deductions || 0)}</span>
              </div>
              <div className="flex justify-between py-2 rounded-xl bg-[#014582]/10 px-3 text-sm font-extrabold text-[#014582]">
                <span>Net Pay</span>
                <span>{pkr(selectedEmp.netPay || selectedEmp.netSalary)}</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#DDE4EE] text-right">
              <button
                type="button"
                onClick={() => setSelectedEmp(null)}
                className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </HRPage>
  );
}

export default function PayRegisterPage() {
  return (
    <React.Suspense fallback={<div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#014582]" /></div>}>
      <PayRegisterContent />
    </React.Suspense>
  );
}
