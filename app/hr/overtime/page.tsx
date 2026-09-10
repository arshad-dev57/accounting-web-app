'use client';

import React from 'react';
import { CircleDollarSign, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { HRPage, HRPageHeader, HRCard, HRFilterChips, HRStatusBadge, HRTable, HRTableRow, HRTableCell, HRToolbar, HRWorkflowNotice, HRAvatar } from '../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

export default function OvertimePage() {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const [rows, setRows] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ employeeId: '', date: '', hours: '' });

  const load = React.useCallback(async () => {
    try {
      const [ot, people] = await Promise.all([
        hrWorkforceService.overtime(),
        hrWorkforceService.employees(),
      ]);
      setRows(ot);
      setEmployees(people);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load overtime');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((o) => (filter === 'All' || o.status === filter) && String(o.employee || '').toLowerCase().includes(query.toLowerCase()));
  const totalHours = rows.reduce((s, o) => s + Number(o.hours || 0), 0);

  const decide = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await hrWorkforceService.updateOvertime(id, status);
      toast.success(`Overtime ${status.toLowerCase()}`);
      load();
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hrWorkforceService.createOvertime({
        employeeId: form.employeeId,
        date: form.date,
        hours: Number(form.hours),
      });
      toast.success('Overtime recorded');
      setShowForm(false);
      setForm({ employeeId: '', date: '', hours: '' });
      load();
    } catch (error: any) {
      toast.error(error.message || 'Could not save overtime');
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Overtime Management"
        subtitle={`${totalHours.toFixed(1)} overtime hours recorded`}
        backHref="/hr/dashboard"
        actions={
          <button type="button" onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold">
            <Plus className="w-4 h-4" /> Add overtime
          </button>
        }
      />

      <HRWorkflowNotice tone="amber" title="Overtime flows into payroll" detail="Record hours against a real employee. Approve them here, then Generate payslips on Payroll to include approved overtime." />

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-[#DDE4EE] rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select required value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm">
            <option value="">Employee</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
          <input type="number" min="0.5" step="0.5" required placeholder="Hours" value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
          <button type="submit" className="bg-[#014582] text-white rounded-xl text-sm font-bold">Save</button>
        </form>
      )}

      <HRToolbar search={query} setSearch={setQuery} placeholder="Search employee..." filters={<HRFilterChips options={FILTERS} value={filter} onChange={setFilter} />} />

      <HRCard title="Overtime approval queue" action={<span className="text-[10px] font-semibold text-[#7A8FA6]">{rows.filter((o) => o.status === 'Pending').length} needs approval</span>}>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#014582]" /></div>
        ) : (
          <HRTable columns={['Employee', 'Date', 'Hours', 'Rate', 'Amount', 'Status', 'Actions']}>
            {filtered.length === 0 && (
              <HRTableRow><HRTableCell className="text-[#7A8FA6]">No overtime yet</HRTableCell></HRTableRow>
            )}
            {filtered.map((o) => (
              <HRTableRow key={o.id}>
                <HRTableCell className="font-bold"><span className="flex items-center gap-2"><HRAvatar name={o.employee} />{o.employee}</span></HRTableCell>
                <HRTableCell>{o.date}</HRTableCell>
                <HRTableCell className="font-semibold">{o.hours}h</HRTableCell>
                <HRTableCell>Rs {Number(o.rate || 0).toFixed(0)}/hr</HRTableCell>
                <HRTableCell className="font-bold">Rs {Number(o.amount || 0).toFixed(0)}</HRTableCell>
                <HRTableCell><HRStatusBadge status={o.status} /></HRTableCell>
                <HRTableCell>
                  {o.status === 'Pending' ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => decide(o.id, 'Approved')} className="px-2.5 py-1 rounded-lg bg-[#2ECC71]/10 text-[#2ECC71] text-[10px] font-bold">Approve</button>
                      <button type="button" onClick={() => decide(o.id, 'Rejected')} className="px-2.5 py-1 rounded-lg bg-[#E74C3C]/10 text-[#E74C3C] text-[10px] font-bold">Reject</button>
                    </div>
                  ) : <span className="text-[10px] text-[#7A8FA6]">—</span>}
                </HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        )}
      </HRCard>
    </HRPage>
  );
}
