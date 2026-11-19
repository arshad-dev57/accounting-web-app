'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Eye,
  BarChart2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface WriteOff {
  id: string;
  writeOffNumber: string;
  writeOffDate: string;
  status: string;
  reason: string;
  notes?: string;
  totalCost: number;
  location?: { id: string; name: string };
  creator?: { id: string; firstName: string; lastName: string };
  items?: any[];
}

interface LocationOption {
  id: string;
  name: string;
}

const REASONS = [
  'Expired',
  'Damaged',
  'Broken',
  'Spoiled',
  'Missing',
  'Obsolete',
  'Quality Issue',
  'Other',
] as const;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Posted: 'bg-emerald-100 text-emerald-700',
    Approved: 'bg-blue-100 text-blue-700',
    Submitted: 'bg-amber-100 text-amber-700',
    Rejected: 'bg-red-100 text-red-700',
    Draft: 'bg-orange-100 text-orange-700',
  };
  return (
    <span
      className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full ${
        map[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {status}
    </span>
  );
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function StockWriteOffsPage() {
  const [writeOffs, setWriteOffs] = useState<WriteOff[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const fetchLocations = async () => {
    try {
      const res = await apiClient.get('/api/warehouse/locations');
      if (res.success || res.data?.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setLocations(list);
      }
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  const fetchWriteOffs = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(pagination.page));
      query.set('limit', String(pagination.limit));
      if (statusFilter) query.set('status', statusFilter);
      if (reasonFilter) query.set('reason', reasonFilter);
      if (locationFilter) query.set('locationId', locationFilter);

      const res = await apiClient.get(`/api/inventory/write-offs?${query.toString()}`);
      if (res.success || res.data?.success) {
        const body = res.data?.data !== undefined && !Array.isArray(res.data) ? res.data : res;
        const rows = Array.isArray(body.data) ? body.data : Array.isArray(res.data) ? res.data : [];
        setWriteOffs(rows);
        const pag = body.pagination || res.data?.pagination;
        if (pag) {
          setPagination((prev) => ({
            ...prev,
            page: pag.page || prev.page,
            limit: pag.limit || prev.limit,
            total: pag.total || 0,
            totalPages: pag.totalPages || pag.pages || 1,
          }));
        }
      } else {
        setWriteOffs([]);
      }
    } catch (err) {
      console.error('Error fetching write-offs:', err);
      setWriteOffs([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, reasonFilter, locationFilter]);

  useEffect(() => {
    void fetchLocations();
  }, []);

  useEffect(() => {
    void fetchWriteOffs();
  }, [fetchWriteOffs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return writeOffs;
    return writeOffs.filter((wo) => {
      const hay = [
        wo.writeOffNumber,
        wo.reason,
        wo.location?.name,
        wo.notes,
        wo.creator?.firstName,
        wo.creator?.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [writeOffs, search]);

  const totalLossValue = filtered.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const postedCount = filtered.filter((item) => item.status === 'Posted').length;
  const draftCount = filtered.filter((item) => item.status === 'Draft').length;
  const pendingCount = filtered.filter(
    (item) => item.status === 'Submitted' || item.status === 'Approved'
  ).length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Trash2 className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
            Stock Write-Offs
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Record damaged, expired, or lost stock and post inventory + GL adjustments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchWriteOffs()}
            className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-[#014582] transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/warehouse/write-offs/reports"
            className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <BarChart2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
            Reports
          </Link>
          <Link
            href="/warehouse/write-offs/new"
            className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
          >
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            New Write-Off
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Loss (page)</p>
            <p className="text-xl md:text-2xl font-bold text-red-600 mt-1">{formatMoney(totalLossValue)}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Posted</p>
            <p className="text-xl md:text-2xl font-bold text-emerald-700 mt-1">{postedCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending</p>
            <p className="text-xl md:text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Drafts</p>
            <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1">{draftCount}</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-xl text-gray-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
          <div className="flex-1 min-w-[160px] md:min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search write-off #, reason, warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
            />
          </div>
          <div className="relative min-w-[130px]">
            <select
              value={statusFilter}
              onChange={(e) => {
                setPagination((p) => ({ ...p, page: 1 }));
                setStatusFilter(e.target.value);
              }}
              className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50 text-gray-700 font-medium"
            >
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Posted">Posted</option>
              <option value="Rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative min-w-[130px]">
            <select
              value={reasonFilter}
              onChange={(e) => {
                setPagination((p) => ({ ...p, page: 1 }));
                setReasonFilter(e.target.value);
              }}
              className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50 text-gray-700 font-medium"
            >
              <option value="">All reasons</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative min-w-[140px]">
            <select
              value={locationFilter}
              onChange={(e) => {
                setPagination((p) => ({ ...p, page: 1 }));
                setLocationFilter(e.target.value);
              }}
              className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50 text-gray-700 font-medium"
            >
              <option value="">All warehouses</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Write-Off
                </th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Warehouse
                </th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="text-center px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Items
                </th>
                <th className="text-right px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Loss
                </th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 md:py-12">
                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                    <p className="mt-2 text-xs md:text-sm text-gray-500">Loading write-offs…</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 md:py-12 text-gray-400">
                    <Trash2 className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                    <p className="text-sm md:text-lg font-medium text-gray-500">No write-offs found</p>
                    <p className="text-xs md:text-sm text-gray-400 mb-3">
                      Try adjusting filters or create a new write-off.
                    </p>
                    <Link
                      href="/warehouse/write-offs/new"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#014582] text-white rounded-lg text-xs font-semibold hover:bg-[#01366a]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Write-Off
                    </Link>
                  </td>
                </tr>
              ) : (
                filtered.map((wo) => (
                  <tr key={wo.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-3 md:px-6 py-2 md:py-3">
                      <Link
                        href={`/warehouse/write-offs/${wo.id}`}
                        className="font-mono font-semibold text-[#014582] hover:underline text-xs md:text-sm"
                      >
                        {wo.writeOffNumber}
                      </Link>
                      <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                        {new Date(wo.writeOffDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3 text-gray-800 text-xs md:text-sm hidden sm:table-cell">
                      {wo.location?.name || '—'}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium text-gray-700">
                      {wo.reason}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3 text-center text-gray-700 hidden md:table-cell">
                      {wo.items?.length || 0}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3 text-right font-semibold text-red-600 text-xs md:text-sm">
                      {formatMoney(wo.totalCost || 0)}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3">
                      <StatusBadge status={wo.status} />
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3 text-right">
                      <Link
                        href={`/warehouse/write-offs/${wo.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-[#014582] hover:bg-[#014582]/10 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-3 md:px-6 py-3">
            <p className="text-[10px] md:text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </p>
            <div className="flex gap-1 md:gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                className="p-1.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))
                }
                className="p-1.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { StockWriteOffsPage };
