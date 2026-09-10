'use client';

import React from 'react';
import Link from 'next/link';
import { UserPlus, Smartphone, Users as UsersIcon, RefreshCw, Loader2 } from 'lucide-react';
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

const COLORS = {
  primary: '#014582',
  success: '#2ECC71',
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
};

function employeeToRow(e: HREmployee): EmployeeRow {
  return {
    key: e.id,
    id: e.id,
    code: e.employeeCode,
    name: e.name || `${e.firstName} ${e.lastName}`.trim(),
    designation: e.designation || '—',
    department: e.department || '—',
    office: e.office || '—',
    email: e.email,
    status: e.status,
  };
}

export default function EmployeesPage() {
  const [rows, setRows] = React.useState<EmployeeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('All');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const employees = await hrEmployeesService.list();
      setRows(employees.map(employeeToRow));
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

  const activeCount = rows.filter((r) => r.status === 'Active').length;
  const onLeaveCount = rows.filter((r) => r.status === 'On Leave').length;

  return (
    <HRPage>
      <HRPageHeader
        title="Employees List"
        subtitle={`${filtered.length} employees from your company database`}
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

      <HRWorkflowNotice
        title="Employee = app user"
        detail="HR creates a real login account. That person opens the mobile app and lands on the Employee Dashboard only — with geofence attendance."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Total Employees" value={rows.length} icon={UsersIcon} color={COLORS.primary} />
        <HRStatCard label="Active" value={activeCount} icon={UserPlus} color={COLORS.success} />
        <HRStatCard label="On Leave" value={onLeaveCount} icon={UsersIcon} color={COLORS.warning} />
        <HRStatCard
          label="App users"
          value={rows.length}
          icon={Smartphone}
          color={COLORS.primary}
          hint="Each employee can log in"
        />
      </div>

      <div className="space-y-4 mb-4">
        <HRSearchInput value={query} onChange={setQuery} placeholder="Search by name, code, designation..." />
        <HRFilterChips options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <HRCard>
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#7A8FA6]">
            <Loader2 className="w-6 h-6 animate-spin text-[#014582]" />
            <p className="text-xs font-semibold">Loading employees…</p>
          </div>
        ) : (
          <HRTable columns={['Code', 'Name', 'Designation', 'Department', 'Office', 'Status']}>
            {filtered.map((r) => (
              <HRTableRow key={r.key}>
                <HRTableCell className="font-mono text-xs text-[#7A8FA6]">{r.code}</HRTableCell>
                <HRTableCell className="font-bold">
                  <Link href={`/hr/employees/${r.id}`} className="hover:text-[#014582]">
                    <div>
                    {r.name}
                    {r.email && (
                      <p className="text-[10px] font-medium text-[#7A8FA6]">{r.email}</p>
                    )}
                    </div>
                  </Link>
                </HRTableCell>
                <HRTableCell>{r.designation}</HRTableCell>
                <HRTableCell>{r.department}</HRTableCell>
                <HRTableCell>{r.office}</HRTableCell>
                <HRTableCell>
                  <HRStatusBadge status={r.status} />
                </HRTableCell>
              </HRTableRow>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#7A8FA6]">
                  No employees yet. Add one to create their app login.
                </td>
              </tr>
            )}
          </HRTable>
        )}
      </HRCard>
    </HRPage>
  );
}
