'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getOpportunities, deleteOpportunity,
  OPPORTUNITY_STATUSES,
  type Opportunity,
} from '@/lib/crm-api';
import { ErpDeskList, type ListColumn } from '../components/ErpDeskForm';

const OPP_STATUS_COLORS: Record<string, string> = {
  'Open': '#2490ef',
  'Quotation': '#f59e0b',
  'Converted': '#22c55e',
  'Lost': '#ef4444',
  'Replied': '#06b6d4',
  'Closed': '#6b7280',
};

function OppStatusBadge({ status }: { status: string }) {
  const color = OPP_STATUS_COLORS[status] || '#6b7280';
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      {status}
    </span>
  );
}

const COLUMNS: ListColumn<Opportunity>[] = [
  {
    key: 'opportunityNumber', label: 'ID', filterType: 'text', filterPlaceholder: 'ID',
    render: (r) => <span className="text-[#014582] font-medium text-xs">{(r as unknown as Record<string, string>)['opportunityNumber'] || r.id?.slice(0, 8)}</span>,
    width: 'w-36',
  },
  {
    key: 'opportunityFrom', label: 'Opportunity From', filterType: 'select',
    filterOptions: ['Lead', 'Customer'],
    filterPlaceholder: 'Opportunity From',
    render: (r) => <span className="text-gray-700">{(r as unknown as Record<string, string>)['opportunityFrom'] || '—'}</span>,
    width: 'w-36',
  },
  {
    key: 'party', label: 'Party', filterType: 'text', filterPlaceholder: 'Party',
    render: (r) => (
      <span className="text-gray-700">
        {(r as unknown as Record<string, string>)['party'] ||
         r.account?.name ||
         `${r.contact?.firstName || ''} ${r.contact?.lastName || ''}`.trim() ||
         '—'}
      </span>
    ),
  },
  {
    key: 'status', label: 'Status', filterType: 'select',
    filterOptions: OPPORTUNITY_STATUSES || ['Open', 'Quotation', 'Converted', 'Lost', 'Replied', 'Closed'],
    filterPlaceholder: 'Status',
    render: (r) => <OppStatusBadge status={(r as unknown as Record<string, string>)['oppStatus'] || r.stage || 'Open'} />,
    width: 'w-32',
  },
  {
    key: 'name', label: 'Title', filterType: 'text', filterPlaceholder: 'Title',
    render: (r) => <span className="font-medium text-gray-800">{r.name}</span>,
  },
];

function OpportunitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({
    status: searchParams.get('status') || '',
  });
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchOpps = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOpportunities({
        page: 1, limit: pageSize,
        search: filters['name'] || undefined,
        stage: filters['status'] || undefined,
      });
      setOpportunities(result.opportunities ?? []);
      setTotal(Number(result.total) || 0);
    } catch {
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize, filters]);

  useEffect(() => { fetchOpps(); }, [fetchOpps]);

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

  const menuItems = [
    { label: 'Refresh', onClick: fetchOpps },
    { label: 'Set as Open', onClick: () => {} },
    { label: 'Set as Closed', onClick: () => {} },
    { label: 'Import', onClick: () => router.push('/crm/import') },
    { label: 'Toggle Sidebar', onClick: () => {} },
    { label: 'Edit', onClick: () => {} },
    { label: 'Export', onClick: () => {} },
    { label: 'Assign To', onClick: () => {} },
    { label: 'Clear Assignment', onClick: () => {} },
    { label: 'Apply Assignment Rule', onClick: () => {} },
    { label: 'Add Tags', onClick: () => {} },
    { label: 'Print', onClick: () => {} },
    ...(selectedIds.size > 0
      ? [{ label: `Delete (${selectedIds.size})`, onClick: async () => {
          if (!confirm(`Delete ${selectedIds.size} opportunities?`)) return;
          await Promise.all([...selectedIds].map(id => deleteOpportunity(id).catch(() => {})));
          setSelectedIds(new Set());
          fetchOpps();
        }}]
      : []),
  ];

  return (
    <ErpDeskList<Opportunity>
      title="Opportunity"
      addLabel="Add Opportunity"
      addHref="/crm/opportunities/new"
      columns={COLUMNS}
      rows={opportunities}
      loading={loading}
      emptyTitle="Potential Sales Deal"
      emptySubtitle="Track your sales opportunities through stages."
      filters={filters}
      onFilterChange={handleFilterChange}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      sortField="Last Updated On"
      sortDir={sortDir}
      onSortChange={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
      getRowId={(r) => r.id}
      onRowClick={(r) => router.push(`/crm/opportunities/${r.id}`)}
      selectedIds={selectedIds}
      onSelect={handleSelect}
      onSelectAll={() => setSelectedIds(selectedIds.size === opportunities.length ? new Set() : new Set(opportunities.map(o => o.id)))}
      totalCount={total}
      menuItems={menuItems}
    />
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-center py-12">Loading…</div>}>
      <OpportunitiesContent />
    </Suspense>
  );
}
