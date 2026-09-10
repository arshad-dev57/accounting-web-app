'use client';

import React from 'react';
import { PlaneTakeoff, Check, X, Clock, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
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
import { hrWorkforceService } from '@/lib/hr-workforce-service';

const COLORS = { success: '#2ECC71', danger: '#E74C3C', warning: '#F39C12' };
const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

export default function LeavesPage() {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const [rows, setRows] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({
    employeeId: '',
    type: 'Casual Leave',
    from: '',
    to: '',
    reason: '',
  });

  const load = React.useCallback(async () => {
    try {
      const [leaves, people] = await Promise.all([
        hrWorkforceService.leaves(),
        hrWorkforceService.employees(),
      ]);
      setRows(leaves);
      setEmployees(people);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter(
    (l) =>
      (filter === 'All' || l.status === filter) &&
      `${l.employee} ${l.type}`.toLowerCase().includes(query.toLowerCase())
  );

  const decide = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await hrWorkforceService.updateLeave(id, status);
      toast.success(`Leave ${status.toLowerCase()}`);
      load();
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hrWorkforceService.createLeave(form);
      toast.success('Leave recorded');
      setShowForm(false);
      setForm({ employeeId: '', type: 'Casual Leave', from: '', to: '', reason: '' });
      load();
    } catch (error: any) {
      toast.error(error.message || 'Could not create leave');
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Leave Management"
        subtitle="Approve or reject employee leave requests"
        backHref="/hr/dashboard"
        actions={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Record leave
          </button>
        }
      />

      <HRWorkflowNotice
        title="Leave requests from the employee app"
        detail="Employees submit leave from the mobile app. HR approves or rejects here. Approved staff are marked On Leave."
      />

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-[#DDE4EE] rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            required
            value={form.employeeId}
            onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
            className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm"
          >
            <option value="">Employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm"
          >
            {['Casual Leave', 'Sick Leave', 'Annual Leave', 'Emergency Leave'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input type="date" required value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
          <input type="date" required value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
          <button type="submit" className="bg-[#014582] text-white rounded-xl text-sm font-bold">Save</button>
        </form>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Pending Requests" value={rows.filter((l) => l.status === 'Pending').length} icon={Clock} color={COLORS.warning} />
        <HRStatCard label="Approved" value={rows.filter((l) => l.status === 'Approved').length} icon={Check} color={COLORS.success} />
        <HRStatCard label="Rejected" value={rows.filter((l) => l.status === 'Rejected').length} icon={X} color={COLORS.danger} />
        <HRStatCard label="Total Requests" value={rows.length} icon={PlaneTakeoff} color="#014582" />
      </div>

      <HRToolbar search={query} setSearch={setQuery} placeholder="Search employee or leave type..." filters={<HRFilterChips options={FILTERS} value={filter} onChange={setFilter} />} />

      <HRCard title="Leave request inbox" action={<span className="text-[10px] font-semibold text-[#7A8FA6]">{rows.filter((l) => l.status === 'Pending').length} awaiting decision</span>}>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#014582]" /></div>
        ) : (
          <HRTable columns={['Employee', 'Leave type', 'Dates', 'Reason', 'Days', 'Status', 'Actions']}>
            {filtered.length === 0 && (
              <HRTableRow>
                <HRTableCell className="text-[#7A8FA6]">No leave requests yet</HRTableCell>
              </HRTableRow>
            )}
            {filtered.map((l) => (
              <HRTableRow key={l.id}>
                <HRTableCell className="font-bold"><span className="flex items-center gap-2"><HRAvatar name={l.employee} />{l.employee}</span></HRTableCell>
                <HRTableCell>{l.type}</HRTableCell>
                <HRTableCell><p className="text-xs">{l.from} → {l.to}</p></HRTableCell>
                <HRTableCell className="text-xs text-[#7A8FA6]">{l.reason || '—'}</HRTableCell>
                <HRTableCell className="font-semibold">{l.days}</HRTableCell>
                <HRTableCell><HRStatusBadge status={l.status} /></HRTableCell>
                <HRTableCell>
                  {l.status === 'Pending' ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => decide(l.id, 'Approved')} className="px-2.5 py-1 rounded-lg bg-[#2ECC71]/10 text-[#2ECC71] text-[10px] font-bold">Approve</button>
                      <button type="button" onClick={() => decide(l.id, 'Rejected')} className="px-2.5 py-1 rounded-lg bg-[#E74C3C]/10 text-[#E74C3C] text-[10px] font-bold">Reject</button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#7A8FA6]">—</span>
                  )}
                </HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        )}
      </HRCard>
    </HRPage>
  );
}
