'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  Truck,
  Receipt,
  ArrowLeftRight,
  Undo2,
  DollarSign,
  Home,
  Building2,
  Warehouse,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  LogOut,
  Phone,
  Headset,
  Settings,
  PackageCheck,
  CreditCard,
  Scale,
} from 'lucide-react';
import { usePermissions } from '../../lib/usePermissions';
import ProfileDropdown from '../../components/ProfileDropdown';
import FiscalYearSelect from '../../components/FiscalYearSelect';
import LocationSelect from '../../components/LocationSelect';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import { performLogout } from '../../lib/auth-logout';
import { FiscalYearProvider } from '../../lib/fiscal-year-context';
import { LocationProvider } from '../../lib/location-context';

// ============================================================
// PURCHASES SIDEBAR
// ============================================================
function PurchasesSidebar() {
  const pathname = usePathname();
  const { hasSubPageAccess, hasModuleAccess, isAdmin } = usePermissions();
  
  const [expandedSections, setExpandedSections] = React.useState({
    purchasesCore: true,
    returnsRefunds: true,
    settings: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path: string) => pathname === path;

  // Permission mapping for purchases sub-pages
  const purchasesPages = [
    { path: '/purchases/dashboard', label: 'Dashboard', permission: 'dashboard' },
    { path: '/purchases/reports', label: 'Purchase Reports', permission: 'dashboard' },
    { path: '/purchases/products', label: 'Products', permission: 'products' },
    { path: '/purchases/purchaseorder', label: 'Purchase Orders', permission: 'purchase-orders' },
    { path: '/purchases/suppliers', label: 'Suppliers', permission: 'suppliers' },
    { path: '/purchases/quotations', label: 'Quotations', permission: 'quotations' },
    { path: '/purchases/goodsRecieving', label: 'Goods Receiving', permission: 'goods-receiving' },
    { path: '/purchases/invoices', label: 'Purchase Invoices', permission: 'purchase-invoices' },
    { path: '/purchases/payments', label: 'Purchase Payments', permission: 'purchase-payments' },
  ];

  const returnsRefundsPages = [
    { path: '/purchases/returns', label: 'Purchase Returns', permission: 'purchase-returns' },
    { path: '/purchases/refunds', label: 'Refunds', permission: 'refunds' },
  ];

  const settingsPages = [
    { path: '/plans', label: 'Subscription Plans', permission: '*' },
    { path: '/tax', label: 'Tax Compliance', permission: 'settings' },
    { path: '/purchases/currency', label: 'Currency', permission: 'currency' },
    { path: '/accounting/pdf-reports', label: 'PDF Reports', permission: 'settings' },
    { path: '/purchases/settings', label: 'Purchases Settings', permission: 'settings' },
  ];

  // Filter pages based on permissions
  const filteredPurchasesPages = purchasesPages.filter(page => 
    isAdmin || hasSubPageAccess('purchases', page.permission)
  );
  
  const filteredReturnsRefundsPages = returnsRefundsPages.filter(page => 
    isAdmin || hasSubPageAccess('purchases', page.permission)
  );
  
  const filteredSettingsPages = settingsPages.filter(page => {
    if (page.path === '/plans') return isAdmin;
    return page.permission === '*' || isAdmin || hasSubPageAccess('purchases', page.permission);
  });

  return (
    <div className="w-64 h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0 fixed left-0 top-0">
      <BrandHeader subtitle="Purchases Module" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">
          PURCHASES NAVIGATION
        </p>

        {/* Purchases Core */}
        <div>
          <button
            onClick={() => toggleSection('purchasesCore')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-white/40">
                <ShoppingCart className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium text-white/90">Purchases Core</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${expandedSections.purchasesCore ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.purchasesCore && filteredPurchasesPages.length > 0 && (
            <div className="ml-6 mt-1 space-y-1">
              {filteredPurchasesPages.map((page) => {
                const iconMap: Record<string, React.ReactNode> = {
                  'dashboard': <Home className="w-4 h-4" />,
                  'products': <Package className="w-4 h-4" />,
                  'purchase-orders': <ShoppingCart className="w-4 h-4" />,
                  'suppliers': <Users className="w-4 h-4" />,
                  'quotations': <FileText className="w-4 h-4" />,
                  'goods-receiving': <PackageCheck className="w-4 h-4" />,
                  'purchase-invoices': <Receipt className="w-4 h-4" />,
                  'purchase-payments': <ArrowLeftRight className="w-4 h-4" />,
                };
                const icon = page.path.includes('/reports')
                  ? <FileText className="w-4 h-4" />
                  : (iconMap[page.permission] || <FileText className="w-4 h-4" />);
                
                return (
                  <Link
                    key={page.path}
                    href={page.path}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive(page.path) ? 'text-white bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {icon}
                    <span>{page.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Returns & Refunds */}
        <div>
          <button
            onClick={() => toggleSection('returnsRefunds')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-white/40">
                <Undo2 className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium text-white/90">Returns & Refunds</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${expandedSections.returnsRefunds ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.returnsRefunds && filteredReturnsRefundsPages.length > 0 && (
            <div className="ml-6 mt-1 space-y-1">
              {filteredReturnsRefundsPages.map((page) => {
                const iconMap: Record<string, React.ReactNode> = {
                  'purchase-returns': <Undo2 className="w-4 h-4" />,
                  'refunds': <DollarSign className="w-4 h-4" />,
                };
                
                return (
                  <Link
                    key={page.path}
                    href={page.path}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive(page.path) ? 'text-white bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {iconMap[page.permission] || <FileText className="w-4 h-4" />}
                    <span>{page.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings */}
        <div>
          <button
            onClick={() => toggleSection('settings')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-white/40">
                <Settings className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium text-white/90">Settings</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${expandedSections.settings ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.settings && filteredSettingsPages.length > 0 && (
            <div className="ml-6 mt-1 space-y-1">
              {filteredSettingsPages.map((page) => {
                const iconMap: Record<string, React.ReactNode> = {
                  'currency': <DollarSign className="w-4 h-4" />,
                  'settings': <Settings className="w-4 h-4" />,
                  '*': <CreditCard className="w-4 h-4" />,
                };
                const isPdf = page.path.includes('pdf-reports');
                const isTax = page.path === '/tax';

                return (
                  <Link
                    key={page.path}
                    href={page.path}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive(page.path) ? 'text-white bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isTax ? <Scale className="w-4 h-4" /> : isPdf ? <FileText className="w-4 h-4" /> : (iconMap[page.permission] || <Settings className="w-4 h-4" />)}
                    <span>{page.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="my-4 border-t border-white/10" />

        <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">
          MAIN MENU
        </p>

        <Link
          href="/dashboard"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">Main Dashboard</span>
        </Link>

        {isAdmin || hasModuleAccess('warehouse') && (
          <Link
            href="/warehouse/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            <Warehouse className="w-5 h-5" />
            <span className="text-sm font-medium">Warehouse</span>
          </Link>
        )}

        {isAdmin || hasModuleAccess('accounting') && (
          <Link
            href="/accounting/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium">Accounting</span>
          </Link>
        )}

        {isAdmin || hasModuleAccess('sales') && (
          <Link
            href="/sales/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-medium">Sales</span>
          </Link>
        )}

        {isAdmin && (
          <Link
            href="/users"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Users</span>
          </Link>
        )}
      </div>

      {/* Bottom Section */}
      <div className="px-3 pb-6 flex-shrink-0">
        {isAdmin && (
          <Link
            href="/plans"
            className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-sm font-medium">Subscription Plans</span>
          </Link>
        )}

        <div className="p-4 bg-[#00E676]/10 rounded-xl border border-[#00E676]/20">
          <HelpCircle className="w-5 h-5 text-[#00E676] mb-2" />
          <p className="text-sm font-semibold text-white">Need Help?</p>
          <p className="text-xs text-white/40">Contact our support team</p>
        </div>

        <button
          type="button"
          onClick={() => void performLogout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PURCHASES LAYOUT
// ============================================================
export default function PurchasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FiscalYearProvider>
      <LocationProvider>
      <PurchasesSidebar />

      <div className="ml-64 min-h-screen bg-gray-50 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
          <TopBarBrand
            title="Purchases Management"
            icon={<ShoppingCart className="w-5 h-5 text-[#00E676]" />}
          />

          <div className="flex items-center gap-4">
            <LocationSelect showManageLink={false} />
            <FiscalYearSelect />

            <div className="w-px h-6 bg-gray-200" />

            <button
              type="button"
              onClick={() => { window.location.href = '/support'; }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Headset className="w-4 h-4" />
              <span>Support</span>
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-[#00E676]" />
            </div>

            <div className="w-px h-6 bg-gray-200" />

            <ProfileDropdown accentClassName="bg-[#00E676]" />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
      </LocationProvider>
    </FiscalYearProvider>
  );
}
