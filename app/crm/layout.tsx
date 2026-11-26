'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
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
  ChevronDown,
  ChevronRight,
  UserCircle2,
  PieChart,
  XCircle,
  Swords,
  Gauge,
  Timer,
  UserMinus,
  LineChart,
  MapPinned,
  Tags,
  Layers,
  StickyNote,
} from 'lucide-react';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import { CollapsibleSidebar } from '../../components/CollapsibleSidebar';
import { ModuleChrome } from '../../components/ModuleChrome';
import ProfileDropdown from '../../components/ProfileDropdown';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import NotificationDropdown from '../../components/NotificationDropdown';
import { CurrencyProvider } from '../../lib/currency-context';
import { performLogout } from '../../lib/auth-logout';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';

type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};
type NavGroup = { id: string; label: string; defaultOpen?: boolean; items: NavLink[] };

const CRM_NAV_GROUPS: NavGroup[] = [
  {
    id: 'pipeline',
    label: 'Sales Pipeline',
    defaultOpen: true,
    items: [
      { href: '/crm/leads', label: 'Leads', icon: Users },
      { href: '/crm/opportunities', label: 'Opportunities', icon: Target },
      { href: '/crm/accounts', label: 'Customers', icon: Building2 },
      { href: '/crm/contracts', label: 'Contracts', icon: FileSignature },
      { href: '/crm/appointments', label: 'Appointments', icon: CalendarDays },
      { href: '/crm/activities', label: 'Communications', icon: Activity },
    ],
  },
  {
    id: 'campaign',
    label: 'Campaigns',
    defaultOpen: false,
    items: [
      { href: '/crm/campaigns', label: 'Campaigns', icon: Megaphone },
      { href: '/crm/email-campaigns', label: 'Email Campaigns', icon: Mail },
    ],
  },
  {
    id: 'masters',
    label: 'Masters',
    defaultOpen: false,
    items: [
      { href: '/crm/territory', label: 'Territory', icon: MapPinned },
      { href: '/crm/customer-group', label: 'Customer Group', icon: Layers },
      { href: '/crm/contacts', label: 'Contacts', icon: Contact2 },
      { href: '/crm/prospects', label: 'Prospects', icon: Briefcase },
      { href: '/crm/sales-stage', label: 'Sales Stage', icon: Kanban },
      { href: '/crm/opportunity-type', label: 'Opportunity Type', icon: Tags },
      { href: '/crm/market-segment', label: 'Market Segment', icon: PieChart },
      { href: '/crm/lost-reason', label: 'Lost Reason', icon: XCircle },
      { href: '/crm/competitor', label: 'Competitor', icon: Swords },
      { href: '/crm/lead-source', label: 'Lead Source', icon: TrendingUp },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    defaultOpen: false,
    items: [
      { href: '/crm/reports/lead-details', label: 'Lead Details', icon: Users },
      {
        href: '/crm/reports/sales-pipeline-analytics',
        label: 'Pipeline Analytics',
        icon: LineChart,
      },
      {
        href: '/crm/reports/opportunity-summary-by-sales-stage',
        label: 'Opportunity by Stage',
        icon: BarChart3,
      },
      { href: '/crm/reports/sales-funnel', label: 'Sales Funnel', icon: TrendingUp },
      {
        href: '/crm/reports/prospects-engaged-but-not-converted',
        label: 'Unconverted Prospects',
        icon: Briefcase,
      },
      {
        href: '/crm/reports/first-response-time-for-opportunity',
        label: 'First Response Time',
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
    id: 'settings',
    label: 'Settings',
    defaultOpen: false,
    items: [
      { href: '/crm/settings', label: 'CRM Settings', icon: Settings },
      { href: '/crm/import', label: 'Import', icon: Import },
      { href: '/crm/google-sheets', label: 'Google Sheets', icon: RefreshCw },
    ],
  },
];

const SHORTCUTS: NavLink[] = [
  { href: '/crm/pipeline', label: 'Sales Pipeline', icon: Kanban },
  { href: '/crm/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/crm/follow-ups', label: 'Follow-ups', icon: Phone },
  { href: '/crm/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/notes', label: 'Local Notes', icon: StickyNote },
  { href: '/crm/contacts/new', label: 'New Contact', icon: UserCircle2 },
];

function pathMatches(pathname: string | null, href: string) {
  const base = href.split('?')[0];
  if (!pathname || !base) return false;
  if (base.startsWith('/crm/reports/')) return pathname === base;
  if (base === '/crm/dashboard') {
    return pathname === '/crm' || pathname === '/crm/dashboard';
  }
  // Prefer exact match for "new" routes under contacts so list stays distinct
  if (base === '/crm/contacts' && pathname.startsWith('/crm/contacts/new')) {
    return false;
  }
  return pathname === base || pathname.startsWith(`${base}/`);
}

function NavItem({
  item,
  active,
  collapsed,
}: {
  item: NavLink;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      className={`group flex w-full items-center rounded-lg transition-all duration-200 ${
        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
      } ${
        active
          ? 'bg-[#014582] text-white shadow-md shadow-[#014582]/25'
          : 'text-white/65 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-white/45 group-hover:text-white/80'}`}
      />
      <span className="sidebar-expanded-only min-w-0 flex-1 truncate text-sm font-medium">
        {item.label}
      </span>
      {active && !collapsed ? (
        <ChevronRight className="sidebar-expanded-only h-4 w-4 shrink-0 text-white/80" />
      ) : null}
    </Link>
  );
}

function CRMSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();

  const activeGroupId = useMemo(() => {
    for (const group of CRM_NAV_GROUPS) {
      if (group.items.some((item) => pathMatches(pathname, item.href))) {
        return group.id;
      }
    }
    if (SHORTCUTS.some((item) => pathMatches(pathname, item.href))) {
      return 'shortcuts';
    }
    return 'pipeline';
  }, [pathname]);

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CRM_NAV_GROUPS.map((g) => [g.id, !!g.defaultOpen]))
  );

  useEffect(() => {
    if (!activeGroupId || activeGroupId === 'shortcuts') return;
    setOpen((prev) => {
      if (prev[activeGroupId]) return prev;
      return { ...prev, [activeGroupId]: true };
    });
  }, [activeGroupId]);

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <BrandHeader subtitle="CRM Module" />

      <div className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="sidebar-expanded-only mb-3 px-2 text-[10px] font-semibold tracking-wider text-white/30">
            CRM MENU
          </p>
        )}

        <NavItem
          item={{ href: '/crm/dashboard', label: 'Dashboard', icon: LayoutDashboard }}
          active={pathMatches(pathname, '/crm/dashboard')}
          collapsed={collapsed}
        />

        {CRM_NAV_GROUPS.map((group) => {
          // Collapsed rail: only primary groups so icons stay aligned and scannable
          if (collapsed && group.id !== 'pipeline' && group.id !== 'settings') {
            return null;
          }
          const isOpen = collapsed || !!open[group.id];
          return (
            <div key={group.id} className="pt-2">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() =>
                    setOpen((p) => ({ ...p, [group.id]: !p[group.id] }))
                  }
                  className="mb-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    {group.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-white/35 transition-transform ${
                      open[group.id] ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}
              {collapsed ? (
                <div className="mx-auto mb-1 h-px w-8 bg-white/10" />
              ) : null}
              {isOpen ? (
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavItem
                      key={`${group.id}-${item.href}`}
                      item={item}
                      active={pathMatches(pathname, item.href)}
                      collapsed={collapsed}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}

        <div className="pt-3">
          {!collapsed && (
            <p className="sidebar-expanded-only mb-2 px-2 text-[10px] font-semibold tracking-wider text-white/30">
              SHORTCUTS
            </p>
          )}
          {collapsed ? <div className="mx-auto mb-1 h-px w-8 bg-white/10" /> : null}
          <div className="space-y-1">
            {SHORTCUTS.map((item) => (
              <NavItem
                key={`sc-${item.href}`}
                item={item}
                active={pathMatches(pathname, item.href)}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-1 border-t border-white/10 px-3 py-4">
        <Link
          href="/dashboard"
          title="Main Dashboard"
          className={`flex w-full items-center rounded-lg text-white/55 transition-all hover:bg-white/5 hover:text-white ${
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <Home className="h-5 w-5 shrink-0" />
          <span className="sidebar-expanded-only text-sm font-medium">Main Dashboard</span>
        </Link>
        <button
          type="button"
          title="Logout"
          onClick={() => performLogout()}
          className={`flex w-full items-center rounded-lg text-white/45 transition-all hover:bg-white/5 hover:text-white/70 ${
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="sidebar-expanded-only text-sm font-medium">Logout</span>
        </button>
      </div>
    </CollapsibleSidebar>
  );
}

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const topGroups = CRM_NAV_GROUPS.map((g) => ({
    label: g.label,
    items: g.items.map((item) => ({ label: item.label, href: item.href })),
  }));
  return (
    <CurrencyProvider>
      <ModuleChrome
        title="CRM"
        icon={<Users className="w-5 h-5 text-[#014582]" />}
        sidebar={<CRMSidebar />}
        topGroups={topGroups}
        showBreadcrumbs
        contentClassName="flex-1 overflow-y-auto p-4 md:p-6"
      >
        {children}
      </ModuleChrome>
    </CurrencyProvider>
  );
}
