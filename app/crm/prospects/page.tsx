'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, Target } from 'lucide-react';
import { getProspects, deleteProspect, type Prospect } from '@/lib/crm-api';
import { ErpDeskList, type ListColumn } from '../components/ErpDeskForm';

const COLUMNS: ListColumn<Prospect>[] = [
  {
    key: 'companyName', label: 'Organization / Company Name', filterType: 'text', filterPlaceholder: 'Search company…',
    render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#014582]/10 text-[#014582] flex items-center justify-center text-xs font-semibold shrink-0">
          <Building2 className="w-4 h-4 text-[#014582]" />
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-gray-900 block truncate">{r.companyName}</span>
          {r.website && (
            <span className="text-[11px] text-gray-400 block truncate">{r.website}</span>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'customerGroup', label: 'Customer Group', filterType: 'text', filterPlaceholder: 'Customer Group',
    render: (r) => (
      <span className="text-xs text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
        {r.customerGroup || 'Commercial'}
      </span>
    ),
    width: 'w-36',
  },
  {
    key: 'industry', label: 'Industry', filterType: 'text', filterPlaceholder: 'Industry',
    render: (r) => <span className="text-gray-700 text-xs">{r.industry || '—'}</span>,
    width: 'w-36',
  },
  {
    key: 'territory', label: 'Territory', filterType: 'text', filterPlaceholder: 'Territory',
    render: (r) => <span className="text-gray-600 text-xs">{r.territory || 'All Territories'}</span>,
    width: 'w-36',
  },
  {
    key: 'annualRevenue', label: 'Annual Revenue', filterType: 'none',
    render: (r) => (
      <span className="text-xs font-mono font-medium text-emerald-700">
        {r.annualRevenue ? `$${Number(r.annualRevenue).toLocaleString()}` : '—'}
      </span>
    ),
    width: 'w-36',
  },
  {
    key: 'leads', label: 'Leads / Opps', filterType: 'none',
    render: (r) => {
      const leadsCount = r._count?.leads ?? r.leads?.length ?? 0;
      const oppsCount = r._count?.opportunities ?? r.opportunities?.length ?? 0;
      return (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1 bg-blue-50 text-[#014582] px-1.5 py-0.5 rounded font-medium">
            <Users className="w-3 h-3" /> {leadsCount}
          </span>
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-medium">
            <Target className="w-3 h-3" /> {oppsCount}
          </span>
        </div>
      );
    },
    width: 'w-36',
  },
];

export default function ProspectsPage() {
  const router = useRouter();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getProspects({ search: filters['companyName'] || undefined });
      const arr = Array.isArray(rows) ? rows : [];
      setProspects(arr);
      setTotal(arr.length);
    } catch {
      setProspects([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  const menuItems = [
    { label: 'Refresh', onClick: fetchProspects },
    { label: 'Import', onClick: () => router.push('/crm/import') },
    { label: 'Toggle Sidebar', onClick: () => {} },
    { label: 'Edit', onClick: () => {} },
    { label: 'Export', onClick: () => {} },
    { label: 'Assign To', onClick: () => {} },
    { label: 'Print', onClick: () => {} },
    ...(selectedIds.size > 0
      ? [{ label: `Delete (${selectedIds.size})`, onClick: async () => {
          if (!confirm(`Delete ${selectedIds.size} prospects?`)) return;
          await Promise.all([...selectedIds].map(id => deleteProspect(id).catch(() => {})));
          setSelectedIds(new Set());
          fetchProspects();
        }}]
      : []),
  ];

  return (
    <ErpDeskList<Prospect>
      title="Prospect"
      addLabel="Add Prospect"
      addHref="/crm/prospects/new"
      columns={COLUMNS}
      rows={prospects}
      loading={loading}
      emptyTitle="You haven't created a Prospect yet"
      emptySubtitle="A company you are trying to win as a customer, with its leads."
      filters={filters}
      onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      sortField="Last Updated On"
      sortDir={sortDir}
      onSortChange={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
      getRowId={(r) => r.id}
      onRowClick={(r) => router.push(`/crm/prospects/${r.id}`)}
      selectedIds={selectedIds}
      onSelect={(id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
      onSelectAll={() => setSelectedIds(selectedIds.size === prospects.length ? new Set() : new Set(prospects.map(p => p.id)))}
      totalCount={total}
      menuItems={menuItems}
    />
  );
}
