'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Truck,
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  Banknote,
  Clock,
  Package,
  Warehouse,
  FileSpreadsheet,
  AlertTriangle,
  Building2,
  ShoppingCart,
  Home,
  LogOut
} from 'lucide-react';
import { performLogout } from '@/lib/auth-logout';
import ProfileDropdown from '@/components/ProfileDropdown';
import AppBreadcrumbs from '@/components/AppBreadcrumbs';
import GlobalSearch from '@/components/GlobalSearch';
import NotificationDropdown from '@/components/NotificationDropdown';
import { CollapsibleSidebar, SidebarMain } from '../../components/CollapsibleSidebar';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';

export default function DistributorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();

  const isActive = (path: string) => pathname === path || (path !== '/distributor' && pathname?.startsWith(path));

  const navItems = [
    { label: 'Dashboard', path: '/distributor/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Customer 360 & Master', path: '/distributor/customers', icon: <Users className="w-4 h-4" /> },
    { label: 'Salesperson 360', path: '/distributor/salespersons', icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Credit Control', path: '/distributor/credit', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Recovery & Collections', path: '/distributor/recovery', icon: <Banknote className="w-4 h-4" /> },
    { label: 'Customer Aging', path: '/distributor/aging', icon: <Clock className="w-4 h-4" /> },
    { label: 'Product 360', path: '/distributor/products', icon: <Package className="w-4 h-4" /> },
    { label: 'Warehouse 360', path: '/distributor/warehouses', icon: <Warehouse className="w-4 h-4" /> },
    { label: 'Stock Write-Offs', path: '/distributor/write-offs', icon: <AlertTriangle className="w-4 h-4" /> },
    { label: 'Distributor Reports', path: '/distributor/reports', icon: <FileSpreadsheet className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
        <div className={`flex items-center border-b border-white/10 ${collapsed ? 'justify-center p-3' : 'gap-3 p-5'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#014582] to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="sidebar-expanded-only">
              <h1 className="font-bold text-white tracking-wide text-sm">DISTRIBUTOR HUB</h1>
              <p className="text-[11px] text-white/50 font-medium">Bisonstechs ERP</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="px-3 text-[10px] font-semibold text-white/40 tracking-wider mb-2 sidebar-expanded-only">OPERATING MODULES</p>
          )}
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                title={item.label}
                className={
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ' +
                  (active
                    ? 'bg-[#014582] text-white shadow-md shadow-[#014582]/30 font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5')
                }
              >
                {item.icon}
                <span className="sidebar-expanded-only">{item.label}</span>
              </Link>
            );
          })}

          <div className="my-4 border-t border-white/10" />

          {!collapsed && (
            <p className="px-3 text-[10px] font-semibold text-white/40 tracking-wider mb-2 sidebar-expanded-only">ERP CORE</p>
          )}
          <Link href="/dashboard" title="Main Dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/5">
            <Home className="w-4 h-4" />
            <span className="sidebar-expanded-only">Main Dashboard</span>
          </Link>
          <Link href="/sales" title="Sales Engine" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/5">
            <ShoppingCart className="w-4 h-4" />
            <span className="sidebar-expanded-only">Sales Engine</span>
          </Link>
          <Link href="/warehouse/dashboard" title="Inventory" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/5">
            <Warehouse className="w-4 h-4" />
            <span className="sidebar-expanded-only">Inventory</span>
          </Link>
          <Link href="/accounting/dashboard" title="Accounting" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/5">
            <Building2 className="w-4 h-4" />
            <span className="sidebar-expanded-only">Accounting</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10">
          <button
            type="button"
            title="Logout"
            onClick={() => void performLogout()}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="sidebar-expanded-only">Logout</span>
          </button>
        </div>
      </CollapsibleSidebar>

      <SidebarMain>
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-[#014582]">
              <Truck className="w-5 h-5 text-[#014582]" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Distributor Operating Workspace</h2>
              <p className="text-[11px] text-gray-500">Deeply connected with Sales, Accounts Receivable & Inventory</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <GlobalSearch />
            <NotificationDropdown />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#014582] border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-[#014582] animate-pulse"></span>
              Distribution Layer Active
            </span>
            <div className="w-px h-6 bg-gray-200" />
            <ProfileDropdown accentClassName="bg-[#014582]" />
          </div>
        </header>

        <AppBreadcrumbs />

        <main className="flex-1 p-6">{children}</main>
      </SidebarMain>
    </div>
  );
}
