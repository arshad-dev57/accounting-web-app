'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Clock,
  UserCheck,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Phone
} from 'lucide-react';
import { fetchCollectionsWorkspace } from '@/lib/distributor-service';

export default function CollectionsWorkspacePage() {
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchCollectionsWorkspace();
        if (res.success) {
          setData(res.data || []);
          setSummary(res.summary || {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = data.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.customerNumber?.toLowerCase().includes(search.toLowerCase()) ||
    item.salesperson?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-emerald-600" />
            Collections & Overdue Recovery Workspace
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track customer outstanding balances, max overdue days, assigned salespersons & payment follow-ups
          </p>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase">Total Receivables</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            PKR {(summary.totalOutstanding || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="text-xs font-semibold text-rose-600 uppercase">Overdue Receivables</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            PKR {(summary.totalOverdue || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 uppercase">Customers Over Limit</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {summary.overLimitCount || 0}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer, code or salesperson..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#014582]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-y border-gray-200">
              <tr>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Salesperson</th>
                <th className="py-3 px-3">Outstanding</th>
                <th className="py-3 px-3">Overdue</th>
                <th className="py-3 px-3">Max Overdue Days</th>
                <th className="py-3 px-3">Last Payment</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">Loading collections data...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">No overdue receivables found</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-gray-900">{item.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{item.customerNumber}</div>
                    </td>
                    <td className="py-3.5 px-3 text-gray-700">{item.salesperson}</td>
                    <td className="py-3.5 px-3 font-bold text-gray-900">PKR {item.totalOutstanding.toLocaleString()}</td>
                    <td className="py-3.5 px-3 font-bold text-rose-600">PKR {item.overdueAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${item.maxOverdueDays > 60 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                        {item.maxOverdueDays} Days
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">
                      {item.lastPaymentDate ? new Date(item.lastPaymentDate).toLocaleDateString() : 'No record'}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={'/distributor/customers/' + item.id}
                        className="px-3 py-1.5 bg-[#014582] text-white rounded-lg text-xs font-semibold hover:bg-blue-900"
                      >
                        Customer 360
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
