'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Clock, Printer, FileSpreadsheet } from 'lucide-react';
import { fetchCustomerAgingReport } from '@/lib/distributor-service';

export default function CustomerAgingPage() {
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchCustomerAgingReport();
        if (res.success) {
          setData(res.data || []);
          setTotals(res.totals || {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-600" />
            Accounts Receivable (AR) Customer Aging Analysis
          </h1>
          <p className="text-xs text-gray-500 mt-1">Multi-Bucket Aging Breakdown: Current, 1-30, 31-60, 61-90, 90+ Days</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-gray-200"
        >
          <Printer className="w-4 h-4" /> Print Aging Report
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-y border-gray-200">
              <tr>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Territory</th>
                <th className="py-3 px-3">Salesperson</th>
                <th className="py-3 px-3 text-right">Current</th>
                <th className="py-3 px-3 text-right">1-30 Days</th>
                <th className="py-3 px-3 text-right">31-60 Days</th>
                <th className="py-3 px-3 text-right">61-90 Days</th>
                <th className="py-3 px-3 text-right">90+ Days</th>
                <th className="py-3 px-3 text-right font-bold">Total Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr><td colSpan={9} className="py-8 text-center text-gray-400">Loading aging buckets...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center text-gray-400">No aging entries found</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.customerId} className="hover:bg-blue-50/30">
                    <td className="py-3 px-3 font-bold text-gray-900">{item.customerName}</td>
                    <td className="py-3 px-3 text-gray-500">{item.territory}</td>
                    <td className="py-3 px-3 text-gray-700">{item.salespersonName}</td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-600">{item.current ? item.current.toLocaleString() : '-'}</td>
                    <td className="py-3 px-3 text-right font-semibold text-blue-600">{item.days1_30 ? item.days1_30.toLocaleString() : '-'}</td>
                    <td className="py-3 px-3 text-right font-semibold text-amber-600">{item.days31_60 ? item.days31_60.toLocaleString() : '-'}</td>
                    <td className="py-3 px-3 text-right font-semibold text-orange-600">{item.days61_90 ? item.days61_90.toLocaleString() : '-'}</td>
                    <td className="py-3 px-3 text-right font-bold text-rose-600">{item.days90Plus ? item.days90Plus.toLocaleString() : '-'}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">PKR {item.totalOutstanding.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Totals Row */}
            <tfoot className="bg-gray-100 font-extrabold text-gray-900 border-t border-gray-300">
              <tr>
                <td colSpan={3} className="py-3 px-3">COMPANY TOTALS</td>
                <td className="py-3 px-3 text-right text-emerald-700">PKR {(totals.current || 0).toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-blue-700">PKR {(totals.days1_30 || 0).toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-amber-700">PKR {(totals.days31_60 || 0).toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-orange-700">PKR {(totals.days61_90 || 0).toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-rose-700">PKR {(totals.days90Plus || 0).toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-[#014582] text-sm">PKR {(totals.totalOutstanding || 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
