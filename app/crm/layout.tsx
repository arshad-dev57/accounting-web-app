'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Kanban,
  Phone,
  Settings,
  Home,
  LogOut,
  TrendingUp,
  RefreshCw,
  Building2,
  Contact2,
  Target,
  Activity,
  CheckSquare,
  CalendarDays,
  Megaphone,
  BarChart3,
  Import,
  Briefcase,
  FileSignature,
  Mail,
  Database,
  ChevronDown,
  UserCircle2,
  PieChart,
  XCircle,
  Swords,
  Gauge,
  Timer,
  UserMinus,
  LineChart,
} from 'lucide-react';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import { CollapsibleSidebar, SidebarMain } from '../../components/CollapsibleSidebar';
import ProfileDropdown from '../../components/ProfileDropdown';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import NotificationDropdown from '../../components/NotificationDropdown';
import { CurrencyProvider } from '../../lib/currency-context';
import { performLogout } from '../../lib/auth-logout';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';

type NavLink = { href: string; label: string; icon?: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; defaultOpen?: boolean; items: NavLink[] };

/** Mirrors ERPNext CRM workspace sidebar. */
const CRM_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspaces',
    defaultOpen: true,
    items: [
      { href: '/crm/dashboard', label: 'CRM', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Reports',
    defaultOpen: false,
    items: [
      { href: '/crm/reports/lead-details', label: 'Lead Details', icon: Users },
      {
        href: '/crm/reports/sales-pipeline-analytics',
        label: 'Sales Pipeline Analytics',
        icon: LineChart,
      },
      {
        href: '/crm/reports/opportunity-summary-by-sales-stage',
        label: 'Opportunity Summary by Sales Stage',
        icon: BarChart3,
      },
      { href: '/crm/reports/sales-funnel', label: 'Sales Funnel', icon: TrendingUp },
      {
        href: '/crm/reports/prospects-engaged-but-not-converted',
        label: 'Prospects Engaged But Not Converted',
        icon: Briefcase,
      },
      {
        href: '/crm/reports/first-response-time-for-opportunity',
        label: 'First Response Time for Opportunity',
        icon: Timer,
      },
      {
        href: '/crm/reports/inactive-customers',
        label: 'Inactive Customers',
        icon: UserMinus,
      },
      {
        href: '/crm/reports/campaign-efficiency',
        label: 'Campaign Efficiency',
        icon: Megaphone,
      },
      {
        href: '/crm/reports/lead-owner-efficiency',
        label: 'Lead Owner Efficiency',
        icon: Gauge,
      },
    ],
  },
  {
    label: 'Masters',
    defaultOpen: false,
    items: [
      { href: '/crm/territory', label: 'Territory', icon: Database },
      { href: '/crm/customer-group', label: 'Customer Group', icon: Database },
      { href: '/crm/contacts', label: 'Contact', icon: Contact2 },
      { href: '/crm/prospects', label: 'Prospect', icon: Briefcase },
      { href: '/crm/sales-stage', label: 'Sales Stage', icon: Target },
      { href: '/crm/opportunity-type', label: 'Opportunity Type', icon: Target },
      { href: '/crm/market-segment', label: 'Market Segment', icon: PieChart },
      { href: '/crm/lost-reason', label: 'Lost Reason', icon: XCircle },
      { href: '/crm/competitor', label: 'Competitor', icon: Swords },
      { href: '/crm/lead-source', label: 'Lead Source', icon: TrendingUp },
    ],
  },
  {
    label: 'Sales Pipeline',
    defaultOpen: true,
    items: [
      { href: '/crm/leads', label: 'Lead', icon: Users },
      { href: '/crm/opportunities', label: 'Opportunity', icon: Target },
      { href: '/crm/accounts', label: 'Customer', icon: Building2 },
      { href: '/crm/contracts', label: 'Contract', icon: FileSignature },
      { href: '/crm/appointments', label: 'Appointment', icon: CalendarDays },
      { href: '/crm/activities', label: 'Communication', icon: Activity },
    ],
  },
  {
    label: 'Settings',
    defaultOpen: false,
    items: [
      { href: '/crm/settings', label: 'CRM Settings', icon: Settings },
      { href: '/crm/import', label: 'Import', icon: Import },
      { href: '/crm/google-sheets', label: 'Google Sheets', icon: RefreshCw },
    ],
  },
  {
    label: 'Campaign',
    defaultOpen: false,
    items: [
      { href: '/crm/campaigns', label: 'Campaign', icon: Megaphone },
      { href: '/crm/email-campaigns', label: 'Email Campaign', icon: Mail },
    ],
  },
];

const SHORTCUTS: NavLink[] = [
  { href: '/crm/pipeline', label: 'Sales Pipeline', icon: Kanban },
  { href: '/crm/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/crm/follow-ups', label: 'Follow-ups', icon: Phone },
  { href: '/crm/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/crm/contacts/new', label: 'New Contact', icon: UserCircle2 },
];

function CRMSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CRM_NAV_GROUPS.map((g) => [g.label, !!g.defaultOpen])),
  );

  const isActive = (href: string) => {
    const base = href.split('?')[0];
    if (base.startsWith('/crm/reports/')) return pathname === base;
    if (base === '/crm/dashboard') {
      return pathname === '/crm' || pathname === '/crm/dashboard';
    }
    return pathname === base || Boolean(pathname?.startsWith(`${base}/`));
  };

  return (
    <CollapsibleSidebar expandedClassName="w-[260px]" expandedWidth={260}>
      <BrandHeader subtitle="CRM Module" />

      <div className="custom-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {CRM_NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1.5">
            {!collapsed && (
              <button
                type="button"
                onClick={() =>
                  setOpen((p) => ({ ...p, [group.label]: !p[group.label] }))
                }
                className="mb-0.5 flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35 hover:bg-white/5 hover:text-white/70"
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    open[group.label] ? '' : '-rotate-90'
                  }`}
                />
              </button>
            )}
            {(collapsed || open[group.label]) &&
              group.items.map((item) => {
                const Icon = item.icon || LayoutDashboard;
                const active = isActive(item.href);
                return (
                  <Link
                    key={`${group.label}-${item.href}-${item.label}`}
                    href={item.href}
                    title={item.label}
                    className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/65 hover:bg-white/[0.07] hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" />
                    <span className="sidebar-expanded-only truncate">{item.label}</span>
                  </Link>
                );
              })}
          </div>
        ))}

        {!collapsed && (
          <p className="mb-1 mt-4 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">
            Your Shortcuts
          </p>
        )}
        {SHORTCUTS.map((item) => {
          const Icon = item.icon || LayoutDashboard;
          const active = isActive(item.href);
          return (
            <Link
              key={`sc-${item.href}-${item.label}`}
              href={item.href}
              title={item.label}
              className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/65 hover:bg-white/[0.07] hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="sidebar-expanded-only truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="shrink-0 space-y-0.5 border-t border-white/10 px-2.5 py-3">
        <Link
          href="/dashboard"
          title="Main Dashboard"
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/55 hover:bg-white/[0.07] hover:text-white"
        >
          <Home className="h-4 w-4 shrink-0" />
          <span className="sidebar-expanded-only">Main Dashboard</span>
        </Link>
        <button
          type="button"
          onClick={() => performLogout()}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/55 hover:bg-white/[0.07] hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="sidebar-expanded-only">Logout</span>
        </button>
      </div>
    </CollapsibleSidebar>
  );
}

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <div className="flex h-screen overflow-hidden bg-[#f6f7f9]">
        <CRMSidebar />
        <SidebarMain className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-gray-200/90 bg-white/95 px-3 md:px-4 backdrop-blur">
            <div className="flex min-w-0 items-center gap-3">
              <TopBarBrand title="CRM" />
              <div className="hidden min-w-0 md:block">
                <AppBreadcrumbs />
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <GlobalSearch />
              <NotificationDropdown />
              <ProfileDropdown />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="px-3 py-3 md:px-4 md:py-4">{children}</div>
          </main>
        </SidebarMain>
      </div>
    </CurrencyProvider>
  );
}
