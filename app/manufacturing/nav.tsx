'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  CalendarRange,
  Workflow,
  AlertTriangle,
  ClipboardList,
  ListTodo,
  Factory,
  Boxes,
  Route,
  Users,
  Wrench,
  PackageSearch,
  FileUp,
  RotateCcw,
  PackagePlus,
  SearchCheck,
  LifeBuoy,
  ClipboardPen,
  Handshake,
  FileText,
  Calculator,
  FileBarChart,
  Settings,
  BookOpen,
  LogOut,
  GitFork,
} from 'lucide-react';
import { performLogout } from '@/lib/auth-logout';

export const MFG_SECTIONS: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType; match?: string }[];
}[] = [
  {
    label: 'MAIN',
    items: [
      { href: '/manufacturing/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/manufacturing/guide', label: 'Process Guide', icon: BookOpen },
    ],
  },
  {
    label: 'PLANNING',
    items: [
      { href: '/manufacturing/planning/demand', label: 'Demand', icon: CalendarRange },
      { href: '/manufacturing/planning/mps', label: 'MPS', icon: Workflow },
      { href: '/manufacturing/planning/mrp', label: 'MRP', icon: GitFork },
      { href: '/manufacturing/planning/shortage', label: 'Material Shortage', icon: AlertTriangle },
    ],
  },
  {
    label: 'PRODUCTION',
    items: [
      { href: '/manufacturing/production/orders', label: 'Production Orders', icon: ClipboardList, match: '/manufacturing/production/orders' },
      { href: '/manufacturing/production/work-orders', label: 'Work Orders', icon: ListTodo },
    ],
  },
  {
    label: 'MASTER DATA',
    items: [
      { href: '/manufacturing/master/bom', label: 'BOM', icon: Boxes, match: '/manufacturing/master/bom' },
      { href: '/manufacturing/master/routings', label: 'Routings', icon: Route },
      { href: '/manufacturing/master/work-centers', label: 'Work Centers', icon: Users },
      { href: '/manufacturing/master/machines', label: 'Machines', icon: Wrench },
    ],
  },
  {
    label: 'MATERIALS',
    items: [
      { href: '/manufacturing/materials/reservations', label: 'Reservations', icon: PackageSearch },
      { href: '/manufacturing/materials/issues', label: 'Issues', icon: FileUp },
      { href: '/manufacturing/materials/scrap', label: 'Scrap', icon: RotateCcw },
      { href: '/manufacturing/materials/byproducts', label: 'By-products', icon: PackagePlus },
    ],
  },
  {
    label: 'QUALITY',
    items: [
      { href: '/manufacturing/quality/inspections', label: 'Inspections', icon: SearchCheck },
      { href: '/manufacturing/quality/rework', label: 'Rework', icon: RotateCcw },
    ],
  },
  {
    label: 'MAINTENANCE',
    items: [
      { href: '/manufacturing/maintenance/requests', label: 'Requests', icon: LifeBuoy },
      { href: '/manufacturing/maintenance/orders', label: 'Orders', icon: ClipboardPen },
    ],
  },
  {
    label: 'SUBCONTRACTING',
    items: [
      { href: '/manufacturing/subcontracting/vendors', label: 'Vendors', icon: Handshake },
      { href: '/manufacturing/subcontracting/orders', label: 'Orders', icon: FileText },
    ],
  },
  {
    label: 'COSTING & REPORTS',
    items: [
      { href: '/manufacturing/costing', label: 'Costing', icon: Calculator, match: '/manufacturing/costing' },
      { href: '/manufacturing/reports', label: 'Reports', icon: FileBarChart },
      { href: '/manufacturing/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function MfgSidebar() {
  const pathname = usePathname();
  const isActive = (path: string): boolean =>
    pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="w-64 h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0 fixed left-0 top-0">
      <div className="p-4 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-all">
          <div className="w-10 h-10 rounded-xl bg-[#014582] flex items-center justify-center">
            <Factory className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">Manufacturing</p>
            <p className="text-[10px] text-white/50 font-medium">Production · Quality · Cost</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
        {MFG_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.match ? pathname.startsWith(item.match) : isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      active ? 'bg-[#014582]/20 text-[#b388ff]' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-[12px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 pb-6 flex-shrink-0">
        <div className="p-4 bg-[#014582]/10 rounded-xl border border-[#014582]/20">
          <Home className="w-5 h-5 text-[#b388ff] mb-2" />
          <p className="text-sm font-semibold text-white">Need Help?</p>
          <p className="text-xs text-white/40 mt-1">Contact the support team</p>
        </div>
        <button
          type="button"
          onClick={() => void performLogout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
