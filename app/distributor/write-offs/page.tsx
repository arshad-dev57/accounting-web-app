'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Plus, FileSpreadsheet } from 'lucide-react';

export default function DistributorWriteOffsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            Stock Write-Offs & GL Expense Posting
          </h1>
          <p className="text-xs text-gray-500 mt-1">Manage Damaged/Expired Stock Approvals & General Ledger Entries</p>
        </div>
        <Link
          href="/warehouse/write-offs/new"
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Stock Write-Off
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 p-8 text-center space-y-4 shadow-sm">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-gray-900">Stock Write-Off System Active</h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Stock write-offs automatically deduct stock balance, log stock movements and post GL Journal Entries to the configured Expense Account.
        </p>
        <Link
          href="/warehouse/write-offs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#014582] text-white text-xs font-bold rounded-xl hover:bg-blue-900"
        >
          Open Write-Off Operating Hub &rarr;
        </Link>
      </div>
    </div>
  );
}
