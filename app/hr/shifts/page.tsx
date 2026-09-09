'use client';

import React from 'react';
import { Clock, Plus, Loader2, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRStatusBadge,
  HRTable,
  HRTableRow,
  HRTableCell,
  HRWorkflowNotice,
} from '../ui';
import { hrShiftsService, type HRShift } from '@/lib/hr-shifts-service';

const inputCls =
  'w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]/50 transition-all disabled:opacity-60';

const STATUSES = ['Active', 'Scheduled', 'Draft', 'Inactive'] as const;

type FormState = {
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: string;
  status: (typeof STATUSES)[number];
};

const EMPTY_FORM: FormState = {
  name: '',
  startTime: '09:00 AM',
  endTime: '06:00 PM',
  graceMinutes: '15',
  status: 'Active',
};

const formatGrace = (m: number) => `${m} min`;

export default function ShiftsPage() {
  const [shifts, setShifts] = React.useState<HRShift[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState<HRShift | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const loadShifts = React.useCallback(async () => {
    try {
      const data = await hrShiftsService.list();
      setShifts(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (shift: HRShift) => {
    setEditing(shift);
    setForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      graceMinutes: String(shift.graceMinutes),
      status: shift.status,
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Shift name is required';
    if (!form.startTime.trim()) next.startTime = 'Start time is required';
    if (!form.endTime.trim()) next.endTime = 'End time is required';
    const grace = Number(form.graceMinutes);
    if (!Number.isFinite(grace) || grace < 0) {
      next.graceMinutes = 'Formato grace period needs a non-negative number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        startTime: form.startTime.trim(),
        endTime: form.endTime.trim(),
        graceMinutes: Number(form.graceMinutes),
        status: form.status,
      };
      if (editing) {
        await hrShiftsService.update(editing.id, payload);
        toast.success(`Shift "${payload.name}" updated`);
      } else {
        await hrShiftsService.create(payload);
        toast.success(`Shift "${payload.name}" created`);
      }
      setShowModal(false);
      await loadShifts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save shift');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shift: HRShift) => {
    if (!window.confirm(`Delete shift "${shift.name}"? This cannot be undone.`)) return;
    setDeleting(shift.id);
    try {
      await hrShiftsService.delete(shift.id);
      toast.success(`Shift "${shift.name}" deleted`);
      await loadShifts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete shift');
    } finally {
      setDeleting(null);
    }
  };

  return (
<HRPage>
      <HRPageHeader
        title="Shift Management"
        subtitle={`${shifts.length} shifts configured`}
        backHref="/hr/dashboard"
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Shift
          </button>
        }
      />

      <HRWorkflowNotice title="Shift design and assignment" detail="Create shift rules here, then assign them by employee, department, office, or rotation in the roster workflow. Changes should take effect from a selected date." />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#014582] animate-spin" />
        </div>
      ) : shifts.length === 0 ? (
        <HRCard>
          <div className="py-10 text-center">
            <Clock className="w-10 h-10 text-[#DDE4EE] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#1A1A2E]">No shifts yet</p>
            <p className="text-xs text-[#7A8FA6] mt-1">
              Add your first shift to start assigning employees and attendance schedules.
            </p>
            <button
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-2 bg-[#014582] hover:bg-[#013a6b] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Shift
            </button>
          </div>
        </HRCard>
      ) : (
        <HRCard>
          <HRTable columns={['Shift', 'Timing', 'Grace Period', 'Employees', 'Status', '']}>
            {shifts.map((s) => (
              <HRTableRow key={s.id}>
                <HRTableCell className="font-bold">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#014582]" />
                    {s.name}
                  </span>
                </HRTableCell>
                <HRTableCell>
                  {s.startTime} – {s.endTime}
                </HRTableCell>
                <HRTableCell>{formatGrace(s.graceMinutes)}</HRTableCell>
                <HRTableCell className="font-semibold">{s.employees}</HRTableCell>
                <HRTableCell>
                  <HRStatusBadge status={s.status} />
                </HRTableCell>
                <HRTableCell>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#014582] hover:bg-[#014582]/10 transition-all"
                      title="Edit shift"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={deleting === s.id}
                      className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#E74C3C] hover:bg-[#E74C3C]/10 transition-all disabled:opacity-50"
                      title="Delete shift"
                    >
                      {deleting === s.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      )}
{showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !saving && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE4EE]">
              <h2 className="text-sm font-bold text-[#1A1A2E]">
                {editing ? 'Edit Shift' : 'Add Shift'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-all"
                disabled={saving}
              >
                <X className="w-4 h-4 text-[#7A8FA6]" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">
                    Shift Name <span className="text-[#E74C3C]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Morning Shift"
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={saving}
                  />
                  {errors.name && (
                    <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">{errors.name}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">
                      Start Time <span className="text-[#E74C3C]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="09:00 AM"
                      className={inputCls}
                      value={form.startTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                      disabled={saving}
                    />
                    {errors.startTime && (
                      <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">{errors.startTime}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">
                      End Time <span className="text-[#E74C3C]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="06:00 PM"
                      className={inputCls}
                      value={form.endTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                      disabled={saving}
                    />
                    {errors.endTime && (
                      <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">{errors.endTime}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">
                      Grace Period (min)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className={inputCls}
                      value={form.graceMinutes}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, graceMinutes: e.target.value }))
                      }
                      disabled={saving}
                    />
                    {errors.graceMinutes && (
                      <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">
                        {errors.graceMinutes}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Status</label>
                    <select
                      className={inputCls}
                      value={form.status}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          status: e.target.value as FormState['status'],
                        }))
                      }
                      disabled={saving}
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
<div className="flex justify-end gap-2 px-5 py-4 border-t border-[#DDE4EE]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6] hover:bg-gray-100 transition-all"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#014582] hover:bg-[#013a6b] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editing ? 'Save Changes' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HRPage>
  );
}
