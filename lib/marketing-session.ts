// lib/marketing-session.ts
/** Bridge cookie readable on bisonstechs.com (and app subdomain). */

import { LOGGED_IN_COOKIE, AUTH_TOKEN_MAX_AGE } from './auth-cookies';

export function setMarketingLoggedInFlag() {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LOGGED_IN_COOKIE}=1; path=/; max-age=${AUTH_TOKEN_MAX_AGE}; SameSite=Lax${secure}`;

  const host = window.location.hostname;
  const isLocal =
    host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
  if (isLocal) return;

  const configured = process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim();
  const bare = configured?.replace(/^\./, '') || '';
  if (configured && (host === bare || host.endsWith(`.${bare}`))) {
    document.cookie = `${LOGGED_IN_COOKIE}=1; path=/; domain=${configured}; max-age=${AUTH_TOKEN_MAX_AGE}; SameSite=Lax${secure}`;
  }
}

export function clearMarketingLoggedInFlag() {
  if (typeof document === 'undefined') return;
  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `${LOGGED_IN_COOKIE}=; expires=${expires}; Max-Age=0; path=/`;

  const host = window.location.hostname;
  const isLocal =
    host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
  if (isLocal) return;

  const domain =
    process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim() || '.bisonstechs.com';
  document.cookie = `${LOGGED_IN_COOKIE}=; expires=${expires}; Max-Age=0; path=/; domain=${domain}`;
}
