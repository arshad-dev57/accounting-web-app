'use client';

import React from 'react';
import Link from 'next/link';
import { BarChart3, TrendingUp, Percent, Clock, FileText, Wallet, ArrowRight } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRStatCard, HRWorkflowNotice } from '../ui';
import { hrDashboardService } from '@/lib/hr-employees-service';

const COLORS = { success: '#2ECC71', warning: '#F39C12', primary: '#014582', danger: '#E74C3C' };
const DEPT_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, '#0FA3E0', '#8E44AD'];

const REPORT_LINKS = [
  { label: 'Payroll reports', href: '/hr/reports/payroll', icon: Wallet, desc: 'Summary, register, tax, deductions, employee cost' },
  { label: 'Attendance reports', href: '/hr/attendance/reports', icon: FileText, desc: 'Monthly register with filters and export' },
  { label: 'Analytics dashboard', href: '/hr/dashboard', icon: BarChart3, desc: 'Headcount, attendance trends, and department charts' },
];

export default function ReportsPage() {
  const [weekly, setWeekly] = React.useState<{ day: string; pct: number }[]>([]);
  const [departments, setDepartments] = React.useState<{ dept: string; count: number; color: string }[]>([]);
  const [avgAttendance, setAvgAttendance] = React.useState(0);
  const [lateCount, setLateCount] = React.useState(0);
  const [total, setTotal] = React.useState(0);

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

  const maxDept = Math.max(1, ...departments.map((d) => d.count));

  return (
    <HRPage>
      <HRPageHeader
        title="HR reports"
        subtitle="Workforce attendance insights and links to payroll reporting"
        backHref="/hr/dashboard"
      />
      <HRWorkflowNotice
        title="Reports & insights"
        detail="HR reports cover attendance analytics. Payroll reports (summary, register, tax, deductions) are in the Payroll Reports section."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {REPORT_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border border-[#DDE4EE] rounded-2xl p-4 hover:border-[#014582]/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 text-[#014582]" />
                <span className="text-sm font-extrabold text-[#1A1A2E]">{item.label}</span>
                <ArrowRight className="w-4 h-4 text-[#7A8FA6] ml-auto group-hover:text-[#014582]" />
              </div>
              <p className="text-xs text-[#7A8FA6]">{item.desc}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Avg attendance" value={`${avgAttendance}%`} icon={Percent} color={COLORS.success} hint="Last 7 days" />
        <HRStatCard label="Late today" value={lateCount} icon={Clock} color={COLORS.warning} hint="From attendance register" />
        <HRStatCard label="Employees" value={total} icon={BarChart3} color={COLORS.primary} hint="Active roster" />
        <HRStatCard label="Departments" value={departments.length} icon={TrendingUp} color={COLORS.danger} hint="From employee profiles" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HRCard title="Weekly attendance rate">
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

        <HRCard title="Department distribution">
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
    </HRPage>
  );
}
