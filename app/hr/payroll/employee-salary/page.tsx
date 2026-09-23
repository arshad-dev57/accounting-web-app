'use client';

import React from 'react';
import Link from 'next/link';
import { Pencil, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRSearchInput,
  HRTable,
  HRTableRow,
  HRTableCell,
  HRWorkflowNotice,
  HRAvatar,
} from '../../ui';
import { hrEmployeesService } from '@/lib/hr-employees-service';

const pkr = (n: number) =>
  `Rs ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

export default function EmployeeSalaryPage() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    hrEmployeesService
      .list()
      .then(setRows)
      .catch((e: any) => toast.error(e.message || 'Failed to load employees'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter((e) =>
    `${e.name} ${e.employeeCode} ${e.department || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <HRPage>
      <HRPageHeader
        title="Employee salary"
        subtitle="Package salary per employee — used when payroll is calculated"
        backHref="/hr/payroll/dashboard"
        actions={
          <Link
            href="/hr/add-employee"
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold"
          >
            Add employee <ExternalLink className="w-3 h-3" />
          </Link>
        }
      />
      <HRWorkflowNotice
        title="Employee packages"
        detail="Edit an employee's package salary on their profile. Salary structure percentages (basic, allowances, tax) are set under Salary Structures."
      />

      <div className="mb-4">
        <HRSearchInput value={query} onChange={setQuery} placeholder="Search employee…" />
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#014582]" /></div>
      ) : (
        <HRCard title="Employee salary packages" action={<span className="text-[10px] font-bold text-[#7A8FA6]">{filtered.length} employees</span>}>
          <HRTable columns={['Employee', 'Department', 'Package salary', 'Pay basis', 'Actions']}>
            {filtered.length === 0 && (
              <HRTableRow><HRTableCell className="text-[#7A8FA6]">No employees found</HRTableCell></HRTableRow>
            )}
            {filtered.map((e) => (
              <HRTableRow key={e.id}>
                <HRTableCell className="font-bold">
                  <div className="flex items-center gap-2">
                    <HRAvatar name={e.name} />
                    <span>
                      {e.name}
                      <span className="block text-[10px] font-semibold text-[#7A8FA6]">{e.employeeCode}</span>
                    </span>
                  </div>
                </HRTableCell>
                <HRTableCell>{e.department || '—'}</HRTableCell>
                <HRTableCell className="font-extrabold text-[#014582]">{pkr(e.salary || 0)}</HRTableCell>
                <HRTableCell className="capitalize">{(e as { payBasis?: string }).payBasis || 'monthly'}</HRTableCell>
                <HRTableCell>
                  <Link
                    href={`/hr/employees/${e.id}/edit`}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#014582] text-white inline-flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Edit salary
                  </Link>
                </HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      )}
    </HRPage>
  );
}
