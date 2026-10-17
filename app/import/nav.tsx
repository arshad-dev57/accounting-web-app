'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileQuestion,
  ShoppingCart,
  FileCheck,
  Ship,
  Truck,
  ShieldCheck,
  FolderOpen,
  PackageCheck,
  Calculator,
  Landmark,
  Receipt,
  BarChart3,
  Settings,
  Home,
  LogOut,
  Boxes,
} from 'lucide-react';
import { BrandHeader } from '../../components/BrandHeader';
import { CollapsibleSidebar } from '../../components/CollapsibleSidebar';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';
import { performLogout } from '../../lib/auth-logout';

export const IMPORT_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/import/dashboard', label: 'Import Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'IMPORT OPERATIONS',
    items: [
      { href: '/import/rfqs', label: 'RFQs & Quotations', icon: FileQuestion },
      { href: '/import/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
      { href: '/import/proforma-invoices', label: 'Proforma Invoices', icon: FileCheck },
      { href: '/import/shipments', label: 'Shipments & Tracking', icon: Ship },
      { href: '/import/carriers', label: 'Carriers', icon: Truck },
      { href: '/import/customs', label: 'Customs & Clearance', icon: ShieldCheck },
      { href: '/import/documents', label: 'Import Documents', icon: FolderOpen },
      { href: '/import/grn', label: 'Import GRN / Receiving', icon: PackageCheck },
      { href: '/import/landed-costs', label: 'Landed Cost Allocation', icon: Calculator },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { href: '/import/finance', label: 'Finance & LC Tracking', icon: Landmark },
      { href: '/import/bills', label: 'Supplier Bills & Payments', icon: Receipt },
    ],
  },
  {
    label: 'ANALYTICS & CONFIG',
    items: [
      { href: '/import/reports', label: 'Import Reports', icon: BarChart3 },
      { href: '/import/settings', label: 'Import Settings', icon: Settings },
    ],
  },
];

export function ImportSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();
  const isActive = (path: string): boolean =>
    pathname === path || pathname.startsWith(`${path}/`);

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <BrandHeader subtitle="Import Management" />

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
        {IMPORT_SECTIONS.map((section) => (
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
              href="/purchases"
              title="Purchases Module"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <ShoppingCart className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="sidebar-expanded-only">Purchases & Suppliers</span>
            </Link>
            <Link
              href="/purchases/goodsRecieving"
              title="Purchase GRN"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <PackageCheck className="w-4 h-4 shrink-0 text-sky-400" />
              <span className="sidebar-expanded-only">Purchase Goods Receiving</span>
            </Link>
            <Link
              href="/warehouse/dashboard"
              title="Inventory Module"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <Boxes className="w-4 h-4 shrink-0 text-cyan-400" />
              <span className="sidebar-expanded-only">Warehouses & Stock</span>
            </Link>
            <Link
              href="/accounting/bills"
              title="Accounting Bills"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <Receipt className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="sidebar-expanded-only">Accounting Bills & AP</span>
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
