'use client';

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
  Phone,
  Headset,
  CreditCard,
  Scale,
  Globe,
  Percent,
  ShieldCheck,
  FileSpreadsheet,
  LayoutDashboard,
} from 'lucide-react';
import { usePermissions } from '../../lib/usePermissions';
import ProfileDropdown from '../../components/ProfileDropdown';
import FiscalYearSelect from '../../components/FiscalYearSelect';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import { performLogout } from '../../lib/auth-logout';
import { FiscalYearProvider } from '../../lib/fiscal-year-context';

function TaxSidebar() {
  const pathname = usePathname();
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
    <div className="w-64 h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0 fixed left-0 top-0">
      <BrandHeader subtitle="Tax Compliance" />

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">
          TAX NAVIGATION
        </p>
        {pages.map((page) => (
          <Link
            key={page.path}
            href={page.path}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              isActive(page.path) ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={isActive(page.path) ? 'text-[#7eb6ff]' : 'text-white/40'}>{page.icon}</span>
            <span>{page.label}</span>
          </Link>
        ))}

        <div className="my-4 border-t border-white/10" />
        <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">MAIN MENU</p>

        <Link href="/dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">Main Dashboard</span>
        </Link>
        {(isAdmin || hasModuleAccess('accounting')) && (
          <Link href="/accounting/dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium">Accounting</span>
          </Link>
        )}
        {(isAdmin || hasModuleAccess('sales')) && (
          <Link href="/sales/dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-medium">Sales</span>
          </Link>
        )}
        {(isAdmin || hasModuleAccess('purchases')) && (
          <Link href="/purchases" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <Package className="w-5 h-5" />
            <span className="text-sm font-medium">Purchases</span>
          </Link>
        )}
        {(isAdmin || hasModuleAccess('warehouse')) && (
          <Link href="/warehouse/dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <Warehouse className="w-5 h-5" />
            <span className="text-sm font-medium">Warehouse</span>
          </Link>
        )}
        {(isAdmin || hasModuleAccess('pos')) && (
          <Link href="/pos" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <Store className="w-5 h-5" />
            <span className="text-sm font-medium">Point of Sale</span>
          </Link>
        )}
      </div>

      <div className="px-3 pb-6 flex-shrink-0">
        {isAdmin && (
          <Link href="/plans" className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm font-medium">Subscription Plans</span>
          </Link>
        )}
        <div className="p-4 bg-[#014582]/10 rounded-xl border border-[#014582]/20">
          <HelpCircle className="w-5 h-5 text-[#014582] mb-2" />
          <p className="text-sm font-semibold text-white">Need Help?</p>
          <p className="text-xs text-white/40">Contact our support team</p>
        </div>
        <button
          type="button"
          onClick={() => void performLogout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default function TaxLayout({ children }: { children: React.ReactNode }) {
  return (
    <FiscalYearProvider>
      <TaxSidebar />
      <div className="ml-64 min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
          <TopBarBrand
            title="Tax Compliance"
            icon={<Scale className="w-5 h-5 text-[#014582]" />}
          />
          <div className="flex items-center gap-4">
            <FiscalYearSelect />
            <div className="w-px h-6 bg-gray-200" />
            <button
              type="button"
              onClick={() => { window.location.href = '/support'; }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <Headset className="w-4 h-4" />
              <span>Support</span>
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-[#014582]" />
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <ProfileDropdown accentClassName="bg-[#091746]" />
          </div>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </FiscalYearProvider>
  );
}
