'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MailQuestion,
  FileSpreadsheet,
  FileCheck2,
  PackageCheck,
  Send,
  ShieldAlert,
  FolderArchive,
  Truck,
  Landmark,
  BadgeDollarSign,
  BarChart4,
  Settings,
  Home,
  LogOut,
  ShoppingCart,
  Boxes,
} from 'lucide-react';
import { BrandHeader } from '../../components/BrandHeader';
import { CollapsibleSidebar } from '../../components/CollapsibleSidebar';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';
import { performLogout } from '../../lib/auth-logout';

export const EXPORT_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/export/dashboard', label: 'Export Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'EXPORT OPERATIONS',
    items: [
      { href: '/export/inquiries', label: 'Export Inquiries', icon: MailQuestion },
      { href: '/export/quotations', label: 'Export Quotations', icon: FileSpreadsheet },
      { href: '/export/orders', label: 'Export Sales Orders', icon: FileCheck2 },
      { href: '/export/proforma-invoices', label: 'Proforma Invoices', icon: FileCheck2 },
      { href: '/export/packing', label: 'Packing & Inspection', icon: PackageCheck },
      { href: '/export/shipments', label: 'Shipments & Tracking', icon: Send },
      { href: '/export/customs', label: 'Customs & Declaration', icon: ShieldAlert },
      { href: '/export/documents', label: 'Export Documents', icon: FolderArchive },
      { href: '/export/dispatch', label: 'Export Dispatch', icon: Truck },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { href: '/export/finance', label: 'Finance & LC Tracking', icon: Landmark },
      { href: '/export/receipts', label: 'Receipts & Settlement', icon: BadgeDollarSign },
    ],
  },
  {
    label: 'ANALYTICS & CONFIG',
    items: [
      { href: '/export/reports', label: 'Export Reports', icon: BarChart4 },
      { href: '/export/settings', label: 'Export Settings', icon: Settings },
    ],
  },
];

export function ExportSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();
  const isActive = (path: string): boolean =>
    pathname === path || pathname.startsWith(`${path}/`);

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <BrandHeader subtitle="Export Management" />

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
        {EXPORT_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-1.5 sidebar-expanded-only">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      active
                        ? 'bg-[#014582] text-white shadow-md shadow-[#014582]/30 font-semibold'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-[13px] font-medium sidebar-expanded-only leading-snug">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="my-2 border-t border-white/10" />

        <div>
          {!collapsed && (
            <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-1.5 sidebar-expanded-only">
              CONNECTED MODULES
            </p>
          )}
          <div className="space-y-0.5">
            <Link
              href="/sales/dashboard"
              title="Sales Module"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <ShoppingCart className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="sidebar-expanded-only">Sales Orders & Customers</span>
            </Link>
            <Link
              href="/sales/deliveries"
              title="Sales Deliveries"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <Truck className="w-4 h-4 shrink-0 text-sky-400" />
              <span className="sidebar-expanded-only">Sales Deliveries</span>
            </Link>
            <Link
              href="/sales/sales-payment"
              title="Sales Receipts"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <BadgeDollarSign className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="sidebar-expanded-only">Sales Payments / Receipts</span>
            </Link>
            <Link
              href="/warehouse/dashboard"
              title="Inventory Module"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <Boxes className="w-4 h-4 shrink-0 text-cyan-400" />
              <span className="sidebar-expanded-only">Warehouses & Dispatch</span>
            </Link>
            <Link
              href="/accounting/accounts-receivable"
              title="Accounting AR"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <Landmark className="w-4 h-4 shrink-0 text-violet-400" />
              <span className="sidebar-expanded-only">Accounts Receivable</span>
            </Link>
            <Link
              href="/dashboard"
              title="Main Dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <Home className="w-4 h-4 shrink-0" />
              <span className="sidebar-expanded-only">Main Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-3 pb-3 flex-shrink-0 border-t border-white/10 pt-2">
        <button
          type="button"
          title="Logout"
          onClick={() => void performLogout()}
          className="w-full flex items-center gap-3 px-3 py-2 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-xs font-medium sidebar-expanded-only">Logout</span>
        </button>
      </div>
    </CollapsibleSidebar>
  );
}
