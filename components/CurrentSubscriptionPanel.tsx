'use client';

import { Building2, Calendar, CreditCard, Users } from 'lucide-react';
import {
  PRICING,
  TRIAL_DAYS,
  calculatePrice,
  formatUsd,
  type SubscriptionCapacity,
} from '../lib/subscription-pricing';

const BRAND = '#014582';
const BRAND_SOFT = 'rgba(1, 69, 130, 0.08)';
const BRAND_BORDER = 'rgba(1, 69, 130, 0.22)';

type Props = {
  capacity: SubscriptionCapacity;
  trialDaysRemaining?: number;
  subscriptionDaysRemaining?: number;
  trialEndDate?: string | null;
  subscriptionEndDate?: string | null;
  compact?: boolean;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function planTitle(capacity: SubscriptionCapacity) {
  if (capacity.isTrial) return `${TRIAL_DAYS}-day free trial`;
  const tier = capacity.productTier === 'pos' ? PRICING.pos.label : PRICING.erp_pos.label;
  const cycle = capacity.billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
  return `${tier} · ${cycle}`;
}

export default function CurrentSubscriptionPanel({
  capacity,
  trialDaysRemaining = 0,
  subscriptionDaysRemaining = 0,
  trialEndDate,
  subscriptionEndDate,
  compact = false,
}: Props) {
  const quote = calculatePrice(
    capacity.productTier,
    capacity.billingCycle,
    capacity.licensedUsers,
    capacity.licensedBranches
  );

  const features =
    capacity.productTier === 'pos' ? PRICING.pos.features : PRICING.erp_pos.features;

  const atUserLimit = capacity.needsUpgradeForUser;
  const atBranchLimit = capacity.needsUpgradeForBranch;

  const cycleLabel = capacity.billingCycle === 'yearly' ? 'year' : 'month';

  return (
    <section
      className={`${compact ? 'mt-0' : 'mt-6'} rounded-2xl border p-5 sm:p-6`}
      style={{ borderColor: BRAND_BORDER, backgroundColor: BRAND_SOFT }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Your current plan
          </p>
          <h2 className="mt-1 text-xl font-semibold text-neutral-900 sm:text-2xl">
            {planTitle(capacity)}
          </h2>
          {capacity.isTrial && (
            <p className="mt-1 text-sm text-emerald-700">
              Full access — unlimited users & branches during trial
            </p>
          )}
        </div>
        {!capacity.isTrial && capacity.isPaid && (
          <div className="rounded-xl border border-white/80 bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs text-neutral-500">You pay</p>
            <p className="text-lg font-bold" style={{ color: BRAND }}>
              {formatUsd(quote.amount)}
              <span className="text-sm font-normal text-neutral-500"> / {cycleLabel}</span>
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">{quote.breakdown}</p>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white/90 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <CreditCard className="h-3.5 w-3.5" />
            Product
          </div>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {capacity.productTier === 'pos' ? PRICING.pos.label : PRICING.erp_pos.label}
          </p>
        </div>

        <div className="rounded-xl bg-white/90 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <Users className="h-3.5 w-3.5" />
            User seats
          </div>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {capacity.usedUsers} used
            {capacity.isTrial || capacity.licensedUsers >= 999
              ? ' · unlimited'
              : ` · ${capacity.licensedUsers} licensed`}
          </p>
          {atUserLimit && (
            <p className="mt-1 text-xs font-medium text-amber-700">At seat limit — upgrade to add users</p>
          )}
        </div>

        {capacity.productTier === 'erp_pos' && (
          <div className="rounded-xl bg-white/90 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
              <Building2 className="h-3.5 w-3.5" />
              Branches / locations
            </div>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {capacity.usedBranches} used
              {capacity.isTrial || capacity.licensedBranches >= 999
                ? ' · unlimited'
                : ` · ${capacity.licensedBranches} licensed`}
            </p>
            {atBranchLimit && (
              <p className="mt-1 text-xs font-medium text-amber-700">
                At branch limit — upgrade to add locations
              </p>
            )}
          </div>
        )}

        <div className="rounded-xl bg-white/90 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <Calendar className="h-3.5 w-3.5" />
            {capacity.isTrial ? 'Trial ends' : 'Renews / ends'}
          </div>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {capacity.isTrial
              ? formatDate(trialEndDate)
              : formatDate(subscriptionEndDate)}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {capacity.isTrial
              ? `${trialDaysRemaining} day(s) left`
              : capacity.isPaid
                ? `${subscriptionDaysRemaining} day(s) remaining`
                : 'Inactive'}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-white/90 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Included in your plan
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: BRAND }}
              />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
