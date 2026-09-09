'use client';

import React from 'react';
import { CalendarDays, Fingerprint, MapPin, ShieldAlert } from 'lucide-react';
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
import { ATTENDANCE } from '../data';

const COLORS = {
  primary: '#014582',
  success: '#2ECC71',
  danger: '#E74C3C',
  warning: '#F39C12',
};

const FILTERS = ['All', 'Present', 'Late', 'Absent', 'On Leave'];

export default function AttendancePage() {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const filtered = ATTENDANCE.filter(
    (a) => (filter === 'All' || a.status === filter) && `${a.name} ${a.id}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <HRPage>
      <HRPageHeader
        title="Employee Attendance"
        subtitle="Daily check-in / check-out records"
        backHref="/hr/dashboard"
        actions={<span className="text-[10px] font-bold text-white/80 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Today · 07 Sep 2026</span>}
      />

      <HRWorkflowNotice
        tone="amber"
        title="3 attendance exceptions need review"
        detail="Late arrival, missing punch, and absence rules are shown here before this period is closed for payroll."
        action={<button className="text-[11px] font-extrabold underline underline-offset-2">Review queue</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Present" value={ATTENDANCE.filter((a) => a.status === 'Present').length} icon={Fingerprint} color={COLORS.success} />
        <HRStatCard label="Late" value={ATTENDANCE.filter((a) => a.status === 'Late').length} icon={Fingerprint} color={COLORS.warning} />
        <HRStatCard label="Absent" value={ATTENDANCE.filter((a) => a.status === 'Absent').length} icon={Fingerprint} color={COLORS.danger} />
        <HRStatCard label="On Leave" value={ATTENDANCE.filter((a) => a.status === 'On Leave').length} icon={Fingerprint} color={COLORS.primary} />
      </div>

      <HRToolbar search={query} setSearch={setQuery} placeholder="Search employee or attendance ID..." filters={<HRFilterChips options={FILTERS} value={filter} onChange={setFilter} />} />

      <HRCard title="Daily attendance register" action={<span className="text-[10px] font-semibold text-[#7A8FA6]">Synced moments ago</span>}>
        <HRTable columns={['ID', 'Employee', 'Shift & location', 'Check in', 'Check out', 'Worked', 'Status', '']}> 
          {filtered.map((a) => (
            <HRTableRow key={a.id}>
              <HRTableCell className="font-mono text-xs text-[#7A8FA6]">{a.id}</HRTableCell>
              <HRTableCell className="font-bold"><span className="flex items-center gap-2"><HRAvatar name={a.name} />{a.name}</span></HRTableCell>
              <HRTableCell><p className="text-xs font-semibold">Morning Shift</p><p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#7A8FA6]"><MapPin className="w-3 h-3" />Head Office</p></HRTableCell>
              <HRTableCell><span className={a.status === 'Late' ? 'font-bold text-[#F39C12]' : ''}>{a.checkIn}</span></HRTableCell>
              <HRTableCell>{a.checkOut}</HRTableCell>
              <HRTableCell className="font-semibold">{a.worked}</HRTableCell>
              <HRTableCell><HRStatusBadge status={a.status} /></HRTableCell>
              <HRTableCell><button className="p-1.5 rounded-lg text-[#7A8FA6] hover:bg-[#F0F4F8] hover:text-[#014582]" title="View attendance evidence"><ShieldAlert className="w-4 h-4" /></button></HRTableCell>
            </HRTableRow>
          ))}
        </HRTable>
      </HRCard>
    </HRPage>
  );
}
