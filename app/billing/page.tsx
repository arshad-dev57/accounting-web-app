'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Receipt,
  CreditCard,
  TrendingUp,
  CalendarDays,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { MainHubSidebar } from '../../components/MainHubSidebar';
import { TopBarBrand } from '../../components/BrandHeader';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import ProfileDropdown from '../../components/ProfileDropdown';
import CurrentSubscriptionPanel from '../../components/CurrentSubscriptionPanel';
import BillingInvoiceModal from '../../components/BillingInvoiceModal';
import { usePermissions } from '../../lib/usePermissions';
import {
  fetchCompanyBilling,
  type BillingInvoice,
  type CompanyBilling,
} from '../../lib/subscription-service';
import { formatUsd } from '../../lib/subscription-pricing';

const BRAND = '#014582';

type Tab = 'overview' | 'invoices';

function invoiceTypeLabel(type?: string) {
  if (type === 'upgrade') return 'Upgrade';
  if (type === 'trial') return 'Trial';
  return 'Subscription';
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BillingPage() {
  const router = useRouter();
  const { isAdmin, loading: permLoading } = usePermissions();
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [billing, setBilling] = useState<CompanyBilling | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchCompanyBilling();
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load billing');
      }
      setBilling(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load billing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permLoading) return;
    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permLoading, isAdmin]);

  if (permLoading || (!isAdmin && !permLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND }} />
      </div>
    );
  }

  const stats = billing?.stats;
  const capacity = billing?.capacity;
  const subscription = billing?.subscription;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MainHubSidebar activePath="/billing" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <TopBarBrand title="Billing" />
          <ProfileDropdown />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <AppBreadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Billing' },
            ]}
          />

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
              <p className="mt-1 text-sm text-gray-500">
                Current plan, payment history and invoices for {billing?.company.name || 'your company'}
              </p>
            </div>
            <Link
              href="/plans"
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: BRAND }}
            >
              Manage subscription
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
          ) : billing && capacity && subscription ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <CreditCard className="h-4 w-4" />
                    Current plan cost
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {capacity.isPaid ? formatUsd(stats?.currentAmount || 0) : '—'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {capacity.isTrial
                      ? 'Free trial'
                      : capacity.isPaid
                        ? `Per ${capacity.billingCycle === 'yearly' ? 'year' : 'month'}`
                        : 'No active paid plan'}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <TrendingUp className="h-4 w-4" />
                    Total paid
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatUsd(stats?.totalPaid || 0)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">All time</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <CalendarDays className="h-4 w-4" />
                    Paid this month
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatUsd(stats?.paidThisMonth || 0)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <FileText className="h-4 w-4" />
                    Invoices
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {stats?.invoiceCount || 0}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Payment records</p>
                </div>
              </div>

              <div className="mt-6 border-b border-gray-200">
                <nav className="-mb-px flex gap-6">
                  {([
                    ['overview', 'Overview'],
                    ['invoices', 'Invoices'],
                  ] as const).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={`border-b-2 pb-3 text-sm font-semibold transition ${
                        tab === id
                          ? 'border-[#014582] text-[#014582]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </div>

              {tab === 'overview' && (
                <div className="mt-2 space-y-6">
                  <CurrentSubscriptionPanel
                    compact
                    capacity={capacity}
                    trialDaysRemaining={subscription.trialDaysRemaining}
                    subscriptionDaysRemaining={subscription.subscriptionDaysRemaining}
                    trialEndDate={subscription.trialEndDate}
                    subscriptionEndDate={subscription.endDate}
                  />

                  {billing.monthlyStats.length > 0 && (
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <h2 className="text-lg font-semibold text-gray-900">Monthly payments</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        How much was paid in each billing month
                      </p>
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[480px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                              <th className="py-3 pr-4">Month</th>
                              <th className="py-3 pr-4">Payments</th>
                              <th className="py-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {billing.monthlyStats.map((row) => (
                              <tr key={row.month} className="border-b border-gray-50">
                                <td className="py-3 pr-4 font-medium text-gray-900">{row.label}</td>
                                <td className="py-3 pr-4 text-gray-600">{row.count}</td>
                                <td className="py-3 text-right font-semibold text-gray-900">
                                  {formatUsd(row.total)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </div>
              )}

              {tab === 'invoices' && (
                <section className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
                  {billing.invoices.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <Receipt className="mx-auto h-10 w-10 text-gray-300" />
                      <p className="mt-3 font-medium text-gray-900">No invoices yet</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Invoices appear here when you subscribe or upgrade your plan.
                      </p>
                      <Link
                        href="/plans"
                        className="mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: BRAND }}
                      >
                        View plans
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="px-5 py-3">Invoice</th>
                            <th className="px-5 py-3">Date</th>
                            <th className="px-5 py-3">Plan</th>
                            <th className="px-5 py-3">Type</th>
                            <th className="px-5 py-3">Period</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3 text-right">Amount</th>
                            <th className="px-5 py-3" />
                          </tr>
                        </thead>
                        <tbody>
                          {billing.invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                              <td className="px-5 py-4 font-medium text-gray-900">
                                {invoice.invoiceNumber}
                              </td>
                              <td className="px-5 py-4 text-gray-600">
                                {formatDate(invoice.createdAt)}
                              </td>
                              <td className="px-5 py-4 capitalize text-gray-600">
                                {invoice.plan}
                                {invoice.productTier && (
                                  <span className="block text-xs text-gray-400">
                                    {invoice.productTier === 'pos' ? 'POS' : 'ERP + POS'}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-gray-600">
                                {invoiceTypeLabel(invoice.type)}
                              </td>
                              <td className="px-5 py-4 text-gray-600">
                                {formatDate(invoice.startDate)} — {formatDate(invoice.endDate)}
                              </td>
                              <td className="px-5 py-4">
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right font-semibold text-gray-900">
                                {invoice.amount > 0 ? formatUsd(invoice.amount) : 'Free'}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedInvoice(invoice)}
                                  className="text-sm font-semibold hover:underline"
                                  style={{ color: BRAND }}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}
            </>
          ) : null}
        </main>
      </div>

      {selectedInvoice && billing && (
        <BillingInvoiceModal
          invoice={selectedInvoice}
          company={billing.company}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
