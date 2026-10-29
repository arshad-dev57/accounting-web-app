'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { HRActionButton, HRCard, HRPage, HRPageHeader } from '../../ui';
import { hrWorkspaceService, type HrLinkOption } from '@/lib/hr-workspace-service';

export default function LeaveControlPanelPage() {
  const [datesBasedOn, setDatesBasedOn] = useState('Leave Period');
  const [leavePeriodId, setLeavePeriodId] = useState('');
  const [leavePolicyId, setLeavePolicyId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [newLeavesAllocated, setNewLeavesAllocated] = useState('0');
  const [carryForward, setCarryForward] = useState(false);
  const [department, setDepartment] = useState('');

  const [employees, setEmployees] = useState<HrLinkOption[]>([]);
  const [periods, setPeriods] = useState<HrLinkOption[]>([]);
  const [policies, setPolicies] = useState<HrLinkOption[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<HrLinkOption[]>([]);
  const [departments, setDepartments] = useState<HrLinkOption[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, per, pol, types, deps] = await Promise.all([
        hrWorkspaceService.linkOptions('employee'),
        hrWorkspaceService.linkOptions('leave-period'),
        hrWorkspaceService.linkOptions('leave-policy'),
        hrWorkspaceService.linkOptions('leave-type'),
        hrWorkspaceService.linkOptions('department')
      ]);
      setEmployees(emps);
      setPeriods(per);
      setPolicies(pol);
      setLeaveTypes(types);
      setDepartments(deps);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to load masters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => employees, [employees]);
  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);

  const allocate = async () => {
    if (!selectedIds.length) {
      toast.error('Select at least one employee');
      return;
    }
    if (!leaveTypeId) {
      toast.error('Leave Type is required');
      return;
    }
    setSaving(true);
    try {
      const days = Number(newLeavesAllocated) || 0;
      const year = new Date().getUTCFullYear();
      for (const employeeId of selectedIds) {
        await hrWorkspaceService.create('leave-allocation', {
          employeeId,
          leaveTypeId,
          leavePeriodId: leavePeriodId || null,
          year,
          fromDate: fromDate || `${year}-01-01`,
          toDate: toDate || `${year}-12-31`,
          newLeaves: days,
          carryForwardLeaves: carryForward ? days : 0,
          status: 'Draft'
        });
        if (leavePolicyId) {
          await hrWorkspaceService.create('leave-policy-assignment', {
            employeeId,
            leavePolicyId,
            leavePeriodId: leavePeriodId || null,
            fromDate: fromDate || `${year}-01-01`,
            toDate: toDate || `${year}-12-31`,
            status: 'Draft'
          });
        }
      }
      toast.success(`Created allocations for ${selectedIds.length} employee(s)`);
      setSelected({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Allocation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Leave Control Panel"
        subtitle="Bulk-allocate leave for employees — ERPNext Leave Control Panel equivalent."
        actions={
          <HRActionButton onClick={() => void allocate()} disabled={saving || !selectedIds.length}>
            {saving ? 'Allocating…' : `Allocate Leave (${selectedIds.length})`}
          </HRActionButton>
        }
      />

      <HRCard title="Set Leave Details" className="mb-3">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-[12px]">
            <span className="mb-1 block text-[#7c7c7c]">Dates Based On</span>
            <select value={datesBasedOn} onChange={(e) => setDatesBasedOn(e.target.value)} className="h-8 w-full rounded border border-[#c7c7c7] px-2 text-[12px]">
              {['Leave Period', 'Joining Date', 'Custom Range'].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          {datesBasedOn === 'Leave Period' ? (
            <label className="text-[12px]">
              <span className="mb-1 block text-[#7c7c7c]">Leave Period</span>
              <select value={leavePeriodId} onChange={(e) => setLeavePeriodId(e.target.value)} className="h-8 w-full rounded border border-[#c7c7c7] px-2 text-[12px]">
                <option value="">—</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="text-[12px]">
                <span className="mb-1 block text-[#7c7c7c]">From Date</span>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 w-full rounded border border-[#c7c7c7] px-2 text-[12px]" />
              </label>
              <label className="text-[12px]">
                <span className="mb-1 block text-[#7c7c7c]">To Date</span>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 w-full rounded border border-[#c7c7c7] px-2 text-[12px]" />
              </label>
            </>
          )}
          <label className="text-[12px]">
            <span className="mb-1 block text-[#7c7c7c]">Leave Policy</span>
            <select value={leavePolicyId} onChange={(e) => setLeavePolicyId(e.target.value)} className="h-8 w-full rounded border border-[#c7c7c7] px-2 text-[12px]">
              <option value="">—</option>
              {policies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px]">
            <span className="mb-1 block text-[#7c7c7c]">Leave Type</span>
            <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} className="h-8 w-full rounded border border-[#c7c7c7] px-2 text-[12px]">
              <option value="">—</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px]">
            <span className="mb-1 block text-[#7c7c7c]">New Leaves Allocated</span>
            <input type="number" value={newLeavesAllocated} onChange={(e) => setNewLeavesAllocated(e.target.value)} className="h-8 w-full rounded border border-[#c7c7c7] px-2 text-[12px]" />
          </label>
          <label className="inline-flex items-end gap-2 pb-1 text-[12px]">
            <input type="checkbox" checked={carryForward} onChange={(e) => setCarryForward(e.target.checked)} />
            Carry Forward
          </label>
        </div>
      </HRCard>

      <HRCard title="Select Employees">
        {loading ? (
          <p className="text-[12px] text-[#7c7c7c]">Loading…</p>
        ) : (
          <div className="max-h-[420px] space-y-1 overflow-y-auto">
            <div className="mb-2 flex items-center gap-3 border-b border-[#e2e2e2] pb-2">
              <label className="flex items-center gap-2 text-[12px] font-medium">
                <input
                  type="checkbox"
                  checked={visible.length > 0 && visible.every((e) => selected[e.id])}
                  onChange={(e) => {
                    const next: Record<string, boolean> = { ...selected };
                    for (const emp of visible) next[emp.id] = e.target.checked;
                    setSelected(next);
                  }}
                />
                Select all
              </label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-7 rounded border border-[#c7c7c7] px-2 text-[12px]">
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
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
