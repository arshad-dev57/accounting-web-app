'use client';

import { useEffect } from 'react';
import { useNavLayout } from '../lib/nav-layout-preference';

/** Keeps CSS vars / dataset in sync with the global sidebar|topbar preference. */
export function useNavLayoutDomSync() {
  const { isTopbar } = useNavLayout();

  useEffect(() => {
    if (isTopbar) {
      document.documentElement.style.setProperty('--app-sidebar-width', '0px');
      document.documentElement.dataset.navLayout = 'topbar';
    } else {
      document.documentElement.dataset.navLayout = 'sidebar';
    }
  }, [isTopbar]);

  return { isTopbar };
}
