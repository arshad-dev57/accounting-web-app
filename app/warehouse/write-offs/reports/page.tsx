'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart2,
  ArrowLeft,
  Building2,
  Calendar,
  PieChart,
  Trash2,
  TrendingDown
} from 'lucide-react';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

export default function WriteOffReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const headers = browserCompanyAuthHeaders();
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);

      const res = await fetch(`/api/inventory/write-offs/reports?${query.toString()}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setReport(json.data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading write-off analytics report...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <Link
          href="/warehouse/write-offs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Write-Off Register
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart2 className="w-7 h-7 text-rose-600" />
          Stock Write-Off Analytics Report
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed inventory loss analysis by reason, product line, and warehouse location.
        </p>
      </div>

      {/* Date Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Start Date:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">End Date:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
          />
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Posted Write-Offs</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{report?.totalWriteOffs || 0}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Financial Loss</span>
          <div className="mt-2 text-2xl font-bold text-rose-600">
            PKR {(report?.totalLossValue || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Written-Off Items</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{report?.totalItemsCount || 0}</div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loss by Reason */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-rose-600" />
            Loss Breakdown by Reason
          </h2>

          <div className="space-y-3">
            {Object.entries(report?.reasonBreakdown || {}).map(([reason, amount]: any) => (
              <div key={reason} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{reason}</span>
                  <span className="text-rose-600">PKR {amount.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((amount / (report?.totalLossValue || 1)) * 100),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loss by Warehouse */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Loss Breakdown by Warehouse
          </h2>

          <div className="space-y-3">
            {Object.entries(report?.locationBreakdown || {}).map(([locName, amount]: any) => (
              <div key={locName} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{locName}</span>
                  <span className="text-emerald-600">PKR {amount.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((amount / (report?.totalLossValue || 1)) * 100),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
