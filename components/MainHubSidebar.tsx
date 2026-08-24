'use client';

import {
  Home,
  Warehouse,
  Building2,
  HelpCircle,
  ChevronRight,
  LogOut,
  User,
  ShoppingCart,
  Package,
  Store,
  CreditCard,
  Scale,
  CalendarDays,
} from 'lucide-react';
import { usePermissions } from '../lib/usePermissions';
import { BrandHeader } from './BrandHeader';
import { performLogout } from '../lib/auth-logout';

export function MainHubSidebar({ activePath = '/dashboard' }: { activePath?: string }) {
  const { hasModuleAccess, isAdmin, canViewRegisteredUsers } = usePermissions();

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Home', path: '/dashboard', show: true },
    { icon: <Building2 className="w-5 h-5" />, label: 'Accounting', path: '/accounting/dashboard', show: isAdmin || hasModuleAccess('accounting') },
    { icon: <Warehouse className="w-5 h-5" />, label: 'Warehouse', path: '/warehouse/dashboard', show: isAdmin || hasModuleAccess('warehouse') },
    { icon: <ShoppingCart className="w-5 h-5" />, label: 'Sales', path: '/sales/dashboard', show: isAdmin || hasModuleAccess('sales') },
    { icon: <Package className="w-5 h-5" />, label: 'Purchases', path: '/purchases', show: isAdmin || hasModuleAccess('purchases') },
    { icon: <Store className="w-5 h-5" />, label: 'Point of Sale', path: '/pos', show: isAdmin || hasModuleAccess('pos') },
    { icon: <Scale className="w-5 h-5" />, label: 'Tax Compliance', path: '/tax', show: isAdmin || hasModuleAccess('accounting') || hasModuleAccess('sales') || hasModuleAccess('purchases') || hasModuleAccess('pos') },
    { icon: <User className="w-5 h-5" />, label: 'Users', path: '/users', show: isAdmin },
    { icon: <CalendarDays className="w-5 h-5" />, label: 'Registered Users', path: '/registered-users', show: canViewRegisteredUsers },
    { icon: <CreditCard className="w-5 h-5" />, label: 'Subscription Plans', path: '/plans', show: isAdmin },
  ];

  const filteredMenuItems = menuItems.filter((item) => item.show);

  return (
    <div className="w-56 min-h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0">
      <BrandHeader subtitle="Main Dashboard" compact />

      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">
          MAIN MENU
        </p>

        {filteredMenuItems.map((item) => {
          const isActive = activePath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                window.location.href = item.path;
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-[#014582]/20 text-[#b388ff]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-[#b388ff]' : 'text-white/40'}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-[#b388ff]" />}
            </button>
          );
        })}
      </div>

      <div className="px-3 pb-6">
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
