'use client';

import React from 'react';
import {
  CalendarDays,
  Fingerprint,
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
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
import { hrDashboardService, hrEmployeesService } from '@/lib/hr-employees-service';
import { hrHcmService } from '@/lib/hr-hcm-service';

const COLORS = {
  primary: '#014582',
  success: '#2ECC71',
  danger: '#E74C3C',
  warning: '#F39C12',
};

const FILTERS = ['All', 'Present', 'Late', 'Absent', 'Half Day'];
const STATUS_OPTIONS = ['Present', 'Late', 'Absent', 'Half Day', 'On Leave', 'Weekly Off', 'Holiday'];

function fmtTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function toInputTime(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
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
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [edit, setEdit] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);

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

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [data, body] = await Promise.all([
        hrDashboardService.attendance(iso),
        hrHcmService.attendanceSummary(iso).catch(() => ({ summary: {} })),
      ]);
      setRows(data);
      setSummary((body as any).summary || {});
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [iso]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    hrEmployeesService.list().then(setEmployees).catch(() => {});
  }, []);

  const mapped = rows.map((row) => {
    const emp = row.employee || {};
    return {
      id: row.id,
      employeeId: row.employeeId || emp.id,
      name: emp.name || 'Employee',
      office: emp.office || '—',
      shift: emp.shift || '—',
      checkInRaw: row.checkIn,
      checkOutRaw: row.checkOut,
      checkIn: fmtTime(row.checkIn),
      checkOut: fmtTime(row.checkOut),
      worked: fmtHours(row.workingMinutes),
      status: row.status || 'Absent',
    };
  });

  const filtered = mapped.filter(
    (a) =>
      (filter === 'All' || a.status === filter) &&
      `${a.name} ${a.employeeId}`.toLowerCase().includes(query.toLowerCase())
  );

  const openNew = () => {
    setEdit({
      employeeId: employees[0]?.id || '',
      status: 'Present',
      checkIn: '09:00',
      checkOut: '18:00',
      isNew: true,
    });
  };

  const openEdit = (a: any) => {
    setEdit({
      employeeId: a.employeeId,
      name: a.name,
      status: a.status,
      checkIn: toInputTime(a.checkInRaw) || '09:00',
      checkOut: toInputTime(a.checkOutRaw) || '',
      isNew: false,
    });
  };

  const saveEdit = async () => {
    if (!edit?.employeeId) {
      toast.error('Select an employee');
      return;
    }
    setSaving(true);
    try {
      await hrDashboardService.upsertAttendance({
        employeeId: edit.employeeId,
        date: iso,
        status: edit.status,
        checkIn: edit.status === 'Absent' || edit.status === 'Weekly Off' || edit.status === 'Holiday'
          ? ''
          : edit.checkIn,
        checkOut: edit.status === 'Absent' || edit.status === 'Weekly Off' || edit.status === 'Holiday'
          ? ''
          : edit.checkOut,
      });
      toast.success('Attendance saved — Salary build will use this');
      setEdit(null);
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Employee Attendance"
        subtitle="HR can edit any day — cuts follow Settings policy on Salary build"
        backHref="/hr/dashboard"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openNew}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Mark / adjust
            </button>
            <span className="text-[10px] font-bold text-white/80 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> {dateLabel}
            </span>
          </div>
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
        title="HR owns attendance + salary"
        detail="Geofence auto-marks presence. HR can edit status / check-in / check-out here. Late and absent cuts come from HR Settings; after Payroll Calculate, HR approves pay."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Present" value={mapped.filter((a) => a.status === 'Present').length} icon={Fingerprint} color={COLORS.success} />
        <HRStatCard label="Late" value={mapped.filter((a) => a.status === 'Late').length} icon={Fingerprint} color={COLORS.warning} />
        <HRStatCard label="Absent" value={mapped.filter((a) => a.status === 'Absent').length} icon={Fingerprint} color={COLORS.danger} />
        <HRStatCard label="Records" value={mapped.length} icon={Fingerprint} color={COLORS.primary} />
        <HRStatCard label="On leave" value={summary.onLeave || 0} icon={Fingerprint} color={COLORS.warning} hint="Approved leave" />
        <HRStatCard label="Missing checkout" value={summary.missingCheckout || 0} icon={Fingerprint} color={COLORS.danger} hint="Still open" />
        <HRStatCard label="Half day" value={summary.halfDay || 0} icon={Fingerprint} color="#0FA3E0" />
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
          <HRTable columns={['Employee', 'Shift & location', 'Check in', 'Check out', 'Worked', 'Status', '']}>
            {filtered.map((a) => (
              <HRTableRow key={a.id || a.employeeId}>
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
                  <span className={a.status === 'Late' ? 'font-bold text-[#F39C12]' : ''}>{a.checkIn}</span>
                </HRTableCell>
                <HRTableCell>{a.checkOut}</HRTableCell>
                <HRTableCell className="font-semibold">{a.worked}</HRTableCell>
                <HRTableCell>
                  <HRStatusBadge status={a.status} />
                </HRTableCell>
                <HRTableCell>
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#014582]/10 text-[#014582]"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                </HRTableCell>
              </HRTableRow>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#7A8FA6]">
                  No attendance records for this day. Use <b>Mark / adjust</b> to add one.
                </td>
              </tr>
            )}
          </HRTable>
        )}
      </HRCard>

      {edit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEdit(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-[#1A1A2E]">
                {edit.isNew ? 'Mark attendance' : `Edit · ${edit.name || 'Employee'}`}
              </h3>
              <button type="button" onClick={() => setEdit(null)} className="p-1 text-[#7A8FA6]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {edit.isNew && (
                <label className="block text-xs font-bold text-[#7A8FA6]">
                  Employee
                  <select
                    className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm"
                    value={edit.employeeId}
                    onChange={(e) => setEdit((p: any) => ({ ...p, employeeId: e.target.value }))}
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block text-xs font-bold text-[#7A8FA6]">
                Status
                <select
                  className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm"
                  value={edit.status}
                  onChange={(e) => setEdit((p: any) => ({ ...p, status: e.target.value }))}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-bold text-[#7A8FA6]">
                  Check in
                  <input
                    type="time"
                    className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm"
                    value={edit.checkIn}
                    onChange={(e) => setEdit((p: any) => ({ ...p, checkIn: e.target.value }))}
                    disabled={['Absent', 'Weekly Off', 'Holiday'].includes(edit.status)}
                  />
                </label>
                <label className="block text-xs font-bold text-[#7A8FA6]">
                  Check out
                  <input
                    type="time"
                    className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm"
                    value={edit.checkOut}
                    onChange={(e) => setEdit((p: any) => ({ ...p, checkOut: e.target.value }))}
                    disabled={['Absent', 'Weekly Off', 'Holiday'].includes(edit.status)}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="w-full bg-[#014582] text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save attendance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </HRPage>
  );
}
