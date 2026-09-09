'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  PlaneTakeoff,
  Clock,
  Fingerprint,
  Users,
  UserPlus,
  Plane,
  Wallet,
  MapPin,
  LogIn,
  LogOut as LogOutIcon,
  Coffee,
  AlertTriangle,
  UserX as UserOff,
  ArrowRight,
  TrendingUp,
  CalendarRange,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { HRPage, HRPageHeader, HRStatCard, HRCard } from '../ui';

const COLORS = {
  primary: '#014582',
  accent: '#0FA3E0',
  success: '#2ECC71',
  danger: '#E74C3C',
  warning: '#F39C12',
  purple: '#8E44AD',
};

// ─────────────────────────────────────────────────────────────
// MOCK ANALYTICS (mirrors mobile app data)
// ─────────────────────────────────────────────────────────────
const WEEKLY_ATTENDANCE = [
  { day: 'Mon', present: 34, absent: 3, leave: 5 },
  { day: 'Tue', present: 36, absent: 2, leave: 4 },
  { day: 'Wed', present: 35, absent: 4, leave: 3 },
  { day: 'Thu', present: 33, absent: 2, leave: 7 },
  { day: 'Fri', present: 37, absent: 1, leave: 4 },
  { day: 'Sat', present: 28, absent: 2, leave: 3 },
  { day: 'Sun', present: 12, absent: 0, leave: 2 },
];

const PUNCTUALITY = [
  { day: 'Mon', onTime: 30, late: 4 },
  { day: 'Tue', onTime: 33, late: 3 },
  { day: 'Wed', onTime: 31, late: 4 },
  { day: 'Thu', onTime: 29, late: 4 },
  { day: 'Fri', onTime: 34, late: 3 },
  { day: 'Sat', onTime: 26, late: 2 },
];

const DEPARTMENT_DIST = [
  { name: 'IT', value: 14, color: COLORS.primary },
  { name: 'Sales', value: 11, color: COLORS.success },
  { name: 'HR', value: 6, color: COLORS.warning },
  { name: 'Finance', value: 4, color: COLORS.accent },
];

const PAYROLL_TREND = [
  { month: 'Apr', amount: 24100 },
  { month: 'May', amount: 24800 },
  { month: 'Jun', amount: 23900 },
  { month: 'Jul', amount: 25300 },
  { month: 'Aug', amount: 26100 },
  { month: 'Sep', amount: 26293 },
];

// Quick actions — mirrors mobile _buildQuickActions
const QUICK_ACTIONS = [
  { label: 'Employees', href: '/hr/employees', icon: Users, color: COLORS.primary },
  { label: 'Add Employee', href: '/hr/add-employee', icon: UserPlus, color: COLORS.success },
  { label: 'Mark Attendance', href: '/hr/attendance', icon: Fingerprint, color: COLORS.accent },
  { label: 'Manage Leaves', href: '/hr/leaves', icon: Plane, color: COLORS.warning },
  { label: 'Payroll', href: '/hr/payroll', icon: Wallet, color: COLORS.purple },
  { label: 'Live Tracking', href: '/hr/live-tracking', icon: MapPin, color: COLORS.danger },
];

// Recent activity — mirrors mobile _buildRecentActivity
const ACTIVITIES = [
  { name: 'Ahmed Khan', action: 'Checked in', time: '09:03 AM', icon: LogIn, color: COLORS.success, note: '✅ Auto Geofence' },
  { name: 'Sara Ali', action: 'Checked in (Late)', time: '09:25 AM', icon: AlertTriangle, color: COLORS.warning, note: '⚠️ 25 min late' },
  { name: 'Ali Raza', action: 'Absent', time: '11:00 AM', icon: UserOff, color: COLORS.danger, note: '❌ No check-in' },
  { name: 'Usman Sheikh', action: 'Started Break', time: '01:05 PM', icon: Coffee, color: '#2563EB', note: '⏸️ Break started' },
  { name: 'Fatima Noor', action: 'Checked out', time: '06:05 PM', icon: LogOutIcon, color: COLORS.purple, note: '✅ Auto checkout' },
];

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #DDE4EE',
  borderRadius: '10px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#1A1A2E',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export default function HRDashboardPage() {
  const [dateOffset, setDateOffset] = React.useState(0);
  const date = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d;
  }, [dateOffset]);
  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  });

  const attendanceRate = Math.round(
    (WEEKLY_ATTENDANCE.reduce((s, d) => s + d.present, 0) /
      WEEKLY_ATTENDANCE.reduce((s, d) => s + d.present + d.absent + d.leave, 0)) *
      100
  );

  return (
    <HRPage>
      <HRPageHeader
        title="HR Dashboard"
        subtitle={dateLabel}
        actions={
          <Link
            href="/hr/notifications"
            className="relative w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-all"
          >
            <Fingerprint className="w-4 h-4 text-white" />
            <span className="absolute right-1.5 top-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
        }
      />

      {/* Date selector — mirrors mobile _buildDateSelector */}
      <div className="bg-white rounded-xl border border-[#DDE4EE] px-4 py-3 flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={() => setDateOffset((v) => v - 1)}
          className="w-8 h-8 rounded-lg bg-[#F0F4F8] flex items-center justify-center hover:bg-[#014582]/10 transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-[#014582]" />
        </button>
        <p className="text-sm font-bold text-[#1A1A2E] flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-[#014582]" />
          {dateLabel}
        </p>
        <button
          type="button"
          onClick={() => setDateOffset((v) => v + 1)}
          className="w-8 h-8 rounded-lg bg-[#F0F4F8] flex items-center justify-center hover:bg-[#014582]/10 transition-all"
        >
          <ChevronRight className="w-4 h-4 text-[#014582]" />
        </button>
      </div>

      {/* Stats grid — mirrors mobile _buildStatsGrid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Present Today" value="34" icon={UserCheck} color={COLORS.success} hint="▲ 4 vs yesterday" />
        <HRStatCard label="Absent" value="3" icon={UserX} color={COLORS.danger} hint="▼ 1 vs yesterday" />
        <HRStatCard label="On Leave" value="5" icon={PlaneTakeoff} color={COLORS.warning} hint="2 pending approval" />
        <HRStatCard label="Attendance Rate" value={`${attendanceRate}%`} icon={TrendingUp} color={COLORS.primary} hint="This week avg" />
      </div>

      {/* CHART ROW 1 — attendance trend + department donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <HRCard
          title="Weekly Attendance Trend"
          action={<span className="text-[10px] font-semibold text-[#7A8FA6]">Last 7 days</span>}
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_ATTENDANCE} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={COLORS.success} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gLeave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.warning} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.warning} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.danger} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.danger} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EE" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#7A8FA6', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7A8FA6' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#014582', strokeOpacity: 0.12, strokeWidth: 28 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#7A8FA6' }} />
                <Area type="monotone" dataKey="present" name="Present" stroke={COLORS.success} strokeWidth={2.5} fill="url(#gPresent)" />
                <Area type="monotone" dataKey="leave" name="On Leave" stroke={COLORS.warning} strokeWidth={2} fill="url(#gLeave)" />
                <Area type="monotone" dataKey="absent" name="Absent" stroke={COLORS.danger} strokeWidth={2} fill="url(#gAbsent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </HRCard>

        <HRCard title="Department Distribution">
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEPARTMENT_DIST}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="60%"
                  outerRadius="88%"
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {DEPARTMENT_DIST.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-extrabold text-[#1A1A2E]">35</p>
              <p className="text-[10px] font-semibold text-[#7A8FA6]">Employees</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3">
            {DEPARTMENT_DIST.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-[#7A8FA6]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                {d.name}
                <span className="ml-auto font-bold text-[#1A1A2E]">{d.value}</span>
              </div>
            ))}
          </div>
        </HRCard>
      </div>

      {/* Quick actions — mirrors mobile _buildQuickActions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {QUICK_ACTIONS.map((qa) => {
          const Icon = qa.icon;
          return (
            <Link
              key={qa.href}
              href={qa.href}
              className="bg-white rounded-xl p-4 shadow-sm border border-[#DDE4EE] flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${qa.color}1A` }}
              >
                <Icon className="w-5 h-5" style={{ color: qa.color }} />
              </div>
              <span className="text-[11px] font-bold text-[#1A1A2E] text-center leading-tight">
                {qa.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* CHART ROW 2 — punctuality + payroll trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <HRCard
          title="Punctuality Breakdown"
          action={<span className="text-[10px] font-semibold text-[#7A8FA6]">On-time vs late arrivals</span>}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PUNCTUALITY} margin={{ top: 5, right: 10, left: -18, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EE" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#7A8FA6', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7A8FA6' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#014582', fillOpacity: 0.05 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#7A8FA6' }} />
                <Bar dataKey="onTime" name="On Time" stackId="a" fill={COLORS.success} radius={[0, 0, 4, 4]} />
                <Bar dataKey="late" name="Late" stackId="a" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </HRCard>

        <HRCard
          title="Payroll Cost Trend"
          action={<Link href="/hr/payroll" className="text-[11px] font-semibold text-[#014582]">View Payroll</Link>}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PAYROLL_TREND} margin={{ top: 5, right: 10, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPayroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EE" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7A8FA6', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#7A8FA6' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`$${Number(value).toLocaleString('en-US')}`, 'Total Payroll']}
                  cursor={{ stroke: '#014582', strokeOpacity: 0.15, strokeWidth: 28 }}
                />
                <Area type="monotone" dataKey="amount" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#gPayroll)">
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </HRCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live tracking — mirrors mobile _buildLiveTrackingCard */}
        <HRCard>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-7 h-7 text-[#2ECC71]" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-[#1A1A2E]">Live Employee Tracking</h3>
              <p className="text-xs text-[#7A8FA6] font-medium mt-1">
                Real-time GPS tracking of field employees
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 bg-[#2ECC71] rounded-full animate-pulse" />
                <span className="text-[11px] text-[#7A8FA6] font-medium">24 employees active</span>
              </div>
            </div>
            <Link
              href="/hr/live-tracking"
              className="bg-[#014582] text-white px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-[#014582]/90 transition-all"
            >
              View Live Map
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </HRCard>

        {/* Recent activity — mirrors mobile _buildRecentActivity */}
        <HRCard
          title="Recent Activity"
          action={
            <Link href="/hr/attendance" className="text-[11px] font-semibold text-[#014582]">
              View All
            </Link>
          }
        >
          <div className="divide-y divide-[#DDE4EE]/60">
            {ACTIVITIES.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.name + a.time} className="flex items-center gap-3 py-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${a.color}1A` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1A1A2E]">{a.name}</p>
                    <p className="text-[11px] text-[#7A8FA6] font-medium">
                      {a.action}{' '}
                      <span className="text-[9px] font-semibold" style={{ color: a.color }}>
                        {a.note}
                      </span>
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#7A8FA6]">{a.time}</span>
                </div>
              );
            })}
          </div>
        </HRCard>
      </div>
    </HRPage>
  );
}

