'use client';

// Loads the ERPNext workspace tree once per company and shares it with the HR
// sidebar and screens. The tree comes from the backend, which already hides the
// Setup/Reports sections a plain employee must not see.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  hrWorkspaceService,
  type HrDescriptor,
  type HrNavItem,
  type HrNavPayload,
  type HrWorkspaceNav,
} from './hr-workspace-service';

type HrNavState = {
  nav: HrNavPayload | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  workspace: (slug: string | undefined | null) => HrWorkspaceNav | null;
  isManager: boolean;
};

const HrNavContext = createContext<HrNavState | null>(null);

function flatten(items: HrNavItem[]): HrNavItem[] {
  const out: HrNavItem[] = [];
  for (const item of items) {
    out.push(item);
    for (const child of item.items || []) out.push(child);
  }
  return out;
}

export function HrNavProvider({ children }: { children: React.ReactNode }) {
  const [nav, setNav] = useState<HrNavPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hrWorkspaceService.nav();
      setNav(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the HR workspaces');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onCompanyChange = () => void refresh();
    window.addEventListener('active-company-changed', onCompanyChange);
    return () => window.removeEventListener('active-company-changed', onCompanyChange);
  }, [refresh]);

  const value = useMemo<HrNavState>(
    () => ({
      nav,
      loading,
      error,
      refresh,
      isManager: Boolean(nav?.isManager),
      workspace: (slug) => (slug ? (nav?.workspaces || []).find((ws) => ws.slug === slug) || null : null)
    }),
    [nav, loading, error, refresh]
  );

  return <HrNavContext.Provider value={value}>{children}</HrNavContext.Provider>;
}

export function useHrNav(): HrNavState {
  const ctx = useContext(HrNavContext);
  if (!ctx) throw new Error('useHrNav must be used inside HrNavProvider');
  return ctx;
}

export function useHrWorkspace(slug: string | undefined | null) {
  const { workspace } = useHrNav();
  return workspace(slug);
}

export function useHrNavItems(slug: string | undefined | null): HrNavItem[] {
  const ws = useHrWorkspace(slug);
  return useMemo(() => (ws ? flatten(ws.items) : []), [ws]);
}

/** Descriptor lookup for a document slug, taken from the backend field list. */
export async function loadDescriptor(resource: string): Promise<HrDescriptor | null> {
  const { descriptors } = await hrWorkspaceService.descriptors();
  return descriptors.find((d) => d.resource === resource) || null;
}
