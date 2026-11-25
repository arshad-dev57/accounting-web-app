'use client';

import Link from 'next/link';
import { BarChart3, ChevronRight } from 'lucide-react';
import {
  ERPNEXT_REPORT_TYPES,
  ERPNEXT_REPORT_LABELS,
} from '@/lib/crm-api';

export default function CrmReportsIndexPage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sales and pipeline query reports — each opens as its own page
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
        {ERPNEXT_REPORT_TYPES.map((type) => (
          <Link
            key={type}
            href={`/crm/reports/${type}`}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#f4f5f6] transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-[#f4f5f6] border border-gray-200 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-[#014582]" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800">
              {ERPNEXT_REPORT_LABELS[type]}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
