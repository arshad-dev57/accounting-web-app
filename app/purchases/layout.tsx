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
  PackageCheck
} from 'lucide-react';
import { usePermissions } from '../../lib/usePermissions';

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
    { path: '/purchases/currency', label: 'Currency', permission: 'currency' },
    { path: '/purchases/settings', label: 'Purchases Settings', permission: 'settings' },
  ];

  // Filter pages based on permissions
  const filteredPurchasesPages = purchasesPages.filter(page => 
    isAdmin || hasSubPageAccess('purchases', page.permission)
  );
  
  const filteredReturnsRefundsPages = returnsRefundsPages.filter(page => 
    isAdmin || hasSubPageAccess('purchases', page.permission)
  );
  
  const filteredSettingsPages = settingsPages.filter(page => 
    isAdmin || hasSubPageAccess('purchases', page.permission)
  );

  return (
    <div className="w-64 min-h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-10 h-10 bg-[#00E676] rounded-xl flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Purchases Module</p>
          <p className="text-xs text-white/50">Manage purchases operations</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto px-3 py-4 space-y-1">
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
                  'purchase-orders': <ShoppingCart className="w-4 h-4" />,
                  'suppliers': <Users className="w-4 h-4" />,
                  'quotations': <FileText className="w-4 h-4" />,
                  'goods-receiving': <PackageCheck className="w-4 h-4" />,
                  'purchase-invoices': <Receipt className="w-4 h-4" />,
                  'purchase-payments': <ArrowLeftRight className="w-4 h-4" />,
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
                };
                
                return (
                  <Link
                    key={page.path}
                    href={page.path}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive(page.path) ? 'text-white bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {iconMap[page.permission] || <Settings className="w-4 h-4" />}
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
            href="/sales"
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
      <div className="px-3 pb-6">
        <div className="p-4 bg-[#00E676]/10 rounded-xl border border-[#00E676]/20">
          <HelpCircle className="w-5 h-5 text-[#00E676] mb-2" />
          <p className="text-sm font-semibold text-white">Need Help?</p>
          <p className="text-xs text-white/40">Contact our support team</p>
        </div>
        
        <button className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all">
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
    <div className="flex min-h-screen bg-gray-50">
      <PurchasesSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-[#00E676]" />
              Purchases Management
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all">
              <Headset className="w-4 h-4" />
              <span>Support</span>
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-[#00E676]" />
              <span>Call Us: 03 111 006 555</span>
            </div>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all">
              <div className="w-8 h-8 bg-[#00E676] rounded-full flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
