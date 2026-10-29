'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  mfgWorkspaceService,
  type MfgDescriptor,
  type MfgNavItem,
  type MfgNavPayload,
  type MfgWorkspaceNav,
} from './mfg-workspace-service';

type MfgNavState = {
  nav: MfgNavPayload | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  workspace: (slug: string | undefined | null) => MfgWorkspaceNav | null;
  isManager: boolean;
};

const MfgNavContext = createContext<MfgNavState | null>(null);

function flatten(items: MfgNavItem[]): MfgNavItem[] {
  const out: MfgNavItem[] = [];
  for (const item of items) {
    out.push(item);
    for (const child of item.items || []) out.push(child);
  }
  return out;
}

export function MfgNavProvider({ children }: { children: React.ReactNode }) {
  const [nav, setNav] = useState<MfgNavPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mfgWorkspaceService.nav();
      setNav(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Manufacturing workspaces');
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

  const value = useMemo<MfgNavState>(
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

  return <MfgNavContext.Provider value={value}>{children}</MfgNavContext.Provider>;
}

export function useMfgNav(): MfgNavState {
  const ctx = useContext(MfgNavContext);
  if (!ctx) throw new Error('useMfgNav must be used inside MfgNavProvider');
  return ctx;
}

export function useMfgWorkspace(slug: string | undefined | null) {
  const { workspace } = useMfgNav();
  return workspace(slug);
}

export function useMfgNavItems(slug: string | undefined | null): MfgNavItem[] {
  const ws = useMfgWorkspace(slug);
  return useMemo(() => (ws ? flatten(ws.items) : []), [ws]);
}

export async function loadMfgDescriptor(resource: string): Promise<MfgDescriptor | null> {
  const { descriptors } = await mfgWorkspaceService.descriptors();
  return descriptors.find((d) => d.resource === resource) || null;
}
