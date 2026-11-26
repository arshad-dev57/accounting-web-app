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
import { CollapsibleSidebar } from '../../components/CollapsibleSidebar';
import { ModuleChrome } from '../../components/ModuleChrome';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/distributor/dashboard', icon: LayoutDashboard },
  { label: 'Customer 360 & Master', path: '/distributor/customers', icon: Users },
  { label: 'Salesperson 360', path: '/distributor/salespersons', icon: UserCheck },
  { label: 'Credit Control', path: '/distributor/credit', icon: CreditCard },
  { label: 'Recovery & Collections', path: '/distributor/recovery', icon: Banknote },
  { label: 'Customer Aging', path: '/distributor/aging', icon: Clock },
  { label: 'Product 360', path: '/distributor/products', icon: Package },
  { label: 'Warehouse 360', path: '/distributor/warehouses', icon: Warehouse },
  { label: 'Stock Write-Offs', path: '/distributor/write-offs', icon: AlertTriangle },
  { label: 'Distributor Reports', path: '/distributor/reports', icon: FileSpreadsheet }
];

function DistributorSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();
  const isActive = (path: string) =>
    pathname === path || (path !== '/distributor' && pathname?.startsWith(path));

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <div className={`flex items-center border-b border-white/10 ${collapsed ? 'justify-center p-3' : 'gap-3 p-5'}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#014582] to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
          <Truck className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="sidebar-expanded-only">
            <h1 className="text-white font-bold text-sm leading-tight">Distributor</h1>
            <p className="text-[10px] text-white/40 font-medium">Operating Layer</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? 'text-white bg-[#014582] shadow-md shadow-[#014582]/30 font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="sidebar-expanded-only truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="px-3 pb-3 space-y-1 border-t border-white/10 pt-3">
        {!collapsed && (
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1">
            Connected Modules
          </p>
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
      </div>

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
  );
}

export default function DistributorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleChrome
      title="Distributor Workspace"
      icon={<Truck className="w-5 h-5 text-[#014582]" />}
      sidebar={<DistributorSidebar />}
      topGroups={[
        {
          label: 'Distributor',
          items: NAV_ITEMS.map((item) => ({ label: item.label, href: item.path }))
        },
        {
          label: 'Connected',
          items: [
            { label: 'Main Dashboard', href: '/dashboard' },
            { label: 'Sales Engine', href: '/sales' },
            { label: 'Inventory', href: '/warehouse/dashboard' },
            { label: 'Accounting', href: '/accounting/dashboard' }
          ]
        }
      ]}
      headerRightExtra={
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#014582] border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-[#014582] animate-pulse" />
          Distribution Layer Active
        </span>
      }
      contentClassName="flex-1 p-6"
    >
      {children}
    </ModuleChrome>
  );
}
