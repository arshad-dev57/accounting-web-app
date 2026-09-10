'use client';

import React from 'react';
import { ListChecks, Plus, CalendarClock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { HRPage, HRPageHeader, HRCard, HRFilterChips, HRStatusBadge, HRTable, HRTableRow, HRTableCell, HRToolbar, HRWorkflowNotice, HRAvatar } from '../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

const PRIORITY_COLORS: Record<string, string> = { High: '#E74C3C', Medium: '#F39C12', Low: '#0FA3E0' };
const FILTERS = ['All', 'Pending', 'Approved', 'Draft'];

export default function TasksPage() {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const [rows, setRows] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', employeeId: '', due: '', priority: 'Medium' });

  const load = React.useCallback(async () => {
    try {
      const [tasks, people] = await Promise.all([
        hrWorkforceService.tasks(),
        hrWorkforceService.employees(),
      ]);
      setRows(tasks);
      setEmployees(people);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((t) => (filter === 'All' || t.status === filter) && `${t.title} ${t.assignedTo}`.toLowerCase().includes(query.toLowerCase()));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hrWorkforceService.createTask(form);
      toast.success('Task assigned');
      setShowForm(false);
      setForm({ title: '', employeeId: '', due: '', priority: 'Medium' });
      load();
    } catch (error: any) {
      toast.error(error.message || 'Could not create task');
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Task Management"
        subtitle={`${rows.length} tasks assigned`}
        backHref="/hr/dashboard"
        actions={
          <button type="button" onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold">
            <Plus className="w-4 h-4" /> New Task
          </button>
        }
      />
      <HRWorkflowNotice title="Assign work to real employees" detail="Tasks are saved against your employee list. Use this for onboarding, follow-ups, and field assignments." />

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-[#DDE4EE] rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input required placeholder="Task title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm md:col-span-2" />
          <select value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input type="date" value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
          <button type="submit" className="bg-[#014582] text-white rounded-xl text-sm font-bold">Save</button>
        </form>
      )}

      <HRToolbar search={query} setSearch={setQuery} placeholder="Search task or owner..." filters={<HRFilterChips options={FILTERS} value={filter} onChange={setFilter} />} />

      <HRCard title="People operations tasks">
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#014582]" /></div>
        ) : (
          <HRTable columns={['Task', 'Assigned To', 'Due Date', 'Priority', 'Status']}>
            {filtered.length === 0 && (
              <HRTableRow><HRTableCell className="text-[#7A8FA6]">No tasks yet</HRTableCell></HRTableRow>
            )}
            {filtered.map((t) => (
              <HRTableRow key={t.id}>
                <HRTableCell className="font-bold"><span className="flex items-center gap-2"><ListChecks className="w-4 h-4 text-[#014582]" />{t.title}</span></HRTableCell>
                <HRTableCell><span className="flex items-center gap-2"><HRAvatar name={t.assignedTo} />{t.assignedTo}</span></HRTableCell>
                <HRTableCell><span className="inline-flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5 text-[#7A8FA6]" />{t.due || '—'}</span></HRTableCell>
                <HRTableCell>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${PRIORITY_COLORS[t.priority] || '#7A8FA6'}1A`, color: PRIORITY_COLORS[t.priority] || '#7A8FA6' }}>
                    {t.priority}
                  </span>
                </HRTableCell>
                <HRTableCell><HRStatusBadge status={t.status} /></HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        )}
      </HRCard>
    </HRPage>
  );
}
