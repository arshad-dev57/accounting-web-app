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
  Calculator,
  PieChart,
  Wallet,
  CreditCard,
  TrendingUp,
  FileSpreadsheet,
  Banknote,
  BookOpen,
  Scale,
  Handshake,
  Landmark,
  Clock,
  Layers,
  CalendarClock,
} from 'lucide-react';
import { usePermissions } from '../../lib/usePermissions';
import { SUBSCRIPTION_PURCHASE_UI_ENABLED } from '../../lib/subscription-ui';
import ProfileDropdown from '../../components/ProfileDropdown';
import FiscalYearSelect from '../../components/FiscalYearSelect';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import { CollapsibleSidebar, SidebarMain } from '../../components/CollapsibleSidebar';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import NotificationDropdown from '../../components/NotificationDropdown';
import { performLogout } from '../../lib/auth-logout';
import { FiscalYearProvider } from '../../lib/fiscal-year-context';
import ModuleViewHost from '../../components/ModuleViewHost';
import { accountingViewHostConfig } from '../../lib/module-view-host/registries';
import { keepAliveNavProps } from '../../lib/module-view-host/nav-props';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';
import { useCompanyBusinessConfig } from '../../lib/company-business-config';

function AccountingSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();
  const { hasSubPageAccess, hasModuleAccess, isAdmin } = usePermissions();
  const { showInstallmentSalesUi, showInstallmentPurchaseUi } =
    useCompanyBusinessConfig();
  const showInstallments = showInstallmentSalesUi || showInstallmentPurchaseUi;

  const [expandedSections, setExpandedSections] = React.useState({
    accountingCore: true,
    reports: false,
    settings: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path: string) => {
    if (pathname === path) return true;
    if (path === '/accounting/dashboard') return false;
    // Avoid highlighting Budgets when on Budget vs Actual
    if (path === '/accounting/budgets' && pathname?.startsWith('/accounting/budgets/vs-actual')) {
      return false;
    }
    return Boolean(pathname?.startsWith(path + '/'));
  };
  const accountingPages = [
    { path: '/accounting/dashboard', label: 'Dashboard', permission: 'dashboard' },
    { path: '/accounting/accounts', label: 'Chart of Accounts', permission: 'chart-of-accounts' },
    { path: '/accounting/bank-Accounts', label: 'Bank Accounts', permission: 'bank-accounts' },
    // { path: '/accounting/bank-Accounts/reconciliation', label: 'Bank Reconciliation', permission: 'bank-reconciliation' },
    { path: '/sales/invoices', label: 'Sales Invoices', permission: 'invoices', iconKey: 'sales-invoices' },
    { path: '/purchases/invoices', label: 'Purchase Invoices', permission: 'invoices', iconKey: 'purchase-invoices' },
    // { path: '/accounting/payments-received', label: 'Payments Received', permission: 'payments-received' },
    // { path: '/accounting/credit-notes', label: 'Credit Notes', permission: 'credit-notes' },
    { path: '/accounting/accounts-receivable', label: 'Accounts Receivable', permission: 'accounts-receivable' },
    // { path: '/accounting/bills', label: 'Bills', permission: 'bills' },
    // { path: '/accounting/payments-made', label: 'Payments Made', permission: 'payments-made' },
    ...(showInstallments
      ? [
          {
            path: '/accounting/installments',
            label: 'Installments',
            permission: 'accounts-receivable' as const,
            iconKey: 'installments',
          },
        ]
      : []),
    { path: '/accounting/expenses', label: 'Expenses', permission: 'expenses' },
    { path: '/accounting/budgets', label: 'Budgets', permission: 'expenses', iconKey: 'budgets' },
    { path: '/accounting/budgets/vs-actual', label: 'Budget vs Actual', permission: 'expenses', iconKey: 'budget-vs-actual' },
    { path: '/accounting/accounts-payable', label: 'Accounts Payable', permission: 'accounts-payable' },
    { path: '/accounting/income', label: 'Income', permission: 'income' },
    { path: '/accounting/journal-entries', label: 'Journal Entries', permission: 'journal-entries' },
    { path: '/accounting/general-ledger', label: 'General Ledger', permission: 'general-ledger' },
    { path: '/accounting/trial-balance', label: 'Trial Balance', permission: 'trial-balance' },
    { path: '/accounting/fixed-assets', label: 'Fixed Assets', permission: 'fixed-assets' },
    { path: '/accounting/loans-borrowings', label: 'Loans & Borrowings', permission: 'loans-borrowings' },
    { path: '/accounting/capital-equity', label: 'Capital & Equity', permission: 'capital-equity' },
    { path: '/accounting/cost-centers', label: 'Cost Centers', permission: 'expenses', iconKey: 'cost-centers' },
  ];

  const reportPages = [
    { path: '/accounting/reports', label: 'Accounting Reports', permission: 'journal-entries' },
    { path: '/accounting/profit-loss', label: 'Profit & Loss', permission: 'profit-loss' },
    { path: '/accounting/balance-sheet', label: 'Balance Sheet', permission: 'balance-sheet' },
    { path: '/accounting/cash-flow', label: 'Cash Flow', permission: 'cash-flow' },
    { path: '/accounting/aged-recievables', label: 'Aged Receivables', permission: 'aged-receivables' },
  ];

  const settingsPages = [
    { path: '/accounting/fiscal-years', label: 'Fiscal Years', permission: 'settings' },
    { path: '/tax', label: 'Tax Compliance', permission: 'settings' },
    { path: '/accounting/currency', label: 'Currency', permission: 'currency' },
    { path: '/accounting/pdf-reports', label: 'PDF Reports', permission: 'settings' },
  ];

  const filteredAccountingPages = accountingPages.filter(page =>
    isAdmin || hasSubPageAccess('accounting', page.permission)
  );

  const filteredReportPages = reportPages.filter(page =>
    isAdmin || hasSubPageAccess('accounting', page.permission)
  );

  const filteredSettingsPages = settingsPages.filter(page =>
    isAdmin || hasSubPageAccess('accounting', page.permission)
  );

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <BrandHeader subtitle="Accounting Module" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {!collapsed && (
          <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3 sidebar-expanded-only">
            ACCOUNTING NAVIGATION
          </p>
        )}
        <div>
          {!collapsed && (
            <button
              type="button"
              onClick={() => toggleSection('accountingCore')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-white/40">
                  <Calculator className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium text-white/90 sidebar-expanded-only">Accounting Core</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform sidebar-expanded-only ${expandedSections.accountingCore ? 'rotate-180' : ''}`} />
            </button>
          )}
          {(collapsed || expandedSections.accountingCore) && filteredAccountingPages.length > 0 && (
            <div className="ml-6 mt-1 space-y-1">
              {filteredAccountingPages.map((page) => {
                const iconMap: Record<string, React.ReactNode> = {
                  'dashboard': <Home className="w-4 h-4" />,
                  'chart-of-accounts': <Banknote className="w-4 h-4" />,
                  'bank-accounts': <Building2 className="w-4 h-4" />,
                  'bank-reconciliation': <Scale className="w-4 h-4" />,
                  'invoices': <Receipt className="w-4 h-4" />,
                  'sales-invoices': <Receipt className="w-4 h-4" />,
                  'purchase-invoices': <FileText className="w-4 h-4" />,
                  'payments-received': <DollarSign className="w-4 h-4" />,
                  'credit-notes': <FileText className="w-4 h-4" />,
                  'accounts-receivable': <Users className="w-4 h-4" />,
                  'installments': <CalendarClock className="w-4 h-4" />,
                  'bills': <FileText className="w-4 h-4" />,
                  'payments-made': <CreditCard className="w-4 h-4" />,
                  'expenses': <Wallet className="w-4 h-4" />,
                  'budgets': <PieChart className="w-4 h-4" />,
                  'budget-vs-actual': <Scale className="w-4 h-4" />,
                  'accounts-payable': <Receipt className="w-4 h-4" />,
                  'income': <TrendingUp className="w-4 h-4" />,
                  'journal-entries': <FileSpreadsheet className="w-4 h-4" />,
                  'general-ledger': <BookOpen className="w-4 h-4" />,
                  'trial-balance': <Scale className="w-4 h-4" />,
                  'fixed-assets': <Package className="w-4 h-4" />,
                  'loans-borrowings': <Handshake className="w-4 h-4" />,
                  'capital-equity': <Landmark className="w-4 h-4" />,
                  'cost-centers': <Layers className="w-4 h-4" />,
                };

                return (
                  <Link
                    key={page.path}
                    href={page.path}
                    title={page.label}
                    {...keepAliveNavProps(accountingViewHostConfig, page.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isActive(page.path) ? 'text-white bg-[#014582] shadow-md shadow-[#014582]/30 font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {iconMap[(page as any).iconKey || page.permission] || <FileText className="w-4 h-4" />}
                    <span className="sidebar-expanded-only">{page.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Reports */}
        <div>
          {!collapsed && (
            <button
              type="button"
              onClick={() => toggleSection('reports')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-white/40">
                  <PieChart className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium text-white/90 sidebar-expanded-only">Reports</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform sidebar-expanded-only ${expandedSections.reports ? 'rotate-180' : ''}`} />
            </button>
          )}
          {(collapsed || expandedSections.reports) && filteredReportPages.length > 0 && (
            <div className="ml-6 mt-1 space-y-1">
              {filteredReportPages.map((page) => {
                const iconMap: Record<string, React.ReactNode> = {
                  'journal-entries': <FileSpreadsheet className="w-4 h-4" />,
                  'balance-sheet': <FileText className="w-4 h-4" />,
                  'profit-loss': <TrendingUp className="w-4 h-4" />,
                  'cash-flow': <DollarSign className="w-4 h-4" />,
                  'aged-receivables': <Clock className="w-4 h-4" />,
                };

                return (
                  <Link
                    key={page.path}
                    href={page.path}
                    title={page.label}
                    {...keepAliveNavProps(accountingViewHostConfig, page.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isActive(page.path) ? 'text-white bg-[#014582] shadow-md shadow-[#014582]/30 font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'
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
                    {...keepAliveNavProps(accountingViewHostConfig, page.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isActive(page.path) ? 'text-white bg-[#014582] shadow-md shadow-[#014582]/30 font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'
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
          href="/distributor/dashboard"
          title="Distributor Hub"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-amber-400"
        >
          <Truck className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium sidebar-expanded-only">Distributor Hub</span>
        </Link>

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

        {isAdmin || hasModuleAccess('purchases') && (
          <Link
            href="/purchases"
            title="Purchases"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Purchases</span>
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
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium sidebar-expanded-only">Logout</span>
        </button>
      </div>
    </CollapsibleSidebar>
  );
}

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FiscalYearProvider>
      <AccountingSidebar />

      <SidebarMain className="bg-gray-50">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
          <TopBarBrand
            title="Accounting Management"
            icon={<Calculator className="w-5 h-5 text-[#014582]" />}
          />

          <div className="flex items-center gap-4">
            <FiscalYearSelect />

            <div className="w-px h-6 bg-gray-200" />

            <GlobalSearch />
            <NotificationDropdown />

            <div className="w-px h-6 bg-gray-200" />

            <ProfileDropdown accentClassName="bg-[#091746]" />
          </div>
        </header>

        <AppBreadcrumbs />

        {/* Page Content */}
        <div className="flex-1 p-6">
          <ModuleViewHost config={accountingViewHostConfig}>
            {children}
          </ModuleViewHost>
        </div>
      </SidebarMain>
    </FiscalYearProvider>
  );
}
