'use client';

import React from 'react';
import {
  GitBranch,
  Plus,
  Loader2,
  Calendar,
  User,
  ArrowRight,
  X,
  CheckCircle2,
  TrendingUp,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRStatCard,
  HRStatusBadge,
  HRToolbar,
  HRTable,
  HRTableRow,
  HRTableCell,
} from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';
import { hrEmployeesService } from '@/lib/hr-employees-service';

export default function LifecyclePage() {
  const [events, setEvents] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const [showModal, setShowModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    employeeId: '',
    type: 'promotion',
    fromValue: '',
    toValue: '',
    effective: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [evts, emps] = await Promise.all([
        hrHcmService.lifecycle(),
        hrEmployeesService.list().catch(() => []),
      ]);
      setEvents(evts);
      setEmployees(emps);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load lifecycle events');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const eventTypes = [
    { id: 'onboarding', label: 'Onboarding / Appointment' },
    { id: 'probation_confirmation', label: 'Probation Confirmation' },
    { id: 'promotion', label: 'Promotion' },
    { id: 'transfer_department', label: 'Department Transfer' },
    { id: 'transfer_branch', label: 'Branch / Office Transfer' },
    { id: 'salary_revision', label: 'Salary / Compensation Revision' },
    { id: 'resignation', label: 'Resignation' },
    { id: 'termination', label: 'Termination / Offboarding' },
  ];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.type) {
      toast.error('Select employee and event type');
      return;
    }
    setSaving(true);
    try {
      await hrHcmService.saveLifecycle(form);
      toast.success('Lifecycle event recorded and employee status updated');
      setShowModal(false);
      setForm({
        employeeId: '',
        type: 'promotion',
        fromValue: '',
        toValue: '',
        effective: new Date().toISOString().slice(0, 10),
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed recording event');
    } finally {
      setSaving(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.employee || '').toLowerCase().includes(q) ||
      (e.type || '').toLowerCase().includes(q) ||
      (e.toValue || '').toLowerCase().includes(q)
    );
  });

  return (
    <HRPage>
      <HRPageHeader
        title="Employee Career Progression & Lifecycle"
        subtitle="Auditable history of onboarding, probation, confirmation, promotion, transfer, and exit events."
        backHref="/hr/dashboard"
        actions={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white text-[#014582] font-extrabold text-xs shadow-md hover:bg-white/90 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Record Lifecycle Event
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Recorded Events" value={events.length} icon={GitBranch} color="#014582" />
        <HRStatCard label="Promotions" value={events.filter((e) => e.type === 'promotion').length} icon={TrendingUp} color="#2ECC71" />
        <HRStatCard label="Confirmations" value={events.filter((e) => e.type === 'probation_confirmation').length} icon={CheckCircle2} color="#F39C12" />
        <HRStatCard label="Transfers" value={events.filter((e) => e.type?.includes('transfer')).length} icon={Award} color="#8E44AD" />
      </div>

      <HRToolbar
        search={search}
        setSearch={setSearch}
        placeholder="Filter career history by employee or event type..."
      />

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#DDE4EE] shadow-sm">
          <GitBranch className="w-12 h-12 text-[#7A8FA6] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-extrabold text-[#1A1A2E]">No Lifecycle Records Found</h3>
          <p className="text-xs text-[#7A8FA6] mt-1">
            Record employee promotions, transfers, probation confirmations, or exits.
          </p>
        </div>
      ) : (
        <HRCard title="Auditable Employment Career History">
          <HRTable columns={['Employee', 'Lifecycle Event', 'Previous State', 'New State / Value', 'Effective Date', 'Notes']}>
            {filteredEvents.map((e, idx) => (
              <HRTableRow key={e.id || idx}>
                <HRTableCell><span className="font-extrabold text-[#1A1A2E]">{e.employee || 'Staff'}</span></HRTableCell>
                <HRTableCell>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-[#014582]/10 text-[#014582]">
                    {e.type}
                  </span>
                </HRTableCell>
                <HRTableCell><span className="text-[#7A8FA6]">{e.fromValue || '—'}</span></HRTableCell>
                <HRTableCell><span className="font-bold text-[#1A1A2E]">{e.toValue || '—'}</span></HRTableCell>
                <HRTableCell><span className="text-xs font-semibold text-[#014582]">{e.effective || e.createdAt}</span></HRTableCell>
                <HRTableCell><span className="text-xs text-[#7A8FA6]">{e.notes || '—'}</span></HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      )}

      {/* MODAL: Record Event */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] pb-4 mb-4">
              <h3 className="text-base font-extrabold text-[#1A1A2E]">Record Lifecycle Event</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Employee *</label>
                <select
                  value={form.employeeId}
                  onChange={(e) => {
                    const emp = employees.find((x) => x.id === e.target.value);
                    setForm({
                      ...form,
                      employeeId: e.target.value,
                      fromValue: emp ? `${emp.designation || ''} (${emp.department || ''})` : '',
                    });
                  }}
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  required
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || emp.employeeCode} ({emp.designation || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Event Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                >
                  {eventTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Previous Value / Designation</label>
                  <input
                    type="text"
                    value={form.fromValue}
                    onChange={(e) => setForm({ ...form, fromValue: e.target.value })}
                    placeholder="e.g. Junior Developer"
                    className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1">New Value / Designation *</label>
                  <input
                    type="text"
                    value={form.toValue}
                    onChange={(e) => setForm({ ...form, toValue: e.target.value })}
                    placeholder="e.g. Senior Developer"
                    className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Effective Date</label>
                <input
                  type="date"
                  value={form.effective}
                  onChange={(e) => setForm({ ...form, effective: e.target.value })}
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Reason / Event Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Annual performance evaluation & promotion recommendation..."
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#DDE4EE]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6] hover:bg-[#F0F4F8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#014582] text-white hover:bg-[#013a6b] flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Record Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HRPage>
  );
}
