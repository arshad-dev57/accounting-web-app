'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getLeads, getLeadFilterOptions, deleteLead, bulkUpdateLeads, updateLead,
  LEAD_STATUSES, STATUS_DOT_COLORS,
  type Lead, type LeadFilterOptions,
} from '@/lib/crm-api';
import { ErpDeskList, type ListColumn } from '../components/ErpDeskForm';

const SAVED_FILTERS_KEY = 'crm.leads.savedFilters';

// ─── Status dot badge ────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const color = STATUS_DOT_COLORS[status] || '#6b7280';
  return (
    <span className="inline-flex items-center justify-start gap-1.5 text-sm text-gray-700 whitespace-nowrap">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="truncate">{status}</span>
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
    width: 'w-44',
  },
  {
    key: 'companyName', label: 'Organization Name', filterType: 'text', filterPlaceholder: 'Organization Name',
    render: (r) => <span className="text-gray-700">{r.companyName || '—'}</span>,
  },
  {
    key: 'territory', label: 'Territory', filterType: 'text', filterPlaceholder: 'Territory',
    render: (r) => <span className="text-gray-600">{r.territory || '—'}</span>,
    width: 'w-32',
  },
  {
    key: 'fullName', label: 'Title', filterType: 'text', filterPlaceholder: 'Title',
    render: (r) => (
      <span className="font-medium text-gray-800">{r.fullName || [r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}</span>
    ),
  },
];

function loadSavedFilters(): { name: string; filters: Record<string, string> }[] {
  try {
    const raw = localStorage.getItem(SAVED_FILTERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Inner content ────────────────────────────────────────────────────────────
function LeadsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({
    status: searchParams.get('status') || '',
    assignedToId: searchParams.get('assignedToId') || '',
    createdBy: searchParams.get('createdBy') || '',
    tags: searchParams.get('tags') || '',
  });
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showTags, setShowTags] = useState(false);
  const [filterOptions, setFilterOptions] = useState<LeadFilterOptions>({
    assignees: [], creators: [], tags: [], unassignedCount: 0,
  });
  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: Record<string, string> }[]>([]);

  useEffect(() => {
    setSavedFilters(loadSavedFilters());
    getLeadFilterOptions().then(setFilterOptions).catch(() => {});
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const search = (
        filters.fullName ||
        filters.leadNumber ||
        filters.companyName ||
        filters.jobTitle ||
        filters.territory ||
        ''
      ).trim();
      const status = (filters.status || '').trim();
      const assignedToId = (filters.assignedToId || '').trim();
      const createdBy = (filters.createdBy || '').trim();
      const tags = (filters.tags || '').trim();

      const result = await getLeads({
        page: 1,
        limit: pageSize,
        sortDir,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(assignedToId ? { assignedToId } : {}),
        ...(createdBy ? { createdBy } : {}),
        ...(tags ? { tags } : {}),
      });
      setLeads(result.leads ?? []);
      setTotal(Number(result.total) || 0);
    } catch (err) {
      console.error('[CRM Leads] fetch failed', err);
      setLeads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize, filters, sortDir]);

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

  const refreshFilterOptions = async () => {
    try {
      setFilterOptions(await getLeadFilterOptions());
    } catch { /* ignore */ }
  };

  const requireSelection = () => {
    if (selectedIds.size === 0) {
      alert('Select at least one lead first.');
      return false;
    }
    return true;
  };

  const handleAssignTo = async () => {
    if (!requireSelection()) return;
    const options = filterOptions.assignees;
    if (options.length === 0) {
      alert('No users available to assign.');
      return;
    }
    const list = options.map((u, i) => `${i + 1}. ${u.label}`).join('\n');
    const pick = window.prompt(`Assign selected leads to:\n${list}\n\nEnter number:`);
    const idx = Number(pick) - 1;
    if (!pick || Number.isNaN(idx) || !options[idx]) return;
    await bulkUpdateLeads([...selectedIds], { assignedToId: options[idx].id });
    setSelectedIds(new Set());
    await fetchLeads();
    await refreshFilterOptions();
  };

  const handleClearAssignment = async () => {
    if (!requireSelection()) return;
    if (!confirm(`Clear assignment for ${selectedIds.size} lead(s)?`)) return;
    await bulkUpdateLeads([...selectedIds], { assignedToId: null });
    setSelectedIds(new Set());
    await fetchLeads();
    await refreshFilterOptions();
  };

  const handleAddTags = async () => {
    if (!requireSelection()) return;
    const tag = window.prompt('Enter tag to add:')?.trim();
    if (!tag) return;
    const selected = leads.filter(l => selectedIds.has(l.id));
    await Promise.all(selected.map(lead => {
      const next = Array.from(new Set([...(lead.tags || []), tag]));
      return updateLead(lead.id, { tags: next }).catch(() => null);
    }));
    setSelectedIds(new Set());
    await fetchLeads();
    await refreshFilterOptions();
  };

  const handleSaveFilter = (name: string) => {
    const next = [
      ...savedFilters.filter(f => f.name !== name),
      { name, filters: { ...filters } },
    ];
    setSavedFilters(next);
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(next));
  };

  const handleApplySavedFilter = (name: string) => {
    const found = savedFilters.find(f => f.name === name);
    if (found) setFilters({ ...found.filters });
  };

  const menuItems = [
    { label: 'Refresh', onClick: () => { fetchLeads(); refreshFilterOptions(); } },
    { label: 'Import', onClick: () => router.push('/crm/import') },
    { label: 'Toggle Sidebar', onClick: () => {} },
    { label: 'Create Prospect', onClick: () => router.push('/crm/prospects') },
    { label: 'Edit', onClick: () => {
      if (selectedIds.size !== 1) { alert('Select exactly one lead to edit.'); return; }
      router.push(`/crm/leads/${[...selectedIds][0]}`);
    }},
    { label: 'Export', onClick: () => {} },
    { label: 'Assign To', onClick: () => { void handleAssignTo(); } },
    { label: 'Clear Assignment', onClick: () => { void handleClearAssignment(); } },
    { label: 'Apply Assignment Rule', onClick: () => alert('Assignment rules are not configured yet.') },
    { label: 'Add Tags', onClick: () => { void handleAddTags(); } },
    { label: 'Print', onClick: () => window.print() },
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
      filterUsers={filterOptions.assignees}
      filterCreators={filterOptions.creators}
      filterTags={filterOptions.tags}
      showTags={showTags}
      onToggleShowTags={() => setShowTags(v => !v)}
      savedFilters={savedFilters}
      onSaveFilter={handleSaveFilter}
      onApplySavedFilter={handleApplySavedFilter}
      getRowTags={(r) => r.tags || []}
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
