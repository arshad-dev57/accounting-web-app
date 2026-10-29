'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LogOut, UsersRound } from 'lucide-react';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import ProfileDropdown from '../../components/ProfileDropdown';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import NotificationDropdown from '../../components/NotificationDropdown';
import { CollapsibleSidebar, SidebarMain } from '../../components/CollapsibleSidebar';
import { performLogout } from '../../lib/auth-logout';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';
import { HrNavProvider, useHrNav } from '@/lib/hr-nav-context';
import { HrWorkspaceSidebar } from './components/hr-workspace-sidebar';

const LAST_WORKSPACE_KEY = 'bisonstechs_hr_last_workspace';

function HRSidebar({ workspaceSlug }: { workspaceSlug: string }) {
  const { collapsed } = useSidebarCollapsed();

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <BrandHeader subtitle="HR Module" />

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar min-h-0">
        {!collapsed && (
          <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3 sidebar-expanded-only">
            HR NAVIGATION
          </p>
        )}
        <HrWorkspaceSidebar workspaceSlug={workspaceSlug} />
      </div>

      <div className="px-3 pb-6 flex-shrink-0">
        <Link
          href="/dashboard"
          title="Main Dashboard"
          className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium sidebar-expanded-only">Main Dashboard</span>
        </Link>
        <button
          type="button"
          title="Logout"
          onClick={() => void performLogout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium sidebar-expanded-only">Logout</span>
        </button>
      </div>
    </CollapsibleSidebar>
  );
}

function HRShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { nav } = useHrNav();

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

  return (
    <>
      <HRSidebar workspaceSlug={workspaceSlug} />
      <SidebarMain className="bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
          <TopBarBrand
            title="HR Management"
            icon={<UsersRound className="w-5 h-5 text-[#014582]" />}
          />
          <div className="flex items-center gap-4">
            <GlobalSearch />
            <NotificationDropdown />
            <div className="w-px h-6 bg-gray-200" />
            <ProfileDropdown accentClassName="bg-[#091746]" />
          </div>
        </header>

        <AppBreadcrumbs />

        <div className="flex-1 p-6">{children}</div>
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
