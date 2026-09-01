'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Users, Building2, ArrowRight } from 'lucide-react';
import {
  calculatePrice,
  formatUsd,
  type SubscriptionCapacity,
  type UpgradeQuote,
} from '../lib/subscription-pricing';
import { upgradeSubscription } from '../lib/subscription-service';

type Props = {
  open: boolean;
  reason: 'user_seat' | 'branch';
  capacity: SubscriptionCapacity;
  upgrade: UpgradeQuote;
  onClose: () => void;
  onUpgraded?: () => void;
};

export default function SubscriptionUpgradeModal({
  open,
  reason,
  capacity,
  upgrade,
  onClose,
  onUpgraded,
}: Props) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const title =
    reason === 'user_seat'
      ? 'Add another user seat'
      : 'Add another branch / location';

  const description =
    reason === 'user_seat'
      ? `You are using ${capacity.usedUsers} of ${capacity.licensedUsers} licensed user seat(s). Upgrade to invite another team member.`
      : `You are using ${capacity.usedBranches} of ${capacity.licensedBranches} licensed branch(es). Upgrade to add another shop or warehouse.`;

  const cycleLabel = capacity.billingCycle === 'yearly' ? 'year' : 'month';

  const preview = useMemo(() => {
    if (reason === 'user_seat') {
      return calculatePrice(
        capacity.productTier,
        capacity.billingCycle,
        upgrade.licensedUsers,
        capacity.licensedBranches
      );
    }
    return calculatePrice(
      capacity.productTier,
      capacity.billingCycle,
      capacity.licensedUsers,
      upgrade.licensedBranches
    );
  }, [capacity, upgrade, reason]);

  if (!open) return null;

  const handleUpgrade = async () => {
    setProcessing(true);
    setError('');
    try {
      const res = await upgradeSubscription({
        licensedUsers: upgrade.licensedUsers,
        licensedBranches: upgrade.licensedBranches,
      });
      if (!res.success) throw new Error(res.message || 'Upgrade failed');
      onUpgraded?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upgrade failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: '#014582' }}
          >
            {reason === 'user_seat' ? <Users size={20} /> : <Building2 size={20} />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Your current plan
          </p>
          <div className="flex justify-between py-1">
            <span className="text-neutral-500">Product</span>
            <span className="font-medium text-neutral-900">
              {capacity.productTier === 'pos' ? 'POS (Desktop)' : 'ERP + POS'}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-500">Billing</span>
            <span className="font-medium text-neutral-900 capitalize">
              {capacity.isTrial ? 'Free trial' : capacity.billingCycle}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-500">User seats</span>
            <span>
              {capacity.usedUsers} used
              {!capacity.isTrial && capacity.licensedUsers < 999
                ? ` / ${capacity.licensedUsers} licensed`
                : capacity.isTrial
                  ? ' (unlimited on trial)'
                  : ''}
            </span>
          </div>
          {capacity.productTier === 'erp_pos' && (
            <div className="flex justify-between py-1">
              <span className="text-neutral-500">Branches</span>
              <span>
                {capacity.usedBranches} used
                {!capacity.isTrial && capacity.licensedBranches < 999
                  ? ` / ${capacity.licensedBranches} licensed`
                  : capacity.isTrial
                    ? ' (unlimited on trial)'
                    : ''}
              </span>
            </div>
          )}
          {!capacity.isTrial && (
            <div className="flex justify-between py-1">
              <span className="text-neutral-500">Current price</span>
              <span>{formatUsd(upgrade.current.amount)} / {cycleLabel}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2">
            <span className="font-medium text-neutral-900">After upgrade</span>
            <span className="font-semibold" style={{ color: '#014582' }}>
              {capacity.isTrial
                ? 'Choose a plan below'
                : `${formatUsd(preview.amount)} / ${cycleLabel}`}
            </span>
          </div>
          {!capacity.isTrial && upgrade.delta > 0 && (
            <p className="mt-2 text-xs text-neutral-500">
              Additional {formatUsd(upgrade.delta)} / {cycleLabel} for this upgrade.
            </p>
          )}
        </div>

        {capacity.isTrial && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            You are on a free trial — all features are included. No charge until you subscribe.
          </p>
        )}

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {!capacity.isTrial && (
            <button
              type="button"
              disabled={processing}
              onClick={handleUpgrade}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#014582' }}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Confirm upgrade
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
          <Link
            href={capacity.isTrial || !capacity.isPaid ? '/plans' : '/billing'}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            {capacity.isTrial || !capacity.isPaid ? 'View plans' : 'Billing & invoices'}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
