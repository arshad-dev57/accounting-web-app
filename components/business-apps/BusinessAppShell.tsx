'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Home,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { BrandHeader, TopBarBrand } from '../BrandHeader';
import { CollapsibleSidebar, SidebarMain } from '../CollapsibleSidebar';
import ProfileDropdown from '../ProfileDropdown';
import AppBreadcrumbs from '../AppBreadcrumbs';
import GlobalSearch from '../GlobalSearch';
import NotificationDropdown from '../NotificationDropdown';
import { ModuleTopNav } from '../ModuleTopNav';
import { performLogout } from '../../lib/auth-logout';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';
import { useNavLayout } from '../../lib/nav-layout-preference';

export type BizNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type BizNavGroup = {
  id: string;
  label: string;
  defaultOpen?: boolean;
  items: BizNavLink[];
};

function pathMatches(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href !== '/' && pathname.startsWith(`${href}/`)) return true;
  return false;
}

function NavItem({
  item,
  active,
  collapsed,
}: {
  item: BizNavLink;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      className={`group flex w-full items-center rounded-lg transition-all ${
        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
      } ${
        active
          ? 'bg-white/10 text-white'
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

function BusinessAppSidebar({
  appKey,
  appTitle,
  menuLabel,
  dashboardHref,
  navGroups,
}: {
  appKey: string;
  appTitle: string;
  menuLabel: string;
  dashboardHref: string;
  navGroups: BizNavGroup[];
}) {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();

  const activeGroupId = useMemo(() => {
    for (const group of navGroups) {
      if (group.items.some((item) => pathMatches(pathname, item.href))) {
        return group.id;
      }
    }
    return navGroups[0]?.id;
  }, [pathname, navGroups]);

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((g) => [g.id, !!g.defaultOpen]))
  );

  useEffect(() => {
    if (!activeGroupId) return;
    setOpen((prev) => {
      if (prev[activeGroupId]) return prev;
      return { ...prev, [activeGroupId]: true };
    });
  }, [activeGroupId]);

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <BrandHeader subtitle={appTitle} />

      <div className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="sidebar-expanded-only mb-3 px-2 text-[10px] font-semibold tracking-wider text-white/30">
            {menuLabel}
          </p>
        )}

        <NavItem
          item={{ href: dashboardHref, label: 'Dashboard', icon: LayoutDashboard }}
          active={pathMatches(pathname, dashboardHref)}
          collapsed={collapsed}
        />

        {navGroups.map((group) => {
          if (collapsed && !group.defaultOpen && group.id !== 'settings') {
            return null;
          }
          const isOpen = collapsed || !!open[group.id];
          return (
            <div key={`${appKey}-${group.id}`} className="pt-2">
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

export function BusinessAppShell({
  appKey,
  appTitle,
  menuLabel,
  dashboardHref,
  navGroups,
  children,
}: {
  appKey: string;
  appTitle: string;
  menuLabel: string;
  dashboardHref: string;
  navGroups: BizNavGroup[];
  children: React.ReactNode;
}) {
  const { isTopbar } = useNavLayout();

  useEffect(() => {
    if (isTopbar) {
      document.documentElement.style.setProperty('--app-sidebar-width', '0px');
      document.documentElement.dataset.navLayout = 'topbar';
    } else {
      document.documentElement.dataset.navLayout = 'sidebar';
    }
  }, [isTopbar]);

  const headerActions = (
    <div className="flex items-center gap-2 sm:gap-3">
      <GlobalSearch />
      <NotificationDropdown />
      <div className="hidden h-6 w-px bg-gray-200 sm:block" />
      <ProfileDropdown />
    </div>
  );

  if (isTopbar) {
    return (
      <div className="flex min-h-screen flex-col overflow-hidden bg-gray-50">
        <header className="sticky top-0 z-30 shrink-0 border-b border-gray-200 bg-white">
          <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-6">
            <TopBarBrand title={appTitle} />
            {headerActions}
          </div>
          <ModuleTopNav
            groups={navGroups.map((g) => ({
              label: g.label,
              items: g.items.map((item) => ({ label: item.label, href: item.href }))
            }))}
          />
        </header>
        <AppBreadcrumbs />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-gray-50">
      <BusinessAppSidebar
        appKey={appKey}
        appTitle={appTitle}
        menuLabel={menuLabel}
        dashboardHref={dashboardHref}
        navGroups={navGroups}
      />
      <SidebarMain className="flex min-w-0 flex-1 flex-col bg-gray-50">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <TopBarBrand title={appTitle} />
            <div className="hidden min-w-0 md:block">
              <AppBreadcrumbs />
            </div>
          </div>
          {headerActions}
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </SidebarMain>
    </div>
  );
}

/** Shared KPI card used on business-app dashboards. */
export function BizStatCard({
  label,
  value,
  hint,
  accent = 'bg-[#014582]',
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 tabular-nums">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
        </div>
        <span className={`mt-1 h-2 w-2 rounded-full ${accent}`} />
      </div>
    </div>
  );
}

export function BizPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function BizEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function BizStatusBadge({
  status,
  tone = 'neutral',
}: {
  status: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-sky-50 text-sky-700',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${tones[tone] || tones.neutral}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
