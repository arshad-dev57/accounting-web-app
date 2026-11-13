'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getCampaigns, deleteCampaign, type Campaign } from '@/lib/crm-api';
import { ErpDeskList, type ListColumn } from '../components/ErpDeskForm';

const COLUMNS: ListColumn<Campaign>[] = [
  {
    key: 'id', label: 'ID', filterType: 'text', filterPlaceholder: 'ID',
    render: (r) => <span className="text-[#014582] font-medium text-xs">{r.id?.slice(0, 8).toUpperCase()}</span>,
    width: 'w-32',
  },
  {
    key: 'tags', label: 'Tag', filterType: 'none',
    render: (r) => (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        {Array.isArray(r.tags) && r.tags.length > 0 ? r.tags[0] : r.type}
      </span>
    ),
    width: 'w-28',
  },
  {
    key: 'description', label: 'Description', filterType: 'none',
    render: (r) => (
      <span className="text-gray-600 text-sm line-clamp-1">
        {r.description || r.name}
      </span>
    ),
  },
];

function CampaignsContent() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCampaigns({ page: 1, limit: pageSize });
      setCampaigns(result.campaigns ?? []);
      setTotal(Number(result.total) || 0);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { load(); }, [load]);

  const menuItems = [
    { label: 'Refresh', onClick: load },
    { label: 'Import', onClick: () => router.push('/crm/import') },
    { label: 'Toggle Sidebar', onClick: () => {} },
    { label: 'Edit', onClick: () => {} },
    { label: 'Export', onClick: () => {} },
    { label: 'Assign To', onClick: () => {} },
    { label: 'Print', onClick: () => {} },
    ...(selectedIds.size > 0
      ? [{ label: `Delete (${selectedIds.size})`, onClick: async () => {
          if (!confirm(`Delete ${selectedIds.size} campaigns?`)) return;
          await Promise.all([...selectedIds].map(id => deleteCampaign(id).catch(() => {})));
          setSelectedIds(new Set());
          load();
        }}]
      : []),
  ];

  return (
    <ErpDeskList<Campaign>
      title="Campaign"
      addLabel="Add Campaign"
      addHref="/crm/campaigns/new"
      columns={COLUMNS}
      rows={campaigns}
      loading={loading}
      emptyTitle="Keep Track of Sales Campaigns."
      emptySubtitle="Keep track of Leads, Quotations, Sales Order etc from Campaigns to gauge Return on Investment."
      filters={filters}
      onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      sortField="Last Updated On"
      sortDir={sortDir}
      onSortChange={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
      getRowId={(r) => r.id}
      onRowClick={(r) => router.push(`/crm/campaigns/${r.id}`)}
      selectedIds={selectedIds}
      onSelect={(id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
      onSelectAll={() => setSelectedIds(selectedIds.size === campaigns.length ? new Set() : new Set(campaigns.map(c => c.id)))}
      totalCount={total}
      menuItems={menuItems}
    />
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-center py-12">Loading…</div>}>
      <CampaignsContent />
    </Suspense>
  );
}
