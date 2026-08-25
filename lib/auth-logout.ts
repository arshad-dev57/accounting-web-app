'use client';

import { apiClient } from '../app/lib/api-client';
import { LOGGED_IN_COOKIE, LOGOUT_FLAG_COOKIE } from './auth-cookies';
import { clearMarketingLoggedInFlag } from './marketing-session';

/** Known app keys — also wiped via localStorage.clear() as a safety net. */
export const LOGOUT_STORAGE_KEYS = [
  'auth_token',
  'refresh_token',
  'user',
  'userProfile',
  'user_name',
  'user_email',
  'company_name',
  'company_address',
  'bisonstechs_company_branding',
  'sales_selected_currency',
  'app_currency_code',
  'app_currency_symbol',
  'pdf_report_settings',
  'pos_settings_v1',
  'pos_offline_queue_v1',
  'has_active_subscription',
  'subscription_plan',
  'subscription_status',
  'trial_days_remaining',
  'subscription_days_remaining',
  'subscription_end_date',
  'trial_end_date',
] as const;

function expireCookie(name: string) {
  if (typeof document === 'undefined') return;
  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
  const host = window.location.hostname;
  const isLocal =
    host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');

  document.cookie = `${name}=; expires=${expires}; Max-Age=0; path=/`;
  document.cookie = `${name}=; expires=${expires}; Max-Age=0; path=/; SameSite=Lax`;

  if (isLocal) return;

  const domain =
    process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim() || '.bisonstechs.com';
  document.cookie = `${name}=; expires=${expires}; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
}

function loginRedirectUrl(redirectTo: string) {
  if (!redirectTo.startsWith('/login')) return redirectTo;
  if (redirectTo.includes('logout=')) return redirectTo;
  return redirectTo.includes('?')
    ? `${redirectTo}&logout=1`
    : `${redirectTo}?logout=1`;
}

/** Wipe all browser-stored app/auth data (local + session). */
export function clearLocalAuthData() {
  if (typeof window === 'undefined') return;

  try {
    for (const key of LOGOUT_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    localStorage.clear();
  } catch {
    /* ignore quota / private mode */
  }

  try {
    sessionStorage.clear();
    sessionStorage.setItem('bt_logged_out', '1');
  } catch {
    /* ignore */
  }

  expireCookie('auth_token');
  expireCookie('refresh_token');
  expireCookie('user_data');
  expireCookie('subscription_access');
  expireCookie(LOGGED_IN_COOKIE);
  clearMarketingLoggedInFlag();

  try {
    apiClient.clearTokens();
  } catch {
    /* ignore */
  }
}

/**
 * Full logout: clear client storage, clear httpOnly cookies via API, then go to login.
 *
 * Always land on /login?logout=1 so proxy.ts strips leftover auth cookies
 * instead of bouncing a still-valid cookie back to /dashboard (reload loop).
 */
export async function performLogout(redirectTo = '/login') {
  clearLocalAuthData();

  try {
    document.cookie = `${LOGOUT_FLAG_COOKIE}=1; path=/; SameSite=Lax; Max-Age=120`;
  } catch {
    /* ignore */
  }

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 4000);
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    });
    window.clearTimeout(timer);
  } catch {
    /* still redirect even if API fails */
  }

  clearLocalAuthData();

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('bt_logged_out', '1');
    } catch {
      /* ignore */
    }
    window.location.replace(loginRedirectUrl(redirectTo));
  }
}
