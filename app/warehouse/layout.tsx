'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Truck,
  LayoutDashboard,
  Package,
  Users,
  Settings,
  HelpCircle,
  ChevronRight,
  LogOut,
  Home,
  Building2,
  Warehouse,
  FolderTree,
  CreditCard,
  ArrowLeftRight,
  Wallet,
  BarChart3,
  AlertTriangle,
  CalendarClock,
  FileBarChart,
  Upload,
  Trash2,
} from 'lucide-react';
import { usePermissions } from '../../lib/usePermissions';
import { SUBSCRIPTION_PURCHASE_UI_ENABLED } from '../../lib/subscription-ui';
import ProfileDropdown from '../../components/ProfileDropdown';
import LocationSelect from '../../components/LocationSelect';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import { CollapsibleSidebar, SidebarMain } from '../../components/CollapsibleSidebar';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import { performLogout } from '../../lib/auth-logout';
import { FiscalYearProvider } from '../../lib/fiscal-year-context';
import { LocationProvider } from '../../lib/location-context';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';
import ModuleViewHost from '../../components/ModuleViewHost';
import {
  warehouseViewHostConfig,
} from '../../lib/module-view-host/registries';
import { keepAliveNavProps } from '../../lib/module-view-host/nav-props';

// ============================================================
// WAREHOUSE SIDEBAR
// ============================================================
function WarehouseSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();
  const { hasSubPageAccess, hasModuleAccess, isAdmin } = usePermissions();

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/warehouse/dashboard', permission: 'dashboard' },
    { icon: <Package className="w-5 h-5" />, label: 'Products', path: '/warehouse/products', permission: 'products' },
    { icon: <Upload className="w-5 h-5" />, label: 'Import Inventory', path: '/warehouse/import', permission: 'products' },
    { icon: <FolderTree className="w-5 h-5" />, label: 'Categories', path: '/warehouse/categories', permission: 'categories' },
    { icon: <Users className="w-5 h-5" />, label: 'Suppliers', path: '/warehouse/suppliers', permission: 'suppliers' },
    { icon: <ArrowLeftRight className="w-5 h-5" />, label: 'Stock Movement', path: '/warehouse/stock-movement', permission: 'stock-movement' },
    { icon: <ArrowLeftRight className="w-5 h-5" />, label: 'Product Transfer', path: '/warehouse/transfers', permission: 'stock-movement' },
    { icon: <Trash2 className="w-5 h-5" />, label: 'Stock Write-Offs', path: '/warehouse/write-offs', permission: 'stock-movement' },
    { icon: <Warehouse className="w-5 h-5" />, label: 'Warehouses', path: '/warehouse/locations', permission: 'products' },
    { icon: <Users className="w-5 h-5" />, label: 'Customers', path: '/warehouse/customers', permission: 'customers' },
    { icon: <Wallet className="w-5 h-5" />, label: 'Inventory Valuation', path: '/warehouse/inventory-valuation', permission: 'inventory-valuation' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Stock Summary', path: '/warehouse/reports/stock-summary', permission: 'stock-summary' },
    { icon: <AlertTriangle className="w-5 h-5" />, label: 'Low Stock Report', path: '/warehouse/reports/low-stock', permission: 'low-stock' },
    { icon: <CalendarClock className="w-5 h-5" />, label: 'Expiry Report', path: '/warehouse/reports/expiry', permission: 'expiry' },
    { icon: <FileBarChart className="w-5 h-5" />, label: 'All Reports', path: '/warehouse/reports', permission: 'reports' },
    { icon: <Settings className="w-5 h-5" />, label: 'Tax Compliance', path: '/tax', permission: 'settings' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/warehouse/product-settings', permission: 'settings' },
    { icon: <CreditCard className="w-5 h-5" />, label: 'Subscription Plans', path: '/plans', permission: '*' },
  ];

  const mainMenuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Main Dashboard', path: '/dashboard' },
    { icon: <Building2 className="w-5 h-5" />, label: 'Accounting', path: '/accounting/dashboard' },
  ];

  const isActive = (path: string) =>
    pathname === path ||
    (path !== '/warehouse/reports' && pathname.startsWith(`${path}/`));

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (item.path === '/plans') return isAdmin && SUBSCRIPTION_PURCHASE_UI_ENABLED;
    if (item.path === '/warehouse/locations') return isAdmin;
    return item.permission === '*' || isAdmin || hasSubPageAccess('warehouse', item.permission);
  });

  const filteredMainMenuItems = mainMenuItems.filter(item => {
    if (item.path === '/dashboard') return true;
    if (item.path === '/accounting/dashboard') return isAdmin || hasModuleAccess('accounting');
    return true;
  });

  return (
    <CollapsibleSidebar expandedClassName="w-56" expandedWidth={224}>
      <BrandHeader subtitle="Inventory Module" />

      {/* Menu Items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {!collapsed && (
          <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3 sidebar-expanded-only">
            INVENTORY MENU
          </p>
        )}
        
        {filteredMenuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            title={item.label}
            {...keepAliveNavProps(warehouseViewHostConfig, item.path)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive(item.path) 
                ? 'bg-[#014582] text-white shadow-md shadow-[#014582]/30' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className={isActive(item.path) ? 'text-white' : 'text-white/40'}>
                {item.icon}
              </span>
              <span className="text-sm font-medium sidebar-expanded-only">{item.label}</span>
            </div>
            {isActive(item.path) && !collapsed && (
              <ChevronRight className="w-4 h-4 text-white sidebar-expanded-only" />
            )}
          </Link>
        ))}

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

        {filteredMainMenuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            title={item.label}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            {item.icon}
            <span className="text-sm font-medium sidebar-expanded-only">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="px-3 pb-4 flex-shrink-0">
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
            <HelpCircle className="w-5 h-5 text-white mb-2" />
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

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FiscalYearProvider>
      <LocationProvider allowAll allowAllUsers>
      <WarehouseSidebar />

      <SidebarMain className="bg-gray-50">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
          <TopBarBrand
            title="Inventory Management"
            icon={<Warehouse className="w-5 h-5 text-[#014582]" />}
          />

          <div className="flex items-center gap-4">
            <LocationSelect entityLabel="Warehouse" />

            <div className="w-px h-6 bg-gray-200" />

            <GlobalSearch />

            <div className="w-px h-6 bg-gray-200" />

            <ProfileDropdown accentClassName="bg-[#014582]" />
          </div>
        </header>

        <AppBreadcrumbs />

        {/* Page Content */}
        <div className="flex-1 p-6">
          <ModuleViewHost config={warehouseViewHostConfig}>
            {children}
          </ModuleViewHost>
        </div>
      </SidebarMain>
      </LocationProvider>
    </FiscalYearProvider>
  );
}