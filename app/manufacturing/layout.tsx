'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo } from 'react';
import { Factory } from 'lucide-react';
import { ModuleChrome } from '../../components/ModuleChrome';
import type { ModuleTopNavGroup } from '../../components/ModuleTopNav';
import LocationSelect from '../../components/LocationSelect';
import { LocationProvider } from '@/lib/location-context';
import { FiscalYearProvider } from '@/lib/fiscal-year-context';
import { usePermissions } from '@/lib/usePermissions';
import { usePathname } from 'next/navigation';
import { MfgNavProvider, useMfgNav } from '@/lib/mfg-nav-context';
import { isTextileWeavingCompany, useCompanyOptional } from '@/lib/company-context';
import { MfgSidebar } from './nav';

const LAST_WORKSPACE_KEY = 'bisonstechs_mfg_last_workspace';

const WEAVING_TOP_ITEMS = [
  { href: '/manufacturing/weaving', label: 'Overview' },
  { href: '/manufacturing/weaving/godown', label: 'Godown Register' },
  { href: '/manufacturing/weaving/twisting', label: 'Twisting / Coning' },
  { href: '/manufacturing/weaving/warping', label: 'Warping (Beams)' },
  { href: '/manufacturing/weaving/looms', label: 'Looms & Wages' }
];

function flattenMfgItems(
  items: Array<{ label: string; href?: string | null; items?: unknown[] }> | undefined,
  out: { label: string; href: string }[] = []
) {
  for (const item of items || []) {
    if (item.href) out.push({ label: item.label, href: item.href });
    if (Array.isArray(item.items)) {
      flattenMfgItems(item.items as typeof items, out);
    }
  }
  return out;
}

function ManufacturingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { nav } = useMfgNav();
  const companyCtx = useCompanyOptional();

  const workspaceSlug = useMemo(() => {
    const segment = pathname.split('/')[2] || '';
    const known = (nav?.workspaces || []).some((ws) => ws.slug === segment);
    if (known) return segment;
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(LAST_WORKSPACE_KEY) || '';
      if ((nav?.workspaces || []).some((ws) => ws.slug === stored)) return stored;
    }
    return nav?.workspaces?.[0]?.slug || 'manufacturing';
  }, [pathname, nav]);

  useEffect(() => {
    if (workspaceSlug) window.localStorage.setItem(LAST_WORKSPACE_KEY, workspaceSlug);
  }, [workspaceSlug]);

  const weavingMode =
    pathname.startsWith('/manufacturing/weaving') ||
    isTextileWeavingCompany(companyCtx?.activeCompany);

  const topGroups: ModuleTopNavGroup[] = useMemo(() => {
    if (weavingMode) {
      return [{ label: 'Weaving', items: WEAVING_TOP_ITEMS }];
    }
    const active = (nav?.workspaces || []).find((ws) => ws.slug === workspaceSlug) || nav?.workspaces?.[0];
    const items = flattenMfgItems(active?.items as Array<{ label: string; href?: string | null; items?: unknown[] }>);
    const workspaceSwitcher = (nav?.workspaces || []).map((ws) => ({
      label: ws.label,
      href: `/manufacturing/${ws.slug}`
    }));
    return [
      ...(workspaceSwitcher.length
        ? [{ label: 'Workspaces', items: workspaceSwitcher }]
        : []),
      { label: active?.label || 'Manufacturing', items }
    ];
  }, [weavingMode, nav, workspaceSlug]);

  return (
    <ModuleChrome
      title="Manufacturing"
      icon={<Factory className="w-5 h-5 text-[#014582]" />}
      sidebar={<MfgSidebar workspaceSlug={workspaceSlug} />}
      topGroups={topGroups}
      headerRightExtra={<LocationSelect entityLabel="Warehouse" />}
      contentClassName="flex-1 p-6"
    >
      {children}
    </ModuleChrome>
  );
}

export default function ManufacturingLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, hasModuleAccess, loading } = usePermissions();
  const allowed = isAdmin || hasModuleAccess('manufacturing');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#014582] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-[#DDE4EE] p-8 max-w-md text-center shadow-sm">
          <Factory className="w-10 h-10 text-[#014582] mx-auto mb-4" />
          <h1 className="text-lg font-bold text-[#1A1A2E]">Manufacturing</h1>
          <p className="text-sm text-[#7A8FA6] mt-2">
            You do not have permission to access the Manufacturing module. Contact your administrator to
            request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FiscalYearProvider>
      <LocationProvider allowAll allowAllUsers>
        <MfgNavProvider>
          <ManufacturingShell>{children}</ManufacturingShell>
        </MfgNavProvider>
      </LocationProvider>
    </FiscalYearProvider>
  );
}
