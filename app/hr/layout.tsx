'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UsersRound } from 'lucide-react';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import ProfileDropdown from '../../components/ProfileDropdown';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import NotificationDropdown from '../../components/NotificationDropdown';
import { CollapsibleSidebar, SidebarMain } from '../../components/CollapsibleSidebar';
import { HrNavProvider, useHrNav } from '@/lib/hr-nav-context';
import { useNavLayout } from '@/lib/nav-layout-preference';
import { HrTopNav } from './components/hr-top-nav';
import { HrWorkspaceSidebar } from './components/hr-workspace-sidebar';

const LAST_WORKSPACE_KEY = 'bisonstechs_hr_last_workspace';

function HRShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { nav } = useHrNav();
  const { isTopbar } = useNavLayout();

  const workspaceSlug = useMemo(() => {
    const segment = pathname.split('/')[2] || '';
    const known = (nav?.workspaces || []).some((ws) => ws.slug === segment);
    if (known) return segment;
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(LAST_WORKSPACE_KEY) || '';
      if ((nav?.workspaces || []).some((ws) => ws.slug === stored)) return stored;
    }
    return nav?.workspaces?.[0]?.slug || '';
  }, [pathname, nav]);

  useEffect(() => {
    if (workspaceSlug) window.localStorage.setItem(LAST_WORKSPACE_KEY, workspaceSlug);
  }, [workspaceSlug]);

  useEffect(() => {
    if (isTopbar) {
      document.documentElement.style.setProperty('--app-sidebar-width', '0px');
      document.documentElement.dataset.navLayout = 'topbar';
    } else {
      document.documentElement.dataset.navLayout = 'sidebar';
    }
  }, [isTopbar]);

  const headerActions = (
    <div className="flex items-center gap-3 sm:gap-4">
      <GlobalSearch />
      <NotificationDropdown />
      <div className="hidden h-6 w-px bg-gray-200 sm:block" />
      <ProfileDropdown accentClassName="bg-[#091746]" />
    </div>
  );

  const brandBlock = (
    <div className="flex min-w-0 items-center gap-3">
      <TopBarBrand
        title="HR Management"
        icon={<UsersRound className="w-5 h-5 text-[#014582]" />}
      />
      <Link
        href="/dashboard"
        className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-[#014582] sm:inline-flex"
      >
        <Home className="h-3.5 w-3.5" />
        Main Dashboard
      </Link>
    </div>
  );

  if (isTopbar) {
    return (
      <div className="app-square-grid min-h-screen flex flex-col bg-gray-50">
        <header className="sticky top-0 z-30 flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            {brandBlock}
            {headerActions}
          </div>
          <HrTopNav workspaceSlug={workspaceSlug} />
        </header>
        <AppBreadcrumbs />
        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </div>
    );
  }

  return (
    <>
      <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
        <BrandHeader subtitle="HR Management" />
        <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
          <HrWorkspaceSidebar workspaceSlug={workspaceSlug} />
        </div>
      </CollapsibleSidebar>
      <SidebarMain className="bg-gray-50">
        <header className="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          {brandBlock}
          {headerActions}
        </header>
        <AppBreadcrumbs />
        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </SidebarMain>
    </>
  );
}

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <HrNavProvider>
      <HRShell>{children}</HRShell>
    </HrNavProvider>
  );
}
