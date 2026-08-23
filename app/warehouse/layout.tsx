'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  HelpCircle,
  ChevronRight,
  LogOut,
  Phone,
  Headset,
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
  MapPin,
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
// WAREHOUSE SIDEBAR
// ============================================================
function WarehouseSidebar() {
  const pathname = usePathname();
  const { hasSubPageAccess, hasModuleAccess, isAdmin } = usePermissions();

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/warehouse/dashboard', permission: 'dashboard' },
    { icon: <Package className="w-5 h-5" />, label: 'Products', path: '/warehouse/products', permission: 'products' },
    { icon: <FolderTree className="w-5 h-5" />, label: 'Categories', path: '/warehouse/categories', permission: 'categories' },
    { icon: <Users className="w-5 h-5" />, label: 'Suppliers', path: '/warehouse/suppliers', permission: 'suppliers' },
    { icon: <ArrowLeftRight className="w-5 h-5" />, label: 'Stock Movement', path: '/warehouse/stock-movement', permission: 'stock-movement' },
    { icon: <MapPin className="w-5 h-5" />, label: 'Locations', path: '/warehouse/locations', permission: 'products' },
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
    if (item.path === '/plans') return isAdmin;
    if (item.path === '/warehouse/locations') return isAdmin;
    return item.permission === '*' || isAdmin || hasSubPageAccess('warehouse', item.permission);
  });

  const filteredMainMenuItems = mainMenuItems.filter(item => {
    if (item.path === '/dashboard') return true;
    if (item.path === '/accounting/dashboard') return isAdmin || hasModuleAccess('accounting');
    return true;
  });

  return (
    <div className="w-56 h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0 fixed left-0 top-0">
      <BrandHeader subtitle="Warehouse Module" />

      {/* Menu Items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">
          WAREHOUSE MENU
        </p>
        
        {filteredMenuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive(item.path) 
                ? 'bg-[#014582]/20 text-[#b388ff]' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className={isActive(item.path) ? 'text-[#b388ff]' : 'text-white/40'}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {isActive(item.path) && (
              <ChevronRight className="w-4 h-4 text-[#b388ff]" />
            )}
          </Link>
        ))}

        <div className="my-4 border-t border-white/10" />

        <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">
          MAIN MENU
        </p>

        {filteredMainMenuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/40 hover:text-white hover:bg-white/5"
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
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
          <HelpCircle className="w-5 h-5 text-[#b388ff] mb-2" />
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
// WAREHOUSE LAYOUT
// ============================================================
export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FiscalYearProvider>
      <LocationProvider>
      <WarehouseSidebar />

      <div className="ml-56 min-h-screen bg-gray-50 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
          <TopBarBrand
            title="Warehouse Management"
            icon={<Warehouse className="w-5 h-5 text-[#014582]" />}
          />

          <div className="flex items-center gap-4">
            <LocationSelect />
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
            </div>

            <div className="w-px h-6 bg-gray-200" />

            <ProfileDropdown accentClassName="bg-[#014582]" />
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