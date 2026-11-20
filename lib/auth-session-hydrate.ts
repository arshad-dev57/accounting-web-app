'use client';

/**
 * Cross-subdomain auth: login happens on app.bisonstechs.com (localStorage there),
 * then we redirect to {slug}.bisonstechs.com where localStorage is empty.
 * httpOnly cookies with Domain=.bisonstechs.com still apply — pull tokens into localStorage.
 */

let hydrateInFlight: Promise<boolean> | null = null;

export async function hydrateAuthFromSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const existing = localStorage.getItem('auth_token');
  if (existing) return true;

  if (hydrateInFlight) return hydrateInFlight;

  hydrateInFlight = (async () => {
    try {
      const res = await fetch('/api/auth/session-token', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (!data?.success || !data.token) return false;

      localStorage.setItem('auth_token', String(data.token));
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', String(data.refreshToken));
      }
      if (data.user && typeof data.user === 'object') {
        try {
          localStorage.setItem('user', JSON.stringify(data.user));
          const { saveUserToLocal } = await import('./permission-service');
          saveUserToLocal(data.user);
        } catch {
          try {
            localStorage.setItem('user', JSON.stringify(data.user));
          } catch {
            /* ignore */
          }
        }
      }

      try {
        const { apiClient } = await import('../app/lib/api-client');
        apiClient.setTokens(data.token, data.refreshToken || '');
      } catch {
        /* localStorage is enough for most fetch() callers */
      }

      // Prefer company from cookie set by tenant proxy
      try {
        const companyCookie = document.cookie
          .split('; ')
          .find((c) => c.startsWith('active_company_id='))
          ?.split('=')[1];
        if (companyCookie) {
          const id = decodeURIComponent(companyCookie);
          if (id) {
            localStorage.setItem('bisonstechs_active_company_id', id);
          }
        }
      } catch {
        /* ignore */
      }

      return true;
    } catch {
      return false;
    } finally {
      hydrateInFlight = null;
    }
  })();

  return hydrateInFlight;
}
