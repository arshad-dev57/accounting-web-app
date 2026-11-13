'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getContracts, deleteContract,
  CONTRACT_STATUSES, CONTRACT_PARTY_TYPES, type CrmContract,
} from '@/lib/crm-api';
import { ErpDeskList, type ListColumn } from '../components/ErpDeskForm';

const CONTRACT_FULFILMENT_STATUSES = ['N/A', 'Unfulfilled', 'Partially Fulfilled', 'Fulfilled', 'Lapsed'];

const STATUS_COLORS: Record<string, string> = {
  'Unsigned': '#f59e0b',
  'Active': '#22c55e',
  'Inactive': '#6b7280',
};

function StatusDot({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || '#6b7280';
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      {status}
    </span>
  );
}

const COLUMNS: ListColumn<CrmContract>[] = [
  {
    key: 'contractNumber', label: 'ID', filterType: 'text', filterPlaceholder: 'ID',
    render: (r) => <span className="text-[#014582] font-medium text-xs">{r.contractNumber || r.id?.slice(0, 8).toUpperCase()}</span>,
    width: 'w-36',
  },
  {
    key: 'partyName', label: 'Party Name', filterType: 'text', filterPlaceholder: 'Party Name',
    render: (r) => <span className="font-medium text-gray-800">{r.partyName}</span>,
  },
  {
    key: 'status', label: 'Status', filterType: 'select',
    filterOptions: [...CONTRACT_STATUSES],
    filterPlaceholder: 'Status',
    render: (r) => <StatusDot status={r.status || 'Unsigned'} />,
    width: 'w-36',
  },
  {
    key: 'fulfilmentStatus', label: 'Fulfilment Status', filterType: 'select',
    filterOptions: CONTRACT_FULFILMENT_STATUSES,
    filterPlaceholder: 'Fulfilment Status',
    render: (r) => <span className="text-gray-700">{r.fulfilmentStatus || 'N/A'}</span>,
    width: 'w-40',
  },
  {
    key: 'contractTerms', label: 'Document Name', filterType: 'text', filterPlaceholder: 'Document Name',
    render: (r) => (
      <span className="text-gray-600 text-xs line-clamp-1">{r.contractTerms?.slice(0, 40) || '—'}</span>
    ),
  },
];

export default function ContractsPage() {
  const router = useRouter();
  const [items, setItems] = useState<CrmContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getContracts({ status: filters['status'] || undefined });
      setItems(Array.isArray(rows) ? rows : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const menuItems = [
    { label: 'Refresh', onClick: load },
    { label: 'Toggle Sidebar', onClick: () => {} },
    { label: 'Edit', onClick: () => {} },
    { label: 'Export', onClick: () => {} },
    { label: 'Assign To', onClick: () => {} },
    { label: 'Print', onClick: () => {} },
    { label: 'Submit', onClick: () => {} },
    { label: 'Cancel', onClick: () => {} },
    ...(selectedIds.size > 0
      ? [{ label: `Delete (${selectedIds.size})`, onClick: async () => {
          if (!confirm(`Delete ${selectedIds.size} contracts?`)) return;
          await Promise.all([...selectedIds].map(id => deleteContract(id).catch(() => {})));
          setSelectedIds(new Set());
          load();
        }}]
      : []),
  ];

  return (
    <ErpDeskList<CrmContract>
      title="Contract"
      addLabel="Add Contract"
      addHref="/crm/contracts/new"
      columns={COLUMNS}
      rows={items}
      loading={loading}
      emptyTitle="You haven't created a Contract yet"
      emptySubtitle="Contracts are legally binding documents between parties."
      filters={filters}
      onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      sortField="Last Updated On"
      sortDir={sortDir}
      onSortChange={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
      getRowId={(r) => r.id}
      onRowClick={(r) => router.push(`/crm/contracts/${r.id}`)}
      selectedIds={selectedIds}
      onSelect={(id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
      onSelectAll={() => setSelectedIds(selectedIds.size === items.length ? new Set() : new Set(items.map(i => i.id)))}
      totalCount={items.length}
      menuItems={menuItems}
    />
  );
}
