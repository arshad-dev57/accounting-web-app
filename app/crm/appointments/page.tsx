'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAppointments, deleteAppointment, type CrmAppointment } from '@/lib/crm-api';
import { ErpDeskList, type ListColumn } from '../components/ErpDeskForm';

const COLUMNS: ListColumn<CrmAppointment>[] = [
  {
    key: 'id', label: 'ID', filterType: 'text', filterPlaceholder: 'ID',
    render: (r) => <span className="text-[#014582] font-medium text-xs">{r.id?.slice(0, 8).toUpperCase()}</span>,
    width: 'w-32',
  },
  {
    key: 'status', label: 'Tag', filterType: 'none',
    render: (r) => (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        {r.status}
      </span>
    ),
    width: 'w-28',
  },
  {
    key: 'scheduledTime', label: 'Scheduled Time', filterType: 'none',
    render: (r) => (
      <span className="text-gray-700">
        {r.scheduledTime ? new Date(r.scheduledTime).toLocaleString() : '—'}
      </span>
    ),
    width: 'w-44',
  },
  {
    key: 'customerName', label: 'Name', filterType: 'text', filterPlaceholder: 'Name',
    render: (r) => <span className="font-medium text-gray-800">{r.customerName}</span>,
  },
];

export default function AppointmentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<CrmAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAppointments();
      setItems(Array.isArray(rows) ? rows : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const menuItems = [
    { label: 'Refresh', onClick: load },
    { label: 'Toggle Sidebar', onClick: () => {} },
    { label: 'Edit', onClick: () => {} },
    { label: 'Export', onClick: () => {} },
    { label: 'Assign To', onClick: () => {} },
    { label: 'Print', onClick: () => {} },
    ...(selectedIds.size > 0
      ? [{ label: `Delete (${selectedIds.size})`, onClick: async () => {
          if (!confirm(`Delete ${selectedIds.size} appointments?`)) return;
          await Promise.all([...selectedIds].map(id => deleteAppointment(id).catch(() => {})));
          setSelectedIds(new Set());
          load();
        }}]
      : []),
  ];

  return (
    <ErpDeskList<CrmAppointment>
      title="Appointment"
      addLabel="Add Appointment"
      addHref="/crm/appointments/new"
      columns={COLUMNS}
      rows={items}
      loading={loading}
      emptyTitle="You haven't created a Appointment yet"
      emptySubtitle="Schedule and manage customer appointments."
      filters={filters}
      onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      sortField="Last Updated On"
      sortDir={sortDir}
      onSortChange={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
      getRowId={(r) => r.id}
      onRowClick={(r) => router.push(`/crm/appointments/${r.id}`)}
      selectedIds={selectedIds}
      onSelect={(id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
      onSelectAll={() => setSelectedIds(selectedIds.size === items.length ? new Set() : new Set(items.map(i => i.id)))}
      totalCount={items.length}
      menuItems={menuItems}
    />
  );
}
