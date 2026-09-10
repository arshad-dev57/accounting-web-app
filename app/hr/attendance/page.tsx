'use client';

import React from 'react';
import { CalendarDays, Fingerprint, MapPin, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRStatCard,
  HRToolbar,
  HRWorkflowNotice,
  HRAvatar,
  HRFilterChips,
  HRStatusBadge,
  HRTable,
  HRTableRow,
  HRTableCell,
} from '../ui';
import { hrDashboardService } from '@/lib/hr-employees-service';
import { hrHcmService } from '@/lib/hr-hcm-service';

const COLORS = {
  primary: '#014582',
  success: '#2ECC71',
  danger: '#E74C3C',
  warning: '#F39C12',
};

const FILTERS = ['All', 'Present', 'Late', 'Absent'];

function fmtTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function fmtHours(minutes?: number) {
  const m = Number(minutes || 0);
  if (m <= 0) return '—';
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return `${h}h ${String(rest).padStart(2, '0')}m`;
}

export default function AttendancePage() {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState<any>({});
  const [dateOffset, setDateOffset] = React.useState(0);

  const date = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d;
  }, [dateOffset]);
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    hrDashboardService
      .attendance(iso)
      .then((data) => {
        if (mounted) setRows(data);
      })
      .catch(() => {
        if (mounted) setRows([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    hrHcmService.attendanceSummary(iso).then((body) => {
      if (mounted) setSummary(body.summary || {});
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, [iso]);

  const mapped = rows.map((row) => {
    const emp = row.employee || {};
    return {
      id: row.id || emp.employeeCode || row.employeeId,
      name: emp.name || 'Employee',
      office: emp.office || '—',
      shift: emp.shift || '—',
      checkIn: fmtTime(row.checkIn),
      checkOut: fmtTime(row.checkOut),
      worked: fmtHours(row.workingMinutes),
      status: row.status || 'Absent',
    };
  });

  const filtered = mapped.filter(
    (a) =>
      (filter === 'All' || a.status === filter) &&
      `${a.name} ${a.id}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <HRPage>
      <HRPageHeader
        title="Employee Attendance"
        subtitle="Check-in / check-out from the database"
        backHref="/hr/dashboard"
        actions={
          <span className="text-[10px] font-bold text-white/80 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> {dateLabel}
          </span>
        }
      />

      <div className="bg-white rounded-xl border border-[#DDE4EE] px-4 py-3 flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={() => setDateOffset((v) => v - 1)}
          className="w-8 h-8 rounded-lg bg-[#F0F4F8] flex items-center justify-center hover:bg-[#014582]/10 transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-[#014582]" />
        </button>
        <p className="text-sm font-bold text-[#1A1A2E]">{dateLabel}</p>
        <button
          type="button"
          onClick={() => setDateOffset((v) => v + 1)}
          className="w-8 h-8 rounded-lg bg-[#F0F4F8] flex items-center justify-center hover:bg-[#014582]/10 transition-all"
        >
          <ChevronRight className="w-4 h-4 text-[#014582]" />
        </button>
      </div>

      <HRWorkflowNotice
        tone="green"
        title="Geofence attendance"
        detail="Employees are marked present when they enter the office radius, and checked out when they leave. This list is live from the server — not sample data."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard
          label="Present"
          value={mapped.filter((a) => a.status === 'Present').length}
          icon={Fingerprint}
          color={COLORS.success}
        />
        <HRStatCard
          label="Late"
          value={mapped.filter((a) => a.status === 'Late').length}
          icon={Fingerprint}
          color={COLORS.warning}
        />
        <HRStatCard
          label="Absent"
          value={mapped.filter((a) => a.status === 'Absent').length}
          icon={Fingerprint}
          color={COLORS.danger}
        />
        <HRStatCard
          label="Records"
          value={mapped.length}
          icon={Fingerprint}
          color={COLORS.primary}
        />
        <HRStatCard label="On leave" value={summary.onLeave || 0} icon={Fingerprint} color={COLORS.warning} hint="Approved leave" />
        <HRStatCard label="Missing checkout" value={summary.missingCheckout || 0} icon={Fingerprint} color={COLORS.danger} hint="Still open" />
        <HRStatCard label="Half day" value={summary.halfDay || 0} icon={Fingerprint} color={COLORS.accent || '#0FA3E0'} />
        <HRStatCard label="Headcount" value={summary.headcount || 0} icon={Fingerprint} color={COLORS.primary} hint="Active roster" />
      </div>

      <HRToolbar
        search={query}
        setSearch={setQuery}
        placeholder="Search employee..."
        filters={<HRFilterChips options={FILTERS} value={filter} onChange={setFilter} />}
      />

      <HRCard title="Daily attendance register">
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#014582]" />
          </div>
        ) : (
          <HRTable columns={['ID', 'Employee', 'Shift & location', 'Check in', 'Check out', 'Worked', 'Status']}>
            {filtered.map((a) => (
              <HRTableRow key={a.id}>
                <HRTableCell className="font-mono text-xs text-[#7A8FA6]">{a.id}</HRTableCell>
                <HRTableCell className="font-bold">
                  <span className="flex items-center gap-2">
                    <HRAvatar name={a.name} />
                    {a.name}
                  </span>
                </HRTableCell>
                <HRTableCell>
                  <p className="text-xs font-semibold">{a.shift}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#7A8FA6]">
                    <MapPin className="w-3 h-3" />
                    {a.office}
                  </p>
                </HRTableCell>
                <HRTableCell>
                  <span className={a.status === 'Late' ? 'font-bold text-[#F39C12]' : ''}>
                    {a.checkIn}
                  </span>
                </HRTableCell>
                <HRTableCell>{a.checkOut}</HRTableCell>
                <HRTableCell className="font-semibold">{a.worked}</HRTableCell>
                <HRTableCell>
                  <HRStatusBadge status={a.status} />
                </HRTableCell>
              </HRTableRow>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#7A8FA6]">
                  No attendance records for today yet.
                </td>
              </tr>
            )}
          </HRTable>
        )}
      </HRCard>
    </HRPage>
  );
}
