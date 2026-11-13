'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAccounts, type CRMAccount } from '@/lib/crm-api';
import { ErpDeskList, type ListColumn } from '../components/ErpDeskForm';

const CUSTOMER_TYPES = ['Individual', 'Company'];
const CUSTOMER_GROUPS = ['Commercial', 'Government', 'Individual', 'Non Profit'];

const COLUMNS: ListColumn<CRMAccount>[] = [
  {
    key: 'customerNumber', label: 'ID', filterType: 'text', filterPlaceholder: 'ID',
    render: (r) => <span className="text-[#014582] font-medium text-xs">{r.customerNumber}</span>,
    width: 'w-36',
  },
  {
    key: 'name', label: 'Customer Name', filterType: 'text', filterPlaceholder: 'Customer Name',
    render: (r) => <span className="font-medium text-gray-800">{r.name}</span>,
  },
  {
    key: 'type', label: 'Customer Group', filterType: 'select',
    filterOptions: CUSTOMER_GROUPS,
    filterPlaceholder: 'Customer Group',
    render: (r) => <span className="text-gray-700">{r.type || '—'}</span>,
    width: 'w-40',
  },
  {
    key: 'territory', label: 'Territory', filterType: 'text', filterPlaceholder: 'Territory',
    render: (r) => <span className="text-gray-600">{(r as unknown as Record<string, string>)['territory'] || '—'}</span>,
    width: 'w-32',
  },
];

export default function CustomersPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<CRMAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAccounts({
        page: 1, limit: pageSize,
        search: filters['name'] || undefined,
      });
      setAccounts(result.accounts ?? []);
      setTotal(Number(result.total) || 0);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize, filters]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

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
    { label: 'Refresh', onClick: fetchAccounts },
    { label: 'Import', onClick: () => router.push('/crm/import') },
    { label: 'Toggle Sidebar', onClick: () => {} },
    { label: 'Edit', onClick: () => {} },
    { label: 'Export', onClick: () => {} },
    { label: 'Assign To', onClick: () => {} },
    { label: 'Clear Assignment', onClick: () => {} },
    { label: 'Apply Assignment Rule', onClick: () => {} },
    { label: 'Add Tags', onClick: () => {} },
    { label: 'Print', onClick: () => {} },
    { label: 'Delete', onClick: () => {} },
  ];

  return (
    <ErpDeskList<CRMAccount>
      title="Customer"
      addLabel="Add Customer"
      addHref="/crm/accounts/new"
      columns={COLUMNS}
      rows={accounts}
      loading={loading}
      emptyTitle="Buyer of Goods and Services."
      emptySubtitle="Create your first Customer"
      filters={filters}
      onFilterChange={handleFilterChange}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      sortField="Last Updated On"
      sortDir={sortDir}
      onSortChange={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
      getRowId={(r) => r.id}
      onRowClick={(r) => router.push(`/crm/accounts/${r.id}`)}
      selectedIds={selectedIds}
      onSelect={handleSelect}
      onSelectAll={() => setSelectedIds(selectedIds.size === accounts.length ? new Set() : new Set(accounts.map(a => a.id)))}
      totalCount={total}
      menuItems={menuItems}
    />
  );
}
