'use client';
import React from 'react';
import { Palmtree, Plus, Loader2, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { HRPage, HRPageHeader, HRCard, HRTable, HRTableRow, HRTableCell, HRWorkflowNotice } from '../ui';
import { hrHolidaysService, type HRHoliday, type HRHolidayType } from '@/lib/hr-holidays-service';

const TYPE_COLORS: Record<HRHolidayType, string> = {
  National: '#014582',
  Religious: '#2ECC71',
  Company: '#F39C12',
};

const TYPES = ['National', 'Religious', 'Company'] as const;

const inputCls =
  'w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]/50 transition-all disabled:opacity-60';

type FormState = {
  name: string;
  date: string;
  type: HRHolidayType;
};

const EMPTY_FORM: FormState = {
  name: '',
  date: '',
  type: 'National',
};

export default function HolidaysPage() {
  const [holidays, setHolidays] = React.useState<HRHoliday[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState<HRHoliday | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const loadHolidays = React.useCallback(async () => {
    try {
      const data = await hrHolidaysService.list();
      setHolidays(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (holiday: HRHoliday) => {
    setEditing(holiday);
    setForm({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Holiday name is required';
    if (!form.date.trim()) next.date = 'Date is required';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      next.date = 'Date must be in YYYY-MM-DD format';
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
        date: form.date,
        type: form.type,
      };
      if (editing) {
        await hrHolidaysService.update(editing.id, payload);
        toast.success(`Holiday "${payload.name}" updated`);
      } else {
        await hrHolidaysService.create(payload);
        toast.success(`Holiday "${payload.name}" created`);
      }
      setShowModal(false);
      await loadHolidays();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (holiday: HRHoliday) => {
    if (!window.confirm(`Delete holiday "${holiday.name}"? This cannot be undone.`)) return;
    setDeleting(holiday.id);
    try {
      await hrHolidaysService.delete(holiday.id);
      toast.success(`Holiday "${holiday.name}" deleted`);
      await loadHolidays();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete holiday');
    } finally {
      setDeleting(null);
    }
  };

  return (
<HRPage>
      <HRPageHeader
        title="Holiday Management"
        subtitle={`${holidays.length} holidays in the calendar`}
        backHref="/hr/dashboard"
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Holiday
          </button>
        }
      />

      <HRWorkflowNotice title="Holiday calendars" detail="Holiday changes should update attendance and leave calculations for the selected office or policy, while preserving past closed payroll periods." />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#014582] animate-spin" />
        </div>
      ) : holidays.length === 0 ? (
        <HRCard>
          <div className="py-10 text-center">
            <Palmtree className="w-10 h-10 text-[#DDE4EE] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#1A1A2E]">No holidays yet</p>
            <p className="text-xs text-[#7A8FA6] mt-1">
              Add your first holiday to the company calendar.
            </p>
            <button
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-2 bg-[#014582] hover:bg-[#013a6b] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Holiday
            </button>
          </div>
        </HRCard>
      ) : (
        <HRCard>
          <HRTable columns={['Holiday', 'Date', 'Day', 'Type', '']}>
            {holidays.map((h) => (
              <HRTableRow key={h.id}>
                <HRTableCell className="font-bold">
                  <span className="flex items-center gap-2">
                    <Palmtree className="w-4 h-4" style={{ color: TYPE_COLORS[h.type] }} />
                    {h.name}
                  </span>
                </HRTableCell>
                <HRTableCell>{h.date}</HRTableCell>
                <HRTableCell>{h.day}</HRTableCell>
                <HRTableCell>
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: `${TYPE_COLORS[h.type]}1A`, color: TYPE_COLORS[h.type] }}
                  >
                    {h.type}
                  </span>
                </HRTableCell>
                <HRTableCell>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(h)}
                      className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#014582] hover:bg-[#014582]/10 transition-all"
                      title="Edit holiday"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(h)}
                      disabled={deleting === h.id}
                      className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#E74C3C] hover:bg-[#E74C3C]/10 transition-all disabled:opacity-50"
                      title="Delete holiday"
                    >
                      {deleting === h.id ? (
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
                {editing ? 'Edit Holiday' : 'Add Holiday'}
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
                    Holiday Name <span className="text-[#E74C3C]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Labour Day"
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={saving}
                  />
                  {errors.name && (
                    <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">
                    Date <span className="text-[#E74C3C]">*</span>
                  </label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    disabled={saving}
                  />
                  {errors.date && (
                    <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">{errors.date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Type</label>
                  <select
                    className={inputCls}
                    value={form.type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        type: e.target.value as HRHolidayType,
                      }))
                    }
                    disabled={saving}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                {form.date && (
                  <div className="text-xs text-[#7A8FA6] font-medium">
                    Falls on{' '}
                    <span className="font-bold text-[#014582]">
                      {new Date(form.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                      })}
                    </span>
                  </div>
                )}
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
                  {editing ? 'Save Changes' : 'Create Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HRPage>
  );
}
