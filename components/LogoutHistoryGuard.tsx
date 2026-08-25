'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const PUBLIC_PREFIXES = [
  '/login',
  '/login-otp',
  '/register',
  '/forgot-password',
  '/reset-password',
];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function hasAuthToken() {
  try {
    if (localStorage.getItem('auth_token')) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function goToLogin() {
  if (window.location.pathname.startsWith('/login')) return;
  window.location.replace('/login?logout=1');
}

/**
 * After logout, browser Back / bfcache can restore the previous app screen.
 * Force login when the session is gone, and trap Back on the login page.
 */
export default function LogoutHistoryGuard() {
  const pathname = usePathname();

  useEffect(() => {
    const enforce = (fromBfCache = false) => {
      if (hasAuthToken()) {
        try {
          sessionStorage.removeItem('bt_logged_out');
        } catch {
          /* ignore */
        }
        return;
      }
      let loggedOut = false;
      try {
        loggedOut = sessionStorage.getItem('bt_logged_out') === '1';
      } catch {
        /* ignore */
      }
      if (isPublicPath(pathname)) return;
      if (loggedOut || fromBfCache) {
        goToLogin();
      }
    };

    const onPageShow = (event: PageTransitionEvent) => {
      enforce(event.persisted);
    };

    enforce(false);
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/login' && pathname !== '/login-otp') return;
    if (hasAuthToken()) {
      try {
        sessionStorage.removeItem('bt_logged_out');
      } catch {
        /* ignore */
      }
      return;
    }

    window.history.pushState({ btLogoutLock: true }, '', window.location.href);
    const onPopState = () => {
      if (!hasAuthToken()) {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [pathname]);

  return null;
}
