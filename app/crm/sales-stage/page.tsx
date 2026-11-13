'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers, Plus, Trash2, Edit3, ArrowUp, ArrowDown,
  RefreshCw, Search, ShieldAlert, CheckCircle2, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getSalesStages,
  deleteSalesStage,
  updateSalesStage,
  seedErpnextMasters,
  type SalesStageRecord,
} from '@/lib/crm-api';

export default function SalesStageListPage() {
  const router = useRouter();
  const [stages, setStages] = useState<SalesStageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSalesStages();
      const list = Array.isArray(data) ? (data as unknown as SalesStageRecord[]) : [];
      // Sort by sortOrder then name
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setStages(list);
    } catch {
      toast.error('Failed to load sales stages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedErpnextMasters();
      toast.success('Seeded ERPNext default sales stages');
      fetchStages();
    } catch {
      toast.error('Failed to seed sales stages');
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete stage "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteSalesStage(id);
      toast.success(`Stage "${name}" deleted`);
      fetchStages();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete stage');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const current = stages[index];
    const target = stages[targetIndex];

    const currentOrder = current.sortOrder ?? index;
    const targetOrder = target.sortOrder ?? targetIndex;

    try {
      await Promise.all([
        updateSalesStage(current.id, { sortOrder: targetOrder } as any),
        updateSalesStage(target.id, { sortOrder: currentOrder } as any),
      ]);
      fetchStages();
    } catch {
      toast.error('Failed to reorder stages');
    }
  };

  const filtered = stages.filter((s) =>
    s.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-4 pb-12">
      {/* ── Breadcrumb & Top Bar ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/crm/dashboard" className="hover:text-gray-900">CRM</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Sales Stage</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#014582]" />
            Sales Stage
          </h1>
          <p className="text-xs text-gray-500">
            A step in your sales process, like qualification or negotiation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white rounded-md text-xs font-medium hover:bg-gray-50 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            Seed ERPNext Defaults
          </button>

          <Link
            href="/crm/sales-stage/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#014582] hover:bg-[#01366a] text-white rounded-md text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Sales Stage
          </Link>
        </div>
      </div>

      {/* ── Pipeline Visual Flow Track ───────────────────────── */}
      {stages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm overflow-hidden">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Sales Pipeline Progression
          </h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {stages.map((stage, idx) => (
              <React.Fragment key={stage.id}>
                <Link
                  href={`/crm/sales-stage/${stage.id}`}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-[#014582]/10 border border-gray-200 hover:border-[#014582]/40 text-gray-800 hover:text-[#014582] transition-colors flex items-center gap-1.5"
                >
                  <span className="w-4 h-4 rounded-full bg-white text-[10px] text-gray-600 font-mono border border-gray-200 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {stage.name}
                </Link>
                {idx < stages.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── Stages Table Container ───────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 bg-[#f8f9fa]">
          <span className="text-xs font-semibold text-gray-700">
            Stages ({filtered.length})
          </span>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stages…"
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs text-gray-800 focus:outline-none focus:border-[#014582] focus:ring-1 focus:ring-[#014582]"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#014582]" />
            Loading sales stages…
          </div>
        ) : stages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#014582] flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No sales stages configured</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Sales stages define the steps deals move through from discovery to close.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="px-3.5 py-1.5 border border-gray-300 text-gray-700 bg-white rounded-md text-xs font-medium hover:bg-gray-50"
              >
                Seed ERPNext Defaults
              </button>
              <Link
                href="/crm/sales-stage/new"
                className="px-3.5 py-1.5 bg-[#014582] hover:bg-[#01366a] text-white rounded-md text-xs font-semibold"
              >
                Create Sales Stage
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8f9fa] text-gray-600 font-semibold">
                  <th className="py-2.5 px-4 w-20 text-center">Order</th>
                  <th className="py-2.5 px-4">Stage Name</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-center w-28">Reorder</th>
                  <th className="py-2.5 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s, idx) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/crm/sales-stage/${s.id}`)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-mono font-semibold text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#014582]" />
                      <span>{s.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      {s.isActive === false ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          Inactive
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, 'up')}
                          className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-200 disabled:opacity-20"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === filtered.length - 1}
                          onClick={() => handleMove(idx, 'down')}
                          className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-200 disabled:opacity-20"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/crm/sales-stage/${s.id}`}
                          className="p-1 rounded text-gray-500 hover:text-[#014582] hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id, s.name)}
                          disabled={deletingId === s.id}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-gray-100 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ERPNext Information Banner ───────────────────────── */}
      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-start gap-3 text-xs text-blue-900">
        <ShieldAlert className="w-5 h-5 text-[#014582] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">ERPNext Sales Stage & Pipeline Rules</p>
          <p className="text-gray-600 leading-relaxed">
            In ERPNext CRM, stages represent the progression milestones of Opportunities from initial engagement (e.g., <em>Prospecting</em>, <em>Qualification</em>) through to closing (<em>Proposal/Price Quote</em>, <em>Negotiation/Review</em>). The order defined here dictates the column sequencing in your Kanban board and sales funnel reports.
          </p>
        </div>
      </div>
    </div>
  );
}

