'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  PlaneTakeoff,
  Fingerprint,
  Users,
  UserPlus,
  Plane,
  Wallet,
  MapPin,
  LogIn,
  LogOut as LogOutIcon,
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
import { hrDashboardService } from '@/lib/hr-employees-service';

const COLORS = {
  primary: '#014582',
  accent: '#0FA3E0',
  success: '#2ECC71',
  danger: '#E74C3C',
  warning: '#F39C12',
  purple: '#8E44AD',
};

const DEPT_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.accent, COLORS.purple, COLORS.danger];

// Quick actions — mirrors mobile _buildQuickActions
const QUICK_ACTIONS = [
  { label: 'Employees', href: '/hr/employees', icon: Users, color: COLORS.primary },
  { label: 'Add Employee', href: '/hr/add-employee', icon: UserPlus, color: COLORS.success },
  { label: 'Mark Attendance', href: '/hr/attendance', icon: Fingerprint, color: COLORS.accent },
  { label: 'Manage Leaves', href: '/hr/leaves', icon: Plane, color: COLORS.warning },
  { label: 'Salary build', href: '/hr/payroll', icon: Wallet, color: COLORS.purple },
  { label: 'Live Tracking', href: '/hr/live-tracking', icon: MapPin, color: COLORS.danger },
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

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function HRDashboardPage() {
  const [dateOffset, setDateOffset] = React.useState(0);
  const [stats, setStats] = React.useState({
    totalEmployees: 0,
    present: 0,
    late: 0,
    absent: 0,
    onLeave: 0,
    fieldStaff: 0,
    working: 0,
  });
  const [activities, setActivities] = React.useState<
    { name: string; action: string; time: string; icon: any; color: string; note: string }[]
  >([]);
  const [weekly, setWeekly] = React.useState<{ day: string; present: number; absent: number; leave: number }[]>([]);
  const [punctuality, setPunctuality] = React.useState<{ day: string; onTime: number; late: number }[]>([]);
  const [departments, setDepartments] = React.useState<{ name: string; value: number; color: string }[]>([]);
  const [liveCount, setLiveCount] = React.useState(0);
  const [typeSplit, setTypeSplit] = React.useState<{ label: string; value: number }[]>([]);

  const date = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d;
  }, [dateOffset]);
  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  });

  React.useEffect(() => {
    let mounted = true;
    const iso = isoDate(date);
    hrDashboardService
      .overview(iso)
      .then((data) => {
        if (!mounted) return;
        const total = Number(data.totalEmployees || 0);
        setStats({
          totalEmployees: total,
          present: Number(data.present || 0),
          late: Number(data.late || 0),
          absent: Number(data.absent || 0),
          onLeave: Number(data.onLeave || 0),
          fieldStaff: Number(data.fieldStaff || 0),
          working: Number(data.working || 0),
        });
        setLiveCount(Number(data.liveCount || 0));
        setTypeSplit([
          { label: 'Office', value: Number(data.officeStaff || 0) },
          { label: 'Field', value: Number(data.fieldStaff || 0) },
        ]);
        setDepartments(
          (data.departments || []).map((d: any, i: number) => ({
            name: d.name || 'Unassigned',
            value: Number(d.value || 0),
            color: DEPT_COLORS[i % DEPT_COLORS.length],
          }))
        );
        const week = Array.isArray(data.weekly) ? data.weekly : [];
        setWeekly(
          week.map((d: any) => ({
            day: d.day,
            present: Number(d.present || 0),
            absent: Number(d.absent || 0),
            leave: Number(d.leave || 0),
          }))
        );
        setPunctuality(
          week.map((d: any) => ({
            day: d.day,
            onTime: Number(d.onTime || 0),
            late: Number(d.late || 0),
          }))
        );
        setActivities(
          (data.attendance || []).slice(0, 8).map((row: any) => {
            const emp = row.employee || {};
            const checkedIn = Boolean(row.checkIn);
            const late = String(row.statusKey || '').toLowerCase() === 'late';
            return {
              name: emp.name || 'Employee',
              action: !checkedIn
                ? 'Absent'
                : late
                  ? 'Checked in (Late)'
                  : row.checkOut
                    ? 'Checked out'
                    : 'Checked in',
              time: row.checkIn
                ? new Date(row.checkIn).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—',
              icon: !checkedIn ? UserOff : late ? AlertTriangle : row.checkOut ? LogOutIcon : LogIn,
              color: !checkedIn ? COLORS.danger : late ? COLORS.warning : COLORS.success,
              note: row.source === 'geofence' ? 'Geofence' : row.status || '',
            };
          })
        );
      })
      .catch(() => {
        if (!mounted) return;
      });
    return () => {
      mounted = false;
    };
  }, [date]);

  const attendanceRate =
    stats.totalEmployees > 0
      ? Math.round((stats.present / stats.totalEmployees) * 100)
      : 0;

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
        <HRStatCard label="Present Today" value={stats.present} icon={UserCheck} color={COLORS.success} hint={`${stats.working} still working`} />
        <HRStatCard label="Absent" value={stats.absent} icon={UserX} color={COLORS.danger} hint={`${stats.late} late`} />
        <HRStatCard label="On Leave" value={stats.onLeave} icon={PlaneTakeoff} color={COLORS.warning} hint={`${stats.totalEmployees} employees`} />
        <HRStatCard label="Attendance Rate" value={`${attendanceRate}%`} icon={TrendingUp} color={COLORS.primary} hint="Today" />
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
              <AreaChart data={weekly} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
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
                  data={departments}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="60%"
                  outerRadius="88%"
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {departments.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-extrabold text-[#1A1A2E]">{stats.totalEmployees}</p>
              <p className="text-[10px] font-semibold text-[#7A8FA6]">Employees</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3">
            {departments.length === 0 ? (
              <p className="text-xs text-[#7A8FA6] text-center py-2">No employees yet</p>
            ) : (
              departments.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-[#7A8FA6]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                {d.name}
                <span className="ml-auto font-bold text-[#1A1A2E]">{d.value}</span>
              </div>
            ))
            )}
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
              <BarChart data={punctuality} margin={{ top: 5, right: 10, left: -18, bottom: 0 }} barCategoryGap="28%">
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
          title="Workforce mix"
          action={<span className="text-[10px] font-semibold text-[#7A8FA6]">Office vs field</span>}
        >
          <div className="h-56 flex flex-col justify-center gap-6 px-2">
            {typeSplit.map((row) => {
              const max = Math.max(1, typeSplit.reduce((s, r) => s + r.value, 0));
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#1A1A2E]">{row.label}</span>
                    <span className="text-xs font-semibold text-[#7A8FA6]">{row.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#F0F4F8] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(row.value / max) * 100}%`,
                        backgroundColor: row.label === 'Field' ? COLORS.warning : COLORS.primary,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {typeSplit.every((r) => r.value === 0) && (
              <p className="text-xs text-[#7A8FA6] text-center">Add employees to see this split.</p>
            )}
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
                <span className="text-[11px] text-[#7A8FA6] font-medium">
                  {liveCount} employee{liveCount === 1 ? '' : 's'} with last-known GPS
                </span>
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
            {activities.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#7A8FA6]">No attendance events yet today.</p>
            ) : (
              activities.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.name + a.time + a.action} className="flex items-center gap-3 py-2.5">
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
            })
            )}
          </div>
        </HRCard>
      </div>
    </HRPage>
  );
}

