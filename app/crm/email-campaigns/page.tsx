'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getEmailCampaigns, createEmailCampaign, deleteEmailCampaign,
  EMAIL_CAMPAIGN_FOR, EMAIL_CAMPAIGN_STATUSES, type EmailCampaign,
} from '@/lib/crm-api';
import {
  ErpDeskList, DeskField, deskInput, deskSelect, type ListColumn,
} from '../components/ErpDeskForm';

const COLUMNS: ListColumn<EmailCampaign>[] = [
  {
    key: 'id', label: 'ID', filterType: 'text', filterPlaceholder: 'ID',
    render: (r) => <span className="text-[#014582] font-medium text-xs">{r.id?.slice(0, 8).toUpperCase()}</span>,
    width: 'w-32',
  },
  {
    key: 'name', label: 'Campaign Name', filterType: 'text', filterPlaceholder: 'Campaign Name',
    render: (r) => <span className="font-medium text-gray-800">{r.name}</span>,
  },
  {
    key: 'emailCampaignFor', label: 'For', filterType: 'select',
    filterOptions: [...EMAIL_CAMPAIGN_FOR],
    filterPlaceholder: 'For',
    render: (r) => <span className="text-gray-700">{r.emailCampaignFor || '—'}</span>,
    width: 'w-28',
  },
  {
    key: 'status', label: 'Status', filterType: 'select',
    filterOptions: [...EMAIL_CAMPAIGN_STATUSES],
    filterPlaceholder: 'Status',
    render: (r) => <span className="text-gray-700">{r.status || '—'}</span>,
    width: 'w-32',
  },
  {
    key: 'startDate', label: 'Start Date', filterType: 'none',
    render: (r) => <span className="text-xs text-gray-600">{r.startDate ? new Date(r.startDate).toLocaleDateString() : '—'}</span>,
    width: 'w-28',
  },
];

const emptyForm = {
  name: '', emailCampaignFor: 'Lead', startDate: '', endDate: '', status: 'Scheduled', notes: '',
};

export default function EmailCampaignsPage() {
  const [items, setItems] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getEmailCampaigns();
      setItems(Array.isArray(rows) ? rows : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      await createEmailCampaign({
        name: form.name.trim(),
        emailCampaignFor: form.emailCampaignFor,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        status: form.status,
        notes: form.notes || undefined,
      });
      toast.success('Email Campaign created');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ErpDeskList<EmailCampaign>
        title="Email Campaign"
        addLabel="Add Email Campaign"
        onAdd={() => setShowModal(true)}
        columns={COLUMNS}
        rows={items}
        loading={loading}
        emptyTitle="You haven't created an Email Campaign yet"
        emptySubtitle="Send bulk emails to Leads or Contacts."
        filters={filters}
        onFilterChange={(key, value) => setFilters((p) => ({ ...p, [key]: value }))}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        sortField="Last Updated On"
        sortDir={sortDir}
        onSortChange={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
        getRowId={(r) => r.id}
        selectedIds={selectedIds}
        onSelect={(id) => setSelectedIds((prev) => {
          const n = new Set(prev);
          n.has(id) ? n.delete(id) : n.add(id);
          return n;
        })}
        onSelectAll={() => setSelectedIds(selectedIds.size === items.length ? new Set() : new Set(items.map((i) => i.id)))}
        totalCount={items.length}
        menuItems={[
          { label: 'Refresh', onClick: load },
          ...(selectedIds.size > 0
            ? [{
                label: `Delete (${selectedIds.size})`,
                onClick: async () => {
                  if (!confirm(`Delete ${selectedIds.size}?`)) return;
                  await Promise.all([...selectedIds].map((id) => deleteEmailCampaign(id).catch(() => {})));
                  setSelectedIds(new Set());
                  load();
                },
              }]
            : []),
        ]}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">New Email Campaign</h3>
            <DeskField label="Name" required>
              <input className={deskInput} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </DeskField>
            <DeskField label="Email Campaign For">
              <select className={deskSelect} value={form.emailCampaignFor} onChange={(e) => setForm((p) => ({ ...p, emailCampaignFor: e.target.value }))}>
                {EMAIL_CAMPAIGN_FOR.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </DeskField>
            <DeskField label="Status">
              <select className={deskSelect} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                {EMAIL_CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </DeskField>
            <div className="grid grid-cols-2 gap-3">
              <DeskField label="Start Date">
                <input type="date" className={deskInput} value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
              </DeskField>
              <DeskField label="End Date">
                <input type="date" className={deskInput} value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
              </DeskField>
            </div>
            <DeskField label="Notes">
              <textarea rows={2} className={deskInput} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </DeskField>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 border rounded-md text-sm">Cancel</button>
              <button type="button" disabled={saving} onClick={handleCreate} className="px-3 py-1.5 bg-[#014582] text-white rounded-md text-sm disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
