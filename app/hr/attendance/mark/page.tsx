'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { HRActionButton, HRCard, HRPage, HRPageHeader } from '../../ui';
import { hrWorkspaceService, type HrLinkOption } from '@/lib/hr-workspace-service';

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

export default function EmployeeAttendanceToolPage() {
  const [date, setDate] = useState(todayYmd());
  const [status, setStatus] = useState('Present');
  const [shiftId, setShiftId] = useState('');
  const [lateEntry, setLateEntry] = useState(false);
  const [earlyExit, setEarlyExit] = useState(false);
  const [department, setDepartment] = useState('');
  const [employees, setEmployees] = useState<HrLinkOption[]>([]);
  const [shifts, setShifts] = useState<HrLinkOption[]>([]);
  const [departments, setDepartments] = useState<HrLinkOption[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, shiftOpts, deptOpts] = await Promise.all([
        hrWorkspaceService.linkOptions('employee'),
        hrWorkspaceService.linkOptions('shift-type'),
        hrWorkspaceService.linkOptions('department')
      ]);
      setEmployees(emps);
      setShifts(shiftOpts);
      setDepartments(deptOpts);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (!department) return employees;
    return employees.filter((e) => String((e as { departmentId?: string }).departmentId || '') === department);
  }, [employees, department]);

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);

  const mark = async () => {
    if (!selectedIds.length) {
      toast.error('Select at least one employee');
      return;
    }
    setSaving(true);
    try {
      for (const employeeId of selectedIds) {
        await hrWorkspaceService.create('attendance', {
          employeeId,
          workDate: date,
          status,
          shiftId: shiftId || null,
          lateEntry,
          earlyExit,
          source: 'attendance-tool'
        });
      }
      toast.success(`Marked ${selectedIds.length} employee(s) as ${status}`);
      setSelected({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Marking failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Employee Attendance Tool"
        subtitle="Mark attendance for multiple employees on a date — same flow as ERPNext."
        actions={
          <HRActionButton onClick={() => void mark()} disabled={saving || !selectedIds.length}>
            {saving ? 'Marking…' : `Mark Attendance (${selectedIds.length})`}
          </HRActionButton>
        }
      />

      <div className="mb-3 grid gap-3 md:grid-cols-4">
        <label className="text-[12px]">
          <span className="mb-1 block text-[#7c7c7c]">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 w-full rounded border border-[#c7c7c7] px-2 text-[12px]" />
        </label>
        <label className="text-[12px]">
          <span className="mb-1 block text-[#7c7c7c]">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 w-full rounded border border-[#c7c7c7] px-2 text-[12px]">
            {['Present', 'Absent', 'Half Day', 'Work From Home', 'On Leave'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[12px]">
          <span className="mb-1 block text-[#7c7c7c]">Shift</span>
          <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} className="h-8 w-full rounded border border-[#c7c7c7] px-2 text-[12px]">
            <option value="">—</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[12px]">
          <span className="mb-1 block text-[#7c7c7c]">Department</span>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-8 w-full rounded border border-[#c7c7c7] px-2 text-[12px]">
            <option value="">All</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-3 flex gap-4 text-[12px]">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={lateEntry} onChange={(e) => setLateEntry(e.target.checked)} />
          Late Entry
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={earlyExit} onChange={(e) => setEarlyExit(e.target.checked)} />
          Early Exit
        </label>
      </div>

      <HRCard title="Select Employees">
        {loading ? (
          <p className="text-[12px] text-[#7c7c7c]">Loading employees…</p>
        ) : (
          <div className="max-h-[420px] space-y-1 overflow-y-auto">
            <label className="mb-2 flex items-center gap-2 border-b border-[#e2e2e2] pb-2 text-[12px] font-medium">
              <input
                type="checkbox"
                checked={visible.length > 0 && visible.every((e) => selected[e.id])}
                onChange={(e) => {
                  const next: Record<string, boolean> = { ...selected };
                  for (const emp of visible) next[emp.id] = e.target.checked;
                  setSelected(next);
                }}
              />
              Select all ({visible.length})
            </label>
            {visible.map((emp) => (
              <label key={emp.id} className="flex items-center gap-2 rounded px-1 py-1 text-[12px] hover:bg-[#f8f8f8]">
                <input
                  type="checkbox"
                  checked={Boolean(selected[emp.id])}
                  onChange={(e) => setSelected((prev) => ({ ...prev, [emp.id]: e.target.checked }))}
                />
                {emp.label}
              </label>
            ))}
          </div>
        )}
      </HRCard>
    </HRPage>
  );
}
