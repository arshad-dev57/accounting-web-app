'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getContacts, deleteContact, type Contact } from '@/lib/crm-api';
import { ErpDeskList, type ListColumn } from '../components/ErpDeskForm';

const COLUMNS: ListColumn<Contact>[] = [
  {
    key: 'fullName', label: 'Contact Name', filterType: 'text', filterPlaceholder: 'Contact Name',
    render: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#014582]/10 text-[#014582] flex items-center justify-center text-xs font-semibold shrink-0">
          {(r.firstName?.[0] || 'C').toUpperCase()}
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-gray-900 block truncate">
            {r.fullName || [r.salutation, r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ') || `${r.firstName} ${r.lastName}`.trim()}
          </span>
          {r.isPrimaryContact && (
            <span className="text-[10px] uppercase font-semibold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200/60">
              Primary
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'status', label: 'Status', filterType: 'select',
    filterOptions: ['Passive', 'Open', 'Replied'],
    filterPlaceholder: 'Status',
    render: (r) => {
      const st = r.status || 'Passive';
      const color =
        st === 'Open'
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : st === 'Replied'
          ? 'bg-blue-50 text-blue-800 border-blue-200'
          : 'bg-gray-100 text-gray-700 border-gray-200';
      return (
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${color}`}>
          {st}
        </span>
      );
    },
    width: 'w-28',
  },
  {
    key: 'email', label: 'Email Address', filterType: 'text', filterPlaceholder: 'Email Address',
    render: (r) => <span className="text-gray-700 truncate">{r.email || '—'}</span>,
  },
  {
    key: 'phone', label: 'Mobile / Phone', filterType: 'text', filterPlaceholder: 'Phone',
    render: (r) => <span className="text-gray-700">{r.mobile || r.phone || '—'}</span>,
    width: 'w-36',
  },
  {
    key: 'account', label: 'Company / Organization', filterType: 'text', filterPlaceholder: 'Company',
    render: (r) => <span className="text-gray-800 font-medium truncate">{r.account?.name || (r as any).companyName || '—'}</span>,
  },
  {
    key: 'title', label: 'Designation', filterType: 'text', filterPlaceholder: 'Designation',
    render: (r) => <span className="text-gray-600 truncate">{r.title || r.department || '—'}</span>,
    width: 'w-36',
  },
];

function ContactsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId') || '';

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getContacts({
        page: 1,
        limit: pageSize,
        search: filters['fullName'] || filters['email'] || undefined,
        accountId: accountId || undefined,
      });
      setContacts(result.contacts ?? []);
      setTotal(Number(result.total) || 0);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize, filters, accountId]);

  useEffect(() => { load(); }, [load]);

  const menuItems = [
    { label: 'Refresh', onClick: load },
    { label: 'Import', onClick: () => router.push('/crm/import') },
    { label: 'Export', onClick: () => {} },
    { label: 'Assign To', onClick: () => {} },
    { label: 'Print', onClick: () => {} },
    ...(selectedIds.size > 0
      ? [{
          label: `Delete (${selectedIds.size})`,
          onClick: async () => {
            if (!confirm(`Delete ${selectedIds.size} contacts?`)) return;
            await Promise.all([...selectedIds].map((id) => deleteContact(id).catch(() => {})));
            setSelectedIds(new Set());
            load();
          },
        }]
      : []),
  ];

  return (
    <ErpDeskList<Contact>
      title="Contact"
      addLabel="Add Contact"
      addHref="/crm/contacts/new"
      columns={COLUMNS}
      rows={contacts}
      loading={loading}
      emptyTitle="You haven't created a Contact yet"
      emptySubtitle="People associated with Customers, Leads, and Opportunities."
      filters={filters}
      onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      sortField="Last Updated On"
      sortDir={sortDir}
      onSortChange={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
      getRowId={(r) => r.id}
      onRowClick={(r) => router.push(`/crm/contacts/${r.id}`)}
      selectedIds={selectedIds}
      onSelect={(id) => setSelectedIds((prev) => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      })}
      onSelectAll={() => setSelectedIds(selectedIds.size === contacts.length ? new Set() : new Set(contacts.map((c) => c.id)))}
      totalCount={total}
      menuItems={menuItems}
    />
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-center py-12">Loading…</div>}>
      <ContactsContent />
    </Suspense>
  );
}
