'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  UserPlus,
  Building2,
  Clock,
  Fingerprint,
  CalendarDays,
  PlaneTakeoff,
  Palmtree,
  Timer,
  Wallet,
  ListChecks,
  ClipboardCheck,
  MapPin,
  Network,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  GitBranch,
  Inbox,
  FolderOpen,
  Landmark,
  Award,
  CalendarRange,
  UsersRound,
  Headset,
  Phone,
} from 'lucide-react';
import { TopBarBrand } from '../../components/BrandHeader';
import ProfileDropdown from '../../components/ProfileDropdown';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import { performLogout } from '../../lib/auth-logout';
const SECTIONS: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType }[];
}[] = [
  {
    label: 'MAIN',
    items: [
      { href: '/hr/dashboard', label: 'Dashboard', icon: Home },
      { href: '/hr/employees', label: 'Employees', icon: Users },
      { href: '/hr/add-employee', label: 'Add Employee', icon: UserPlus },
      { href: '/hr/offices', label: 'Offices', icon: Building2 },
      { href: '/hr/organization', label: 'Departments', icon: GitBranch },
      { href: '/hr/team', label: 'My Team', icon: UsersRound },
    ],
  },
  {
    label: 'TIME & ATTENDANCE',
    items: [
      { href: '/hr/attendance', label: 'Attendance', icon: Fingerprint },
      { href: '/hr/shifts', label: 'Shifts', icon: Clock },
      { href: '/hr/shift-plans', label: 'Shift Plans', icon: Clock },
      { href: '/hr/calendar', label: 'Calendar View', icon: CalendarDays },
      { href: '/hr/leaves', label: 'Leave Management', icon: PlaneTakeoff },
      { href: '/hr/leave-policies', label: 'Leave Policies', icon: PlaneTakeoff },
      { href: '/hr/holidays', label: 'Holidays', icon: Palmtree },
      { href: '/hr/overtime', label: 'Overtime', icon: Timer },
      { href: '/hr/roster', label: 'Roster', icon: CalendarRange },
      { href: '/hr/live-tracking', label: 'Live Tracking', icon: MapPin },
    ],
  },
  {
    label: 'WORKFORCE',
    items: [
      { href: '/hr/payroll', label: 'Payroll', icon: Wallet },
      { href: '/hr/loans', label: 'Loans & Advances', icon: Landmark },
      { href: '/hr/bonuses', label: 'Bonuses', icon: Award },
      { href: '/hr/lifecycle', label: 'Lifecycle', icon: GitBranch },
      { href: '/hr/documents', label: 'Documents', icon: FolderOpen },
      { href: '/hr/approvals', label: 'Approvals', icon: Inbox },
      { href: '/hr/tasks', label: 'Task Management', icon: ListChecks },
      { href: '/hr/performance', label: 'Performance Reviews', icon: ClipboardCheck },
      { href: '/hr/org-chart', label: 'Organization Chart', icon: Network },
    ],
  },
  {
    label: 'INSIGHTS & SETTINGS',
    items: [
      { href: '/hr/reports', label: 'Reports & Analytics', icon: BarChart3 },
      { href: '/hr/notifications', label: 'Notifications', icon: Bell },
      { href: '/hr/settings', label: 'HR Settings', icon: Settings },
    ],
  },
];

function HRSidebar() {
  const pathname = usePathname();
  const isActive = (path: string): boolean => pathname === path || pathname.startsWith(path + '/');

  return (
    <div className="w-64 h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0 fixed left-0 top-0">
      <div className="p-4 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-all">
          <div className="w-10 h-10 rounded-xl bg-[#014582] flex items-center justify-center">
            <UsersRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">HR Management</p>
            <p className="text-[10px] text-white/50 font-medium">hr@bisonstechs.com</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-2">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      active
                        ? 'text-white bg-[#014582]/60 font-semibold'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                    {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom — mirrors the mobile drawer's logout */}
      <div className="px-3 pb-6 pt-2 flex-shrink-0 border-t border-white/10">
        <Link
          href="/dashboard"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-white/40 hover:text-white hover:bg-white/5"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">Main Dashboard</span>
        </Link>
        <button
          type="button"
          onClick={() => void performLogout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 text-[#E74C3C]/90 hover:text-[#E74C3C] hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HRSidebar />
      <div className="ml-64 min-h-screen bg-[#F0F4F8] flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
          <TopBarBrand
            title="HR Management"
            icon={<UsersRound className="w-5 h-5 text-[#014582]" />}
          />

          <div className="flex items-center gap-4">
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

        <AppBreadcrumbs />

        {/* Page Content */}
        <div className="flex-1 p-6">{children}</div>
      </div>
    </>
  );
}
