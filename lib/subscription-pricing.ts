export const TRIAL_DAYS = 14;

/** PKR list prices → USD (4000 PKR ≈ $14/user/mo) */
export const PKR_TO_USD = 4000 / 14;

export type ProductTier = 'pos' | 'erp_pos';
export type BillingCycle = 'monthly' | 'yearly';

export const PRICING = {
  pos: {
    label: 'POS (Desktop App)',
    monthlyPerUser: 14,
    yearlyPerUser: 86,
    currency: 'USD',
    features: [
      'Desktop POS for Windows & Mac',
      'Offline sales — sync when back online',
      'Shifts, terminals & thermal receipts',
      'Barcode / QR product scanning',
      'Cash drawer & card terminal ready',
      'Held sales, returns & shift reports',
    ],
  },
  erp_pos: {
    label: 'ERP + POS',
    monthlyBase: 36,
    yearlyBase: 257,
    currency: 'USD',
    features: [
      'Full web ERP — accounting, sales, purchases, warehouse',
      'Desktop POS with offline mode included',
      'Base price: 1 user + 1 branch',
      'Each extra user doubles total price',
      'Each extra branch doubles total price',
      'Tax compliance, reports & permissions',
    ],
  },
} as const;

/** Convert stored PKR subscription amounts to USD for display */
export function normalizeToUsd(amount: number, currency?: string | null) {
  const c = (currency || 'USD').toUpperCase();
  if (c === 'PKR') return amount / PKR_TO_USD;
  return amount;
}

export function formatUsd(amount: number, sourceCurrency?: string | null) {
  const usd = normalizeToUsd(amount, sourceCurrency);
  return `$${Math.round(usd).toLocaleString()}`;
}

export function calculatePrice(
  productTier: ProductTier,
  billingCycle: BillingCycle,
  users = 1,
  branches = 1
) {
  const u = Math.max(1, users);
  const b = Math.max(1, branches);
  if (productTier === 'pos') {
    const rate =
      billingCycle === 'yearly'
        ? PRICING.pos.yearlyPerUser
        : PRICING.pos.monthlyPerUser;
    return {
      productTier,
      billingCycle,
      licensedUsers: u,
      licensedBranches: b,
      amount: rate * u,
      currency: 'USD' as const,
      breakdown: `${formatUsd(rate)} × ${u} user(s)`,
    };
  }
  const rate =
    billingCycle === 'yearly'
      ? PRICING.erp_pos.yearlyBase
      : PRICING.erp_pos.monthlyBase;
  return {
    productTier,
    billingCycle,
    licensedUsers: u,
    licensedBranches: b,
    amount: rate * u * b,
    currency: 'USD' as const,
    breakdown: `${formatUsd(rate)} × ${u} user(s) × ${b} branch(es)`,
  };
}

export type SubscriptionCapacity = {
  productTier: ProductTier;
  billingCycle: BillingCycle;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isTrial: boolean;
  isPaid: boolean;
  hasAccess: boolean;
  licensedUsers: number;
  licensedBranches: number;
  usedUsers: number;
  usedBranches: number;
  canAddUser: boolean;
  canAddBranch: boolean;
  needsUpgradeForUser?: boolean;
  needsUpgradeForBranch?: boolean;
  currentAmount?: number;
};

export type UpgradeQuote = {
  current: ReturnType<typeof calculatePrice>;
  next: ReturnType<typeof calculatePrice>;
  delta: number;
  licensedUsers: number;
  licensedBranches: number;
};
