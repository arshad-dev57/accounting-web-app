'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { Loader2, Pencil, Power } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRTable, HRTableRow, HRTableCell, HRStatusBadge, HRWorkflowNotice } from '../ui';
import { hrCostCenterService, CostCenter } from '@/lib/hr-cost-center-service';
import { hrOfficesService } from '@/lib/hr-offices-service';

const inputCls =
  'w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20';

type Office = { id: string; name: string };

export default function CostCentersPage() {
  const [rows, setRows] = React.useState<CostCenter[]>([]);
  const [offices, setOffices] = React.useState<Office[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    code: '',
    name: '',
    description: '',
    officeId: '',
  });

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [centers, officeRows] = await Promise.all([
        hrCostCenterService.list({
          search: search || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          includeInactive: statusFilter !== 'active',
        }),
        hrOfficesService.list(),
      ]);
      setRows(centers);
      setOffices(officeRows);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load cost centers');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ code: '', name: '', description: '', officeId: '' });
  };

  const startEdit = (row: CostCenter) => {
    setEditingId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      description: row.description || '',
      officeId: row.officeId || '',
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        officeId: form.officeId || null,
      };
      if (editingId) {
        await hrCostCenterService.update(editingId, payload);
        toast.success('Cost center updated');
      } else {
        await hrCostCenterService.create(payload);
        toast.success('Cost center created');
      }
      resetForm();
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row: CostCenter) => {
    try {
      const next = row.status === 'active' ? 'inactive' : 'active';
      await hrCostCenterService.setStatus(row.id, next);
      toast.success(next === 'active' ? 'Cost center activated' : 'Cost center deactivated');
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Status update failed');
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Cost Centers"
        subtitle="Accounting dimension for HR, payroll, and general ledger"
        backHref="/hr/settings"
        actions={
          <a href="/hr/cost-centers/reports" className="text-xs font-bold text-white/90 hover:text-white underline">
            View reports
          </a>
        }
      />
      <HRWorkflowNotice
        title="Enterprise cost center master"
        detail="Cost centers are company-specific. Departments and employees reference this master. Payroll and posted journal lines preserve historical cost center attribution."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HRCard title={editingId ? 'Edit Cost Center' : 'Create Cost Center'}>
          <form className="space-y-3" onSubmit={submit}>
            <label className="block text-xs font-bold text-[#7A8FA6]">
              Code
              <input
                required
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="CC-IT"
                className={`mt-1 ${inputCls}`}
              />
            </label>
            <label className="block text-xs font-bold text-[#7A8FA6]">
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="IT Department"
                className={`mt-1 ${inputCls}`}
              />
            </label>
            <label className="block text-xs font-bold text-[#7A8FA6]">
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className={`mt-1 ${inputCls}`}
                rows={2}
              />
            </label>
            <label className="block text-xs font-bold text-[#7A8FA6]">
              Office / Branch
              <select
                value={form.officeId}
                onChange={(e) => setForm((p) => ({ ...p, officeId: e.target.value }))}
                className={`mt-1 ${inputCls}`}
              >
                <option value="">None</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex-1 bg-[#014582] text-white rounded-xl py-2.5 text-sm font-bold">
                {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="px-4 rounded-xl border border-[#DDE4EE] text-sm font-bold text-[#7A8FA6]">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </HRCard>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or name…"
              className={inputCls}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className={inputCls}
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>

          <HRCard title="Cost Center List" action={<span className="text-[10px] font-bold text-[#7A8FA6]">{rows.length}</span>}>
            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#014582]" /></div>
            ) : (
              <HRTable columns={['Code', 'Name', 'Office', 'Usage', 'Status', 'Actions']}>
                {rows.length === 0 && (
                  <HRTableRow><HRTableCell className="text-[#7A8FA6]">No cost centers yet</HRTableCell></HRTableRow>
                )}
                {rows.map((row) => (
                  <HRTableRow key={row.id}>
                    <HRTableCell className="font-mono font-bold">{row.code}</HRTableCell>
                    <HRTableCell className="font-bold">{row.name}</HRTableCell>
                    <HRTableCell>{row.officeName || '—'}</HRTableCell>
                    <HRTableCell className="text-xs text-[#7A8FA6]">
                      {row.departmentCount || 0} dept · {row.employeeCount || 0} emp
                    </HRTableCell>
                    <HRTableCell>
                      <HRStatusBadge status={row.status === 'active' ? 'Active' : 'Inactive'} />
                    </HRTableCell>
                    <HRTableCell>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEdit(row)} className="p-1.5 rounded-lg hover:bg-[#014582]/10 text-[#014582]" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => toggleStatus(row)} className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600" title={row.status === 'active' ? 'Deactivate' : 'Activate'}>
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </HRTableCell>
                  </HRTableRow>
                ))}
              </HRTable>
            )}
          </HRCard>
        </div>
      </div>
    </HRPage>
  );
}
