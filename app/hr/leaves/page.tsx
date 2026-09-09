'use client';

import React from 'react';
import { PlaneTakeoff, Check, X, Clock, CalendarRange } from 'lucide-react';
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
import { LEAVES } from '../data';

const COLORS = { success: '#2ECC71', danger: '#E74C3C', warning: '#F39C12' };

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

export default function LeavesPage() {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const filtered = LEAVES.filter((l) => (filter === 'All' || l.status === filter) && `${l.employee} ${l.type}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <HRPage>
      <HRPageHeader
        title="Leave Management"
        subtitle="Approve or reject employee leave requests"
        backHref="/hr/dashboard"
        actions={<span className="flex items-center gap-1.5 text-[10px] font-bold text-white/80"><CalendarRange className="w-3.5 h-3.5" /> September 2026</span>}
      />

      <HRWorkflowNotice title="Approval workflow: manager → HR" detail="Requests retain the leave balance, policy check, approver decision, and employee notification in one timeline." action={<button className="text-[11px] font-extrabold underline underline-offset-2">View policy</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Pending Requests" value={LEAVES.filter((l) => l.status === 'Pending').length} icon={Clock} color={COLORS.warning} />
        <HRStatCard label="Approved" value={LEAVES.filter((l) => l.status === 'Approved').length} icon={Check} color={COLORS.success} />
        <HRStatCard label="Rejected" value={LEAVES.filter((l) => l.status === 'Rejected').length} icon={X} color={COLORS.danger} />
        <HRStatCard label="Total Requests" value={LEAVES.length} icon={PlaneTakeoff} color="#014582" />
      </div>

      <HRToolbar search={query} setSearch={setQuery} placeholder="Search employee or leave type..." filters={<HRFilterChips options={FILTERS} value={filter} onChange={setFilter} />} />

      <HRCard title="Leave request inbox" action={<span className="text-[10px] font-semibold text-[#7A8FA6]">2 awaiting your decision</span>}>
        <HRTable columns={['Employee', 'Leave type', 'Dates', 'Balance after', 'Days', 'Status', 'Actions']}>
          {filtered.map((l, i) => (
            <HRTableRow key={`${l.employee}-${l.from}-${i}`}>
              <HRTableCell className="font-bold"><span className="flex items-center gap-2"><HRAvatar name={l.employee} />{l.employee}</span></HRTableCell>
              <HRTableCell>{l.type}</HRTableCell>
              <HRTableCell><p className="text-xs">{l.from} → {l.to}</p><p className="text-[10px] text-[#7A8FA6]">Requested today</p></HRTableCell>
              <HRTableCell><span className="font-semibold">12.5 days</span><p className="text-[10px] text-[#7A8FA6]">policy balance</p></HRTableCell>
              <HRTableCell className="font-semibold">{l.days}</HRTableCell>
              <HRTableCell><HRStatusBadge status={l.status} /></HRTableCell>
              <HRTableCell>
                {l.status === 'Pending' ? (
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
