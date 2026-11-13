'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getLeads, deleteLead, updateLeadBoardOrder,
  LEAD_STATUSES, STATUS_DOT_COLORS,
  type Lead,
} from '@/lib/crm-api';
import { ErpDeskList, type ListColumn } from '../components/ErpDeskForm';

// ─── Status dot badge ────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const color = STATUS_DOT_COLORS[status] || '#6b7280';
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      {status}
    </span>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS: ListColumn<Lead>[] = [
  {
    key: 'leadNumber', label: 'ID', filterType: 'text', filterPlaceholder: 'ID',
    render: (r) => <span className="text-[#014582] font-medium text-xs">{r.leadNumber}</span>,
    width: 'w-36',
  },
  {
    key: 'jobTitle', label: 'Job Title', filterType: 'text', filterPlaceholder: 'Job Title',
    render: (r) => <span className="text-gray-700">{r.jobTitle || '—'}</span>,
  },
  {
    key: 'status', label: 'Status', filterType: 'select', filterPlaceholder: 'Status',
    filterOptions: LEAD_STATUSES,
    render: (r) => <StatusDot status={r.status} />,
    width: 'w-40',
  },
  {
    key: 'companyName', label: 'Organization Name', filterType: 'text', filterPlaceholder: 'Organization Name',
    render: (r) => <span className="text-gray-700">{r.companyName || '—'}</span>,
  },
  {
    key: 'territory', label: 'Territory', filterType: 'text', filterPlaceholder: 'Territory',
    render: (r) => <span className="text-gray-600">{(r as unknown as Record<string, string>)['territory'] || '—'}</span>,
    width: 'w-32',
  },
  {
    key: 'fullName', label: 'Title', filterType: 'text', filterPlaceholder: 'Title',
    render: (r) => (
      <span className="font-medium text-gray-800">{r.fullName || [r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}</span>
    ),
  },
];

// ─── Inner content ────────────────────────────────────────────────────────────
function LeadsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({
    status: searchParams.get('status') || '',
  });
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getLeads({
        page: 1, limit: pageSize,
        search: filters['fullName'] || filters['leadNumber'] || undefined,
        status: filters['status'] || undefined,
      });
      setLeads(result.leads ?? []);
      setTotal(Number(result.total) || 0);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize, filters]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.size === leads.length ? new Set() : new Set(leads.map(l => l.id)));
  };

  const menuItems = [
    { label: 'Refresh', onClick: fetchLeads },
    { label: 'Import', onClick: () => router.push('/crm/import') },
    { label: 'Toggle Sidebar', onClick: () => {} },
    { label: 'Create Prospect', onClick: () => router.push('/crm/prospects') },
    { label: 'Edit', onClick: () => {} },
    { label: 'Export', onClick: () => {} },
    { label: 'Assign To', onClick: () => {} },
    { label: 'Clear Assignment', onClick: () => {} },
    { label: 'Apply Assignment Rule', onClick: () => {} },
    { label: 'Add Tags', onClick: () => {} },
    { label: 'Print', onClick: () => {} },
    ...(selectedIds.size > 0
      ? [{ label: `Delete (${selectedIds.size})`, onClick: async () => {
          if (!confirm(`Delete ${selectedIds.size} leads?`)) return;
          await Promise.all([...selectedIds].map(id => deleteLead(id).catch(() => {})));
          setSelectedIds(new Set());
          fetchLeads();
        }}]
      : []),
  ];

  return (
    <ErpDeskList<Lead>
      title="Lead"
      addLabel="Add Lead"
      addHref="/crm/leads/new"
      columns={COLUMNS}
      rows={leads}
      loading={loading}
      emptyTitle="You haven't created a Lead yet"
      emptySubtitle="A Lead is an inquiry from a potential customer."
      filters={filters}
      onFilterChange={handleFilterChange}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      sortField="Last Updated On"
      sortDir={sortDir}
      onSortChange={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
      getRowId={(r) => r.id}
      onRowClick={(r) => router.push(`/crm/leads/${r.id}`)}
      selectedIds={selectedIds}
      onSelect={handleSelect}
      onSelectAll={handleSelectAll}
      totalCount={total}
      menuItems={menuItems}
    />
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-center py-12">Loading…</div>}>
      <LeadsPageContent />
    </Suspense>
  );
}
