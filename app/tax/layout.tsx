'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Building2,
  Warehouse,
  ShoppingCart,
  Package,
  Store,
  HelpCircle,
  LogOut,
  CreditCard,
  Scale,
  Globe,
  Percent,
  ShieldCheck,
  FileSpreadsheet,
  LayoutDashboard,
} from 'lucide-react';
import { usePermissions } from '../../lib/usePermissions';
import { SUBSCRIPTION_PURCHASE_UI_ENABLED } from '../../lib/subscription-ui';
import ProfileDropdown from '../../components/ProfileDropdown';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import { CollapsibleSidebar, SidebarMain } from '../../components/CollapsibleSidebar';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import NotificationDropdown from '../../components/NotificationDropdown';
import { performLogout } from '../../lib/auth-logout';
import { FiscalYearProvider } from '../../lib/fiscal-year-context';
import ModuleViewHost from '../../components/ModuleViewHost';
import {
  taxViewHostConfig,
} from '../../lib/module-view-host/registries';
import { keepAliveNavProps } from '../../lib/module-view-host/nav-props';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';

function TaxSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();
  const { hasModuleAccess, isAdmin } = usePermissions();
  const isActive = (path: string) => pathname === path || (path !== '/tax' && pathname.startsWith(path));

  const pages = [
    { path: '/tax', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/tax/setup', label: 'Country & Profile', icon: <Globe className="w-4 h-4" /> },
    { path: '/tax/rates', label: 'Types, Rates & Rules', icon: <Percent className="w-4 h-4" /> },
    { path: '/tax/exemptions', label: 'Exemptions', icon: <ShieldCheck className="w-4 h-4" /> },
    { path: '/tax/reports', label: 'Liability & Audit', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <BrandHeader subtitle="Tax Compliance" />

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {!collapsed && (
          <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3 sidebar-expanded-only">
            TAX NAVIGATION
          </p>
        )}
        {pages.map((page) => (
          <Link
            key={page.path}
            href={page.path}
            title={page.label}
            {...keepAliveNavProps(taxViewHostConfig, page.path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              isActive(page.path) ? 'text-white bg-[#014582] shadow-md shadow-[#014582]/30 font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={isActive(page.path) ? 'text-white' : 'text-white/40'}>{page.icon}</span>
            <span className="sidebar-expanded-only">{page.label}</span>
          </Link>
        ))}

        <div className="my-4 border-t border-white/10" />
        {!collapsed && (
          <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3 sidebar-expanded-only">MAIN MENU</p>
        )}

        <Link href="/dashboard" title="Main Dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium sidebar-expanded-only">Main Dashboard</span>
        </Link>
        {(isAdmin || hasModuleAccess('accounting')) && (
          <Link href="/accounting/dashboard" title="Accounting" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Accounting</span>
          </Link>
        )}
        {(isAdmin || hasModuleAccess('sales')) && (
          <Link href="/sales/dashboard" title="Sales" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Sales</span>
          </Link>
        )}
        {(isAdmin || hasModuleAccess('purchases')) && (
          <Link href="/purchases" title="Purchases" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <Package className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Purchases</span>
          </Link>
        )}
        {(isAdmin || hasModuleAccess('warehouse')) && (
          <Link href="/warehouse/dashboard" title="Inventory" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <Warehouse className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Inventory</span>
          </Link>
        )}
        {(isAdmin || hasModuleAccess('pos')) && (
          <Link href="/pos" title="Point of Sale" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <Store className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Point of Sale</span>
          </Link>
        )}
      </div>

      <div className="px-3 pb-6 flex-shrink-0">
        {isAdmin && SUBSCRIPTION_PURCHASE_UI_ENABLED && (
          <Link href="/plans" title="Subscription Plans" className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Subscription Plans</span>
          </Link>
        )}
        {!collapsed && (
          <div className="p-4 bg-[#014582]/10 rounded-xl border border-[#014582]/20 sidebar-help sidebar-expanded-only">
            <HelpCircle className="w-5 h-5 text-[#014582] mb-2" />
            <p className="text-sm font-semibold text-white">Need Help?</p>
            <p className="text-xs text-white/40">Contact our support team</p>
          </div>
        )}
        <button
          type="button"
          title="Logout"
          onClick={() => void performLogout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium sidebar-expanded-only">Logout</span>
        </button>
      </div>
    </CollapsibleSidebar>
  );
}

export default function TaxLayout({ children }: { children: React.ReactNode }) {
  return (
    <FiscalYearProvider>
      <TaxSidebar />
      <SidebarMain className="bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
          <TopBarBrand
            title="Tax Compliance"
            icon={<Scale className="w-5 h-5 text-[#014582]" />}
          />
          <div className="flex items-center gap-4">
            <GlobalSearch />
            <NotificationDropdown />
            <div className="w-px h-6 bg-gray-200" />
            <ProfileDropdown accentClassName="bg-[#091746]" />
          </div>
        </header>
        <AppBreadcrumbs />
        <div className="flex-1 p-6">
          <ModuleViewHost config={taxViewHostConfig}>{children}</ModuleViewHost>
        </div>
      </SidebarMain>
    </FiscalYearProvider>
  );
}
