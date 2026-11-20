'use client';

import { useEffect } from 'react';
import { hydrateAuthFromSession } from '../lib/auth-session-hydrate';

/**
 * On tenant subdomains, restore localStorage auth from shared httpOnly cookies
 * before profile/dashboard fetches run.
 */
export default function AuthSessionHydrator() {
  useEffect(() => {
    void hydrateAuthFromSession().then((ok) => {
      if (ok) {
        window.dispatchEvent(new Event('auth-session-hydrated'));
      }
    });
  }, []);

  return null;
}
