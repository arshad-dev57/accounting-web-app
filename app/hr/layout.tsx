'use client';

export const dynamic = 'force-dynamic';

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
  FileText,
  Layers,
  Play,
  ShieldCheck,
  Banknote,
  History,
  TrendingUp,
} from 'lucide-react';
import { TopBarBrand } from '../../components/BrandHeader';
import { CollapsibleSidebar, SidebarMain } from '../../components/CollapsibleSidebar';
import ProfileDropdown from '../../components/ProfileDropdown';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import NotificationDropdown from '../../components/NotificationDropdown';
import { performLogout } from '../../lib/auth-logout';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';

const SECTIONS: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType; matchPrefix?: boolean }[];
}[] = [
  {
    label: 'MAIN',
    items: [
      { href: '/hr/dashboard', label: 'Dashboard', icon: Home },
      { href: '/hr/offices', label: 'Offices', icon: Building2 },
      { href: '/hr/organization', label: 'Departments', icon: GitBranch },
      { href: '/hr/cost-centers', label: 'Cost Centers', icon: Landmark },
      { href: '/hr/team', label: 'My Team', icon: UsersRound },
    ],
  },
  {
    label: 'WORKFORCE',
    items: [
      { href: '/hr/employees', label: 'Employees', icon: Users, matchPrefix: true },
      { href: '/hr/add-employee', label: 'Add Employee', icon: UserPlus },
      { href: '/hr/shift-plans', label: 'Shift Plans', icon: Clock },
      { href: '/hr/roster', label: 'Roster', icon: CalendarRange },
      { href: '/hr/attendance', label: 'Attendance', icon: Fingerprint, matchPrefix: true },
      { href: '/hr/calendar', label: 'Calendar View', icon: CalendarDays },
      { href: '/hr/leaves', label: 'Leave Management', icon: PlaneTakeoff },
      { href: '/hr/leave-policies', label: 'Leave Policies', icon: PlaneTakeoff },
      { href: '/hr/holidays', label: 'Holidays', icon: Palmtree },
      { href: '/hr/overtime', label: 'Overtime', icon: Timer },
      { href: '/hr/live-tracking', label: 'Live Tracking', icon: MapPin },
      { href: '/hr/lifecycle', label: 'Lifecycle', icon: GitBranch },
      { href: '/hr/documents', label: 'Documents', icon: FolderOpen },
      { href: '/hr/approvals', label: 'Approvals', icon: Inbox },
      { href: '/hr/performance', label: 'Performance Reviews', icon: ClipboardCheck },
      { href: '/hr/org-chart', label: 'Organization Chart', icon: Network },
    ],
  },
  {
    label: 'PAYROLL PROCESSING',
    items: [
      { href: '/hr/payroll/dashboard', label: 'Payroll Dashboard', icon: Wallet, matchPrefix: true },
      { href: '/hr/payroll/periods', label: 'Pay Periods', icon: CalendarDays },
      { href: '/hr/payroll/run', label: 'Payroll Processing', icon: Play },
    ],
  },
  {
    label: 'PAYROLL RECORDS',
    items: [
      { href: '/hr/payroll/pay-register', label: 'Pay Register', icon: FileText },
      { href: '/hr/payroll/payslips', label: 'Payslips', icon: FileText },
      { href: '/hr/payroll/payments', label: 'Payroll Payments', icon: Banknote },
      { href: '/hr/payroll/history', label: 'Payroll History', icon: History },
    ],
  },
  {
    label: 'PAYROLL MANAGEMENT',
    items: [
      { href: '/hr/payroll/salary-structures', label: 'Salary Structures', icon: Layers },
      { href: '/hr/payroll/employee-salary', label: 'Employee Salary', icon: Users },
      { href: '/hr/loans', label: 'Loans & Advances', icon: Landmark },
      { href: '/hr/bonuses', label: 'Bonuses', icon: Award },
      { href: '/hr/payroll/sales', label: 'Sales Commission', icon: Award },
    ],
  },
  {
    label: 'REPORTS & INSIGHTS',
    items: [
      { href: '/hr/reports/payroll', label: 'Payroll Reports', icon: Wallet, matchPrefix: true },
      { href: '/hr/reports', label: 'HR Reports', icon: BarChart3 },
      { href: '/hr/attendance/reports', label: 'Attendance Reports', icon: FileText },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { href: '/hr/settings', label: 'HR & Payroll Settings', icon: Settings },
      { href: '/hr/notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

function HRSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();

  const isActive = (path: string, label: string, matchPrefix?: boolean): boolean => {
    if (label === 'Analytics') return false;
    if (path === '/hr/payroll/dashboard') return pathname === '/hr/payroll/dashboard';
    if (path === '/hr/payroll/run') return pathname === '/hr/payroll/run' || pathname === '/hr/payroll';
    if (path === '/hr/payroll/pay-register') return pathname === '/hr/payroll/pay-register';
    if (path === '/hr/reports') return pathname === '/hr/reports';
    if (path === '/hr/reports/payroll') {
      return pathname === '/hr/reports/payroll' || pathname.startsWith('/hr/reports/payroll/');
    }
    if (matchPrefix) return pathname === path || pathname.startsWith(`${path}/`);
    return pathname === path;
  };

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <div className="p-4 flex-shrink-0">
        <Link
          href="/dashboard"
          title="HR Management"
          className={`flex items-center rounded-lg hover:bg-white/5 transition-all ${
            collapsed ? 'justify-center px-1 py-2' : 'gap-3 px-2 py-2'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#014582] flex items-center justify-center flex-shrink-0">
            <UsersRound className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="sidebar-expanded-only">
              <p className="text-sm font-extrabold text-white">HR Management</p>
              <p className="text-[10px] text-white/50 font-medium">hr@bisonstechs.com</p>
            </div>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-2 sidebar-expanded-only">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.label, item.matchPrefix);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    title={item.label}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      active
                        ? 'text-white bg-[#014582] shadow-md shadow-[#014582]/30 font-semibold'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate sidebar-expanded-only">{item.label}</span>
                    {active && !collapsed && (
                      <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0 sidebar-expanded-only" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 pb-6 pt-2 flex-shrink-0 border-t border-white/10">
        <Link
          href="/dashboard"
          title="Main Dashboard"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-white/40 hover:text-white hover:bg-white/5"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium sidebar-expanded-only">Main Dashboard</span>
        </Link>
        <button
          type="button"
          title="Logout"
          onClick={() => void performLogout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 text-[#E74C3C]/90 hover:text-[#E74C3C] hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium sidebar-expanded-only">Logout</span>
        </button>
      </div>
    </CollapsibleSidebar>
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
      <SidebarMain className="bg-[#F0F4F8]">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
          <TopBarBrand
            title="HR Management"
            icon={<UsersRound className="w-5 h-5 text-[#014582]" />}
          />

          <div className="flex items-center gap-4">
            <GlobalSearch />
            <NotificationDropdown />

            <div className="w-px h-6 bg-gray-200" />

            <ProfileDropdown accentClassName="bg-[#014582]" />
          </div>
        </header>

        <AppBreadcrumbs />

        <div className="flex-1 p-6">{children}</div>
      </SidebarMain>
    </>
  );
}
