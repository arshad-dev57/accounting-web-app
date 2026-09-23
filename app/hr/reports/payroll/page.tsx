'use client';

import React from 'react';
import Link from 'next/link';
import { Download, Loader2, Wallet, Banknote, AlertTriangle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRStatCard,
  HRWorkflowNotice,
  HRTable,
  HRTableRow,
  HRTableCell,
} from '../../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

import { openReportPrintPreview } from '@/lib/hr-reports-generator';
import { Printer } from 'lucide-react';

const COLORS = { success: '#2ECC71', warning: '#F39C12', primary: '#014582', danger: '#E74C3C' };
const pkr = (n: number) =>
  `Rs ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

type ReportTab =
  | 'summary'
  | 'register'
  | 'overtime'
  | 'deductions'
  | 'tax'
  | 'employee-cost'
  | 'history';

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'summary', label: 'Payroll summary' },
  { id: 'register', label: 'Salary register' },
  { id: 'overtime', label: 'Overtime report' },
  { id: 'deductions', label: 'Deduction report' },
  { id: 'tax', label: 'Tax report' },
  { id: 'employee-cost', label: 'Employee cost' },
  { id: 'history', label: 'Payroll history' },
];

export default function PayrollReportsPage() {
  const [tab, setTab] = React.useState<ReportTab>('summary');
  const [period, setPeriod] = React.useState(currentPeriod());
  const [loading, setLoading] = React.useState(true);
  const [payroll, setPayroll] = React.useState<any>(null);

  const load = React.useCallback(async (p = period) => {
    setLoading(true);
    try {
      setPayroll(await hrWorkforceService.payrollReport(p));
    } catch (error: any) {
      toast.error(error.message || 'Failed to load payroll report');
    } finally {
      setLoading(false);
    }
  }, [period]);

  React.useEffect(() => {
    void load(period);
  }, [load, period]);

  const summary = payroll?.summary || {};
  const statutory = summary.statutory || {};
  const register = payroll?.register || [];

  const exportCsv = () => {
    const header = ['Employee', 'Code', 'Department', 'Gross', 'Deductions', 'Net', 'Status'];
    const lines = register.map((r: any) =>
      [r.employee, r.employeeCode, r.department, r.breakdown?.earnings?.gross ?? r.base, r.deductions, r.net, r.status].join(',')
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${tab}-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printCorporateReport = () => {
    const rows = register.map((r: any) => ({
      employeeCode: r.employeeCode || '—',
      employee: r.employee || 'Emp',
      department: r.department || 'General',
      gross: pkr(r.breakdown?.earnings?.gross ?? r.base ?? 0),
      deductions: pkr(r.deductions || 0),
      net: pkr(r.net || 0),
      status: r.status || 'Approved',
    }));

    openReportPrintPreview({
      title: `Payroll Report — ${tab.toUpperCase()} (${period})`,
      subtitle: `Authoritative stored payroll calculation records`,
      filterSummary: `Month: ${period} · Headcount: ${register.length}`,
      columns: [
        { key: 'employeeCode', label: 'Employee ID' },
        { key: 'employee', label: 'Employee Name' },
        { key: 'department', label: 'Department' },
        { key: 'gross', label: 'Gross Salary' },
        { key: 'deductions', label: 'Total Deductions' },
        { key: 'net', label: 'Net Payable' },
        { key: 'status', label: 'Status' },
      ],
      rows,
      summaryCards: [
        { label: 'Headcount', value: register.length },
        { label: 'Gross Payroll', value: pkr(summary.gross || 0) },
        { label: 'Total Deductions', value: pkr(summary.deductions || 0) },
        { label: 'Net Payable', value: pkr(summary.net || 0) },
      ],
      includeSignature: true,
    });
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Payroll reports"
        subtitle="Summary, register, statutory deductions, and cost analysis"
        backHref="/hr/reports"
        actions={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white/15 text-white rounded-lg px-2 py-2 text-xs font-bold border border-white/20"
            />
            <button
              type="button"
              onClick={printCorporateReport}
              className="flex items-center gap-2 bg-[#014582] text-white px-3 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-[#013a6b]"
            >
              <Printer className="w-4 h-4" /> Print PDF Report
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        }
      />
      <HRWorkflowNotice
        title="Processed payroll only"
        detail="Reports use completed pay runs for the selected month. Run payroll first, then review reports here."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold ${tab === t.id ? 'bg-[#014582] text-white' : 'bg-white border border-[#DDE4EE] text-[#7A8FA6]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#014582]" /></div>
      ) : tab === 'summary' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <HRStatCard label="Gross payroll" value={pkr(summary.gross || 0)} icon={Wallet} color={COLORS.primary} hint={payroll?.periodLabel} />
          <HRStatCard label="Net payable" value={pkr(summary.net || 0)} icon={Banknote} color={COLORS.success} />
          <HRStatCard label="Total deductions" value={pkr(summary.deductions || 0)} icon={Wallet} color={COLORS.danger} />
          <HRStatCard label="Vs previous month" value={pkr(summary.variance || 0)} icon={AlertTriangle} color={COLORS.warning} hint={payroll?.previousPeriodLabel} />
        </div>
      ) : tab === 'register' || tab === 'history' ? (
        <HRCard title={tab === 'history' ? 'Payroll history register' : 'Salary register'} action={<span className="text-[10px] font-bold text-[#7A8FA6]">{register.length} employees</span>}>
          <HRTable columns={['Employee', 'Department', 'Gross', 'Deductions', 'Net', 'Status']}>
            {register.length === 0 && <HRTableRow><HRTableCell className="text-[#7A8FA6]">No payroll for this period</HRTableCell></HRTableRow>}
            {register.map((r: any) => (
              <HRTableRow key={r.id}>
                <HRTableCell className="font-bold">{r.employee}<span className="block text-[10px] text-[#7A8FA6]">{r.employeeCode}</span></HRTableCell>
                <HRTableCell>{r.department || '—'}</HRTableCell>
                <HRTableCell>{pkr(r.breakdown?.earnings?.gross ?? r.base)}</HRTableCell>
                <HRTableCell className="text-[#E74C3C]">{pkr(r.deductions)}</HRTableCell>
                <HRTableCell className="font-bold">{pkr(r.net)}</HRTableCell>
                <HRTableCell>{r.status}</HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      ) : tab === 'overtime' ? (
        <HRCard title="Overtime report">
          <p className="text-xs text-[#7A8FA6] mb-4">
            Overtime amounts are included in payroll gross. Manage overtime requests under Workforce.
          </p>
          <Link href="/hr/overtime" className="inline-flex items-center gap-1 text-xs font-bold text-[#014582] mb-4">
            Open overtime management <ExternalLink className="w-3 h-3" />
          </Link>
          <HRTable columns={['Employee', 'Department', 'Overtime earnings', 'Gross', 'Net']}>
            {register.filter((r: any) => Number(r.breakdown?.earnings?.overtime || 0) > 0).length === 0 && (
              <HRTableRow><HRTableCell className="text-[#7A8FA6]">No overtime in this period</HRTableCell></HRTableRow>
            )}
            {register
              .filter((r: any) => Number(r.breakdown?.earnings?.overtime || 0) > 0)
              .map((r: any) => (
                <HRTableRow key={r.id}>
                  <HRTableCell className="font-bold">{r.employee}</HRTableCell>
                  <HRTableCell>{r.department || '—'}</HRTableCell>
                  <HRTableCell>{pkr(r.breakdown?.earnings?.overtime || 0)}</HRTableCell>
                  <HRTableCell>{pkr(r.breakdown?.earnings?.gross ?? r.base)}</HRTableCell>
                  <HRTableCell className="font-bold">{pkr(r.net)}</HRTableCell>
                </HRTableRow>
              ))}
          </HRTable>
        </HRCard>
      ) : tab === 'deductions' ? (
        <HRCard title="Deduction report">
          <div className="space-y-3 mb-6">
            {[
              ['Unpaid / absent', statutory.unpaidLeave],
              ['Late arrival', statutory.late],
              ['Loan recovery', statutory.loan],
              ['Other recoveries', summary.deductions],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between text-sm border-b border-[#F0F4F8] pb-2">
                <span className="text-[#7A8FA6] font-semibold">{label}</span>
                <span className="font-extrabold">{pkr(Number(value || 0))}</span>
              </div>
            ))}
          </div>
          <HRTable columns={['Employee', 'Attendance cut', 'Loan', 'Total deductions', 'Net']}>
            {register.map((r: any) => (
              <HRTableRow key={r.id}>
                <HRTableCell className="font-bold">{r.employee}</HRTableCell>
                <HRTableCell>{pkr(r.breakdown?.deductions?.attendanceCut || 0)}</HRTableCell>
                <HRTableCell>{pkr(r.breakdown?.deductions?.loan || 0)}</HRTableCell>
                <HRTableCell className="text-[#E74C3C]">{pkr(r.deductions)}</HRTableCell>
                <HRTableCell className="font-bold">{pkr(r.net)}</HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      ) : tab === 'tax' ? (
        <HRCard title="Tax & statutory report">
          <div className="space-y-3 mb-6">
            {[
              ['Income tax', statutory.tax],
              ['EOBI', statutory.eobi],
              ['Provident fund', statutory.providentFund],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between text-sm border-b border-[#F0F4F8] pb-2">
                <span className="text-[#7A8FA6] font-semibold">{label}</span>
                <span className="font-extrabold">{pkr(Number(value || 0))}</span>
              </div>
            ))}
          </div>
          <HRTable columns={['Employee', 'Income tax', 'EOBI', 'PF', 'Net']}>
            {register.map((r: any) => (
              <HRTableRow key={r.id}>
                <HRTableCell className="font-bold">{r.employee}</HRTableCell>
                <HRTableCell>{pkr(r.breakdown?.deductions?.incomeTax || r.breakdown?.deductions?.tax || 0)}</HRTableCell>
                <HRTableCell>{pkr(r.breakdown?.deductions?.eobi || 0)}</HRTableCell>
                <HRTableCell>{pkr(r.breakdown?.deductions?.providentFund || 0)}</HRTableCell>
                <HRTableCell className="font-bold">{pkr(r.net)}</HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      ) : (
        <HRCard title="Employee cost by department">
          {(summary.byDepartment || []).length === 0 ? (
            <p className="py-10 text-center text-xs text-[#7A8FA6]">Process a pay run to populate department cost.</p>
          ) : (
            <div className="space-y-3">
              {(summary.byDepartment || []).map((d: any) => (
                <div key={d.department} className="flex justify-between text-sm">
                  <span className="font-bold text-[#1A1A2E]">{d.department} · {d.headcount} employees</span>
                  <span className="font-extrabold text-[#2ECC71]">{pkr(d.net)}</span>
                </div>
              ))}
            </div>
          )}
        </HRCard>
      )}
    </HRPage>
  );
}
