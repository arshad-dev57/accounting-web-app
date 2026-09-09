'use client';

import React from 'react';
import { BarChart3, TrendingUp, Percent, Clock, Download, SlidersHorizontal } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRStatCard, HRActionButton, HRWorkflowNotice } from '../ui';

const COLORS = { success: '#2ECC71', warning: '#F39C12', primary: '#014582', danger: '#E74C3C' };

const WEEKLY_ATTENDANCE = [
  { day: 'Mon', pct: 94 },
  { day: 'Tue', pct: 96 },
  { day: 'Wed', pct: 91 },
  { day: 'Thu', pct: 88 },
  { day: 'Fri', pct: 95 },
  { day: 'Sat', pct: 72 },
  { day: 'Sun', pct: 30 },
];

const DEPARTMENT_DISTRIBUTION = [
  { dept: 'IT', count: 14, color: COLORS.primary },
  { dept: 'Sales', count: 11, color: COLORS.success },
  { dept: 'HR', count: 6, color: COLORS.warning },
  { dept: 'Finance', count: 4, color: COLORS.danger },
];

export default function ReportsPage() {
  return (
    <HRPage>
      <HRPageHeader
        title="HR Reports & Analytics"
        subtitle="Workforce insights for September 2026"
        backHref="/hr/dashboard"
        actions={<button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold"><Download className="w-4 h-4" /> Export report</button>}
      />
      <HRWorkflowNotice title="Live report prototype" detail="The final flow will let HR select a date range, company, office, department, and shift before exporting a drill-down report." action={<HRActionButton variant="ghost" icon={SlidersHorizontal}>Configure view</HRActionButton>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Avg Attendance" value="91.2%" icon={Percent} color={COLORS.success} hint="▲ 2.1% vs last month" />
        <HRStatCard label="Avg Late Arrival" value="12 min" icon={Clock} color={COLORS.warning} hint="▼ 3 min improved" />
        <HRStatCard label="Overtime Hours" value="11h" icon={BarChart3} color={COLORS.primary} hint="This month" />
        <HRStatCard label="Attrition Rate" value="1.8%" icon={TrendingUp} color={COLORS.danger} hint="Quarterly" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HRCard title="Weekly Attendance Rate">
          <div className="flex items-end justify-between gap-2 h-44">
            {WEEKLY_ATTENDANCE.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[9px] font-bold text-[#7A8FA6]">{d.pct}%</span>
                <div
                  className="w-full rounded-t-lg bg-[#014582] transition-all"
                  style={{ height: `${d.pct}%` }}
                />
                <span className="text-[10px] font-bold text-[#1A1A2E]">{d.day}</span>
              </div>
            ))}
          </div>
        </HRCard>

        <HRCard title="Department Distribution">
          <div className="space-y-4">
            {DEPARTMENT_DISTRIBUTION.map((d) => (
              <div key={d.dept}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1A1A2E]">{d.dept}</span>
                  <span className="text-xs font-semibold text-[#7A8FA6]">{d.count} employees</span>
                </div>
                <div className="h-2.5 rounded-full bg-[#F0F4F8] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(d.count / 35) * 100}%`, backgroundColor: d.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </HRCard>
      </div>
    </HRPage>
  );
}
