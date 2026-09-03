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
  productTier?: 'pos' | 'erp_pos' | string | null;
};

export type SubscriptionSnapshot = {
  hasAccess: boolean;
  trialEligible?: boolean;
  productTier?: 'pos' | 'erp_pos' | string | null;
  subscription: SubscriptionInfo;
};

export type BillingInvoice = {
  id: string;
  invoiceNumber: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  productTier?: string;
  licensedUsers?: number;
  licensedBranches?: number;
  type?: string;
  delta?: number;
  previousAmount?: number;
  paidBy?: { name: string; email: string } | null;
};

export type CompanyBilling = {
  company: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  capacity: import('./subscription-pricing').SubscriptionCapacity;
  subscription: SubscriptionInfo;
  stats: {
    currentAmount: number;
    totalPaid: number;
    paidThisMonth: number;
    invoiceCount: number;
  };
  monthlyStats: { month: string; label: string; total: number; count: number }[];
  invoices: BillingInvoice[];
};

const STORAGE_KEYS = {
  hasAccess: 'has_active_subscription',
  plan: 'subscription_plan',
  status: 'subscription_status',
  trialDays: 'trial_days_remaining',
  subDays: 'subscription_days_remaining',
  endDate: 'subscription_end_date',
  trialEndDate: 'trial_end_date',
  productTier: 'product_tier',
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
  const tier =
    snapshot.productTier ||
    sub.productTier ||
    (sub.plan === 'trial' ? 'erp_pos' : null);

  localStorage.setItem(STORAGE_KEYS.hasAccess, snapshot.hasAccess ? '1' : '0');
  localStorage.setItem(STORAGE_KEYS.plan, String(sub.plan || 'none'));
  localStorage.setItem(STORAGE_KEYS.status, String(sub.status || 'expired'));
  localStorage.setItem(STORAGE_KEYS.trialDays, String(sub.trialDaysRemaining || 0));
  localStorage.setItem(STORAGE_KEYS.subDays, String(sub.subscriptionDaysRemaining || 0));
  if (sub.endDate) localStorage.setItem(STORAGE_KEYS.endDate, String(sub.endDate));
  else localStorage.removeItem(STORAGE_KEYS.endDate);
  if (sub.trialEndDate) localStorage.setItem(STORAGE_KEYS.trialEndDate, String(sub.trialEndDate));
  else localStorage.removeItem(STORAGE_KEYS.trialEndDate);
  if (tier) localStorage.setItem(STORAGE_KEYS.productTier, String(tier));
  else localStorage.removeItem(STORAGE_KEYS.productTier);

  // Non-httpOnly hint for proxy / fast client reads (source of truth remains API)
  document.cookie = `subscription_access=${snapshot.hasAccess ? '1' : '0'}; path=/; SameSite=Lax; max-age=${7 * 24 * 60 * 60}`;
  if (tier) {
    document.cookie = `product_tier=${tier}; path=/; SameSite=Lax; max-age=${7 * 24 * 60 * 60}`;
  } else {
    document.cookie = 'product_tier=; path=/; Max-Age=0';
  }
}

export function clearSubscriptionCache() {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  document.cookie = 'subscription_access=; path=/; Max-Age=0';
  document.cookie = 'product_tier=; path=/; Max-Age=0';
}

export function readCachedHasAccess(): boolean | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(STORAGE_KEYS.hasAccess);
  if (v === null) return null;
  return v === '1';
}

export function readCachedProductTier(): 'pos' | 'erp_pos' | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(STORAGE_KEYS.productTier);
  if (v === 'pos' || v === 'erp_pos') return v;
  return null;
}

/** True when paid POS-only (not trial / not ERP). */
export function isPosOnlyTier(
  tier?: string | null,
  plan?: string | null,
  hasAccess = true
): boolean {
  if (!hasAccess) return false;
  if (plan === 'trial') return false;
  return tier === 'pos';
}

export function readCachedSubscription(): SubscriptionSnapshot {
  if (typeof window === 'undefined') {
    return { hasAccess: false, subscription: emptySubscription() };
  }
  const productTier = localStorage.getItem(STORAGE_KEYS.productTier);
  return {
    hasAccess: localStorage.getItem(STORAGE_KEYS.hasAccess) === '1',
    productTier,
    subscription: {
      plan: localStorage.getItem(STORAGE_KEYS.plan) || 'none',
      status: localStorage.getItem(STORAGE_KEYS.status) || 'expired',
      trialDaysRemaining: Number(localStorage.getItem(STORAGE_KEYS.trialDays) || 0),
      subscriptionDaysRemaining: Number(localStorage.getItem(STORAGE_KEYS.subDays) || 0),
      endDate: localStorage.getItem(STORAGE_KEYS.endDate),
      trialEndDate: localStorage.getItem(STORAGE_KEYS.trialEndDate),
      productTier,
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

  const productTier =
    data?.data?.capacity?.productTier ||
    subscription.productTier ||
    (subscription.plan === 'trial' ? 'erp_pos' : null);

  const snapshot: SubscriptionSnapshot = {
    hasAccess: data?.data?.hasAccess === true,
    trialEligible: data?.data?.trialEligible === true,
    productTier,
    subscription: {
      ...subscription,
      productTier: productTier || subscription.productTier,
    },
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

export async function fetchSubscriptionCapacity(): Promise<{
  success: boolean;
  data?: import('./subscription-pricing').SubscriptionCapacity;
  message?: string;
}> {
  const res = await fetch('/api/subscription/capacity', {
    headers: authHeaders(),
    cache: 'no-store',
  });
  const data = await parseJson(res);
  if (res.ok && data.success && data.data) {
    const cached = readCachedSubscription();
    cacheSubscriptionSnapshot({
      ...cached,
      hasAccess: data.data.hasAccess === true ? true : cached.hasAccess,
      productTier: data.data.productTier || cached.productTier,
      subscription: {
        ...cached.subscription,
        productTier: data.data.productTier || cached.subscription.productTier,
        plan: data.data.subscriptionPlan || cached.subscription.plan,
        status: data.data.subscriptionStatus || cached.subscription.status,
      },
    });
  }
  return {
    success: !!data.success,
    data: data.data,
    message: data.message,
  };
}

export async function upgradeSubscription(body: {
  licensedUsers?: number;
  licensedBranches?: number;
  addUsers?: number;
  addBranches?: number;
}): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const res = await fetch('/api/subscription/upgrade', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
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

export async function subscribeToPlan(
  plan: string,
  amount: number,
  options?: {
    productTier?: 'pos' | 'erp_pos';
    licensedUsers?: number;
    licensedBranches?: number;
  }
): Promise<{
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
      productTier: options?.productTier || 'erp_pos',
      licensedUsers: options?.licensedUsers ?? 1,
      licensedBranches: options?.licensedBranches ?? 1,
      paymentMethod: 'direct',
      transactionId: `TXN-${Date.now()}`,
    }),
  });
  const data = await parseJson(res);
  if (res.ok && data.success) {
    const tier =
      options?.productTier ||
      (data.data as { productTier?: string } | undefined)?.productTier ||
      'erp_pos';
    const cached = readCachedSubscription();
    cacheSubscriptionSnapshot({
      hasAccess: true,
      productTier: tier,
      subscription: {
        ...cached.subscription,
        plan,
        status: 'active',
        productTier: tier,
      },
    });
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

export async function fetchCompanyBilling(): Promise<{
  success: boolean;
  data?: CompanyBilling;
  message?: string;
}> {
  const res = await fetch('/api/subscription/billing', {
    headers: authHeaders(),
    cache: 'no-store',
  });
  const data = await parseJson(res);
  return {
    success: !!data.success,
    data: data.data,
    message: data.message,
  };
}

/** After login/register: POS-only → /pos, ERP → /dashboard, else /plans. */
export async function resolvePostAuthDestination(
  token?: string
): Promise<'/dashboard' | '/plans' | '/pos'> {
  try {
    const snapshot = await fetchSubscriptionStatus(token);
    if (!snapshot.hasAccess) return '/plans';
    if (
      isPosOnlyTier(
        snapshot.productTier || snapshot.subscription.productTier,
        snapshot.subscription.plan,
        snapshot.hasAccess
      )
    ) {
      return '/pos';
    }
    return '/dashboard';
  } catch {
    // Fail closed to pricing so expired users never land in the app
    return '/plans';
  }
}

export function isSubscriptionExemptPath(pathname: string): boolean {
  const exempt = ['/login', '/login-otp', '/register', '/plans'];
  return exempt.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** ERP module paths blocked for POS-only subscribers. */
export function isErpOnlyPath(pathname: string): boolean {
  const erpPrefixes = [
    '/dashboard',
    '/accounting',
    '/sales',
    '/warehouse',
    '/purchases',
    '/tax',
    '/users',
    '/registered-users',
  ];
  return erpPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function resolveAppHomePath(opts: {
  hasAccess: boolean;
  productTier?: string | null;
  plan?: string | null;
}): '/plans' | '/pos' | '/dashboard' {
  if (!opts.hasAccess) return '/plans';
  if (isPosOnlyTier(opts.productTier, opts.plan, opts.hasAccess)) return '/pos';
  return '/dashboard';
}
