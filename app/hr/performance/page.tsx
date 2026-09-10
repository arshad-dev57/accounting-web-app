'use client';

import React from 'react';
import { Star, Target, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { HRPage, HRPageHeader, HRCard, HRStatusBadge, HRTable, HRTableRow, HRTableCell, HRWorkflowNotice, HRAvatar } from '../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

function Rating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 text-[#F39C12] fill-[#F39C12]" />
      <span className="font-bold">{Number(value || 0).toFixed(1)}</span>
    </span>
  );
}

export default function PerformancePage() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ employeeId: '', period: '', rating: '4', goals: '', reviewer: '' });

  const load = React.useCallback(async () => {
    try {
      const [reviews, people] = await Promise.all([
        hrWorkforceService.reviews(),
        hrWorkforceService.employees(),
      ]);
      setRows(reviews);
      setEmployees(people);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hrWorkforceService.createReview(form);
      toast.success('Review saved');
      setShowForm(false);
      load();
    } catch (error: any) {
      toast.error(error.message || 'Could not save review');
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Performance Reviews"
        subtitle="Reviews against your employee list"
        backHref="/hr/dashboard"
        actions={
          <button type="button" onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold">
            <Plus className="w-4 h-4" /> Add review
          </button>
        }
      />

      <HRWorkflowNotice title="Review cycle flow" detail="Add a review for any employee, then mark it Approved when the manager cycle is done." />

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-[#DDE4EE] rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <select required value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm">
            <option value="">Employee</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input placeholder="Period e.g. 2026-H2" value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
          <input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
          <input placeholder="Goals e.g. 7/9" value={form.goals} onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
          <button type="submit" className="bg-[#014582] text-white rounded-xl text-sm font-bold">Save</button>
        </form>
      )}

      <HRCard title="Review cycle" action={<span className="text-[10px] font-semibold text-[#7A8FA6]">{rows.filter((p) => p.status === 'Pending').length} awaiting input</span>}>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#014582]" /></div>
        ) : (
          <HRTable columns={['Employee', 'Review Period', 'Rating', 'Goals Completed', 'Reviewer', 'Status']}>
            {rows.length === 0 && (
              <HRTableRow><HRTableCell className="text-[#7A8FA6]">No reviews yet</HRTableCell></HRTableRow>
            )}
            {rows.map((p) => (
              <HRTableRow key={p.id}>
                <HRTableCell className="font-bold"><span className="flex items-center gap-2"><HRAvatar name={p.employee} />{p.employee}</span></HRTableCell>
                <HRTableCell>{p.period}</HRTableCell>
                <HRTableCell><Rating value={p.rating} /></HRTableCell>
                <HRTableCell className="font-semibold"><span className="inline-flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-[#0FA3E0]" />{p.goals || '—'}</span></HRTableCell>
                <HRTableCell>{p.reviewer || '—'}</HRTableCell>
                <HRTableCell><HRStatusBadge status={p.status} /></HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        )}
      </HRCard>
    </HRPage>
  );
}
