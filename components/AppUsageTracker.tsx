'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { apiClient } from '../app/lib/api-client';

const HEARTBEAT_MS = 5 * 60 * 1000;
const SKIP_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify'];

function shouldTrack(pathname: string | null) {
  if (!pathname) return false;
  return !SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function hasAuthToken() {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('auth_token'));
}

async function ping(action: 'active' | 'page_view', path: string) {
  if (!hasAuthToken()) return;
  try {
    await apiClient.post('/api/users/activity', {
      action,
      path,
      source: 'web',
      client: 'web',
    });
  } catch {
    // Non-blocking — never interrupt the app for analytics.
  }
}

/**
 * Sends lightweight usage heartbeats so platform admin can see
 * whether / when a client is actively using the web app.
 */
export default function AppUsageTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!shouldTrack(pathname)) return;
    if (pathname && pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      void ping('page_view', pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (!shouldTrack(pathname)) return;

    const tick = () => {
      if (document.visibilityState === 'hidden') return;
      void ping('active', pathname || '/');
    };

    tick();
    const id = window.setInterval(tick, HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pathname]);

  return null;
}
