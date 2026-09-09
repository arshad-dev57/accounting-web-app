'use client';

import React from 'react';
import { CircleDollarSign } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRFilterChips, HRStatusBadge, HRTable, HRTableRow, HRTableCell, HRToolbar, HRWorkflowNotice, HRAvatar } from '../ui';
import { OVERTIME } from '../data';

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

export default function OvertimePage() {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const filtered = OVERTIME.filter((o) => (filter === 'All' || o.status === filter) && o.employee.toLowerCase().includes(query.toLowerCase()));
  const totalHours = OVERTIME.reduce((s, o) => s + o.hours, 0);

  return (
    <HRPage>
      <HRPageHeader
        title="Overtime Management"
        subtitle={`${totalHours.toFixed(1)} overtime hours recorded`}
        backHref="/hr/dashboard"
        actions={<span className="flex items-center gap-1.5 text-[10px] font-bold text-white/80"><CircleDollarSign className="w-3.5 h-3.5" /> Payroll cutoff: 25 Sep</span>}
      />

      <HRWorkflowNotice tone="amber" title="Overtime is pending attendance validation" detail="Approve only when the recorded punch, shift rule, and overtime policy agree. Approved entries flow to the next payroll preview." />

      <HRToolbar search={query} setSearch={setQuery} placeholder="Search employee..." filters={<HRFilterChips options={FILTERS} value={filter} onChange={setFilter} />} />

      <HRCard title="Overtime approval queue" action={<span className="text-[10px] font-semibold text-[#7A8FA6]">1 needs approval</span>}>
        <HRTable columns={['Employee', 'Date', 'Hours', 'Rate', 'Amount', 'Status', 'Actions']}>
          {filtered.map((o, i) => (
            <HRTableRow key={`${o.employee}-${o.date}-${i}`}>
              <HRTableCell className="font-bold">
                <span className="flex items-center gap-2">
                  <HRAvatar name={o.employee} />
                  {o.employee}
                </span>
              </HRTableCell>
              <HRTableCell>{o.date}</HRTableCell>
              <HRTableCell className="font-semibold">{o.hours}h</HRTableCell>
              <HRTableCell>{o.rate}</HRTableCell>
              <HRTableCell className="font-bold">{o.amount}</HRTableCell>
              <HRTableCell><HRStatusBadge status={o.status} /></HRTableCell>
              <HRTableCell>
                {o.status === 'Pending' ? (
                  <div className="flex gap-2">
                    <button type="button" className="px-2.5 py-1 rounded-lg bg-[#2ECC71]/10 text-[#2ECC71] text-[10px] font-bold hover:bg-[#2ECC71]/20">
                      Approve
                    </button>
                    <button type="button" className="px-2.5 py-1 rounded-lg bg-[#E74C3C]/10 text-[#E74C3C] text-[10px] font-bold hover:bg-[#E74C3C]/20">
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-[#7A8FA6]">—</span>
                )}
              </HRTableCell>
            </HRTableRow>
          ))}
        </HRTable>
      </HRCard>
    </HRPage>
  );
}
