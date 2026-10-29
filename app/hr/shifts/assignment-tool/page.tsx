'use client';

export const dynamic = 'force-dynamic';

// ERPNext Shift Assignment Tool — field layout and actions mirror
// hrms/hr/doctype/shift_assignment_tool (Assign Shift / Assign Shift Schedule /
// Process Shift Requests + Quick Filters + employee / request datatable).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { HRActionButton, HRCard, HRPage, HRPageHeader } from '../../ui';
import { FieldControl } from '../../components/hr-document-form';
import {
  hrWorkspaceService,
  type HrField,
  type HrLinkOption
} from '@/lib/hr-workspace-service';
import { apiClient } from '@/lib/api-client';

const ACTIONS = ['Assign Shift', 'Assign Shift Schedule', 'Process Shift Requests'] as const;
type ToolAction = (typeof ACTIONS)[number];

type EmpRow = {
  id: string;
  employeeId: string;
  employee: string;
  employeeName: string;
  branch?: string;
  department?: string;
  defaultShift?: string;
  shiftRequest?: string;
  shiftType?: string;
  fromDate?: string;
  toDate?: string;
};

const inputClass =
  'h-8 w-full rounded border border-[#c7c7c7] bg-white px-2.5 text-[12.5px] text-[#171717] outline-none focus:border-[#014582]';

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function linkField(n: string, l: string, o: string): HrField {
  return { n, l, t: 'link', o } as HrField;
}

function Section({
  title,
  collapsible,
  defaultOpen = true,
  children
}: {
  title: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4 rounded border border-[#e2e2e2] bg-white">
      <button
        type="button"
        disabled={!collapsible}
        onClick={() => collapsible && setOpen((v) => !v)}
        className="flex w-full items-center gap-2 border-b border-[#e2e2e2] px-3 py-2 text-left"
      >
        {collapsible ? (
          open ? <ChevronDown className="h-3.5 w-3.5 text-[#7c7c7c]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#7c7c7c]" />
        ) : null}
        <span className="text-[13px] font-semibold text-[#171717]">{title}</span>
      </button>
      {(!collapsible || open) && <div className="px-3 py-3">{children}</div>}
    </div>
  );
}

function FieldLabel({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-[12px]">
      <span className="mb-1.5 block font-medium text-[#525252]">
        {label}
        {required ? <span className="text-[#e24c4c]"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[12px] text-[#7c7c7c]">{hint}</span> : null}
    </label>
  );
}

async function toolCall<T>(method: 'post', path: string, body: unknown): Promise<T> {
  const res = await apiClient.post(path, body);
  const payload = (res.data ?? {}) as { data?: T; message?: string };
  if (!res.success) throw new Error(payload.message || res.message || 'Request failed');
  return payload.data as T;
}

export default function ShiftAssignmentToolPage() {
  const [action, setAction] = useState<ToolAction>('Assign Shift');
  const [companyId, setCompanyId] = useState('');
  const [shiftTypeId, setShiftTypeId] = useState('');
  const [shiftScheduleId, setShiftScheduleId] = useState('');
  const [shiftLocationId, setShiftLocationId] = useState('');
  const [status, setStatus] = useState('Active');
  const [startDate, setStartDate] = useState(todayYmd());
  const [endDate, setEndDate] = useState('');

  // Shift Request Filters
  const [shiftTypeFilter, setShiftTypeFilter] = useState('');
  const [approverId, setApproverId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Quick Filters
  const [branchId, setBranchId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [employmentTypeId, setEmploymentTypeId] = useState('');
  const [search, setSearch] = useState('');

  const [options, setOptions] = useState<Record<string, HrLinkOption[]>>({});
  const [rows, setRows] = useState<EmpRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);

  const loadMeta = useCallback(async () => {
    setMetaLoading(true);
    try {
      const targets = [
        'company',
        'shift-type',
        'shift-schedule',
        'shift-location',
        'office',
        'department',
        'designation',
        'employee-grade',
        'employment-type',
        'user'
      ];
      const entries = await Promise.all(
        targets.map(async (t) => [t, await hrWorkspaceService.linkOptions(t).catch(() => [] as HrLinkOption[])] as const)
      );
      const map = Object.fromEntries(entries);
      setOptions(map);
      if (map.company?.[0]) setCompanyId(map.company[0].id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to load options');
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const filterPayload = useMemo(
    () => ({
      action,
      companyId,
      shiftTypeId,
      shift_type: shiftTypeId,
      shiftScheduleId,
      shift_schedule: shiftScheduleId,
      shiftLocationId,
      status,
      startDate,
      start_date: startDate,
      endDate: endDate || null,
      end_date: endDate || null,
      shiftTypeFilter,
      shift_type_filter: shiftTypeFilter,
      approverId,
      approver: approverId,
      fromDate,
      from_date: fromDate,
      toDate,
      to_date: toDate,
      branchId,
      branch: branchId,
      departmentId,
      department: departmentId,
      designationId,
      designation: designationId,
      gradeId,
      grade: gradeId,
      employmentTypeId,
      employmentType: employmentTypeId,
      search
    }),
    [
      action,
      companyId,
      shiftTypeId,
      shiftScheduleId,
      shiftLocationId,
      status,
      startDate,
      endDate,
      shiftTypeFilter,
      approverId,
      fromDate,
      toDate,
      branchId,
      departmentId,
      designationId,
      gradeId,
      employmentTypeId,
      search
    ]
  );

  const loadRows = useCallback(async () => {
    if (action === 'Assign Shift' && !(shiftTypeId && startDate)) {
      setRows([]);
      setSelected({});
      return;
    }
    if (action === 'Assign Shift Schedule' && !(shiftScheduleId && startDate)) {
      setRows([]);
      setSelected({});
      return;
    }
    setLoading(true);
    try {
      const data = await toolCall<EmpRow[]>('post', '/api/hr/tools/shift-assignment/employees', filterPayload);
      setRows(Array.isArray(data) ? data : []);
      setSelected({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to load employees');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [action, shiftTypeId, shiftScheduleId, startDate, filterPayload]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadRows]);

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);

  const emptyMessage = useMemo(() => {
    if (action === 'Assign Shift') {
      return shiftTypeId && startDate
        ? 'There are no employees without Shift Assignments for these dates based on the given filters.'
        : 'Please select Shift Type and assignment date(s).';
    }
    if (action === 'Assign Shift Schedule') {
      return shiftScheduleId && startDate
        ? 'There are no employees without active overlapping Shift Schedule Assignments based on the given filters.'
        : 'Please select Shift Schedule and assignment date(s).';
    }
    return 'There are no open Shift Requests based on the given filters.';
  }, [action, shiftTypeId, shiftScheduleId, startDate]);

  const runAssign = async () => {
    if (!selectedIds.length) {
      toast.error(action === 'Process Shift Requests' ? 'Select at least one Shift Request' : 'Select at least one employee');
      return;
    }
    if (!window.confirm(`${action} to ${selectedIds.length} ${action === 'Process Shift Requests' ? 'request(s)' : 'employee(s)'}?`)) {
      return;
    }
    setSaving(true);
    try {
      const result = await toolCall<{ created: number; failure: string[] }>(
        'post',
        '/api/hr/tools/shift-assignment/bulk-assign',
        { ...filterPayload, employees: selectedIds }
      );
      const failed = result.failure?.length || 0;
      toast.success(`Assigned ${result.created || selectedIds.length - failed} · failed ${failed}`);
      await loadRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setSaving(false);
    }
  };

  const processRequests = async (nextStatus: 'Approved' | 'Rejected') => {
    if (!selectedIds.length) {
      toast.error('Select at least one Shift Request');
      return;
    }
    if (!window.confirm(`Process ${selectedIds.length} Shift Request(s) as ${nextStatus}?`)) return;
    setSaving(true);
    try {
      const shiftRequests = rows
        .filter((r) => selected[r.id])
        .map((r) => ({ shiftRequest: r.id, employee: r.employeeId }));
      const result = await toolCall<{ processed: number; failure: string[] }>(
        'post',
        '/api/hr/tools/shift-assignment/process-requests',
        { status: nextStatus, shiftRequests }
      );
      toast.success(`Processed ${result.processed || 0} · failed ${result.failure?.length || 0}`);
      await loadRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setSaving(false);
    }
  };

  const primaryActions =
    action === 'Process Shift Requests' ? (
      <>
        <HRActionButton onClick={() => void processRequests('Approved')} disabled={saving || !selectedIds.length}>
          Approve ({selectedIds.length})
        </HRActionButton>
        <HRActionButton
          variant="secondary"
          onClick={() => void processRequests('Rejected')}
          disabled={saving || !selectedIds.length}
        >
          Reject ({selectedIds.length})
        </HRActionButton>
      </>
    ) : (
      <HRActionButton onClick={() => void runAssign()} disabled={saving || !selectedIds.length}>
        {saving ? 'Assigning…' : `${action} (${selectedIds.length})`}
      </HRActionButton>
    );

  const showAssignmentDetails = action === 'Assign Shift' || action === 'Assign Shift Schedule';
  const showRequestFilters = action === 'Process Shift Requests';

  return (
    <HRPage>
      <HRPageHeader
        title="Shift Assignment Tool"
        subtitle="Bulk assign shifts or schedules, or process open shift requests — same flow as ERPNext."
        actions={primaryActions}
      />

      {metaLoading ? (
        <p className="text-[12.5px] text-[#7c7c7c]">Loading…</p>
      ) : (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <FieldLabel label="Action" required>
              <select value={action} onChange={(e) => setAction(e.target.value as ToolAction)} className={inputClass}>
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="Company" required>
              <FieldControl
                field={linkField('companyId', 'Company', 'company')}
                value={companyId}
                optionsByTarget={options}
                onChange={(v) => setCompanyId(String(v || ''))}
              />
            </FieldLabel>
          </div>

          {showAssignmentDetails ? (
            <Section title="Shift Assignment Details">
              <div className="grid gap-3 md:grid-cols-2">
                {action === 'Assign Shift' ? (
                  <FieldLabel label="Shift Type" required>
                    <FieldControl
                      field={linkField('shiftTypeId', 'Shift Type', 'shift-type')}
                      value={shiftTypeId}
                      optionsByTarget={options}
                      onChange={(v) => setShiftTypeId(String(v || ''))}
                    />
                  </FieldLabel>
                ) : (
                  <FieldLabel label="Shift Schedule" required>
                    <FieldControl
                      field={linkField('shiftScheduleId', 'Shift Schedule', 'shift-schedule')}
                      value={shiftScheduleId}
                      optionsByTarget={options}
                      onChange={(v) => setShiftScheduleId(String(v || ''))}
                    />
                  </FieldLabel>
                )}
                <FieldLabel label="Shift Location">
                  <FieldControl
                    field={linkField('shiftLocationId', 'Shift Location', 'shift-location')}
                    value={shiftLocationId}
                    optionsByTarget={options}
                    onChange={(v) => setShiftLocationId(String(v || ''))}
                  />
                </FieldLabel>
                <FieldLabel
                  label="Status"
                  hint="When set to 'Inactive', employees with conflicting active shifts will not be excluded."
                >
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </FieldLabel>
                <FieldLabel label="Start Date" required>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      setStartDate(next);
                      if (endDate && next && endDate < next) setEndDate('');
                    }}
                    className={inputClass}
                  />
                </FieldLabel>
                <FieldLabel label="End Date">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      setEndDate(next);
                      if (startDate && next && next < startDate) setStartDate('');
                    }}
                    className={inputClass}
                  />
                </FieldLabel>
              </div>
            </Section>
          ) : null}

          {showRequestFilters ? (
            <Section title="Shift Request Filters">
              <div className="grid gap-3 md:grid-cols-2">
                <FieldLabel label="Shift Type">
                  <FieldControl
                    field={linkField('shiftTypeFilter', 'Shift Type', 'shift-type')}
                    value={shiftTypeFilter}
                    optionsByTarget={options}
                    onChange={(v) => setShiftTypeFilter(String(v || ''))}
                  />
                </FieldLabel>
                <FieldLabel label="Approver">
                  <FieldControl
                    field={{ n: 'approverId', l: 'Approver', t: 'userLink' } as HrField}
                    value={approverId}
                    optionsByTarget={options}
                    onChange={(v) => setApproverId(String(v || ''))}
                  />
                </FieldLabel>
                <FieldLabel label="From Date" hint="Shift Requests ending before this date will be excluded.">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      setFromDate(next);
                      if (toDate && next && toDate < next) setToDate('');
                    }}
                    className={inputClass}
                  />
                </FieldLabel>
                <FieldLabel label="To Date" hint="Shift Requests starting after this date will be excluded.">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      setToDate(next);
                      if (fromDate && next && next < fromDate) setFromDate('');
                    }}
                    className={inputClass}
                  />
                </FieldLabel>
              </div>
            </Section>
          ) : null}

          <Section title="Quick Filters" collapsible defaultOpen>
            <div className="grid gap-3 md:grid-cols-2">
              <FieldLabel label="Branch">
                <FieldControl
                  field={linkField('branchId', 'Branch', 'office')}
                  value={branchId}
                  optionsByTarget={options}
                  onChange={(v) => setBranchId(String(v || ''))}
                />
              </FieldLabel>
              <FieldLabel label="Department">
                <FieldControl
                  field={linkField('departmentId', 'Department', 'department')}
                  value={departmentId}
                  optionsByTarget={options}
                  onChange={(v) => setDepartmentId(String(v || ''))}
                />
              </FieldLabel>
              <FieldLabel label="Designation">
                <FieldControl
                  field={linkField('designationId', 'Designation', 'designation')}
                  value={designationId}
                  optionsByTarget={options}
                  onChange={(v) => setDesignationId(String(v || ''))}
                />
              </FieldLabel>
              <FieldLabel label="Employee Grade">
                <FieldControl
                  field={linkField('gradeId', 'Employee Grade', 'employee-grade')}
                  value={gradeId}
                  optionsByTarget={options}
                  onChange={(v) => setGradeId(String(v || ''))}
                />
              </FieldLabel>
              <FieldLabel label="Employment Type">
                <FieldControl
                  field={linkField('employmentTypeId', 'Employment Type', 'employment-type')}
                  value={employmentTypeId}
                  optionsByTarget={options}
                  onChange={(v) => setEmploymentTypeId(String(v || ''))}
                />
              </FieldLabel>
            </div>
          </Section>

          <Section title="Advanced Filters" collapsible defaultOpen={false}>
            <FieldLabel label="Search">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Employee name or ID"
                className={inputClass}
              />
            </FieldLabel>
          </Section>

          <HRCard
            title={action === 'Process Shift Requests' ? 'Select Shift Requests' : 'Select Employees'}
            action={
              <button
                type="button"
                className="text-[12px] text-[#525252] hover:text-[#171717]"
                onClick={() => void loadRows()}
              >
                Refresh
              </button>
            }
          >
            {loading ? (
              <p className="text-[12.5px] text-[#7c7c7c]">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="py-6 text-center text-[12.5px] text-[#9c9c9c]">{emptyMessage}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-[#e2e2e2] text-[#525252]">
                      <th className="w-10 px-2 py-2">
                        <input
                          type="checkbox"
                          checked={rows.length > 0 && rows.every((r) => selected[r.id])}
                          onChange={(e) => {
                            const next: Record<string, boolean> = {};
                            for (const row of rows) next[row.id] = e.target.checked;
                            setSelected(next);
                          }}
                        />
                      </th>
                      {action === 'Process Shift Requests' ? (
                        <>
                          <th className="px-2 py-2 font-normal">Shift Request</th>
                          <th className="px-2 py-2 font-normal">Employee</th>
                          <th className="px-2 py-2 font-normal">Shift Type</th>
                          <th className="px-2 py-2 font-normal">From Date</th>
                          <th className="px-2 py-2 font-normal">To Date</th>
                        </>
                      ) : (
                        <>
                          <th className="px-2 py-2 font-normal">Employee</th>
                          <th className="px-2 py-2 font-normal">Employee Name</th>
                          <th className="px-2 py-2 font-normal">Branch</th>
                          <th className="px-2 py-2 font-normal">Department</th>
                          <th className="px-2 py-2 font-normal">Default Shift</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-[#f0f0f0] hover:bg-[#fafafa]">
                        <td className="px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={Boolean(selected[row.id])}
                            onChange={(e) => setSelected((prev) => ({ ...prev, [row.id]: e.target.checked }))}
                          />
                        </td>
                        {action === 'Process Shift Requests' ? (
                          <>
                            <td className="px-2 py-1.5 font-mono text-[11px]">{String(row.id).slice(0, 8)}</td>
                            <td className="px-2 py-1.5">{row.employeeName}</td>
                            <td className="px-2 py-1.5">{row.shiftType}</td>
                            <td className="px-2 py-1.5">{row.fromDate}</td>
                            <td className="px-2 py-1.5">{row.toDate}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-1.5">{row.employee}</td>
                            <td className="px-2 py-1.5">{row.employeeName}</td>
                            <td className="px-2 py-1.5">{row.branch || '—'}</td>
                            <td className="px-2 py-1.5">{row.department || '—'}</td>
                            <td className="px-2 py-1.5">{row.defaultShift || '—'}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </HRCard>
        </>
      )}
    </HRPage>
  );
}
