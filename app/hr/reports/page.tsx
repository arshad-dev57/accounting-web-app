'use client';

import React from 'react';
import { BarChart3, TrendingUp, Percent, Clock, Download, Wallet, Banknote, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { HRPage, HRPageHeader, HRCard, HRStatCard, HRWorkflowNotice, HRTable, HRTableRow, HRTableCell } from '../ui';
import { hrDashboardService } from '@/lib/hr-employees-service';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

const COLORS = { success: '#2ECC71', warning: '#F39C12', primary: '#014582', danger: '#E74C3C' };
const DEPT_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, '#0FA3E0', '#8E44AD'];
const pkr = (n: number) =>
  `Rs ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function ReportsPage() {
  const [tab, setTab] = React.useState<'attendance' | 'payroll'>('payroll');
  const [period, setPeriod] = React.useState(currentPeriod());
  const [weekly, setWeekly] = React.useState<{ day: string; pct: number }[]>([]);
  const [departments, setDepartments] = React.useState<{ dept: string; count: number; color: string }[]>([]);
  const [avgAttendance, setAvgAttendance] = React.useState(0);
  const [lateCount, setLateCount] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [payroll, setPayroll] = React.useState<any>(null);
  const [loadingPay, setLoadingPay] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    hrDashboardService
      .overview()
      .then((data) => {
        if (!mounted) return;
        const headcount = Number(data.totalEmployees || 0);
        setTotal(headcount);
        setDepartments(
          (data.departments || []).map((d: any, i: number) => ({
            dept: d.name || 'Unassigned',
            count: Number(d.value || 0),
            color: DEPT_COLORS[i % DEPT_COLORS.length],
          }))
        );
        const week = Array.isArray(data.weekly) ? data.weekly : [];
        const days = week.map((d: any) => ({
          day: d.day,
          pct: headcount > 0 ? Math.round((Number(d.present || 0) / headcount) * 100) : 0,
        }));
        setWeekly(days);
        setAvgAttendance(days.length ? Math.round(days.reduce((s: number, d: any) => s + d.pct, 0) / days.length) : 0);
        const today = week[week.length - 1];
        setLateCount(Number(today?.late || 0));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const loadPayroll = React.useCallback(async (p = period) => {
    setLoadingPay(true);
    try {
      setPayroll(await hrWorkforceService.payrollReport(p));
    } catch (error: any) {
      toast.error(error.message || 'Failed to load payroll report');
    } finally {
      setLoadingPay(false);
    }
  }, [period]);

  React.useEffect(() => {
    loadPayroll(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxDept = Math.max(1, ...departments.map((d) => d.count));
  const summary = payroll?.summary || {};
  const statutory = summary.statutory || {};
  const register = payroll?.register || [];

  const exportPayroll = () => {
    const header = ['Employee', 'Code', 'Department', 'Gross', 'Deductions', 'Net', 'Status'];
    const lines = register.map((r: any) =>
      [r.employee, r.employeeCode, r.department, r.breakdown?.earnings?.gross ?? r.base, r.deductions, r.net, r.status].join(',')
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <HRPage>
      <HRPageHeader
        title="HR Reports & Analytics"
        subtitle="Attendance, payroll register, statutory totals and period variance"
        backHref="/hr/dashboard"
        actions={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={period}
              onChange={(e) => {
                const next = e.target.value;
                setPeriod(next);
                loadPayroll(next);
              }}
              className="bg-white/15 text-white rounded-lg px-2 py-2 text-xs font-bold border border-white/20"
            />
            <button
              type="button"
              onClick={exportPayroll}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold"
            >
              <Download className="w-4 h-4" /> Export payroll
            </button>
          </div>
        }
      />
      <HRWorkflowNotice
        title="Standard HR reporting pack"
        detail="Payroll reports use processed pay runs only. Process Payroll for the selected month, then use this pack for register, department cost, statutory deductions and month-on-month variance."
      />

      <div className="flex gap-2 mb-6">
        {[
          { id: 'payroll', label: 'Payroll pack' },
          { id: 'attendance', label: 'Attendance pack' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${tab === t.id ? 'bg-[#014582] text-white' : 'bg-white border border-[#DDE4EE] text-[#7A8FA6]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'payroll' ? (
        loadingPay ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#014582]" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <HRStatCard label="Gross payroll" value={pkr(summary.gross || 0)} icon={Wallet} color={COLORS.primary} hint={payroll?.periodLabel} />
              <HRStatCard label="Net payable" value={pkr(summary.net || 0)} icon={Banknote} color={COLORS.success} />
              <HRStatCard label="Statutory + recoveries" value={pkr(summary.deductions || 0)} icon={Wallet} color={COLORS.danger} />
              <HRStatCard
                label="Vs previous month"
                value={pkr(summary.variance || 0)}
                icon={AlertTriangle}
                color={COLORS.warning}
                hint={payroll?.previousPeriodLabel || 'Previous period'}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <HRCard title="Statutory deductions">
                <div className="space-y-3">
                  {[
                    ['Income tax', statutory.tax],
                    ['EOBI', statutory.eobi],
                    ['Provident fund', statutory.providentFund],
                    ['Unpaid / absent', statutory.unpaidLeave],
                    ['Late arrival', statutory.late],
                    ['Loan recovery', statutory.loan],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between text-sm border-b border-[#F0F4F8] pb-2">
                      <span className="text-[#7A8FA6] font-semibold">{label}</span>
                      <span className="font-extrabold">{pkr(Number(value || 0))}</span>
                    </div>
                  ))}
                </div>
              </HRCard>
              <HRCard title="Department cost">
                {(summary.byDepartment || []).length === 0 ? (
                  <p className="py-10 text-center text-xs text-[#7A8FA6]">Process a pay run to populate this report.</p>
                ) : (
                  <div className="space-y-3">
                    {(summary.byDepartment || []).map((d: any) => (
                      <div key={d.department} className="flex justify-between text-sm">
                        <span className="font-bold text-[#1A1A2E]">{d.department} · {d.headcount}</span>
                        <span className="font-extrabold text-[#2ECC71]">{pkr(d.net)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </HRCard>
            </div>

            <HRCard title="Payroll register" action={<span className="text-[10px] font-bold text-[#7A8FA6]">{register.length} employees</span>}>
              <HRTable columns={['Employee', 'Department', 'Gross', 'Deductions', 'Net', 'Status']}>
                {register.length === 0 && (
                  <HRTableRow><HRTableCell className="text-[#7A8FA6]">No payroll for this period</HRTableCell></HRTableRow>
                )}
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
          </>
        )
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <HRStatCard label="Avg Attendance" value={`${avgAttendance}%`} icon={Percent} color={COLORS.success} hint="Last 7 days" />
            <HRStatCard label="Late today" value={lateCount} icon={Clock} color={COLORS.warning} hint="From attendance register" />
            <HRStatCard label="Employees" value={total} icon={BarChart3} color={COLORS.primary} hint="Active roster" />
            <HRStatCard label="Departments" value={departments.length} icon={TrendingUp} color={COLORS.danger} hint="From employee profiles" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HRCard title="Weekly Attendance Rate">
              {weekly.length === 0 ? (
                <p className="py-10 text-center text-xs text-[#7A8FA6]">No attendance yet.</p>
              ) : (
                <div className="flex items-end justify-between gap-2 h-44">
                  {weekly.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[9px] font-bold text-[#7A8FA6]">{d.pct}%</span>
                      <div
                        className="w-full rounded-t-lg bg-[#014582] transition-all"
                        style={{ height: `${Math.max(6, d.pct)}%` }}
                      />
                      <span className="text-[10px] font-bold text-[#1A1A2E]">{d.day}</span>
                    </div>
                  ))}
                </div>
              )}
            </HRCard>

            <HRCard title="Department Distribution">
              {departments.length === 0 ? (
                <p className="py-10 text-center text-xs text-[#7A8FA6]">Add employees to see departments.</p>
              ) : (
                <div className="space-y-4">
                  {departments.map((d) => (
                    <div key={d.dept}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#1A1A2E]">{d.dept}</span>
                        <span className="text-xs font-semibold text-[#7A8FA6]">{d.count} employees</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[#F0F4F8] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(d.count / maxDept) * 100}%`, backgroundColor: d.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </HRCard>
          </div>
        </>
      )}
    </HRPage>
  );
}
