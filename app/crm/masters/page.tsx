'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Database, Plus, Trash2, RefreshCw } from 'lucide-react';
import {
  getSalesStages, createSalesStage, deleteSalesStage,
  getOpportunityTypes, createOpportunityType, deleteOpportunityType,
  getMarketSegments, createMarketSegment, deleteMarketSegment,
  getTerritories, createTerritory, deleteTerritory,
  getCustomerGroups, createCustomerGroup, deleteCustomerGroup,
  getLostReasons, createLostReason, deleteLostReason,
  getCompetitors, createCompetitor, deleteCompetitor,
  getLeadSources, createLeadSource, deleteLeadSource,
  seedErpnextMasters,
  type CrmMasterRecord,
} from '@/lib/crm-api';
import toast from 'react-hot-toast';

type MasterTab =
  | 'sales-stage' | 'opportunity-type' | 'market-segment' | 'territory'
  | 'customer-group' | 'lost-reason' | 'competitor' | 'lead-source';

const TABS: { id: MasterTab; label: string }[] = [
  { id: 'sales-stage', label: 'Sales Stage' },
  { id: 'opportunity-type', label: 'Opportunity Type' },
  { id: 'market-segment', label: 'Market Segment' },
  { id: 'territory', label: 'Territory' },
  { id: 'customer-group', label: 'Customer Group' },
  { id: 'lost-reason', label: 'Lost Reason' },
  { id: 'competitor', label: 'Competitor' },
  { id: 'lead-source', label: 'Lead Source' },
];

const API: Record<MasterTab, {
  list: () => Promise<CrmMasterRecord[]>;
  create: (d: { name: string }) => Promise<CrmMasterRecord>;
  remove: (id: string) => Promise<void>;
}> = {
  'sales-stage': { list: getSalesStages, create: createSalesStage, remove: deleteSalesStage },
  'opportunity-type': { list: getOpportunityTypes, create: createOpportunityType, remove: deleteOpportunityType },
  'market-segment': { list: getMarketSegments, create: createMarketSegment, remove: deleteMarketSegment },
  territory: { list: getTerritories, create: createTerritory, remove: deleteTerritory },
  'customer-group': { list: getCustomerGroups, create: createCustomerGroup, remove: deleteCustomerGroup },
  'lost-reason': { list: getLostReasons, create: createLostReason, remove: deleteLostReason },
  competitor: { list: getCompetitors, create: createCompetitor, remove: deleteCompetitor },
  'lead-source': { list: getLeadSources as any, create: createLeadSource as any, remove: deleteLeadSource },
};

const TAB_FROM_QUERY: Record<string, MasterTab> = {
  territories: 'territory',
  customerGroups: 'customer-group',
  salesStages: 'sales-stage',
  opportunityTypes: 'opportunity-type',
  marketSegments: 'market-segment',
  lostReasons: 'lost-reason',
  competitors: 'competitor',
  leadSources: 'lead-source',
  sources: 'lead-source',
};

function CrmMastersContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<MasterTab>('sales-stage');
  const [rows, setRows] = useState<CrmMasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await API[tab].list();
      setRows(Array.isArray(list) ? list : []);
    } catch {
      setRows([]);
      toast.error('Failed to load masters');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = searchParams.get('tab');
    if (q && TAB_FROM_QUERY[q]) {
      setTab(TAB_FROM_QUERY[q]);
    }
  }, [searchParams]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await API[tab].create({ name: name.trim() });
      toast.success('Added');
      setName('');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    await API[tab].remove(id).catch(() => toast.error('Delete failed'));
    load();
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedErpnextMasters();
      toast.success('ERPNext masters seeded');
      load();
    } catch {
      toast.error('Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Database className="w-6 h-6 text-[#014582]" /> CRM Masters</h1>
          <p className="text-gray-500 text-sm">ERPNext lookup tables for your company</p>
        </div>
        <button type="button" disabled={seeding} onClick={handleSeed} className="flex items-center gap-2 px-4 py-2 border border-[#014582]/30 text-[#014582] rounded-xl text-sm font-medium hover:bg-[#014582]/5 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} /> Seed ERPNext Defaults
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-[#014582] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'territory' && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <span>
            Territory supports full ERPNext Tree/List view, parent-child hierarchies, managers, and targets.
          </span>
          <a
            href="/crm/territory"
            className="font-semibold text-[#014582] hover:underline shrink-0 ml-3"
          >
            Open Territory Workspace →
          </a>
        </div>
      )}

      {tab === 'customer-group' && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <span>
            Customer Group supports full ERPNext Tree/List view, parent-child hierarchies, price lists, and credit limits.
          </span>
          <a
            href="/crm/customer-group"
            className="font-semibold text-[#014582] hover:underline shrink-0 ml-3"
          >
            Open Customer Group Workspace →
          </a>
        </div>
      )}

      {tab === 'opportunity-type' && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <span>
            Opportunity Type classifies your business deals into offerings (Sales, Support, Maintenance, etc.).
          </span>
          <a
            href="/crm/opportunity-type"
            className="font-semibold text-[#014582] hover:underline shrink-0 ml-3"
          >
            Open Opportunity Type Workspace →
          </a>
        </div>
      )}

      {tab === 'market-segment' && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <span>
            Market Segment stratifies your prospects and customer accounts by target demographic and industry tier.
          </span>
          <a
            href="/crm/market-segment"
            className="font-semibold text-[#014582] hover:underline shrink-0 ml-3"
          >
            Open Market Segment Workspace →
          </a>
        </div>
      )}

      {tab === 'lost-reason' && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <span>
            Lost Reason tracks root causes when deals are dropped or lost to competitors.
          </span>
          <a
            href="/crm/lost-reason"
            className="font-semibold text-[#014582] hover:underline shrink-0 ml-3"
          >
            Open Lost Reason Workspace →
          </a>
        </div>
      )}

      {tab === 'competitor' && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <span>
            Competitor manages battlecard profiles, intelligence notes, and win/loss analysis.
          </span>
          <a
            href="/crm/competitor"
            className="font-semibold text-[#014582] hover:underline shrink-0 ml-3"
          >
            Open Competitor Workspace →
          </a>
        </div>
      )}

      {tab === 'sales-stage' && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <span>
            Sales Stage defines the progression milestones of your sales deals in the pipeline and Kanban board.
          </span>
          <a
            href="/crm/sales-stage"
            className="font-semibold text-[#014582] hover:underline shrink-0 ml-3"
          >
            Open Sales Stage Workspace →
          </a>
        </div>
      )}

      {tab === 'lead-source' && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <span>
            Lead Source provides acquisition channel tracking, color tags, and attribution reporting.
          </span>
          <a
            href="/crm/lead-source"
            className="font-semibold text-[#014582] hover:underline shrink-0 ml-3"
          >
            Open Lead Source Workspace →
          </a>
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
        />
        <button type="submit" className="px-4 py-2 bg-[#014582] text-white rounded-xl text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No records — use Seed or Add above</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50">
                <span className="text-sm font-medium text-gray-800">{r.name}</span>
                <button type="button" onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function CrmMastersPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-center py-12">Loading…</div>}>
      <CrmMastersContent />
    </Suspense>
  );
}
