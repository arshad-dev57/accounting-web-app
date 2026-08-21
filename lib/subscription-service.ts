'use client';

export type SubscriptionPlanId = 'none' | 'trial' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired';

export type PlanOffer = {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string;
  features: string[];
  isPopular?: boolean;
  savings?: string;
};

export type SubscriptionInfo = {
  plan: SubscriptionPlanId | string;
  status: SubscriptionStatus | string;
  trialDaysRemaining: number;
  subscriptionDaysRemaining: number;
  startDate?: string | null;
  endDate?: string | null;
  trialStartDate?: string | null;
  trialEndDate?: string | null;
};

export type SubscriptionSnapshot = {
  hasAccess: boolean;
  subscription: SubscriptionInfo;
};

const STORAGE_KEYS = {
  hasAccess: 'has_active_subscription',
  plan: 'subscription_plan',
  status: 'subscription_status',
  trialDays: 'trial_days_remaining',
  subDays: 'subscription_days_remaining',
  endDate: 'subscription_end_date',
  trialEndDate: 'trial_end_date',
} as const;

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token') || '';
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function emptySubscription(): SubscriptionInfo {
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

export function cacheSubscriptionSnapshot(snapshot: SubscriptionSnapshot) {
  if (typeof window === 'undefined') return;
  const sub = snapshot.subscription || emptySubscription();
  localStorage.setItem(STORAGE_KEYS.hasAccess, snapshot.hasAccess ? '1' : '0');
  localStorage.setItem(STORAGE_KEYS.plan, String(sub.plan || 'none'));
  localStorage.setItem(STORAGE_KEYS.status, String(sub.status || 'expired'));
  localStorage.setItem(STORAGE_KEYS.trialDays, String(sub.trialDaysRemaining || 0));
  localStorage.setItem(STORAGE_KEYS.subDays, String(sub.subscriptionDaysRemaining || 0));
  if (sub.endDate) localStorage.setItem(STORAGE_KEYS.endDate, String(sub.endDate));
  else localStorage.removeItem(STORAGE_KEYS.endDate);
  if (sub.trialEndDate) localStorage.setItem(STORAGE_KEYS.trialEndDate, String(sub.trialEndDate));
  else localStorage.removeItem(STORAGE_KEYS.trialEndDate);

  // Non-httpOnly hint for proxy / fast client reads (source of truth remains API)
  document.cookie = `subscription_access=${snapshot.hasAccess ? '1' : '0'}; path=/; SameSite=Lax; max-age=${7 * 24 * 60 * 60}`;
}

export function clearSubscriptionCache() {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  document.cookie = 'subscription_access=; path=/; Max-Age=0';
}

export function readCachedHasAccess(): boolean | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(STORAGE_KEYS.hasAccess);
  if (v === null) return null;
  return v === '1';
}

export function readCachedSubscription(): SubscriptionSnapshot {
  if (typeof window === 'undefined') {
    return { hasAccess: false, subscription: emptySubscription() };
  }
  return {
    hasAccess: localStorage.getItem(STORAGE_KEYS.hasAccess) === '1',
    subscription: {
      plan: localStorage.getItem(STORAGE_KEYS.plan) || 'none',
      status: localStorage.getItem(STORAGE_KEYS.status) || 'expired',
      trialDaysRemaining: Number(localStorage.getItem(STORAGE_KEYS.trialDays) || 0),
      subscriptionDaysRemaining: Number(localStorage.getItem(STORAGE_KEYS.subDays) || 0),
      endDate: localStorage.getItem(STORAGE_KEYS.endDate),
      trialEndDate: localStorage.getItem(STORAGE_KEYS.trialEndDate),
    },
  };
}

async function parseJson(res: Response) {
  return res.json().catch(() => ({}));
}

export async function fetchSubscriptionPlans(): Promise<{
  success: boolean;
  data: PlanOffer[];
  message?: string;
}> {
  const res = await fetch('/api/subscription/plans', {
    headers: authHeaders(),
    cache: 'no-store',
  });
  const data = await parseJson(res);
  return {
    success: !!data.success,
    data: Array.isArray(data.data) ? data.data : [],
    message: data.message,
  };
}

export async function fetchSubscriptionStatus(token?: string): Promise<SubscriptionSnapshot> {
  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : authHeaders();

  const res = await fetch('/api/subscription/status', {
    headers,
    cache: 'no-store',
  });
  const data = await parseJson(res);

  const subscription: SubscriptionInfo = {
    ...emptySubscription(),
    ...(data?.data?.subscription || {}),
  };

  const snapshot: SubscriptionSnapshot = {
    hasAccess: data?.data?.hasAccess === true,
    subscription,
  };

  if (res.ok && data.success) {
    cacheSubscriptionSnapshot(snapshot);
  }

  return snapshot;
}

export async function startTrial(): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const res = await fetch('/api/subscription/trial/start', {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await parseJson(res);
  if (res.ok && data.success) {
    await fetchSubscriptionStatus();
  }
  return {
    success: !!data.success,
    message: data.message,
    data: data.data,
  };
}

export async function subscribeToPlan(plan: string, amount: number): Promise<{
  success: boolean;
  message?: string;
  data?: unknown;
}> {
  const res = await fetch('/api/subscription/subscribe', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      plan,
      amount,
      paymentMethod: 'direct',
      transactionId: `TXN-${Date.now()}`,
    }),
  });
  const data = await parseJson(res);
  if (res.ok && data.success) {
    await fetchSubscriptionStatus();
  }
  return {
    success: !!data.success,
    message: data.message,
    data: data.data,
  };
}

export async function cancelSubscription(): Promise<{
  success: boolean;
  message?: string;
}> {
  const res = await fetch('/api/subscription/cancel', {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await parseJson(res);
  if (res.ok && data.success) {
    await fetchSubscriptionStatus();
  }
  return {
    success: !!data.success,
    message: data.message,
  };
}

/** After login/register: go to dashboard if active, otherwise pricing. */
export async function resolvePostAuthDestination(token?: string): Promise<'/dashboard' | '/plans'> {
  try {
    const snapshot = await fetchSubscriptionStatus(token);
    return snapshot.hasAccess ? '/dashboard' : '/plans';
  } catch {
    // Fail closed to pricing so expired users never land in the app
    return '/plans';
  }
}

export function isSubscriptionExemptPath(pathname: string): boolean {
  const exempt = ['/login', '/login-otp', '/register', '/plans'];
  return exempt.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
