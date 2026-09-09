'use client';

import React from 'react';
import { Wallet, Download, LockKeyhole, CircleCheck } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRStatCard, HRStatusBadge, HRTable, HRTableRow, HRTableCell, HRActionButton, HRWorkflowNotice, HRAvatar } from '../ui';
import { PAYROLL } from '../data';

const COLORS = { success: '#2ECC71', warning: '#F39C12' };

export default function PayrollPage() {
  const totalNet = PAYROLL.reduce((s, p) => s + parseFloat(p.net.replace(/[$,]/g, '')), 0);

  return (
    <HRPage>
      <HRPageHeader
        title="Payroll Generation"
        subtitle="Monthly salary processing"
        backHref="/hr/dashboard"
        actions={<button type="button" className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"><Download className="w-4 h-4" /> Generate payslips</button>}
      />

      <HRWorkflowNotice tone="amber" title="September pay run is in review" detail="Resolve 3 attendance exceptions and 1 pending overtime request before locking the period and releasing payslips." action={<HRActionButton variant="ghost" icon={LockKeyhole}>Review blockers</HRActionButton>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Payroll Runs" value={PAYROLL.length} icon={Wallet} color="#014582" />
        <HRStatCard label="Total Net Payable" value={`$${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={Wallet} color={COLORS.success} />
        <HRStatCard label="Paid" value={PAYROLL.filter((p) => p.status === 'Paid').length} icon={Wallet} color={COLORS.success} />
        <HRStatCard label="Pending / Draft" value={PAYROLL.filter((p) => p.status !== 'Paid').length} icon={Wallet} color={COLORS.warning} />
      </div>

      <HRCard title="September 2026 pay run" action={<span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#2ECC71]"><CircleCheck className="w-3.5 h-3.5" /> Calculation preview</span>}>
        <HRTable columns={['Run ID', 'Employee', 'Base Salary', 'Overtime', 'Deductions', 'Net Pay', 'Status']}>
          {PAYROLL.map((p) => (
            <HRTableRow key={p.id}>
              <HRTableCell className="font-mono text-xs text-[#7A8FA6]">{p.id}</HRTableCell>
              <HRTableCell className="font-bold"><span className="flex items-center gap-2"><HRAvatar name={p.employee} />{p.employee}</span></HRTableCell>
              <HRTableCell>{p.base}</HRTableCell>
              <HRTableCell>{p.overtime}</HRTableCell>
              <HRTableCell className="text-[#E74C3C]">-{p.deductions}</HRTableCell>
              <HRTableCell className="font-bold text-[#2ECC71]">{p.net}</HRTableCell>
              <HRTableCell><HRStatusBadge status={p.status} /></HRTableCell>
            </HRTableRow>
          ))}
        </HRTable>
      </HRCard>
    </HRPage>
  );
}
