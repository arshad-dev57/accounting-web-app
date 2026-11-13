'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Swords, Plus, Trash2, Edit3, RefreshCw, Search,
  ShieldAlert, ExternalLink, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCompetitors,
  deleteCompetitor,
  type CompetitorRecord,
} from '@/lib/crm-api';

export default function CompetitorListPage() {
  const router = useRouter();
  const [competitors, setCompetitors] = useState<CompetitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCompetitors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompetitors();
      const list = Array.isArray(data) ? (data as unknown as CompetitorRecord[]) : [];
      list.sort((a, b) => a.name.localeCompare(b.name));
      setCompetitors(list);
    } catch {
      toast.error('Failed to load competitors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete competitor "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteCompetitor(id);
      toast.success(`Competitor "${name}" deleted`);
      fetchCompetitors();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete competitor');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = competitors.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
    (c.website && c.website.toLowerCase().includes(search.trim().toLowerCase()))
  );

  return (
    <div className="space-y-4 pb-12">
      {/* ── Breadcrumb & Top Bar ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/crm/dashboard" className="hover:text-gray-900">CRM</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Competitor</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Swords className="w-6 h-6 text-[#014582]" />
            Competitor
          </h1>
          <p className="text-xs text-gray-500">
            Market competitors tracked against opportunities and competitive intelligence reports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/crm/competitor/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#014582] hover:bg-[#01366a] text-white rounded-md text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Competitor
          </Link>
        </div>
      </div>

      {/* ── Competitor Visual Chips ──────────────────────────────── */}
      {competitors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm overflow-hidden">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Active Competitors ({competitors.length})
          </h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {competitors.map((comp) => (
              <Link
                key={comp.id}
                href={`/crm/competitor/${comp.id}`}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-[#014582]/10 border border-gray-200 hover:border-[#014582]/40 text-gray-800 hover:text-[#014582] transition-colors flex items-center gap-2"
              >
                <Swords className="w-3.5 h-3.5 text-[#014582]" />
                <span>{comp.name}</span>
                {comp.isActive === false && (
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
            Competitors ({filtered.length})
          </span>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search competitors…"
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs text-gray-800 focus:outline-none focus:border-[#014582] focus:ring-1 focus:ring-[#014582]"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#014582]" />
            Loading competitors…
          </div>
        ) : competitors.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#014582] flex items-center justify-center mx-auto">
              <Swords className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No competitors registered</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Record external competitors to monitor deal contests, win/loss rates, and market presence.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/crm/competitor/new"
                className="px-3.5 py-1.5 bg-[#014582] hover:bg-[#01366a] text-white rounded-md text-xs font-semibold"
              >
                Create Competitor
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8f9fa] text-gray-600 font-semibold">
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4">Competitor Name</th>
                  <th className="py-2.5 px-4">Website</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 w-28">Status</th>
                  <th className="py-2.5 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c, idx) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/crm/competitor/${c.id}`)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-mono font-semibold text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#014582]" />
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {c.website ? (
                        <a
                          href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[#014582] hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[180px]">{c.website}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {(c as any).description || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {c.isActive === false ? (
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
                          href={`/crm/competitor/${c.id}`}
                          className="p-1 rounded text-gray-500 hover:text-[#014582] hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.name)}
                          disabled={deletingId === c.id}
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
          <p className="font-semibold text-gray-900">ERPNext Competitor Intelligence Tracking</p>
          <p className="text-gray-600 leading-relaxed">
            In ERPNext CRM, Competitor records are linked to Opportunities and Lost Reasons to build battlecards, track market share trends, and analyze pricing displacement across contested sales cycles.
          </p>
        </div>
      </div>
    </div>
  );
}

