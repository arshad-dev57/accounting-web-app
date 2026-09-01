'use client';

import type { SubscriptionSnapshot } from './subscription-service';
import {
  cacheSubscriptionSnapshot,
  fetchSubscriptionStatus,
} from './subscription-service';

export type SessionAccessCode =
  | 'OK'
  | 'USER_INACTIVE'
  | 'COMPANY_INACTIVE'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SESSION_INVALID';

export type SessionAccessResult = {
  ok: boolean;
  code: SessionAccessCode;
  message?: string;
  hasAccess: boolean;
  subscription?: SubscriptionSnapshot['subscription'];
};

function emptySubscription(): SubscriptionSnapshot['subscription'] {
  return {
    plan: 'none',
    status: 'expired',
    trialDaysRemaining: 0,
    subscriptionDaysRemaining: 0,
    startDate: null,
    endDate: null,
    trialStartDate: null,
    trialEndDate: null,
  };
}

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token') || '';
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

async function parseJson(res: Response) {
  return res.json().catch(() => ({}));
}

/**
 * Combined account gate: user active, company active, subscription valid.
 * Uses protectOnly backend route so expired trials can still reach /plans after redirect.
 */
export async function fetchSessionAccess(): Promise<SessionAccessResult> {
  const res = await fetch('/api/users/session-status', {
    headers: authHeaders(),
    cache: 'no-store',
  });
  const data = await parseJson(res);
  const payload = data?.data || {};
  const subscription = {
    ...emptySubscription(),
    ...(payload.subscription || {}),
  };

  if (res.status === 401) {
    return {
      ok: false,
      code: (data?.code as SessionAccessCode) || 'USER_INACTIVE',
      message: data?.message || 'Your account has been deactivated. Please contact support.',
      hasAccess: false,
      subscription,
    };
  }

  if (res.status === 403) {
    return {
      ok: false,
      code: (data?.code as SessionAccessCode) || 'COMPANY_INACTIVE',
      message: data?.message || 'Your company account has been deactivated. Please contact support.',
      hasAccess: false,
      subscription,
    };
  }

  if (!res.ok || !data.success) {
    return {
      ok: false,
      code: 'SESSION_INVALID',
      message: data?.message || 'Session expired. Please sign in again.',
      hasAccess: false,
      subscription,
    };
  }

  if (payload.ok === false || payload.hasAccess === false) {
    cacheSubscriptionSnapshot({ hasAccess: false, subscription });
    return {
      ok: false,
      code: (payload.code as SessionAccessCode) || 'SUBSCRIPTION_EXPIRED',
      message: payload.message || 'Your subscription has expired. Please subscribe to continue.',
      hasAccess: false,
      subscription,
    };
  }

  cacheSubscriptionSnapshot({ hasAccess: true, subscription });
  return {
    ok: true,
    code: 'OK',
    hasAccess: true,
    subscription,
  };
}

/** Subscription-only refresh (legacy callers). */
export async function refreshSubscriptionAccess(): Promise<SubscriptionSnapshot> {
  return fetchSubscriptionStatus();
}
