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
  Clock
} from 'lucide-react';
import { usePermissions } from '../../lib/usePermissions';
import ProfileDropdown from '../../components/ProfileDropdown';
import FiscalYearSelect from '../../components/FiscalYearSelect';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import { performLogout } from '../../lib/auth-logout';
import { FiscalYearProvider } from '../../lib/fiscal-year-context';

// ============================================================
// ACCOUNTING SIDEBAR
// ============================================================
function AccountingSidebar() {
  const pathname = usePathname();
  const { hasSubPageAccess, hasModuleAccess, isAdmin } = usePermissions();
  
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

  const isActive = (path: string) => pathname === path;

  // Setup → money in → money out → books → balance sheet
  const accountingPages = [
    { path: '/accounting/dashboard', label: 'Dashboard', permission: 'dashboard' },
    { path: '/accounting/accounts', label: 'Chart of Accounts', permission: 'chart-of-accounts' },
    { path: '/accounting/bank-Accounts', label: 'Bank Accounts', permission: 'bank-accounts' },
    { path: '/accounting/invoices', label: 'Invoices', permission: 'invoices' },
    { path: '/accounting/payments-received', label: 'Payments Received', permission: 'payments-received' },
    { path: '/accounting/credit-notes', label: 'Credit Notes', permission: 'credit-notes' },
    { path: '/accounting/accounts-receivable', label: 'Accounts Receivable', permission: 'accounts-receivable' },
    { path: '/accounting/bills', label: 'Bills', permission: 'bills' },
    { path: '/accounting/payments-made', label: 'Payments Made', permission: 'payments-made' },
    { path: '/accounting/expenses', label: 'Expenses', permission: 'expenses' },
    { path: '/accounting/accounts-payable', label: 'Accounts Payable', permission: 'accounts-payable' },
    { path: '/accounting/income', label: 'Income', permission: 'income' },
    { path: '/accounting/journal-entries', label: 'Journal Entries', permission: 'journal-entries' },
    { path: '/accounting/general-ledger', label: 'General Ledger', permission: 'general-ledger' },
    { path: '/accounting/trial-balance', label: 'Trial Balance', permission: 'trial-balance' },
    { path: '/accounting/fixed-assets', label: 'Fixed Assets', permission: 'fixed-assets' },
    { path: '/accounting/loans-borrowings', label: 'Loans & Borrowings', permission: 'loans-borrowings' },
    { path: '/accounting/capital-equity', label: 'Capital & Equity', permission: 'capital-equity' },
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
    { path: '/accounting/settings', label: 'Accounting Settings', permission: 'settings' },
  ];

  // Filter pages based on permissions
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
    <div className="w-64 h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0 fixed left-0 top-0">
      <BrandHeader subtitle="Accounting Module" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">
          ACCOUNTING NAVIGATION
        </p>

        {/* Accounting Core */}
        <div>
          <button
            onClick={() => toggleSection('accountingCore')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-white/40">
                <Calculator className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium text-white/90">Accounting Core</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${expandedSections.accountingCore ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.accountingCore && filteredAccountingPages.length > 0 && (
            <div className="ml-6 mt-1 space-y-1">
              {filteredAccountingPages.map((page) => {
                const iconMap: Record<string, React.ReactNode> = {
                  'dashboard': <Home className="w-4 h-4" />,
                  'chart-of-accounts': <Banknote className="w-4 h-4" />,
                  'bank-accounts': <Building2 className="w-4 h-4" />,
                  'invoices': <Receipt className="w-4 h-4" />,
                  'payments-received': <DollarSign className="w-4 h-4" />,
                  'credit-notes': <FileText className="w-4 h-4" />,
                  'accounts-receivable': <Users className="w-4 h-4" />,
                  'bills': <FileText className="w-4 h-4" />,
                  'payments-made': <CreditCard className="w-4 h-4" />,
                  'expenses': <Wallet className="w-4 h-4" />,
                  'accounts-payable': <Receipt className="w-4 h-4" />,
                  'income': <TrendingUp className="w-4 h-4" />,
                  'journal-entries': <FileSpreadsheet className="w-4 h-4" />,
                  'general-ledger': <BookOpen className="w-4 h-4" />,
                  'trial-balance': <Scale className="w-4 h-4" />,
                  'fixed-assets': <Package className="w-4 h-4" />,
                  'loans-borrowings': <Handshake className="w-4 h-4" />,
                  'capital-equity': <Landmark className="w-4 h-4" />,
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

        {/* Reports */}
        <div>
          <button
            onClick={() => toggleSection('reports')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-white/40">
                <PieChart className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium text-white/90">Reports</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${expandedSections.reports ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.reports && filteredReportPages.length > 0 && (
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

        {isAdmin || hasModuleAccess('sales') && (
          <Link
            href="/sales"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-medium">Sales</span>
          </Link>
        )}

        {isAdmin || hasModuleAccess('purchases') && (
          <Link
            href="/purchases"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-medium">Purchases</span>
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

        <div className="p-4 bg-[#014582]/10 rounded-xl border border-[#014582]/20">
          <HelpCircle className="w-5 h-5 text-[#014582] mb-2" />
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
// ACCOUNTING LAYOUT
// ============================================================
export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FiscalYearProvider>
      <AccountingSidebar />

      <div className="ml-64 min-h-screen bg-gray-50 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
          <TopBarBrand
            title="Accounting Management"
            icon={<Calculator className="w-5 h-5 text-[#014582]" />}
          />

          <div className="flex items-center gap-4">
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
              <Phone className="w-4 h-4 text-[#014582]" />
              <span>Call Us: 03 111 006 555</span>
            </div>

            <div className="w-px h-6 bg-gray-200" />

            <ProfileDropdown accentClassName="bg-[#091746]" />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </FiscalYearProvider>
  );
}
