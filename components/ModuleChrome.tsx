'use client';

import React, { useEffect } from 'react';
import AppBreadcrumbs from './AppBreadcrumbs';
import GlobalSearch from './GlobalSearch';
import NotificationDropdown from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';
import { TopBarBrand } from './BrandHeader';
import { SidebarMain } from './CollapsibleSidebar';
import { ModuleTopNav, type ModuleTopNavGroup } from './ModuleTopNav';
import { useNavLayout } from '../lib/nav-layout-preference';

type ModuleChromeProps = {
  title: string;
  icon: React.ReactNode;
  /** Existing left sidebar (CollapsibleSidebar tree). Used when layout = sidebar. */
  sidebar: React.ReactNode;
  /** Top dropdown groups. Used when layout = topbar. */
  topGroups: ModuleTopNavGroup[];
  /** Optional controls next to the brand (e.g. Main Dashboard link). */
  headerLeftExtra?: React.ReactNode;
  /** Optional controls before search/notifications (e.g. fiscal year). */
  headerRightExtra?: React.ReactNode;
  children: React.ReactNode;
  mainClassName?: string;
  contentClassName?: string;
  /** When false, skips AppBreadcrumbs (caller embeds them). Default true. */
  showBreadcrumbs?: boolean;
};

/**
 * Shared module shell. Respects Settings → Themes (sidebar vs topbar)
 * so every module can flip chrome from one preference.
 */
export function ModuleChrome({
  title,
  icon,
  sidebar,
  topGroups,
  headerLeftExtra,
  headerRightExtra,
  children,
  mainClassName = 'bg-gray-50',
  contentClassName = 'flex-1 p-4 sm:p-6',
  showBreadcrumbs = true
}: ModuleChromeProps) {
  const { layout, isTopbar } = useNavLayout();

  useEffect(() => {
    if (isTopbar) {
      document.documentElement.style.setProperty('--app-sidebar-width', '0px');
      document.documentElement.dataset.navLayout = 'topbar';
    } else {
      document.documentElement.dataset.navLayout = 'sidebar';
      // CollapsibleSidebar's useSidebarWidthVar will re-assert width when mounted.
    }
  }, [isTopbar, layout]);

  const headerActions = (
    <div className="flex items-center gap-3 sm:gap-4">
      {headerRightExtra}
      {headerRightExtra ? <div className="hidden h-6 w-px bg-gray-200 sm:block" /> : null}
      <GlobalSearch />
      <NotificationDropdown />
      <div className="hidden h-6 w-px bg-gray-200 sm:block" />
      <ProfileDropdown accentClassName="bg-[#091746]" />
    </div>
  );

  if (isTopbar) {
    return (
      <div className={`app-square-grid min-h-screen flex flex-col ${mainClassName}`}>
        <header className="sticky top-0 z-30 flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <TopBarBrand title={title} icon={icon} />
              {headerLeftExtra}
            </div>
            {headerActions}
          </div>
          <ModuleTopNav groups={topGroups} />
        </header>
        {showBreadcrumbs ? <AppBreadcrumbs /> : null}
        <div className={contentClassName}>{children}</div>
      </div>
    );
  }

  return (
    <>
      {sidebar}
      <SidebarMain className={mainClassName}>
        <header className="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <TopBarBrand title={title} icon={icon} />
            {headerLeftExtra}
          </div>
          {headerActions}
        </header>
        {showBreadcrumbs ? <AppBreadcrumbs /> : null}
        <div className={contentClassName}>{children}</div>
      </SidebarMain>
    </>
  );
}
