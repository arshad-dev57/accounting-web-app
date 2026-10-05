'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Clock,
  Truck,
  ArrowUpRight,
  ShieldAlert,
  UserCheck,
  CreditCard
} from 'lucide-react';
import { fetchDistributorDashboard } from '@/lib/distributor-service';

export default function DistributorDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchDistributorDashboard();
        if (res.success) setData(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load distributor dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#014582] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">Loading Distributor Analytics...</p>
        </div>
      </div>
    );
  }

  const sales = data?.sales || { todayAmount: 0, todayCount: 0, monthAmount: 0, monthCount: 0 };
  const recovery = data?.recovery || { todayAmount: 0, monthAmount: 0 };
  const receivables = data?.receivables || { totalOutstanding: 0, overdueAmount: 0, customersOverLimitCount: 0, openInvoicesCount: 0 };
  const topSalespersons = data?.topSalespersons || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#00274d] via-[#014582] to-blue-700 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider">
              Executive Distribution Layer
            </span>
            <span className="text-xs text-white/70">Real-time ERP Sync</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Distributor Operational Dashboard</h1>
          <p className="text-xs text-white/80 mt-1 max-w-xl">
            Connected overview of Sales, Customer Credit Exposure, Recovery Efficiency, Stock Movement & Salesperson Targets.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/distributor/credit"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-2 border border-white/20"
          >
            <CreditCard className="w-4 h-4" />
            Check Credit Exposure
          </Link>
          <Link
            href="/distributor/customers"
            className="px-4 py-2 bg-white text-[#014582] hover:bg-blue-50 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Customer 360
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today Sales</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#014582]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">PKR {sales.todayAmount.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{sales.todayCount} Invoices posted</span>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Today</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Recovery</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">PKR {recovery.monthAmount.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">Today: PKR {recovery.todayAmount.toLocaleString()}</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Collected</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Receivables (AR)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">PKR {receivables.totalOutstanding.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-amber-600 font-semibold">Overdue: PKR {receivables.overdueAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Credit Risk & Limit</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600">{receivables.customersOverLimitCount}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">Customers over limit</span>
              <Link href="/distributor/credit" className="text-[11px] font-bold text-rose-600 hover:underline">
                Review &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#014582]" />
                Salesperson Target Achievement
              </h2>
              <p className="text-xs text-gray-500">Monthly posted sales vs target progress</p>
            </div>
            <Link
              href="/distributor/salespersons"
              className="text-xs font-semibold text-[#014582] hover:text-blue-800 flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-y border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Salesperson</th>
                  <th className="py-2.5 px-3">Territory</th>
                  <th className="py-2.5 px-3">Target (PKR)</th>
                  <th className="py-2.5 px-3">Achieved (PKR)</th>
                  <th className="py-2.5 px-3 text-right font-bold">Achievement %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {topSalespersons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      No active salespersons found
                    </td>
                  </tr>
                ) : (
                  topSalespersons.map((sp: any) => (
                    <tr key={sp.id} className="hover:bg-blue-50/40 transition-all">
                      <td className="py-3 px-3 font-semibold text-gray-900">{sp.name}</td>
                      <td className="py-3 px-3 text-gray-500">{sp.territory}</td>
                      <td className="py-3 px-3 text-gray-700">{sp.target ? sp.target.toLocaleString() : '-'}</td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">{sp.monthlySales.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-[#014582] h-full rounded-full"
                              style={{ width: `${Math.min(100, sp.achievementPercent)}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-gray-900 w-10 text-right">{sp.achievementPercent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#014582]" />
            Distributor Actions
          </h2>
          <p className="text-xs text-gray-500">Fast access to key operational workflows</p>

          <div className="space-y-2.5 pt-2">
            <Link
              href="/distributor/customers"
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-[#014582] group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Customer 360 & Ledger</div>
                  <div className="text-[11px] text-gray-500">Statements, Aging, Limits & Payments</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#014582]" />
            </Link>

            <Link
              href="/distributor/credit"
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Credit Limit Check</div>
                  <div className="text-[11px] text-gray-500">Calculate exposure (AR + Open Orders)</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-amber-700" />
            </Link>

            <Link
              href="/distributor/recovery"
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 group-hover:scale-105 transition-transform">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Collections Workspace</div>
                  <div className="text-[11px] text-gray-500">Overdue recovery by salesperson</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700" />
            </Link>

            <Link
              href="/warehouse/write-offs"
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-800 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Inventory Write-Offs</div>
                  <div className="text-[11px] text-gray-500">Expired stock & GL posting</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-rose-700" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
