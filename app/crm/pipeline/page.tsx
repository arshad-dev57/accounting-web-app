'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, DollarSign, GripVertical, AlertCircle, RefreshCw } from 'lucide-react';
import {
  getOpportunities, updateOpportunityStage,
  OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_DOT_COLORS,
  type Opportunity,
} from '@/lib/crm-api';
import Link from 'next/link';
import { StatusBadge } from '../components/StatusBadge';

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch up to 200 for the pipeline view
      const result = await getOpportunities({ limit: 200 });
      setOpportunities(result.opportunities ?? []);
    } catch (e: any) {
      setError(e.message || 'Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDrop = async (stage: string) => {
    if (!draggingId || draggingId === stage) {
      setDraggingId(null);
      setDragOverStage(null);
      return;
    }
    const opp = opportunities.find((o) => o.id === draggingId);
    if (!opp || opp.stage === stage) {
      setDraggingId(null);
      setDragOverStage(null);
      return;
    }
    // Optimistic update
    setOpportunities((prev) => prev.map((o) => o.id === draggingId ? { ...o, stage } : o));
    setDraggingId(null);
    setDragOverStage(null);
    try {
      await updateOpportunityStage(draggingId, stage);
    } catch {
      // Revert
      fetchAll();
    }
  };

  const grouped = OPPORTUNITY_STAGES.reduce((acc, stage) => {
    acc[stage] = opportunities.filter((o) => o.stage === stage);
    return acc;
  }, {} as Record<string, Opportunity[]>);

  const stageValues = OPPORTUNITY_STAGES.reduce((acc, stage) => {
    acc[stage] = grouped[stage].reduce((s, o) => s + (o.amount || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex-shrink-0 w-64 h-96 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-500 text-sm">{opportunities.length} opportunities · PKR {opportunities.reduce((s, o) => s + (o.amount || 0), 0).toLocaleString()} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/crm/opportunities/new" className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-medium hover:bg-[#01366a]">
            <Plus className="w-4 h-4" /> New Opportunity
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-6">
        {OPPORTUNITY_STAGES.map((stage) => {
          const color = OPPORTUNITY_STAGE_DOT_COLORS[stage] || '#6b7280';
          const cols = grouped[stage] || [];
          const val = stageValues[stage] || 0;
          return (
            <div
              key={stage}
              className={`flex-shrink-0 w-72 bg-white rounded-2xl border-2 transition-all ${dragOverStage === stage ? 'border-[#014582] bg-blue-50/50' : 'border-gray-100'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage); }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => handleDrop(stage)}
            >
              {/* Column header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-semibold text-gray-700">{stage}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">{cols.length}</span>
                </div>
                {val > 0 && (
                  <p className="text-xs text-gray-400 ml-5">PKR {val.toLocaleString()}</p>
                )}
              </div>

              {/* Cards */}
              <div className="p-3 space-y-2.5 min-h-32 max-h-[calc(100vh-280px)] overflow-y-auto">
                {cols.map((opp) => (
                  <div
                    key={opp.id}
                    draggable
                    onDragStart={() => setDraggingId(opp.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverStage(null); }}
                    className={`bg-white border rounded-xl p-3.5 cursor-grab hover:shadow-md transition-all group ${draggingId === opp.id ? 'opacity-50 border-[#014582] shadow-md' : 'border-gray-100 shadow-sm hover:border-[#014582]/20'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/crm/opportunities/${opp.id}`} className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-[#014582] transition-colors flex-1">
                        {opp.name}
                      </Link>
                      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 ml-1 mt-0.5" />
                    </div>

                    {opp.account && (
                      <p className="text-xs text-gray-500 mb-1.5">{opp.account.name}</p>
                    )}

                    {opp.amount != null && (
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
                        <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                        {opp.amount.toLocaleString()}
                        <span className="text-xs font-normal text-gray-400">{opp.currency || 'PKR'}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                      {opp.probability != null && (
                        <span className="text-xs text-gray-400">{opp.probability}% win</span>
                      )}
                      {opp.expectedCloseDate && (
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(opp.expectedCloseDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {opp.assignedTo && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-5 h-5 bg-[#014582] text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {opp.assignedTo.firstName?.[0]}{opp.assignedTo.lastName?.[0]}
                        </div>
                        <span className="text-xs text-gray-400">{opp.assignedTo.firstName} {opp.assignedTo.lastName}</span>
                      </div>
                    )}
                  </div>
                ))}

                {cols.length === 0 && (
                  <div className="text-center py-8 text-gray-300">
                    <p className="text-xs">Drop here</p>
                  </div>
                )}
              </div>

              {/* Add button */}
              <div className="p-3 border-t border-gray-50">
                <Link href={`/crm/opportunities/new?stage=${encodeURIComponent(stage)}`}
                  className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-[#014582] py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
