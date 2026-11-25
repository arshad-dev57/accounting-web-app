'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PieChart, Plus, Trash2, Edit3, RefreshCw, Search,
  ShieldAlert, Sparkles, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMarketSegments,
  deleteMarketSegment,
  type MarketSegmentRecord,
} from '@/lib/crm-api';

export default function MarketSegmentListPage() {
  const router = useRouter();
  const [segments, setSegments] = useState<MarketSegmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSegments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMarketSegments();
      const list = Array.isArray(data) ? (data as unknown as MarketSegmentRecord[]) : [];
      list.sort((a, b) => a.name.localeCompare(b.name));
      setSegments(list);
    } catch {
      toast.error('Failed to load market segments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);


  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete market segment "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteMarketSegment(id);
      toast.success(`Market segment "${name}" deleted`);
      fetchSegments();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete market segment');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = segments.filter((s) =>
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
            <span className="text-gray-800 font-medium">Market Segment</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-[#014582]" />
            Market Segment
          </h1>
          <p className="text-xs text-gray-500">
            Target customer demographic or economic strata (e.g. Corporate, SME, Lower/Middle/Upper Income).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          <Link
            href="/crm/market-segment/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#014582] hover:bg-[#01366a] text-white rounded-md text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Market Segment
          </Link>
        </div>
      </div>

      {/* ── Segment Visual Chips ──────────────────────────────── */}
      {segments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm overflow-hidden">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Target Market Segments
          </h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {segments.map((segment) => (
              <Link
                key={segment.id}
                href={`/crm/market-segment/${segment.id}`}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-[#014582]/10 border border-gray-200 hover:border-[#014582]/40 text-gray-800 hover:text-[#014582] transition-colors flex items-center gap-2"
              >
                <PieChart className="w-3.5 h-3.5 text-[#014582]" />
                <span>{segment.name}</span>
                {segment.isActive === false && (
                  <span className="text-[10px] font-mono px-1 rounded bg-gray-200 text-gray-600">
                    Inactive
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Table Container ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 bg-[#f8f9fa]">
          <span className="text-xs font-semibold text-gray-700">
            Market Segments ({filtered.length})
          </span>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search segments…"
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs text-gray-800 focus:outline-none focus:border-[#014582] focus:ring-1 focus:ring-[#014582]"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#014582]" />
            Loading market segments…
          </div>
        ) : segments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#014582] flex items-center justify-center mx-auto">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No market segments configured</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Add segments such as Corporate or income tiers, or define custom demographic groups.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/crm/market-segment/new"
                className="px-3.5 py-1.5 bg-[#014582] hover:bg-[#01366a] text-white rounded-md text-xs font-semibold"
              >
                Create Market Segment
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8f9fa] text-gray-600 font-semibold">
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4">Segment Name</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 w-28">Status</th>
                  <th className="py-2.5 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s, idx) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/crm/market-segment/${s.id}`)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-mono font-semibold text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#014582]" />
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {(s as any).description || '—'}
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
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/crm/market-segment/${s.id}`}
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

      {/* ── CRM guidance ───────────────────────── */}
      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-start gap-3 text-xs text-blue-900">
        <ShieldAlert className="w-5 h-5 text-[#014582] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">Market segment stratification</p>
          <p className="text-gray-600 leading-relaxed">
            Market Segment categorizes prospects and customer accounts by their target market profile (e.g., <em>Corporate</em>, <em>Government</em>, or income bracket). This enables sales teams to tailor marketing campaigns and track average order value by segment.
          </p>
        </div>
      </div>
    </div>
  );
}

