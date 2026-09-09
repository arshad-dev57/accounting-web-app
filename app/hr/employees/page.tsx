'use client';

import React from 'react';
import Link from 'next/link';
import { UserPlus, ShieldCheck, Users as UsersIcon, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRFilterChips,
  HRSearchInput,
  HRStatusBadge,
  HRTable,
  HRTableRow,
  HRTableCell,
  HRStatCard,
  HRWorkflowNotice,
} from '../ui';
import { hrEmployeesService, HREmployee } from '@/lib/hr-employees-service';
import { usersService } from '../../users/service';

const COLORS = {
  primary: '#014582',
  success: '#2ECC71',
  danger: '#E74C3C',
  warning: '#F39C12',
};

const FILTERS = ['All', 'Active', 'On Leave', 'Inactive'];

type EmployeeRow = {
  key: string;
  id: string;
  code: string;
  name: string;
  designation: string;
  department: string;
  office: string;
  email: string;
  status: string;
  erpAccess: boolean;
};

// Map an ERP user into the unified employee row shape.
function userToRow(u: any): EmployeeRow {
  const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unnamed user';
  return {
    key: `user-${u.id}`,
    id: u.id,
    code: `USR-${String(u.id).slice(0, 6).toUpperCase()}`,
    name,
    designation: u.userRole?.name || u.role || 'ERP User',
    department: u.userRole?.name || 'ERP',
    office: (u.locations || []).map((l: any) => l.name).join(', ') || '—',
    email: u.email || '',
    status: u.isActive ? 'Active' : 'Inactive',
    erpAccess: true,
  };
}

// Map a stored HR employee into the unified row shape.
function employeeToRow(e: HREmployee): EmployeeRow {
  return {
    key: `emp-${e.id}`,
    id: e.id,
    code: e.employeeCode,
    name: `${e.firstName} ${e.lastName}`.trim(),
    designation: e.designation || '—',
    department: e.department || '—',
    office: e.office || '—',
    email: e.email,
    status: e.status,
    erpAccess: Boolean(e.linkedUserId),
  };
}

function ErpBadge({ has }: { has: boolean }) {
  return has ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#014582]/10 text-[#014582]">
      <ShieldCheck className="w-3 h-3" />
      ERP User
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#7A8FA6]/10 text-[#7A8FA6]">
      <UsersIcon className="w-3 h-3" />
      HR Only
    </span>
  );
}

export default function EmployeesPage() {
  const [rows, setRows] = React.useState<EmployeeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('All');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1) HR employees (local HR API) + 2) ERP users (existing users API)
      const [employees, usersRes] = await Promise.all([
        hrEmployeesService.list(),
        usersService.getUsers().catch(() => ({ data: [] as any[] })),
      ]);
      const userRows = (usersRes.data || []).map(userToRow);
      const employeeRows = employees.map(employeeToRow);
      // avoid duplicates when an employee is linked to a user
      const linkedUserIds = new Set(
        employees.map((e) => e.linkedUserId).filter(Boolean)
      );
      const filteredUserRows = userRows.filter((u) => !linkedUserIds.has(u.id));
      setRows([...employeeRows, ...filteredUserRows]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows.filter((r) => {
    const matchesFilter = filter === 'All' || r.status === filter;
    const q = query.toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      r.name.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.designation.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  const erpCount = rows.filter((r) => r.erpAccess).length;
  const hrOnlyCount = rows.length - erpCount;
  const activeCount = rows.filter((r) => r.status === 'Active').length;

  return (
    <HRPage>
      <HRPageHeader
        title="Employees List"
        subtitle={`${filtered.length} employees · ${erpCount} with ERP access`}
        backHref="/hr/dashboard"
        actions={
          <React.Fragment>
            <button
              type="button"
              onClick={() => void load()}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/hr/add-employee"
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Add Employee
            </Link>
          </React.Fragment>
        }
      />

      <HRWorkflowNotice title="Employee record flow" detail="Create the core profile, assign office and shift, link ERP access when needed, then use the employee record as the source for attendance, leave, payroll, and reviews." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Total Employees" value={rows.length} icon={UsersIcon} color={COLORS.primary} />
        <HRStatCard label="ERP Users" value={erpCount} icon={ShieldCheck} color={COLORS.primary} hint="Have ERP access" />
        <HRStatCard label="HR Only" value={hrOnlyCount} icon={UsersIcon} color={COLORS.warning} hint="No ERP access" />
        <HRStatCard label="Active" value={activeCount} icon={UserPlus} color={COLORS.success} />
      </div>

      <div className="space-y-4 mb-4">
        <HRSearchInput value={query} onChange={setQuery} placeholder="Search by name, code, designation..." />
        <HRFilterChips options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <HRCard>
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#7A8FA6]">
            <Loader2 className="w-6 h-6 animate-spin text-[#014582]" />
            <p className="text-xs font-semibold">Loading employees and users…</p>
          </div>
        ) : (
          
          <HRTable columns={['Code', 'Name', 'Designation', 'Department', 'Office', 'ERP Access', 'Status']}>
            {filtered.map((r) => (
              <HRTableRow key={r.key}>
                <HRTableCell className="font-mono text-xs text-[#7A8FA6]">{r.code}</HRTableCell>
                <HRTableCell className="font-bold">
                  <div>
                    {r.name}
                    {r.email && (
                      <p className="text-[10px] font-medium text-[#7A8FA6]">{r.email}</p>
                    )}
                  </div>
                </HRTableCell>
                <HRTableCell>{r.designation}</HRTableCell>
                <HRTableCell>{r.department}</HRTableCell>
                <HRTableCell>{r.office}</HRTableCell>
                <HRTableCell><ErpBadge has={r.erpAccess} /></HRTableCell>
                <HRTableCell><HRStatusBadge status={r.status} /></HRTableCell>
              </HRTableRow>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#7A8FA6]">
                  No employees found
                </td>
              </tr>
            )}
          </HRTable>
        )}
      </HRCard>
    </HRPage>
  );
}
