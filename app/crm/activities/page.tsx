'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import toast from 'react-hot-toast';
import {
  getActivities, createActivity, deleteActivity,
  ACTIVITY_TYPES, type CRMActivity,
} from '@/lib/crm-api';
import {
  ErpDeskList, DeskField, deskInput, deskSelect, type ListColumn,
} from '../components/ErpDeskForm';

const COLUMNS: ListColumn<CRMActivity>[] = [
  {
    key: 'id', label: 'ID', filterType: 'text', filterPlaceholder: 'ID',
    render: (r) => <span className="text-[#014582] font-medium text-xs">{r.id?.slice(0, 8).toUpperCase()}</span>,
    width: 'w-32',
  },
  {
    key: 'type', label: 'Type', filterType: 'select', filterPlaceholder: 'Type',
    filterOptions: [...ACTIVITY_TYPES],
    render: (r) => <span className="text-gray-700">{r.type}</span>,
    width: 'w-28',
  },
  {
    key: 'status', label: 'Status', filterType: 'select', filterPlaceholder: 'Status',
    filterOptions: ['Planned', 'Completed', 'Cancelled'],
    render: (r) => (
      <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
        <span className={`w-2 h-2 rounded-full ${r.status === 'Completed' ? 'bg-green-500' : r.status === 'Cancelled' ? 'bg-gray-400' : 'bg-blue-500'}`} />
        {r.status}
      </span>
    ),
    width: 'w-32',
  },
  {
    key: 'subject', label: 'Subject', filterType: 'text', filterPlaceholder: 'Subject',
    render: (r) => <span className="font-medium text-gray-800">{r.subject}</span>,
  },
  {
    key: 'dueDate', label: 'Date', filterType: 'none',
    render: (r) => <span className="text-gray-600 text-xs">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString()}</span>,
    width: 'w-28',
  },
];

function ActivitiesContent() {
  const [rows, setRows] = useState<CRMActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'Call', subject: '', description: '', status: 'Planned', dueDate: '', dueTime: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getActivities({
        page: 1,
        limit: pageSize,
        search: filters['subject'] || undefined,
        type: filters['type'] || undefined,
        status: filters['status'] || undefined,
      });
      setRows(result.activities ?? []);
      setTotal(Number(result.total) || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize, filters]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    setSaving(true);
    try {
      await createActivity({
        type: form.type,
        subject: form.subject.trim(),
        description: form.description || undefined,
        status: form.status,
        dueDate: form.dueDate || undefined,
        dueTime: form.dueTime || undefined,
      });
      toast.success('Communication created');
      setShowModal(false);
      setForm({ type: 'Call', subject: '', description: '', status: 'Planned', dueDate: '', dueTime: '' });
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { label: 'Refresh', onClick: load },
    { label: 'Export', onClick: () => {} },
    { label: 'Print', onClick: () => {} },
    ...(selectedIds.size > 0
      ? [{
          label: `Delete (${selectedIds.size})`,
          onClick: async () => {
            if (!confirm(`Delete ${selectedIds.size} items?`)) return;
            await Promise.all([...selectedIds].map((id) => deleteActivity(id).catch(() => {})));
            setSelectedIds(new Set());
            load();
          },
        }]
      : []),
  ];

  return (
    <>
      <ErpDeskList<CRMActivity>
        title="Communication"
        addLabel="Add Communication"
        onAdd={() => setShowModal(true)}
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        emptyTitle="You haven't created a Communication yet"
        emptySubtitle="Log calls, emails, meetings and other communications."
        filters={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        sortField="Last Updated On"
        sortDir={sortDir}
        onSortChange={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
        getRowId={(r) => r.id}
        onRowClick={() => {}}
        selectedIds={selectedIds}
        onSelect={(id) => setSelectedIds((prev) => {
          const n = new Set(prev);
          n.has(id) ? n.delete(id) : n.add(id);
          return n;
        })}
        onSelectAll={() => setSelectedIds(selectedIds.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)))}
        totalCount={total}
        menuItems={menuItems}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">New Communication</h3>
            <DeskField label="Type">
              <select className={deskSelect} value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </DeskField>
            <DeskField label="Subject" required>
              <input className={deskInput} value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} />
            </DeskField>
            <DeskField label="Status">
              <select className={deskSelect} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                {['Planned', 'Completed', 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </DeskField>
            <div className="grid grid-cols-2 gap-3">
              <DeskField label="Date">
                <input type="date" className={deskInput} value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
              </DeskField>
              <DeskField label="Time">
                <input type="time" className={deskInput} value={form.dueTime} onChange={(e) => setForm((p) => ({ ...p, dueTime: e.target.value }))} />
              </DeskField>
            </div>
            <DeskField label="Content">
              <textarea rows={3} className={deskInput} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
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

export default function ActivitiesPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-center py-12">Loading…</div>}>
      <ActivitiesContent />
    </Suspense>
  );
}
