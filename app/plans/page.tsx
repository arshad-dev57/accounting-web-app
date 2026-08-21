'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  Loader2,
  LogOut,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  cancelSubscription,
  fetchSubscriptionStatus,
  startTrial,
  subscribeToPlan,
  type SubscriptionSnapshot,
} from '../../lib/subscription-service';
import { supportTicketService } from '../../lib/support-ticket-service';
import { performLogout } from '../../lib/auth-logout';
import { usePermissions } from '../../lib/usePermissions';

type DisplayPlan = {
  id: 'trial' | 'monthly' | 'yearly' | 'custom';
  name: string;
  priceLabel: string;
  priceSub?: string;
  badge?: string;
  badgeTone?: 'blue' | 'gray';
  cta: string;
  ctaStyle: 'outline' | 'solid';
  includesLabel: string;
  highlights: string[];
  amount?: number;
};

const DISPLAY_PLANS: DisplayPlan[] = [
  {
    id: 'trial',
    name: 'Trial',
    priceLabel: '$0',
    priceSub: undefined,
    cta: 'Start free trial',
    ctaStyle: 'outline',
    includesLabel: '30-DAY FULL ACCESS',
    highlights: [
      'Full ERP access for 30 days',
      'Accounting, sales, purchases & warehouse',
      'POS terminal & receipts',
      'Reports export to PDF / Excel',
      'Email support during trial',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    priceLabel: '$15',
    priceSub: 'PER MONTH',
    badge: 'FLEXIBLE',
    badgeTone: 'gray',
    cta: 'Select plan',
    ctaStyle: 'solid',
    includesLabel: 'EVERYTHING IN TRIAL, PLUS:',
    highlights: [
      'Unlimited transactions & journals',
      'Invoices, bills, payments & AR/AP',
      'Inventory, stock & goods receiving',
      'Sales orders, POS & purchase flow',
      'Financial statements & aged reports',
      'Email support',
    ],
    amount: 15,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    priceLabel: '$150',
    priceSub: 'PER YEAR',
    badge: 'POPULAR',
    badgeTone: 'blue',
    cta: 'Select plan',
    ctaStyle: 'solid',
    includesLabel: 'EVERYTHING IN MONTHLY, PLUS:',
    highlights: [
      '2 months free (save ~16%)',
      'Priority support',
      'Advanced analytics & PDF branding',
      'Best value for growing businesses',
      'Continuous updates & data security',
    ],
    amount: 150,
  },
  {
    id: 'custom',
    name: 'Custom',
    priceLabel: 'Let’s talk',
    priceSub: undefined,
    badge: 'NEW',
    badgeTone: 'gray',
    cta: 'Request features',
    ctaStyle: 'solid',
    includesLabel: 'TAILORED FOR YOUR BUSINESS:',
    highlights: [
      'Tell us the features you need',
      'Discuss scope with our product team',
      'Custom modules, reports or workflows',
      'Dedicated onboarding & training',
      'Flexible pricing for your company',
    ],
  },
];

type CompareValue = boolean | string;

type CompareRow =
  | { type: 'section'; label: string }
  | { type: 'feature'; label: string; values: Record<string, CompareValue> };

const COMPARE_ROWS: CompareRow[] = [
  { type: 'section', label: 'Access & users' },
  {
    type: 'feature',
    label: 'Active subscription access',
    values: { trial: '30 days', monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'Company workspace',
    values: { trial: '1', monthly: '1', yearly: '1', custom: 'Unlimited' },
  },
  {
    type: 'feature',
    label: 'User seats',
    values: {
      trial: 'Limited',
      monthly: 'Standard',
      yearly: 'Standard',
      custom: 'Unlimited / negotiated',
    },
  },

  { type: 'section', label: 'Accounting' },
  {
    type: 'feature',
    label: 'Chart of accounts & journals',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'Invoices, bills & payments',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'P&L, balance sheet, cash flow',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'Trial balance, GL & aged AR',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'Fixed assets, loans & equity',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },

  { type: 'section', label: 'Sales & POS' },
  {
    type: 'feature',
    label: 'Orders, quotations & invoices',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'Customers, deliveries & returns',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'Point of Sale & shifts',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'Sales reports (PDF / Excel)',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },

  { type: 'section', label: 'Purchases & warehouse' },
  {
    type: 'feature',
    label: 'Purchase orders & invoices',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'Goods receiving & payments',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'Products, stock & categories',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'Purchase reports (PDF / Excel)',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },

  { type: 'section', label: 'Support & extras' },
  {
    type: 'feature',
    label: 'Support tickets',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'Priority support',
    values: { trial: false, monthly: false, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'PDF branding & signature',
    values: { trial: true, monthly: true, yearly: true, custom: true },
  },
  {
    type: 'feature',
    label: 'Custom feature development',
    values: { trial: false, monthly: false, yearly: false, custom: true },
  },
  {
    type: 'feature',
    label: 'Dedicated onboarding',
    values: { trial: false, monthly: false, yearly: false, custom: true },
  },
];

const PLAN_COLUMNS = [
  { id: 'trial', name: 'Trial', price: '$0 / month' },
  { id: 'monthly', name: 'Monthly', price: '$15 / month' },
  { id: 'yearly', name: 'Yearly', price: '$150 / year' },
  { id: 'custom', name: 'Custom', price: 'Let’s talk' },
] as const;

const BRAND = '#014582';
const BRAND_SOFT = 'rgba(1, 69, 130, 0.10)';
const BRAND_BORDER = 'rgba(1, 69, 130, 0.22)';

function CellValue({ value }: { value: CompareValue }) {
  if (typeof value === 'boolean') {
    return value ? (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: BRAND }}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    ) : (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-red-400 text-red-500">
        <X className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  return <span className="text-sm text-neutral-700">{value}</span>;
}

export default function PlansPage() {
  const router = useRouter();
  const { isAdmin, loading: permLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot | null>(null);

  const [customOpen, setCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customFeatures, setCustomFeatures] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customSubmitting, setCustomSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.replace('/login');
        return;
      }
      const status = await fetchSubscriptionStatus();
      setSnapshot(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (permLoading || loading) return;
    if (!isAdmin && snapshot?.hasAccess) {
      router.replace('/dashboard');
    }
  }, [permLoading, loading, isAdmin, snapshot, router]);

  const plan = snapshot?.subscription?.plan || 'none';
  const status = snapshot?.subscription?.status || 'expired';
  const hasAccess = snapshot?.hasAccess === true;
  const isTrial = plan === 'trial' && status === 'active' && hasAccess;
  const isPaid =
    (plan === 'monthly' || plan === 'yearly') && status === 'active' && hasAccess;

  const statusLine = useMemo(() => {
    if (loading) return 'Loading your subscription…';
    if (isTrial) {
      return `You are on a free trial · ${snapshot?.subscription.trialDaysRemaining ?? 0} day(s) left`;
    }
    if (isPaid) {
      return `Active ${plan} plan · ${snapshot?.subscription.subscriptionDaysRemaining ?? 0} day(s) remaining`;
    }
    return 'No active plan — choose a plan below to unlock the ERP';
  }, [loading, isTrial, isPaid, plan, snapshot]);

  const goDashboard = () => window.location.replace('/dashboard');

  const handlePlanAction = async (planId: DisplayPlan['id']) => {
    if (processing) return;
    setError('');
    setSuccess('');

    if (planId === 'custom') {
      setCustomOpen(true);
      return;
    }

    setProcessing(true);
    try {
      if (planId === 'trial') {
        const res = await startTrial();
        if (!res.success) throw new Error(res.message || 'Could not start trial');
        setSuccess(res.message || '30-day free trial started');
        await load();
        setTimeout(goDashboard, 700);
        return;
      }

      const amount = planId === 'yearly' ? 150 : 15;
      const res = await subscribeToPlan(planId, amount);
      if (!res.success) throw new Error(res.message || 'Subscription failed');
      setSuccess(res.message || 'Subscription activated');
      await load();
      setTimeout(goDashboard, 700);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (processing) return;
    if (!confirm('Cancel your subscription? Access will end immediately.')) return;
    setProcessing(true);
    setError('');
    try {
      const res = await cancelSubscription();
      if (!res.success) throw new Error(res.message || 'Cancel failed');
      setSuccess(res.message || 'Subscription cancelled');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel');
    } finally {
      setProcessing(false);
    }
  };

  if (permLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND }} />
      </div>
    );
  }

  if (!isAdmin) {
    if (hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND }} />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-white text-neutral-900">
        <header className="border-b border-neutral-200">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <Image
                src="/bisontechs.png"
                alt="Bisonstechs"
                width={32}
                height={32}
                className="rounded"
              />
              <div>
                <p className="text-sm font-semibold tracking-tight" style={{ color: BRAND }}>
                  Bisonstechs
                </p>
                <p className="text-xs text-neutral-500">ERP Suite</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => performLogout()}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              style={{ borderColor: BRAND_BORDER }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-lg px-5 py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: BRAND }}>
            Subscription
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Contact your administrator
          </h1>
          <p className="mt-4 text-sm text-neutral-500">
            Your company&apos;s subscription has expired. Only an admin can view plans
            and renew access. Please ask your administrator to update the subscription.
          </p>
        </main>
      </div>
    );
  }

  const submitCustomRequest = async () => {
    if (!customTitle.trim() || !customFeatures.trim()) {
      setError('Please describe the features you want for a custom plan');
      return;
    }
    setCustomSubmitting(true);
    setError('');
    try {
      const description = [
        'Custom plan / feature request from Subscription page.',
        customCompany.trim() ? `Company / context: ${customCompany.trim()}` : null,
        '',
        'Requested features / requirements:',
        customFeatures.trim(),
      ]
        .filter(Boolean)
        .join('\n');

      const res = await supportTicketService.create({
        title: customTitle.trim(),
        description,
        category: 'Feature Request',
        priority: 'Medium',
        module: 'Subscription',
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to submit request');
      }

      setSuccess(
        'Custom plan request sent. Our team will contact you to discuss features and pricing.'
      );
      setCustomOpen(false);
      setCustomTitle('');
      setCustomFeatures('');
      setCustomCompany('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit custom request');
    } finally {
      setCustomSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Top bar */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/bisontechs.png"
              alt="Bisonstechs"
              width={32}
              height={32}
              className="rounded"
            />
            <div>
              <p className="text-sm font-semibold tracking-tight" style={{ color: BRAND }}>
                Bisonstechs
              </p>
              <p className="text-xs text-neutral-500">ERP Suite</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasAccess && (
              <button
                type="button"
                onClick={goDashboard}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-[rgba(1,69,130,0.08)]"
                style={{ color: BRAND }}
              >
                Dashboard
              </button>
            )}
            <Link
              href="/support"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-[rgba(1,69,130,0.08)] sm:inline-flex"
            >
              Support
            </Link>
            <button
              type="button"
              onClick={() => performLogout()}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              style={{ borderColor: BRAND_BORDER }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {/* Hero */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              <span style={{ color: BRAND }}>Bisonstechs</span>
              <br />
              <span className="text-neutral-400">Plans and Pricing</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-neutral-500">{statusLine}</p>
          </div>
          <div className="max-w-sm text-left lg:text-right">
            <p className="text-sm text-neutral-500">
              Choose the perfect plan for your business journey.
            </p>
            <a
              href="#compare"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide underline-offset-4 hover:underline"
              style={{ color: BRAND }}
            >
              Compare every ERP feature
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}

        {(isTrial || isPaid) && (
          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: BRAND_BORDER, backgroundColor: BRAND_SOFT }}
          >
            <p className="text-sm text-neutral-700">
              {isTrial
                ? `Trial ends ${
                    snapshot?.subscription.trialEndDate
                      ? new Date(snapshot.subscription.trialEndDate).toLocaleDateString()
                      : 'soon'
                  }`
                : `Current plan: ${plan}`}
            </p>
            <div className="flex gap-2">
              {hasAccess && (
                <button
                  type="button"
                  onClick={goDashboard}
                  className="rounded-md px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  Continue to ERP
                </button>
              )}
              {isPaid && (
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleCancel}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-white disabled:opacity-50"
                >
                  Cancel plan
                </button>
              )}
            </div>
          </div>
        )}

        <p className="mt-12 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Individual plans
        </p>

        {/* Plan cards */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {DISPLAY_PLANS.map((p) => {
              const current =
                (p.id === 'trial' && isTrial) ||
                (p.id === plan && isPaid);

              return (
                <div
                  key={p.id}
                  className="flex flex-col rounded-xl border bg-white p-6"
                  style={{
                    borderColor: p.badgeTone === 'blue' ? BRAND : '#e5e7eb',
                    boxShadow:
                      p.badgeTone === 'blue'
                        ? `0 0 0 1px ${BRAND_BORDER}`
                        : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-2xl font-medium text-neutral-500">{p.name}</h2>
                    {p.badge && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={
                          p.badgeTone === 'blue'
                            ? { backgroundColor: BRAND_SOFT, color: BRAND }
                            : { backgroundColor: '#f3f4f6', color: '#525252' }
                        }
                      >
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex items-end gap-2">
                    {p.id === 'custom' || p.id === 'trial' ? (
                      <span className="text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
                        {p.priceLabel}
                      </span>
                    ) : (
                      <>
                        <span className="text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
                          {p.priceLabel}
                        </span>
                        {p.priceSub && (
                          <span className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                            {p.priceSub}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={processing || (current && p.id !== 'custom')}
                    onClick={() => handlePlanAction(p.id)}
                    className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50"
                    style={
                      p.ctaStyle === 'solid'
                        ? { backgroundColor: BRAND, color: '#fff' }
                        : {
                            border: `1.5px solid ${BRAND}`,
                            backgroundColor: '#fff',
                            color: BRAND,
                          }
                    }
                  >
                    {processing ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : current && p.id !== 'custom' ? (
                      'Current plan'
                    ) : (
                      p.cta
                    )}
                  </button>

                  <div className="my-5 border-t border-neutral-200" />

                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    {p.includesLabel}
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {p.highlights.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0"
                          style={{ color: BRAND }}
                          strokeWidth={2.5}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* Compare table */}
        <section id="compare" className="mt-20 scroll-mt-8">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Compare Plans
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Everything you can run in the Bisonstechs ERP — accounting, sales, purchases,
            warehouse, POS, reports and support — by plan.
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-4 pr-4 text-sm font-medium text-neutral-400" />
                  {PLAN_COLUMNS.map((col) => (
                    <th key={col.id} className="px-3 py-4 align-bottom">
                      <div className="text-base font-semibold text-neutral-950">{col.name}</div>
                      <div className="mt-1 text-xs text-neutral-400">{col.price}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, idx) => {
                  if (row.type === 'section') {
                    return (
                      <tr key={`s-${row.label}-${idx}`} className="border-b border-neutral-100">
                        <td
                          colSpan={5}
                          className="pb-2 pt-8 text-sm font-semibold text-neutral-950"
                        >
                          {row.label}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={`f-${row.label}-${idx}`} className="border-b border-neutral-100">
                      <td className="py-4 pr-4 text-sm text-neutral-800">{row.label}</td>
                      {PLAN_COLUMNS.map((col) => (
                        <td key={col.id} className="px-3 py-4">
                          <CellValue value={row.values[col.id]} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-12 text-center text-xs text-neutral-400">
          Need help choosing?{' '}
          <Link href="/support" className="hover:underline" style={{ color: BRAND }}>
            Open a support ticket
          </Link>{' '}
          or request a Custom plan above.
        </p>
      </main>

      {/* Custom plan modal */}
      {customOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-neutral-950">Custom plan</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Tell us what new features or workflows you need. Our team will discuss
                  scope and pricing with you.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Request title
                </label>
                <input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Multi-branch inventory + custom payroll reports"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Company / context (optional)
                </label>
                <input
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  placeholder="Business name, industry, team size"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Features you want
                </label>
                <textarea
                  value={customFeatures}
                  onChange={(e) => setCustomFeatures(e.target.value)}
                  rows={5}
                  placeholder="List the modules, reports, integrations or workflows you need…"
                  className="w-full resize-y rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={customSubmitting}
                onClick={submitCustomRequest}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: BRAND }}
              >
                {customSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Send to team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
