'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trash2,
  Plus,
  Search,
  Building2,
  Calendar,
  AlertOctagon,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  BarChart2
} from 'lucide-react';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

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

export default function StockWriteOffsPage() {
  const [writeOffs, setWriteOffs] = useState<WriteOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');

  const fetchWriteOffs = async () => {
    try {
      setLoading(true);
      const headers = browserCompanyAuthHeaders();
      const query = new URLSearchParams();
      if (statusFilter) query.append('status', statusFilter);
      if (reasonFilter) query.append('reason', reasonFilter);

      const res = await fetch(`/api/inventory/write-offs?${query.toString()}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setWriteOffs(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching write-offs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWriteOffs();
  }, [statusFilter, reasonFilter]);

  const totalLossValue = writeOffs.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const postedCount = writeOffs.filter((item) => item.status === 'Posted').length;
  const draftCount = writeOffs.filter((item) => item.status === 'Draft').length;
  const pendingApprovalCount = writeOffs.filter((item) => item.status === 'Submitted').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trash2 className="w-7 h-7 text-rose-600" />
            Stock Write-Off Register
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage damaged, expired, or lost inventory write-off entries and accounting postings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/warehouse/write-offs/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <BarChart2 className="w-4 h-4 text-emerald-600" /> Write-Off Analytics
          </Link>
          <Link
            href="/warehouse/write-offs/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Stock Write-Off
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Write-Off Loss</span>
          <div className="mt-2 text-2xl font-bold text-rose-600">
            PKR {totalLossValue.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Inventory Value Written Off</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Posted Entries</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{postedCount}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Stock Reduced & GL Posted</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Approval</span>
          <div className="mt-2 text-2xl font-bold text-amber-600">{pendingApprovalCount}</div>
          <div className="text-xs text-amber-600 font-medium mt-1">Awaiting Review</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Draft Entries</span>
          <div className="mt-2 text-2xl font-bold text-slate-700 dark:text-slate-300">{draftCount}</div>
          <div className="text-xs text-slate-500 mt-1">Unsubmitted Drafts</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Posted">Posted</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
          >
            <option value="">All Reasons</option>
            <option value="Expired">Expired</option>
            <option value="Damaged">Damaged</option>
            <option value="Broken">Broken</option>
            <option value="Spoiled">Spoiled</option>
            <option value="Missing">Missing / Shortage</option>
            <option value="Obsolete">Obsolete</option>
            <option value="Quality Issue">Quality Issue</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Write-off Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold">
                <th className="px-5 py-3.5">Write-Off # & Date</th>
                <th className="px-5 py-3.5">Warehouse</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5 text-center">Item Count</th>
                <th className="px-5 py-3.5 text-right">Total Loss Value</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Loading write-off entries...
                  </td>
                </tr>
              ) : writeOffs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No write-off entries found.
                  </td>
                </tr>
              ) : (
                writeOffs.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{wo.writeOffNumber}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(wo.writeOffDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
                      {wo.location?.name || 'Main Warehouse'}
                    </td>
                    <td className="px-5 py-4 font-medium text-rose-600 dark:text-rose-400">{wo.reason}</td>
                    <td className="px-5 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      {wo.items?.length || 0}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-rose-600">
                      PKR {(wo.totalCost || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                          wo.status === 'Posted'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : wo.status === 'Approved'
                            ? 'bg-blue-50 text-blue-700'
                            : wo.status === 'Submitted'
                            ? 'bg-amber-50 text-amber-700'
                            : wo.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/warehouse/write-offs/${wo.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
