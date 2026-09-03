'use client';

import { useMemo, useState } from 'react';
import { Check, Loader2, Monitor, LayoutGrid } from 'lucide-react';
import {
  TRIAL_DAYS,
  PRICING,
  calculatePrice,
  formatUsd,
  type BillingCycle,
  type ProductTier,
} from '../../lib/subscription-pricing';
import {
  startTrial,
  subscribeToPlan,
  upgradeSubscription,
} from '../../lib/subscription-service';
import type { SubscriptionCapacity } from '../../lib/subscription-pricing';

const BRAND = '#014582';

type Props = {
  processing: boolean;
  setProcessing: (v: boolean) => void;
  setError: (v: string) => void;
  setSuccess: (v: string) => void;
  onComplete: () => void;
  isTrial: boolean;
  isPaid: boolean;
  trialEligible?: boolean;
  capacity?: SubscriptionCapacity | null;
};

export default function PricingSection({
  processing,
  setProcessing,
  setError,
  setSuccess,
  onComplete,
  isTrial,
  isPaid,
  trialEligible = false,
  capacity,
}: Props) {
  const hasActivePlan = isTrial || isPaid;

  const initialUsers =
    capacity && (capacity.isTrial || capacity.licensedUsers >= 999)
      ? Math.max(1, capacity.usedUsers || 1)
      : capacity?.licensedUsers || 1;
  const initialBranches =
    capacity && (capacity.isTrial || capacity.licensedBranches >= 999)
      ? Math.max(1, capacity.usedBranches || 1)
      : capacity?.licensedBranches || 1;

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    capacity?.billingCycle || 'monthly'
  );
  const [productTier, setProductTier] = useState<ProductTier>(
    capacity?.productTier || 'erp_pos'
  );
  const [users, setUsers] = useState(initialUsers);
  const [branches, setBranches] = useState(initialBranches);

  const quote = useMemo(
    () => calculatePrice(productTier, billingCycle, users, branches),
    [productTier, billingCycle, users, branches]
  );

  const currentQuote = useMemo(() => {
    if (!capacity || !capacity.isPaid) return null;
    return calculatePrice(
      capacity.productTier,
      capacity.billingCycle,
      capacity.licensedUsers,
      capacity.licensedBranches
    );
  }, [capacity]);

  const priceDelta =
    currentQuote && hasActivePlan && capacity?.isPaid
      ? quote.amount - currentQuote.amount
      : 0;

  const cycleLabel = billingCycle === 'yearly' ? 'year' : 'month';

  const handleTrial = async () => {
    if (processing || isTrial || isPaid) return;
    setProcessing(true);
    setError('');
    try {
      const res = await startTrial();
      if (!res.success) throw new Error(res.message || 'Could not start trial');
      setSuccess(`${TRIAL_DAYS}-day free trial started — full ERP + POS access!`);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trial failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubscribe = async () => {
    if (processing) return;
    setProcessing(true);
    setError('');
    try {
      const sameTierUpgrade =
        capacity?.isPaid &&
        productTier === capacity.productTier &&
        billingCycle === capacity.billingCycle;

      const res = sameTierUpgrade
        ? await upgradeSubscription({ licensedUsers: users, licensedBranches: branches })
        : await subscribeToPlan(billingCycle, quote.amount, {
            productTier,
            licensedUsers: users,
            licensedBranches: branches,
          });

      if (!res.success) throw new Error(res.message || 'Subscription failed');
      setSuccess(
        sameTierUpgrade ? 'Subscription updated successfully' : 'Subscription activated successfully'
      );
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Subscription failed');
    } finally {
      setProcessing(false);
    }
  };

  const subscribeLabel = (tier: ProductTier) => {
    if (isTrial) return tier === 'pos' ? 'Subscribe to POS' : 'Subscribe to ERP + POS';
    if (isPaid && capacity) {
      const changed =
        tier !== capacity.productTier ||
        billingCycle !== capacity.billingCycle ||
        users !== capacity.licensedUsers ||
        branches !== capacity.licensedBranches;
      if (!changed) return 'Current selection';
      return 'Update subscription';
    }
    return tier === 'pos' ? 'Subscribe to POS' : 'Subscribe to ERP + POS';
  };

  const isCurrentSelection = (tier: ProductTier) =>
    isPaid &&
    capacity &&
    tier === capacity.productTier &&
    billingCycle === capacity.billingCycle &&
    users === capacity.licensedUsers &&
    branches === capacity.licensedBranches;

  return (
    <div className="space-y-8">
      {hasActivePlan && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            {isTrial ? 'Subscribe after trial' : 'Upgrade or change plan'}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {isTrial
              ? 'Choose a paid plan before your trial ends. Values below start from your trial usage.'
              : 'Adjust users or branches below. Your current plan details are shown above.'}
          </p>
          {capacity?.isPaid && currentQuote && priceDelta !== 0 && (
            <p className="mt-2 text-sm font-medium" style={{ color: BRAND }}>
              {priceDelta > 0
                ? `New total: ${formatUsd(quote.amount)} / ${cycleLabel} (+${formatUsd(priceDelta)} vs current)`
                : `New total: ${formatUsd(quote.amount)} / ${cycleLabel}`}
            </p>
          )}
        </div>
      )}

      {/* Trial banner */}
      {!isTrial && !isPaid && trialEligible && (
        <div
          className="rounded-2xl border p-6 text-center"
          style={{ borderColor: 'rgba(1,69,130,0.25)', background: 'rgba(1,69,130,0.06)' }}
        >
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: BRAND }}>
            Start free
          </p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-900">
            {TRIAL_DAYS}-day trial — everything included
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-600">
            Full ERP + Desktop POS with offline mode. Unlimited users and branches during trial.
            No credit card required.
          </p>
          <button
            type="button"
            disabled={processing}
            onClick={handleTrial}
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: BRAND }}
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Start {TRIAL_DAYS}-day free trial
          </button>
        </div>
      )}

      {/* Billing toggle */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">Restaurant add-on (POS plan)</p>
        <p className="mt-1 text-amber-900/90">
          Choose <strong>Restaurant / Cafe</strong> at signup (or ask support to enable{' '}
          <code className="text-xs">posMode=restaurant</code>). You get:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900/90">
          <li>
            <strong>Bisonstechs Order Picker</strong> mobile app — waiters send orders to kitchen
            (cloud API)
          </li>
          <li>
            Desktop POS <strong>Kitchen</strong> &amp; <strong>Counter</strong> tabs — no WiFi hub;
            kitchen via API, cashier payment local then sync
          </li>
          <li>Retail checkout flow stays unchanged for shop customers (Flow #1)</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-100 p-1">
          {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize transition ${
                billingCycle === cycle ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
              }`}
            >
              {cycle}
            </button>
          ))}
        </div>
      </div>

      {/* Product cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* POS */}
        <div
          className={`rounded-2xl border p-6 transition ${
            productTier === 'pos' ? 'border-[#014582] shadow-md' : 'border-neutral-200'
          }`}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-neutral-100 p-3 text-neutral-700">
              <Monitor size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">{PRICING.pos.label}</h3>
              <p className="text-sm text-neutral-500">Per user · Desktop register app</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-900">
            {formatUsd(
              billingCycle === 'yearly'
                ? PRICING.pos.yearlyPerUser
                : PRICING.pos.monthlyPerUser
            )}
            <span className="text-base font-normal text-neutral-500">
              {' '}/ user / {billingCycle === 'yearly' ? 'year' : 'month'}
            </span>
          </p>
          <ul className="mt-4 space-y-2">
            {PRICING.pos.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-neutral-600">
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} />
                {f}
              </li>
            ))}
          </ul>
          <label className="mt-4 block text-sm font-medium text-neutral-700">Users</label>
          <input
            type="number"
            min={1}
            value={users}
            onChange={(e) => {
              setProductTier('pos');
              setUsers(Math.max(1, parseInt(e.target.value, 10) || 1));
            }}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={processing || isCurrentSelection('pos')}
            onClick={() => {
              setProductTier('pos');
              void handleSubscribe();
            }}
            className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: productTier === 'pos' ? BRAND : '#475569' }}
          >
            {subscribeLabel('pos')}
          </button>
        </div>

        {/* ERP + POS */}
        <div
          className={`relative rounded-2xl border p-6 transition ${
            productTier === 'erp_pos' ? 'border-[#014582] shadow-md' : 'border-neutral-200'
          }`}
        >
          <span
            className="absolute -top-3 right-4 rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: BRAND }}
          >
            POPULAR
          </span>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-neutral-100 p-3 text-neutral-700">
              <LayoutGrid size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">{PRICING.erp_pos.label}</h3>
              <p className="text-sm text-neutral-500">1 user + 1 branch included</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-900">
            {formatUsd(
              billingCycle === 'yearly'
                ? PRICING.erp_pos.yearlyBase
                : PRICING.erp_pos.monthlyBase
            )}
            <span className="text-base font-normal text-neutral-500">
              {' '}/ {billingCycle === 'yearly' ? 'year' : 'month'} base
            </span>
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            + each extra user doubles price · + each extra branch doubles price
          </p>
          <ul className="mt-4 space-y-2">
            {PRICING.erp_pos.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-neutral-600">
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-neutral-700">Users</label>
              <input
                type="number"
                min={1}
                value={users}
                onChange={(e) => {
                  setProductTier('erp_pos');
                  setUsers(Math.max(1, parseInt(e.target.value, 10) || 1));
                }}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Branches</label>
              <input
                type="number"
                min={1}
                value={branches}
                onChange={(e) => {
                  setProductTier('erp_pos');
                  setBranches(Math.max(1, parseInt(e.target.value, 10) || 1));
                }}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div
            className="mt-4 rounded-lg px-3 py-2 text-center text-sm font-semibold"
            style={{ background: 'rgba(1,69,130,0.08)', color: BRAND }}
          >
            Total: {formatUsd(quote.amount)} / {billingCycle === 'yearly' ? 'year' : 'month'}
          </div>
          <button
            type="button"
            disabled={processing || isCurrentSelection('erp_pos')}
            onClick={() => {
              setProductTier('erp_pos');
              void handleSubscribe();
            }}
            className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: productTier === 'erp_pos' ? BRAND : '#475569' }}
          >
            {subscribeLabel('erp_pos')}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-center">
        <p className="text-sm font-semibold text-neutral-800">Need a custom plan?</p>
        <p className="mt-1 text-sm text-neutral-500">
          Contact BisonsTechs directly — we&apos;ll discuss features and pricing.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold">
          <a
            href="mailto:support@bisonstechs.com"
            className="hover:underline"
            style={{ color: BRAND }}
          >
            support@bisonstechs.com
          </a>
          <a
            href="tel:+923253411482"
            className="hover:underline"
            style={{ color: BRAND }}
          >
            +92 325 3411482
          </a>
        </div>
      </div>
    </div>
  );
}
