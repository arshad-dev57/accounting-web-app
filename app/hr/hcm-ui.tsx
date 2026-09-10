'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRTable, HRTableRow, HRTableCell, HRStatusBadge, HRWorkflowNotice } from './ui';

export function HcmCrudPage({
  title,
  subtitle,
  notice,
  columns,
  load,
  create,
  fields,
  rowCells,
  createLabel = 'Save',
}: {
  title: string;
  subtitle: string;
  notice: string;
  columns: string[];
  load: () => Promise<any[]>;
  create: (input: Record<string, unknown>) => Promise<any>;
  fields: { key: string; label: string; type?: string; options?: string[] }[];
  rowCells: (row: any) => React.ReactNode;
  createLabel?: string;
}) {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      setRows(await load());
    } catch (error: any) {
      toast.error(error.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void refresh();
    // load once on mount; parent passes a stable API call
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      fields.forEach((f) => {
        payload[f.key] = f.type === 'number' ? Number(form[f.key] || 0) : form[f.key] || '';
      });
      await create(payload);
      toast.success('Saved');
      setForm({});
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HRPage>
      <HRPageHeader title={title} subtitle={subtitle} backHref="/hr/dashboard" />
      <HRWorkflowNotice title="Extends existing HR" detail={notice} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HRCard title={createLabel}>
          <form className="space-y-3" onSubmit={submit}>
            {fields.map((f) => (
              <label key={f.key} className="block text-xs font-bold text-[#7A8FA6]">
                {f.label}
                {f.options ? (
                  <select
                    value={form[f.key] || ''}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm text-[#1A1A2E]"
                  >
                    <option value="">Select</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={form[f.key] || ''}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm text-[#1A1A2E]"
                  />
                )}
              </label>
            ))}
            <button type="submit" disabled={saving} className="w-full bg-[#014582] text-white rounded-xl py-2.5 text-sm font-bold">
              {saving ? 'Saving…' : createLabel}
            </button>
          </form>
        </HRCard>
        <div className="lg:col-span-2">
          <HRCard title="Records" action={<span className="text-[10px] font-bold text-[#7A8FA6]">{rows.length}</span>}>
            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#014582]" /></div>
            ) : (
              <HRTable columns={columns}>
                {rows.length === 0 && (
                  <HRTableRow><HRTableCell className="text-[#7A8FA6]">No records yet</HRTableCell></HRTableRow>
                )}
                {rows.map((row) => (
                  <HRTableRow key={row.id}>{rowCells(row)}</HRTableRow>
                ))}
              </HRTable>
            )}
          </HRCard>
        </div>
      </div>
    </HRPage>
  );
}

export { HRStatusBadge };
