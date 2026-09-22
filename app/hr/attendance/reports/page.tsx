'use client';

import React from 'react';
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Printer,
  Search,
  CalendarRange,
  User,
  Building2,
  Fingerprint,
  Clock,
  Palmtree,
} from 'lucide-react';
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
  HRStatusBadge,
} from '../../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';
import { hrEmployeesService } from '@/lib/hr-employees-service';

const COLORS = { primary: '#014582', success: '#2ECC71', danger: '#E74C3C', warning: '#F39C12' };

type ReportRow = {
  date: string;
  dayName: string;
  employeeId: string;
  employeeCode: string;
  employee: string;
  department: string;
  designation: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  workingMinutes: number;
  source: string | null;
};

type ReportData = {
  from: string;
  to: string;
  dayCount: number;
  employeeCount: number;
  employee: { id: string; employeeCode: string; name: string; department: string } | null;
  summary: {
    totalDays: number;
    present: number;
    late: number;
    absent: number;
    halfDay: number;
    onLeave: number;
    holiday: number;
    weekend: number;
    missingCheckout: number;
    totalWorkingMinutes: number;
    avgWorkingMinutes: number;
  };
  rows: ReportRow[];
};

const PRESETS = [
  { id: 'this_week', label: 'This week' },
  { id: 'last_week', label: 'Last week' },
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'custom', label: 'Custom range' },
] as const;

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function presetRange(preset: string): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (preset === 'this_week') {
    const start = new Date(today);
    const dow = start.getDay();
    start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));
    return { from: fmtDate(start), to: fmtDate(today) };
  }
  if (preset === 'last_week') {
    const end = new Date(today);
    const dow = end.getDay();
    end.setDate(end.getDate() - (dow === 0 ? 6 : dow - 1) - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { from: fmtDate(start), to: fmtDate(end) };
  }
  if (preset === 'this_month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: fmtDate(start), to: fmtDate(today) };
  }
  if (preset === 'last_month') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: fmtDate(start), to: fmtDate(end) };
  }
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  return { from: fmtDate(start), to: fmtDate(today) };
}

function fmtTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtHours(minutes?: number) {
  const m = Number(minutes || 0);
  if (m <= 0) return '—';
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return `${h}h ${String(rest).padStart(2, '0')}m`;
}

function statusTone(status: string) {
  if (status === 'Present') return 'Active';
  if (status === 'Late') return 'Pending';
  if (status === 'Absent') return 'Inactive';
  if (status === 'On leave') return 'On Leave';
  return status;
}

function csvEscape(v: unknown) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function AttendanceReportsPage() {
  const [preset, setPreset] = React.useState<(typeof PRESETS)[number]['id']>('this_month');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [employeeId, setEmployeeId] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [report, setReport] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    hrEmployeesService.list().then(setEmployees).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (preset === 'custom') return;
    const r = presetRange(preset);
    setFrom(r.from);
    setTo(r.to);
  }, [preset]);

  React.useEffect(() => {
    const r = presetRange('this_month');
    setFrom(r.from);
    setTo(r.to);
  }, []);

  const departments = React.useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  const generate = async () => {
    if (!from || !to) {
      toast.error('Select a date range');
      return;
    }
    setLoading(true);
    try {
      const data = await hrHcmService.attendanceReport({
        from,
        to,
        employeeId: employeeId || undefined,
        department: department || undefined,
      });
      setReport(data as ReportData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = React.useMemo(() => {
    if (!report?.rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return report.rows;
    return report.rows.filter(
      (r) =>
        r.employee.toLowerCase().includes(q) ||
        r.employeeCode.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.date.includes(q)
    );
  }, [report, query]);

  const downloadCsv = () => {
    if (!report?.rows?.length) {
      toast.error('Generate a report first');
      return;
    }
    const multi = !employeeId;
    const header = multi
      ? ['Date', 'Day', 'Employee Code', 'Employee', 'Department', 'Designation', 'Status', 'Check In', 'Check Out', 'Worked', 'Source']
      : ['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Worked', 'Source'];
    const lines = filteredRows.map((r) =>
      (multi
        ? [r.date, r.dayName, r.employeeCode, r.employee, r.department, r.designation, r.status, fmtTime(r.checkIn), fmtTime(r.checkOut), fmtHours(r.workingMinutes), r.source || '']
        : [r.date, r.dayName, r.status, fmtTime(r.checkIn), fmtTime(r.checkOut), fmtHours(r.workingMinutes), r.source || '']
      ).map(csvEscape).join(',')
    );
    const label = report.employee
      ? `${report.employee.employeeCode}-${report.from}-to-${report.to}`
      : `all-employees-${report.from}-to-${report.to}`;
    const blob = new Blob(['\uFEFF', [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const printReport = () => {
    if (!report) {
      toast.error('Generate a report first');
      return;
    }
    window.print();
  };

  const summary = report?.summary;

  return (
    <HRPage>
      <HRPageHeader
        title="Attendance Reports"
        subtitle="Monthly, weekly, or custom attendance register with export"
        backHref="/hr/attendance"
        actions={
          report ? (
            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={downloadCsv}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                type="button"
                onClick={printReport}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
          ) : undefined
        }
      />

      <HRWorkflowNotice
        title="Professional attendance register"
        detail="Pick an employee or all staff, choose weekly/monthly/custom dates, generate the report, then download CSV or print. Leave and holidays are included in status classification."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:hidden">
        <HRCard title="Report filters" className="xl:col-span-1">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-[#7A8FA6] mb-2">Period</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      preset === p.id
                        ? 'bg-[#014582] text-white border-[#014582]'
                        : 'bg-white text-[#7A8FA6] border-[#DDE4EE] hover:border-[#014582]/30'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-bold text-[#7A8FA6]">
                From
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setPreset('custom');
                    setFrom(e.target.value);
                  }}
                  className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-bold text-[#7A8FA6]">
                To
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setPreset('custom');
                    setTo(e.target.value);
                  }}
                  className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm"
                />
              </label>
            </div>

            <label className="block text-xs font-bold text-[#7A8FA6]">
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Employee</span>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm"
              >
                <option value="">All employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.employeeCode} — {e.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-[#7A8FA6]">
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Department (optional)</span>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm"
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => void generate()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#014582] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              {loading ? 'Generating…' : 'Generate report'}
            </button>
          </div>
        </HRCard>

        <div className="xl:col-span-2 space-y-6">
          {report && summary && (
            <>
              <div className="bg-white rounded-xl border border-[#DDE4EE] px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
                <CalendarRange className="w-4 h-4 text-[#014582]" />
                <span className="font-bold text-[#1A1A2E]">
                  {report.from} → {report.to}
                </span>
                <span className="text-[#7A8FA6]">· {report.dayCount} days</span>
                {report.employee ? (
                  <span className="text-[#7A8FA6]">
                    · {report.employee.employeeCode} — {report.employee.name}
                  </span>
                ) : (
                  <span className="text-[#7A8FA6]">· {report.employeeCount} employees</span>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <HRStatCard label="Present" value={summary.present} icon={Fingerprint} color={COLORS.success} />
                <HRStatCard label="Late" value={summary.late} icon={Clock} color={COLORS.warning} />
                <HRStatCard label="Absent" value={summary.absent} icon={Fingerprint} color={COLORS.danger} />
                <HRStatCard label="On leave" value={summary.onLeave} icon={Palmtree} color={COLORS.primary} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <HRStatCard label="Half day" value={summary.halfDay} icon={Clock} color={COLORS.warning} />
                <HRStatCard label="Holiday / Weekend" value={summary.holiday + summary.weekend} icon={CalendarRange} color={COLORS.primary} />
                <HRStatCard label="Total hours" value={fmtHours(summary.totalWorkingMinutes)} icon={Clock} color={COLORS.success} />
                <HRStatCard label="Avg / working day" value={fmtHours(summary.avgWorkingMinutes)} icon={Clock} color={COLORS.primary} />
              </div>
            </>
          )}

          <HRCard
            title="Attendance register"
            action={
              report ? (
                <div className="relative w-48 print:hidden">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter rows…"
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#DDE4EE] text-xs"
                  />
                </div>
              ) : null
            }
          >
            {!report ? (
              <div className="py-16 text-center text-sm text-[#7A8FA6]">
                Select filters and click <b>Generate report</b> to preview attendance.
              </div>
            ) : loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#014582]" />
              </div>
            ) : (
              <div className="overflow-x-auto" id="attendance-report-table">
                <HRTable
                  columns={
                    employeeId
                      ? ['Date', 'Day', 'Status', 'Check in', 'Check out', 'Worked', 'Source']
                      : ['Date', 'Employee', 'Department', 'Status', 'Check in', 'Check out', 'Worked']
                  }
                >
                  {filteredRows.length === 0 && (
                    <HRTableRow>
                      <HRTableCell className="text-[#7A8FA6]">No rows match your filter</HRTableCell>
                    </HRTableRow>
                  )}
                  {filteredRows.map((r) => (
                    <HRTableRow key={`${r.employeeId}-${r.date}`}>
                      <HRTableCell className="font-mono text-xs">{r.date}</HRTableCell>
                      {!employeeId && (
                        <>
                          <HRTableCell>
                            <div className="font-bold text-sm">{r.employee}</div>
                            <div className="text-[10px] text-[#7A8FA6]">{r.employeeCode}</div>
                          </HRTableCell>
                          <HRTableCell>{r.department || '—'}</HRTableCell>
                        </>
                      )}
                      {employeeId && <HRTableCell>{r.dayName}</HRTableCell>}
                      <HRTableCell>
                        <HRStatusBadge status={statusTone(r.status) as any} />
                      </HRTableCell>
                      <HRTableCell>{fmtTime(r.checkIn)}</HRTableCell>
                      <HRTableCell>{fmtTime(r.checkOut)}</HRTableCell>
                      <HRTableCell>{fmtHours(r.workingMinutes)}</HRTableCell>
                      {!employeeId ? null : <HRTableCell className="text-xs text-[#7A8FA6]">{r.source || '—'}</HRTableCell>}
                    </HRTableRow>
                  ))}
                </HRTable>
              </div>
            )}
          </HRCard>
        </div>
      </div>

      {/* Print-only header */}
      {report && (
        <div className="hidden print:block mt-8">
          <h1 className="text-xl font-bold">Attendance Report</h1>
          <p className="text-sm text-gray-600 mt-1">
            {report.from} to {report.to}
            {report.employee ? ` · ${report.employee.name} (${report.employee.employeeCode})` : ` · ${report.employeeCount} employees`}
          </p>
        </div>
      )}
    </HRPage>
  );
}
