'use client';

import Link from 'next/link';
import { AlertTriangle, BarChart3, CalendarClock, ChevronRight } from 'lucide-react';

const REPORTS = [
  {
    title: 'Stock Summary Report',
    subtitle: 'Current stock levels with values',
    href: '/warehouse/reports/stock-summary',
    icon: BarChart3,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Low Stock Report',
    subtitle: 'Products below minimum level',
    href: '/warehouse/reports/low-stock',
    icon: AlertTriangle,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    title: 'Expiry Report',
    subtitle: 'Products expiring soon or already expired',
    href: '/warehouse/reports/expiry',
    icon: CalendarClock,
    color: 'bg-red-50 text-red-600',
  },
] as const;

export function WarehouseReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Warehouse Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Inventory reports — stock summary, low stock alerts, and expiry tracking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#014582]/20 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`p-3 rounded-xl ${report.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#014582] transition-colors" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mt-4">{report.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{report.subtitle}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
/** Next.js route shell — real UI mounts via ModuleViewHost. */
export default function ModuleRoutePlaceholder() {
  return null;
}
