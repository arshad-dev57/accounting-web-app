'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart2,
  ArrowLeft,
  Building2,
  PieChart,
  Loader2,
  Eye,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function WriteOffReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);

      const res = await apiClient.get(`/api/inventory/write-offs/reports?${query.toString()}`);
      const data = res.data?.data ?? res.data;
      if (res.success || res.data?.success) {
        setReport(data);
      } else {
        setReport(null);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReport();
  }, [startDate, endDate]);

  const recent = report?.recentPostedWriteOffs || [];

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <Link
          href="/warehouse/write-offs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#014582] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to write-offs
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
          Write-off reports
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
          Posted inventory loss by reason and warehouse.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4 flex flex-wrap gap-3 items-center">
        <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
          Start
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs outline-none focus:ring-2 focus:ring-[#014582]"
          />
        </label>
        <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
          End
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs outline-none focus:ring-2 focus:ring-[#014582]"
          />
        </label>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
          <p className="text-sm text-gray-500 mt-2">Loading report…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Posted write-offs</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{report?.totalWriteOffs || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Total loss</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {formatMoney(report?.totalLossValue || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Items written off</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{report?.totalItemsCount || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-4">
              <h2 className="text-sm md:text-base font-bold text-gray-800 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#014582]" />
                By reason
              </h2>
              {Object.keys(report?.reasonBreakdown || {}).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No posted write-offs in range</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(report?.reasonBreakdown || {}).map(([reason, amount]: any) => (
                    <div key={reason} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700">{reason}</span>
                        <span className="text-red-600">{formatMoney(Number(amount) || 0)}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#014582] rounded-full"
                          style={{
                            width: `${Math.min(
                              (Number(amount) / (report?.totalLossValue || 1)) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-4">
              <h2 className="text-sm md:text-base font-bold text-gray-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                By warehouse
              </h2>
              {Object.keys(report?.locationBreakdown || {}).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No posted write-offs in range</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(report?.locationBreakdown || {}).map(([locName, amount]: any) => (
                    <div key={locName} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700">{locName}</span>
                        <span className="text-emerald-600">{formatMoney(Number(amount) || 0)}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              (Number(amount) / (report?.totalLossValue || 1)) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 md:px-6 py-3 border-b border-gray-100">
              <h2 className="text-sm md:text-base font-bold text-gray-800">Recent posted</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 md:px-6 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                      Write-off
                    </th>
                    <th className="text-left px-4 md:px-6 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                      Date
                    </th>
                    <th className="text-left px-4 md:px-6 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                      Reason
                    </th>
                    <th className="text-right px-4 md:px-6 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                      Loss
                    </th>
                    <th className="text-right px-4 md:px-6 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                      —
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No recent posted write-offs
                      </td>
                    </tr>
                  ) : (
                    recent.map((wo: any) => (
                      <tr key={wo.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 md:px-6 py-3 font-mono font-semibold text-[#014582]">
                          {wo.writeOffNumber}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-gray-600">
                          {wo.writeOffDate ? new Date(wo.writeOffDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-gray-700">{wo.reason}</td>
                        <td className="px-4 md:px-6 py-3 text-right font-semibold text-red-600">
                          {formatMoney(wo.totalCost || 0)}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-right">
                          <Link
                            href={`/warehouse/write-offs/${wo.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-[#014582]"
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
          </div>
        </>
      )}
    </div>
  );
}
