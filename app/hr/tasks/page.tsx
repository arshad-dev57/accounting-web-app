'use client';

import React from 'react';
import { ListChecks, Plus, CalendarClock } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRFilterChips, HRStatusBadge, HRTable, HRTableRow, HRTableCell, HRToolbar, HRWorkflowNotice, HRAvatar } from '../ui';
import { TASKS } from '../data';

const PRIORITY_COLORS: Record<string, string> = {
  High: '#E74C3C',
  Medium: '#F39C12',
  Low: '#0FA3E0',
};

const FILTERS = ['All', 'Pending', 'Approved', 'Draft'];

export default function TasksPage() {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const filtered = TASKS.filter((t) => (filter === 'All' || t.status === filter) && `${t.title} ${t.assignedTo}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <HRPage>
      <HRPageHeader
        title="Task Management"
        subtitle={`${TASKS.length} tasks assigned`}
        backHref="/hr/dashboard"
        actions={
          <button
            type="button"
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        }
      />
      <HRWorkflowNotice title="Employee lifecycle tasks" detail="Use this workspace for onboarding, probation, policy acknowledgements, and offboarding checklists with a visible owner and due date." />

      <HRToolbar search={query} setSearch={setQuery} placeholder="Search task or owner..." filters={<HRFilterChips options={FILTERS} value={filter} onChange={setFilter} />} />

      <HRCard title="People operations tasks" action={<span className="text-[10px] font-semibold text-[#E74C3C]">2 tasks due this week</span>}>
        <HRTable columns={['Task', 'Assigned To', 'Due Date', 'Priority', 'Status']}>
          {filtered.map((t, i) => (
            <HRTableRow key={`${t.title}-${i}`}>
              <HRTableCell className="font-bold">
                <span className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-[#014582]" />
                  {t.title}
                </span>
              </HRTableCell>
              <HRTableCell><span className="flex items-center gap-2"><HRAvatar name={t.assignedTo} />{t.assignedTo}</span></HRTableCell>
              <HRTableCell><span className="inline-flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5 text-[#7A8FA6]" />{t.due}</span></HRTableCell>
              <HRTableCell>
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: `${PRIORITY_COLORS[t.priority]}1A`, color: PRIORITY_COLORS[t.priority] }}
                >
                  {t.priority}
                </span>
              </HRTableCell>
              <HRTableCell><HRStatusBadge status={t.status} /></HRTableCell>
            </HRTableRow>
          ))}
        </HRTable>
      </HRCard>
    </HRPage>
  );
}
