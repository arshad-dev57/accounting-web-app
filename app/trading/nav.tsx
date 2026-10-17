'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  FileSpreadsheet,
  PackageCheck,
  FileText,
  FileCheck2,
  Truck,
  Receipt,
  Boxes,
  Tags,
  BadgePercent,
  TrendingUp,
  Undo2,
  RotateCcw,
  BarChart3,
  Settings,
  Home,
  LogOut,
  Users,
  Building2,
  Package,
  CreditCard,
  Banknote,
  UserCircle,
  Coins,
} from 'lucide-react';
import { BrandHeader } from '../../components/BrandHeader';
import { CollapsibleSidebar } from '../../components/CollapsibleSidebar';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';
import { performLogout } from '../../lib/auth-logout';

/** Full Sales + Purchases surface under Trading labels (same forms/flows). */
export const TRADING_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/trading/dashboard', label: 'Trading Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'PROCUREMENT',
    items: [
      { href: '/trading/requisitions', label: 'Purchase Requisitions', icon: FileSpreadsheet },
      { href: '/trading/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
      { href: '/trading/suppliers', label: 'Suppliers', icon: Building2 },
      { href: '/trading/goods-receiving', label: 'Goods Receiving', icon: PackageCheck },
      { href: '/trading/purchase-invoices', label: 'Purchase Invoices', icon: Receipt },
      { href: '/trading/purchase-payments', label: 'Purchase Payments', icon: Banknote },
      { href: '/trading/purchase-products', label: 'Purchase Products', icon: Package },
    ],
  },
  {
    label: 'SALES & DISTRIBUTION',
    items: [
      { href: '/trading/sales-quotations', label: 'Sales Quotations', icon: FileText },
      { href: '/trading/sales-orders', label: 'Sales Orders', icon: FileCheck2 },
      { href: '/trading/customers', label: 'Customers', icon: Users },
      { href: '/trading/deliveries', label: 'Delivery & Dispatch', icon: Truck },
      { href: '/trading/invoices', label: 'Sales Invoices', icon: Receipt },
      { href: '/trading/sales-payments', label: 'Sales Payments', icon: CreditCard },
      { href: '/trading/salespersons', label: 'Salespersons', icon: UserCircle },
      { href: '/trading/sales-products', label: 'Sales Products', icon: Package },
    ],
  },
  {
    label: 'INVENTORY & PRICING',
    items: [
      { href: '/trading/stock', label: 'Stock / Products', icon: Boxes },
      { href: '/trading/price-lists', label: 'Product Price Lists', icon: Tags },
      { href: '/trading/customer-pricing', label: 'Customer Pricing', icon: BadgePercent },
      { href: '/trading/margins', label: 'Trading Margins', icon: TrendingUp },
    ],
  },
  {
    label: 'RETURNS & REFUNDS',
    items: [
      { href: '/trading/sales-returns', label: 'Sales Returns', icon: Undo2 },
      { href: '/trading/sales-refunds', label: 'Sales Refunds', icon: RotateCcw },
      { href: '/trading/purchase-returns', label: 'Purchase Returns', icon: Undo2 },
      { href: '/trading/purchase-refunds', label: 'Purchase Refunds', icon: RotateCcw },
    ],
  },
  {
    label: 'ANALYTICS & CONFIG',
    items: [
      { href: '/trading/sales-reports', label: 'Sales Reports', icon: BarChart3 },
      { href: '/trading/purchase-reports', label: 'Purchase Reports', icon: BarChart3 },
      { href: '/trading/reports', label: 'Trading Reports', icon: BarChart3 },
      { href: '/trading/currency', label: 'Currency', icon: Coins },
      { href: '/trading/settings', label: 'Trading Settings', icon: Settings },
    ],
  },
];

export function TradingSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();
  const isActive = (path: string): boolean =>
    pathname === path || pathname.startsWith(`${path}/`);

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <BrandHeader subtitle="Trading Management" />

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
        {TRADING_SECTIONS.map((section) => (
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
        <Link
          href="/dashboard"
          title="Main Dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all text-xs"
        >
          <Home className="w-4 h-4 shrink-0" />
          <span className="sidebar-expanded-only">Main Dashboard</span>
        </Link>
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
