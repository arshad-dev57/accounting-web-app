'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, ArrowRight } from 'lucide-react';
import {
  fetchSubscriptionStatus,
  type SubscriptionSnapshot,
} from '../lib/subscription-service';
import { usePermissions } from '../lib/usePermissions';

const BRAND = '#014582';

function planLabel(plan: string) {
  const p = (plan || 'none').toLowerCase();
  if (p === 'trial') return 'Free Trial';
  if (p === 'monthly') return 'Monthly Plan';
  if (p === 'yearly') return 'Yearly Plan';
  return 'No active plan';
}

export default function SubscriptionStatusBanner() {
  const { isAdmin, loading: permLoading } = usePermissions();
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setReady(true);
          return;
        }
        const data = await fetchSubscriptionStatus();
        if (!cancelled) setSnapshot(data);
      } catch {
        /* keep silent — banner is informational */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (permLoading || !isAdmin || !ready || !snapshot) return null;

  const plan = String(snapshot.subscription.plan || 'none');
  const hasAccess = snapshot.hasAccess;
  const isTrial = plan === 'trial' && hasAccess;
  const days = isTrial
    ? snapshot.subscription.trialDaysRemaining || 0
    : snapshot.subscription.subscriptionDaysRemaining || 0;

  const urgent = hasAccess && days > 0 && days <= 3;

  let message = '';
  if (!hasAccess) {
    message = 'Your subscription has expired — renew to keep using the ERP';
  } else if (isTrial) {
    message =
      days === 1
        ? 'Free Trial · 1 day remaining'
        : `Free Trial · ${days} days remaining`;
  } else {
    message =
      days === 1
        ? `${planLabel(plan)} · 1 day remaining`
        : `${planLabel(plan)} · ${days} days remaining`;
  }

  return (
    <div
      className="flex-shrink-0 border-b px-4 py-1.5 sm:px-6"
      style={{
        backgroundColor: urgent || !hasAccess ? 'rgba(220, 38, 38, 0.06)' : 'rgba(1, 69, 130, 0.07)',
        borderColor: urgent || !hasAccess ? 'rgba(220, 38, 38, 0.15)' : 'rgba(1, 69, 130, 0.12)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Crown
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: urgent || !hasAccess ? '#dc2626' : BRAND }}
          />
          <p
            className="truncate text-xs font-medium sm:text-[13px]"
            style={{ color: urgent || !hasAccess ? '#b91c1c' : BRAND }}
          >
            {message}
          </p>
        </div>
        <Link
          href="/plans"
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wide hover:underline"
          style={{ color: urgent || !hasAccess ? '#dc2626' : BRAND }}
        >
          {hasAccess ? 'Manage' : 'Renew'}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
