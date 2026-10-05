'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { FileSpreadsheet, Clock, UserCheck, TrendingUp, Printer } from 'lucide-react';

export default function DistributorReportsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-[#014582]" />
          Distributor Intelligence & Reports Workspace
        </h1>
        <p className="text-xs text-gray-500 mt-1">Executive Financial Reports for Sales, Aging, Recoveries & Stock Valuation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/distributor/aging"
          className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Customer AR Aging Report</h3>
              <p className="text-xs text-gray-500">Multi-bucket aging breakdown (Current, 1-30, 31-60, 61-90, 90+ days)</p>
            </div>
          </div>
        </Link>

        <Link
          href="/distributor/recovery"
          className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-105 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Salesperson Recovery & Target Report</h3>
              <p className="text-xs text-gray-500">Salesperson monthly target achievement & collection efficiency</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
