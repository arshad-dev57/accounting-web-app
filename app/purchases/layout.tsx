'use client';

export const dynamic = 'force-dynamic';

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
  Settings,
  PackageCheck,
  CreditCard,
  Scale,
  ClipboardList,
  CalendarClock,
} from 'lucide-react';
import { usePermissions } from '../../lib/usePermissions';
import { SUBSCRIPTION_PURCHASE_UI_ENABLED } from '../../lib/subscription-ui';
import ProfileDropdown from '../../components/ProfileDropdown';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import { CollapsibleSidebar, SidebarMain } from '../../components/CollapsibleSidebar';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import { performLogout } from '../../lib/auth-logout';
import { FiscalYearProvider } from '../../lib/fiscal-year-context';
import ModuleViewHost from '../../components/ModuleViewHost';
import {
  purchasesViewHostConfig,
} from '../../lib/module-view-host/registries';
import { keepAliveNavProps } from '../../lib/module-view-host/nav-props';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';
import { useCompanyBusinessConfig } from '../../lib/company-business-config';

// ============================================================
// PURCHASES SIDEBAR
// ============================================================
function PurchasesSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();
  const { hasSubPageAccess, hasModuleAccess, isAdmin } = usePermissions();
  const { showInstallmentPurchaseUi } = useCompanyBusinessConfig();
  
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

  const isActive = (path: string) =>
    pathname === path || Boolean(pathname?.startsWith(path + '/'));

  // Permission mapping for purchases sub-pages
  const purchasesPages = [
    { path: '/purchases/dashboard', label: 'Dashboard', permission: 'dashboard' },
    { path: '/purchases/reports', label: 'Purchase Reports', permission: 'dashboard' },
    { path: '/purchases/products', label: 'Products', permission: 'products' },
    { path: '/purchases/requisitions', label: 'Requisitions', permission: 'requisitions' },
    { path: '/purchases/purchaseorder', label: 'Purchase Orders', permission: 'purchase-orders' },
    { path: '/purchases/suppliers', label: 'Suppliers', permission: 'suppliers' },
    { path: '/purchases/goodsRecieving', label: 'Goods Receiving', permission: 'goods-receiving' },
    { path: '/purchases/invoices', label: 'Purchase Invoices', permission: 'purchase-invoices' },
    ...(showInstallmentPurchaseUi
      ? [
          {
            path: '/purchases/installments',
            label: 'Installments',
            permission: 'purchase-invoices' as const,
          },
        ]
      : []),
    { path: '/purchases/payments', label: 'Purchase Payments', permission: 'purchase-payments' },
  ];

  const returnsRefundsPages = [
    { path: '/purchases/returns', label: 'Purchase Returns', permission: 'purchase-returns' },
    { path: '/purchases/refunds', label: 'Refunds', permission: 'refunds' },
  ];

  const settingsPages = [
    ...(SUBSCRIPTION_PURCHASE_UI_ENABLED
      ? [{ path: '/plans', label: 'Subscription Plans', permission: '*' as const }]
      : []),
    { path: '/tax', label: 'Tax Compliance', permission: 'settings' },
    { path: '/purchases/currency', label: 'Display Currency', permission: 'currency' },
    { path: '/accounting/settings/currencies', label: 'Currency Master', permission: 'settings' },
    { path: '/accounting/settings/exchange-rates', label: 'Exchange Rates', permission: 'settings' },
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
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <BrandHeader subtitle="Purchases Module" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {!collapsed && (
          <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3 sidebar-expanded-only">
            PURCHASES NAVIGATION
          </p>
        )}

        {/* Purchases Core */}
        <div>
          {!collapsed && (
            <button
              type="button"
              onClick={() => toggleSection('purchasesCore')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-white/40">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium text-white/90 sidebar-expanded-only">Purchases Core</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform sidebar-expanded-only ${expandedSections.purchasesCore ? 'rotate-180' : ''}`} />
            </button>
          )}
          {(collapsed || expandedSections.purchasesCore) && filteredPurchasesPages.length > 0 && (
            <div className="ml-6 mt-1 space-y-1">
              {filteredPurchasesPages.map((page) => {
                const iconMap: Record<string, React.ReactNode> = {
                  'dashboard': <Home className="w-4 h-4" />,
                  'products': <Package className="w-4 h-4" />,
                  'requisitions': <ClipboardList className="w-4 h-4" />,
                  'purchase-orders': <ShoppingCart className="w-4 h-4" />,
                  'suppliers': <Users className="w-4 h-4" />,
                  'quotations': <FileText className="w-4 h-4" />,
                  'goods-receiving': <PackageCheck className="w-4 h-4" />,
                  'purchase-invoices': <Receipt className="w-4 h-4" />,
                  'purchase-payments': <ArrowLeftRight className="w-4 h-4" />,
                };
                const icon = page.path.includes('/installments')
                  ? <CalendarClock className="w-4 h-4" />
                  : page.path.includes('/reports')
                  ? <FileText className="w-4 h-4" />
                  : (iconMap[page.permission] || <FileText className="w-4 h-4" />);
                
                return (
                  <Link
                    key={page.path}
                    href={page.path}
                    title={page.label}
                    {...keepAliveNavProps(purchasesViewHostConfig, page.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive(page.path) ? 'text-white bg-[#014582] shadow-md shadow-[#014582]/30 font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {icon}
                    <span className="sidebar-expanded-only">{page.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Returns & Refunds */}
        <div>
          {!collapsed && (
            <button
              type="button"
              onClick={() => toggleSection('returnsRefunds')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-white/40">
                  <Undo2 className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium text-white/90 sidebar-expanded-only">Returns & Refunds</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform sidebar-expanded-only ${expandedSections.returnsRefunds ? 'rotate-180' : ''}`} />
            </button>
          )}
          {(collapsed || expandedSections.returnsRefunds) && filteredReturnsRefundsPages.length > 0 && (
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
                    title={page.label}
                    {...keepAliveNavProps(purchasesViewHostConfig, page.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive(page.path) ? 'text-white bg-[#014582] shadow-md shadow-[#014582]/30 font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {iconMap[page.permission] || <FileText className="w-4 h-4" />}
                    <span className="sidebar-expanded-only">{page.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings */}
        <div>
          {!collapsed && (
            <button
              type="button"
              onClick={() => toggleSection('settings')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-white/40">
                  <Settings className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium text-white/90 sidebar-expanded-only">Settings</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform sidebar-expanded-only ${expandedSections.settings ? 'rotate-180' : ''}`} />
            </button>
          )}
          {(collapsed || expandedSections.settings) && filteredSettingsPages.length > 0 && (
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
                    title={page.label}
                    {...keepAliveNavProps(purchasesViewHostConfig, page.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive(page.path) ? 'text-white bg-[#014582] shadow-md shadow-[#014582]/30 font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isTax ? <Scale className="w-4 h-4" /> : isPdf ? <FileText className="w-4 h-4" /> : (iconMap[page.permission] || <Settings className="w-4 h-4" />)}
                    <span className="sidebar-expanded-only">{page.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="my-4 border-t border-white/10" />

        {!collapsed && (
          <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3 sidebar-expanded-only">
            MAIN MENU
          </p>
        )}

        <Link
          href="/dashboard"
          title="Main Dashboard"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium sidebar-expanded-only">Main Dashboard</span>
        </Link>

        {isAdmin || hasModuleAccess('warehouse') && (
          <Link
            href="/warehouse/dashboard"
            title="Inventory"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            <Warehouse className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Inventory</span>
          </Link>
        )}

        {isAdmin || hasModuleAccess('accounting') && (
          <Link
            href="/accounting/dashboard"
            title="Accounting"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Accounting</span>
          </Link>
        )}

        {isAdmin || hasModuleAccess('sales') && (
          <Link
            href="/sales/dashboard"
            title="Sales"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Sales</span>
          </Link>
        )}

        {isAdmin && (
          <Link
            href="/users"
            title="Users"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Users</span>
          </Link>
        )}
      </div>

      {/* Bottom Section */}
      <div className="px-3 pb-6 flex-shrink-0">
        {isAdmin && SUBSCRIPTION_PURCHASE_UI_ENABLED && (
          <Link
            href="/plans"
            title="Subscription Plans"
            className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Subscription Plans</span>
          </Link>
        )}

        {!collapsed && (
          <div className="p-4 bg-[#00E676]/10 rounded-xl border border-[#00E676]/20 sidebar-help sidebar-expanded-only">
            <HelpCircle className="w-5 h-5 text-[#00E676] mb-2" />
            <p className="text-sm font-semibold text-white">Need Help?</p>
            <p className="text-xs text-white/40">Contact our support team</p>
          </div>
        )}

        <button
          type="button"
          title="Logout"
          onClick={() => void performLogout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium sidebar-expanded-only">Logout</span>
        </button>
      </div>
    </CollapsibleSidebar>
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
      <PurchasesSidebar />

      <SidebarMain className="bg-gray-50">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
          <TopBarBrand
            title="Purchases Management"
            icon={<ShoppingCart className="w-5 h-5 text-[#00E676]" />}
          />

          <div className="flex items-center gap-4">
            <GlobalSearch />

            <div className="w-px h-6 bg-gray-200" />

            <ProfileDropdown accentClassName="bg-[#00E676]" />
          </div>
        </header>

        <AppBreadcrumbs />

        {/* Page Content */}
        <div className="flex-1 p-6">
          <ModuleViewHost config={purchasesViewHostConfig}>
            {children}
          </ModuleViewHost>
        </div>
      </SidebarMain>
    </FiscalYearProvider>
  );
}
