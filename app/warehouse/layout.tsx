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
  ChevronDown,
  Home,
  Building2,
  Warehouse,
  FolderTree
} from 'lucide-react';
import { usePermissions } from '../../lib/usePermissions';

// ============================================================
// WAREHOUSE SIDEBAR
// ============================================================
function WarehouseSidebar() {
  const pathname = usePathname();
  const { hasSubPageAccess, hasModuleAccess, isAdmin } = usePermissions();

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/warehouse/dashboard', permission: 'dashboard' },
    { icon: <Package className="w-5 h-5" />, label: 'Products', path: '/products', permission: 'products' },
    { icon: <FolderTree className="w-5 h-5" />, label: 'Categories', path: '/warehouse/categories', permission: 'categories' },
    { icon: <Users className="w-5 h-5" />, label: 'Suppliers', path: '/warehouse/suppliers', permission: 'suppliers' },
    { icon: <Users className="w-5 h-5" />, label: 'Stock-Movement', path: '/warehouse/stock-movement', permission: 'stock-movement' },
    { icon: <Users className="w-5 h-5" />, label: 'customers', path: '/warehouse/customers', permission: 'customers' },
    { icon: <Users className="w-5 h-5" />, label: 'Orders', path: '/warehouse/orders', permission: 'orders' },
    { icon: <Users className="w-5 h-5" />, label: 'Returns', path: '/warehouse/returns', permission: 'returns' },
    { icon: <Users className="w-5 h-5" />, label: 'Refunds', path: '/warehouse/refunds', permission: 'refunds' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/warehouse/product-settings', permission: 'settings' },
  ];

  const mainMenuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Main Dashboard', path: '/dashboard' },
    { icon: <Building2 className="w-5 h-5" />, label: 'Accounting', path: '/accounting/dashboard' },
  ];

  const isActive = (path: string) => pathname === path;

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(item => 
    isAdmin || hasSubPageAccess('warehouse', item.permission)
  );

  const filteredMainMenuItems = mainMenuItems.filter(item => {
    if (item.path === '/dashboard') return true;
    if (item.path === '/accounting/dashboard') return isAdmin || hasModuleAccess('accounting');
    return true;
  });

  return (
    <div className="w-56 min-h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-10 h-10 bg-[#7c4dff] rounded-xl flex items-center justify-center">
          <Warehouse className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-extrabold tracking-wider">Warehouse</span>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">
          WAREHOUSE MENU
        </p>
        
        {filteredMenuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive(item.path) 
                ? 'bg-[#7c4dff]/20 text-[#b388ff]' 
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
      <div className="px-3 pb-6">
        <div className="p-4 bg-[#7c4dff]/10 rounded-xl border border-[#7c4dff]/20">
          <HelpCircle className="w-5 h-5 text-[#b388ff] mb-2" />
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
// WAREHOUSE LAYOUT
// ============================================================
export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <WarehouseSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-[#7c4dff]" />
              Warehouse Management
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all">
              <Headset className="w-4 h-4" />
              <span>Support</span>
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-[#7c4dff]" />
              <span>Call Us: 03 111 006 555</span>
            </div>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all">
              <div className="w-8 h-8 bg-[#7c4dff] rounded-full flex items-center justify-center text-white text-sm font-bold">
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