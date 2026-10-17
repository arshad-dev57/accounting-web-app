'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Receipt,
  DollarSign,
  RefreshCw,
  Users,
  StickyNote,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Plus,
  Loader2,
  Store,
  FileText,
  Package,
  X,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { usePermissions } from '../../../lib/usePermissions';
import { useDashboardFiltersReady } from '../../../lib/use-dashboard-filters-ready';
import { useFiscalYear } from '../../../lib/fiscal-year-context';
import { getStoredFiscalYearId } from '../../../lib/fiscal-year-service';
import { useModulePageVisible } from '../../../components/ModuleViewHost';
import { browserCompanyAuthHeaders } from '../../../lib/company-api-headers';
import { useCompanyOptional } from '../../../lib/company-context';
import {
  TradePage,
  TradePageHeader,
  TradeStatCard,
  TradeCard,
  TRADE_COLORS,
} from '../../../components/trade/TradeUI';

type TrendPoint = {
  date: string;
  revenue?: number;
  orderRevenue?: number;
  collected?: number;
  count?: number;
  orders?: number;
};

type OrderStatus = { status: string; count: number; revenue: number };

type PeriodComparison = {
  currentSales: number;
  priorSales: number;
  currentReturns: number;
  priorReturns: number;
  salesChangePercent: number;
  returnsChangePercent: number;
  currentLabel?: string;
  priorLabel?: string;
};

type TopProduct = {
  id: string;
  name: string;
  sku: string;
  quantitySold: number;
  revenue: number;
  orderCount?: number;
  avgUnitPrice?: number;
  orderRevenue?: number;
  posRevenue?: number;
  invoiceRevenue?: number;
  orderQty?: number;
  posQty?: number;
  invoiceQty?: number;
};

type DashboardData = {
  summary?: {
    totalRevenue?: number;
    totalPosSales?: number;
    totalPosRevenue?: number;
  };
  orders: {
    count: number;
    revenue: number;
    byStatus: OrderStatus[];
    trend: TrendPoint[];
    todayCount: number;
    todayRevenue: number;
    pendingCount: number;
    revenueGrowth: string;
  };
  pos?: {
    count: number;
    revenue: number;
    discountTotal?: number;
    taxTotal?: number;
    paidAmount?: number;
    todayCount: number;
    todayRevenue: number;
    trend: Array<{ date: string; sales?: number; revenue?: number }>;
    revenueGrowth?: string;
  };
  invoices: {
    stats: {
      grandTotal: number;
      revenue: number;
      paidAmount: number;
      outstanding: number;
      total: number;
    };
    trend: TrendPoint[];
    grandTotalGrowth: string;
    paidAmountGrowth: string;
    outstandingGrowth: string;
  };
  credits: {
    total: number;
    creditAmount: number;
    remainingAmount: number;
  };
  comparison: {
    today: PeriodComparison;
    week: PeriodComparison;
    month: PeriodComparison;
    year: PeriodComparison;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    amount: number;
    date?: string;
    status: string;
    timestamp: string;
  }>;
  topProducts: TopProduct[];
  topCustomers: Array<{
    id: string;
    name: string;
    orderCount: number;
    totalSpent: number;
    email?: string;
    phone?: string;
  }>;
  revenueBreakdown: {
    items: Array<{ category: string; amount: number; percentage: number }>;
  };
};

const TIME_PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'Last Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'month' },
  { label: 'This Quarter', value: 'year' },
  { label: 'This Year', value: 'year' },
] as const;

const PIE_COLORS = ['#014582', '#0FA3E0', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatAxis(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(Math.round(value));
}

function formatShortDate(date: string) {
  const parts = date.split('-');
  if (parts.length >= 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return date;
}

function toNum(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function SalesDashboardPage() {
  const router = useRouter();
  const { isAdmin, hasSubPageAccess } = usePermissions();
  const companyCtx = useCompanyOptional();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading dashboard...');
  const [data, setData] = useState<DashboardData | null>(null);
  const [periodLabel, setPeriodLabel] = useState('This Month');
  const [period, setPeriod] = useState('month');
  const [selectedProduct, setSelectedProduct] = useState<TopProduct | null>(null);
  const { selectedFiscalYear } = useFiscalYear();
  const { ready: filtersReady, selectedFiscalYearId } = useDashboardFiltersReady();
  const fetchAbortRef = useRef<AbortController | null>(null);
  const dashboardCacheRef = useRef<Map<string, { data: DashboardData; fetchedAt: number }>>(
    new Map()
  );
  const CACHE_TTL_MS = 60_000;
  const isPageVisible = useModulePageVisible();

  const canSeeCredits = isAdmin || hasSubPageAccess('sales', 'credits');

  const fetchDashboard = async (
    p = period,
    options?: { refresh?: boolean; signal?: AbortSignal; force?: boolean }
  ) => {
    const fyId = selectedFiscalYearId || getStoredFiscalYearId() || '';
    const cacheKey = `${p}_${fyId || 'none'}_${companyCtx?.activeCompanyId || 'default'}`;
    const cached = dashboardCacheRef.current.get(cacheKey);
    const cacheFresh =
      !options?.force &&
      !options?.refresh &&
      cached &&
      Date.now() - cached.fetchedAt < CACHE_TTL_MS;

    if (cacheFresh && cached) {
      setData(cached.data);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!options?.signal) {
      fetchAbortRef.current?.abort();
      const controller = new AbortController();
      fetchAbortRef.current = controller;
      options = { ...options, signal: controller.signal };
    }

    try {
      if (options?.refresh) setRefreshing(true);
      else if (!data) setLoading(true);
      else setRefreshing(true);

      const qs = new URLSearchParams({ period: p });
      if (fyId) qs.set('fiscalYearId', fyId);

      const response = await fetch(`/api/sales/dashboard?${qs.toString()}`, {
        headers: browserCompanyAuthHeaders(),
        signal: options?.signal,
      });
      const result = await response.json();

      if (options?.signal?.aborted) return;

      if (result.success && result.data) {
        setData(result.data);
        dashboardCacheRef.current.set(cacheKey, {
          data: result.data,
          fetchedAt: Date.now(),
        });
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      console.error('Failed to load sales dashboard:', e);
    } finally {
      if (!options?.signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!filtersReady) return;

    setLoadingMessage('Updating dashboard for selected filters...');

    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    void fetchDashboard(period, { signal: controller.signal });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersReady, selectedFiscalYearId, companyCtx?.activeCompanyId]);

  const selectPeriod = (label: string, value: string) => {
    if (loading || refreshing) return;
    setPeriodLabel(label);
    setPeriod(value);
    setLoadingMessage(`Loading ${label.toLowerCase()} data...`);
    const fyId = selectedFiscalYearId || getStoredFiscalYearId() || '';
    const cacheKey = `${value}_${fyId || 'none'}_${companyCtx?.activeCompanyId || 'default'}`;
    const cached = dashboardCacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setData(cached.data);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    fetchDashboard(value);
  };

  const orders = data?.orders;
  const pos = data?.pos;
  const invoices = data?.invoices;
  const invoiceTotal = invoices?.stats?.grandTotal ?? invoices?.stats?.revenue ?? 0;
  const collected = invoices?.stats?.paidAmount ?? 0;
  const outstanding = invoices?.stats?.outstanding ?? 0;
  const creditAmount = data?.credits?.creditAmount ?? 0;
  const posRevenue = pos?.revenue ?? 0;
  const posCount = pos?.count ?? 0;
  const combinedRevenue = (orders?.revenue ?? 0) + posRevenue;

  const trendData = useMemo(() => {
    const invoiceTrend = invoices?.trend ?? [];
    const orderTrend = orders?.trend ?? [];
    const posTrend = pos?.trend ?? [];
    const dates = new Set<string>();
    invoiceTrend.forEach((p) => p.date && dates.add(p.date));
    orderTrend.forEach((p) => p.date && dates.add(p.date));
    posTrend.forEach((p) => p.date && dates.add(p.date));
    const sorted = Array.from(dates).sort();

    if (sorted.length === 0) {
      return Array.from({ length: 7 }).map((_, i) => ({
        date: `D${i + 1}`,
        label: `--`,
        invoices: 0,
        orders: 0,
        pos: 0,
      }));
    }

    const recent = sorted.slice(-14);
    return recent.map((d) => {
      const inv = invoiceTrend.find((p) => p.date === d);
      const ord = orderTrend.find((p) => p.date === d);
      const posRow = posTrend.find((p) => p.date === d);
      return {
        date: d,
        label: formatShortDate(d),
        invoices: toNum(inv?.revenue),
        orders: toNum(ord?.orderRevenue ?? ord?.revenue),
        pos: toNum(posRow?.revenue),
      };
    });
  }, [invoices?.trend, orders?.trend, pos?.trend]);

  const statusPie = useMemo(
    () =>
      (orders?.byStatus ?? [])
        .filter((s) => s.count > 0)
        .map((s) => ({
          name: s.status,
          value: s.count,
          revenue: s.revenue,
        })),
    [orders?.byStatus]
  );

  const channelPie = useMemo(() => {
    const items = data?.revenueBreakdown?.items ?? [];
    if (items.length > 0) {
      return items.map((i) => ({ name: i.category, value: i.amount }));
    }
    return [
      { name: 'POS', value: posRevenue },
      { name: 'Orders', value: orders?.revenue ?? 0 },
      { name: 'Invoices', value: invoiceTotal },
    ].filter((i) => i.value > 0);
  }, [data?.revenueBreakdown?.items, posRevenue, orders?.revenue, invoiceTotal]);

  const comparisons = [
    {
      title: 'Today vs Yesterday',
      data: data?.comparison?.today,
      currentLabel: data?.comparison?.today?.currentLabel || 'Today',
      priorLabel: data?.comparison?.today?.priorLabel || 'Yesterday',
    },
    {
      title: 'This Week vs Last Week',
      data: data?.comparison?.week,
      currentLabel: data?.comparison?.week?.currentLabel || 'This Week',
      priorLabel: data?.comparison?.week?.priorLabel || 'Last Week',
    },
    {
      title: 'This Month vs Last Month',
      data: data?.comparison?.month,
      currentLabel: data?.comparison?.month?.currentLabel || 'This Month',
      priorLabel: data?.comparison?.month?.priorLabel || 'Last Month',
    },
    {
      title: 'This Year vs Last Year',
      data: data?.comparison?.year,
      currentLabel: data?.comparison?.year?.currentLabel || 'This Year',
      priorLabel: data?.comparison?.year?.priorLabel || 'Last Year',
    },
  ];

  const isBusy = loading || refreshing;
  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
      active
        ? 'bg-white text-[#014582] shadow-sm'
        : 'bg-white/15 text-white hover:bg-white/25'
    } ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`;

  return (
    <TradePage fullWidth className="-mx-6 px-3 sm:px-4">
      {refreshing && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] h-1 overflow-hidden bg-[#014582]/10"
          role="progressbar"
          aria-label="Loading dashboard"
        >
          <div className="h-full w-full animate-pulse bg-[#014582]" />
        </div>
      )}

      <TradePageHeader
        title="Sales Dashboard"
        moduleName="Sales Operations"
        icon={<ShoppingCart className="w-5 h-5 text-white" />}
        subtitle={
          isBusy && data
            ? loadingMessage
            : `POS, orders, invoices and collections · ${periodLabel}${
                selectedFiscalYear?.name ? ` · ${selectedFiscalYear.name}` : ''
              }`
        }
        actions={
          <div className="flex items-center flex-wrap gap-2">
            {TIME_PERIODS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => selectPeriod(p.label, p.value)}
                disabled={isBusy}
                className={chipClass(periodLabel === p.label)}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setLoadingMessage('Refreshing dashboard...');
                setRefreshing(true);
                fetchDashboard(period, { refresh: true, force: true });
              }}
              disabled={isBusy}
              className="p-2 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-all disabled:opacity-60"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${isBusy ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center min-h-[420px] bg-white rounded-xl border border-[#DDE4EE] shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582] mb-3" />
          <p className="text-sm font-medium text-gray-700">
            Loading {periodLabel.toLowerCase()} data...
          </p>
        </div>
      ) : (
        <div className="relative">
          {refreshing && (
            <div
              className="absolute inset-0 z-20 flex items-start justify-center pt-28 rounded-xl bg-white/55 backdrop-blur-[1px]"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-lg">
                <Loader2 className="w-5 h-5 animate-spin text-[#014582]" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{loadingMessage}</p>
                  <p className="text-xs text-gray-500">Please wait while data updates</p>
                </div>
              </div>
            </div>
          )}

          <div
            className={`space-y-6 transition-opacity duration-200 ${
              refreshing ? 'opacity-50 pointer-events-none select-none' : ''
            }`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <TradeStatCard
                label="POS Revenue"
                value={formatCurrency(posRevenue)}
                icon={Store}
                color={TRADE_COLORS.warning}
                hint={`${posCount} sales · ${pos?.todayCount ?? 0} today`}
                href="/sales/orders"
              />
              <TradeStatCard
                label="Order Revenue"
                value={formatCurrency(orders?.revenue ?? 0)}
                icon={ShoppingCart}
                color={TRADE_COLORS.primary}
                hint={`${orders?.count ?? 0} orders · ${orders?.todayCount ?? 0} today`}
                href="/sales/orders"
              />
              <TradeStatCard
                label="Invoice Total"
                value={formatCurrency(invoiceTotal)}
                icon={Receipt}
                color={TRADE_COLORS.success}
                hint={`${invoices?.stats?.total ?? 0} invoices · ${formatCurrency(outstanding)} due`}
                href="/sales/invoices"
              />
              <TradeStatCard
                label="Collected"
                value={formatCurrency(collected)}
                icon={DollarSign}
                color={TRADE_COLORS.accent}
                hint={`Combined ${formatCurrency(combinedRevenue)} · Credits ${formatCurrency(creditAmount)}`}
                href="/sales/payments"
              />
            </div>

            {/* Charts — Import layout: BarChart 2/3 + Pie 1/3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TradeCard
                  title="Sales Channel Revenue Trend"
                  subtitle="Daily POS vs Orders vs Invoices"
                  action={
                    <span className="text-xs font-semibold text-[#014582] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                      Combined {formatCurrency(combinedRevenue)}
                    </span>
                  }
                >
                  <div className="h-[280px] w-full pt-2">
                    {isPageVisible ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatAxis} />
                          <Tooltip
                            formatter={((val: number | string, name: string) => [
                              formatCurrency(Number(val ?? 0)),
                              name === 'pos' ? 'POS' : name === 'invoices' ? 'Invoices' : 'Orders',
                            ]) as never}
                            labelFormatter={(_, payload) =>
                              String(payload?.[0]?.payload?.date || '')
                            }
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              fontSize: '12px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                          <Bar
                            dataKey="pos"
                            name="POS"
                            fill={TRADE_COLORS.warning}
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="orders"
                            name="Orders"
                            fill={TRADE_COLORS.primary}
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="invoices"
                            name="Invoices"
                            fill={TRADE_COLORS.accent}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : null}
                  </div>
                </TradeCard>
              </div>

              <div>
                <TradeCard
                  title="Orders by Status"
                  subtitle={
                    statusPie.length === 0
                      ? `No orders · ${periodLabel}`
                      : `${statusPie.reduce((s, e) => s + e.value, 0)} orders · ${periodLabel}`
                  }
                >
                  <div className="h-[280px] w-full flex flex-col items-center justify-center">
                    {statusPie.length === 0 ? (
                      <p className="text-sm text-[#7A8FA6]">No order status data</p>
                    ) : isPageVisible ? (
                      <>
                        <ResponsiveContainer width="100%" height={210}>
                          <PieChart>
                            <Pie
                              data={statusPie}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              innerRadius={50}
                              paddingAngle={3}
                            >
                              {statusPie.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={((value: number | string) => [
                                Number(value),
                                'Orders',
                              ]) as never}
                              contentStyle={{ borderRadius: '10px', fontSize: '11px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] w-full mt-2">
                          {statusPie.slice(0, 6).map((item, idx) => (
                            <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                                }}
                              />
                              <span className="text-gray-600 truncate">{item.name}</span>
                              <strong className="text-gray-900 ml-auto shrink-0">{item.value}</strong>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                </TradeCard>
              </div>
            </div>

            {/* Period comparisons — show current + prior properly */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {comparisons.map((card) => (
                <TradeCard key={card.title} title={card.title}>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A8FA6]">
                          Sales
                        </p>
                        <ChangeBadge percent={card.data?.salesChangePercent ?? 0} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-2.5">
                          <p className="text-[10px] text-blue-700 font-semibold">{card.currentLabel}</p>
                          <p className="text-sm font-extrabold text-[#014582] mt-0.5">
                            {formatCurrency(card.data?.currentSales ?? 0)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 border border-gray-100 p-2.5">
                          <p className="text-[10px] text-gray-500 font-semibold">{card.priorLabel}</p>
                          <p className="text-sm font-extrabold text-gray-700 mt-0.5">
                            {formatCurrency(card.data?.priorSales ?? 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A8FA6]">
                          Returns
                        </p>
                        <ChangeBadge percent={card.data?.returnsChangePercent ?? 0} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-amber-50/70 border border-amber-100 p-2.5">
                          <p className="text-[10px] text-amber-700 font-semibold">{card.currentLabel}</p>
                          <p className="text-sm font-extrabold text-amber-800 mt-0.5">
                            {formatCurrency(card.data?.currentReturns ?? 0)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 border border-gray-100 p-2.5">
                          <p className="text-[10px] text-gray-500 font-semibold">{card.priorLabel}</p>
                          <p className="text-sm font-extrabold text-gray-700 mt-0.5">
                            {formatCurrency(card.data?.priorReturns ?? 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TradeCard>
              ))}
            </div>

            {/* Top products & customers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TradeCard
                  title="Top Products"
                  subtitle={`Sales-wise ranking · ${periodLabel}`}
                  action={
                    <span className="text-xs text-[#7A8FA6]">
                      {data?.topProducts?.length ?? 0} items
                    </span>
                  }
                >
                  {(data?.topProducts?.length ?? 0) === 0 ? (
                    <EmptyState label="No product sales in this period" />
                  ) : (
                    <div className="space-y-2.5">
                      {(data?.topProducts ?? []).slice(0, 8).map((product, idx) => (
                        <button
                          key={product.id || idx}
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-white hover:border-[#014582]/30 border border-transparent transition-all text-left"
                        >
                          <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {product.sku ? `${product.sku} · ` : ''}
                              {product.quantitySold} sold
                              {product.orderCount ? ` · ${product.orderCount} lines` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-gray-800">
                              {formatCurrency(product.revenue)}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#014582]">
                              <Eye className="w-3 h-3" /> Detail
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </TradeCard>
              </div>

              <div>
                <TradeCard
                  title="Top Customers"
                  subtitle={`By spend · ${periodLabel}`}
                  action={
                    <button
                      type="button"
                      onClick={() => router.push('/sales/customers')}
                      className="text-xs font-semibold text-[#014582] hover:underline"
                    >
                      View all
                    </button>
                  }
                >
                  {(data?.topCustomers?.length ?? 0) === 0 ? (
                    <EmptyState label="No customer sales in this period" />
                  ) : (
                    <div className="space-y-2.5">
                      {(data?.topCustomers ?? []).slice(0, 5).map((customer, idx) => (
                        <button
                          key={customer.id || idx}
                          type="button"
                          onClick={() =>
                            customer.id && router.push(`/sales/customers/${customer.id}`)
                          }
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-white hover:border-emerald-200 border border-transparent transition-all text-left"
                        >
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">
                            {(customer.name?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {customer.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {customer.orderCount} orders
                              {customer.phone ? ` · ${customer.phone}` : ''}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-gray-800 shrink-0">
                            {formatCurrency(customer.totalSpent)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </TradeCard>
              </div>
            </div>

            {/* Channel mix + activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TradeCard title="Revenue by Channel" subtitle={`Mix for ${periodLabel}`}>
                {channelPie.length === 0 ? (
                  <EmptyState label="No channel revenue" />
                ) : isPageVisible ? (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelPie}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          innerRadius={48}
                          paddingAngle={3}
                          label={({ name, percent }) =>
                            `${name} ${((percent || 0) * 100).toFixed(0)}%`
                          }
                        >
                          {channelPie.map((_, index) => (
                            <Cell
                              key={`ch-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={((value: number | string) =>
                            formatCurrency(Number(value))) as never}
                          contentStyle={{ borderRadius: '10px', fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}
              </TradeCard>

              <TradeCard title="Recent Activity" subtitle="Latest POS and sales events">
                {(data?.recentActivity?.length ?? 0) === 0 ? (
                  <EmptyState label="No recent activity" />
                ) : (
                  <div className="space-y-2.5">
                    {(data?.recentActivity ?? []).slice(0, 6).map((activity, idx) => {
                      const meta = activityMeta(activity.type);
                      const Icon = meta.icon;
                      return (
                        <div
                          key={activity.id || idx}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.bg}`}
                          >
                            <Icon className={`w-5 h-5 ${meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-400">
                              {activity.timestamp || activity.date || ''}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-gray-800 shrink-0">
                            {formatCurrency(activity.amount)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TradeCard>
            </div>

            <TradeCard title="Quick Actions" subtitle="Jump into common sales tasks">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickAction
                  label="New Order"
                  description="Create sales order"
                  icon={Plus}
                  color="bg-indigo-50 text-indigo-600"
                  onClick={() => router.push('/sales/orders')}
                />
                <QuickAction
                  label="New Invoice"
                  description="Issue invoice"
                  icon={Receipt}
                  color="bg-emerald-50 text-emerald-600"
                  onClick={() => router.push('/sales/invoices')}
                />
                <QuickAction
                  label="Customers"
                  description="View customers"
                  icon={Users}
                  color="bg-amber-50 text-amber-600"
                  onClick={() => router.push('/sales/customers')}
                />
                <QuickAction
                  label="Sales Reports"
                  description="Filter & download"
                  icon={FileText}
                  color="bg-sky-50 text-sky-600"
                  onClick={() => router.push('/sales/reports')}
                />
                {canSeeCredits && (
                  <QuickAction
                    label="Credits"
                    description="Credit notes"
                    icon={StickyNote}
                    color="bg-violet-50 text-violet-600"
                    onClick={() => router.push('/accounting/credit-notes')}
                  />
                )}
              </div>
            </TradeCard>
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          periodLabel={periodLabel}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </TradePage>
  );
}

function ProductDetailModal({
  product,
  periodLabel,
  onClose,
}: {
  product: TopProduct;
  periodLabel: string;
  onClose: () => void;
}) {
  const channels = [
    {
      label: 'Orders',
      qty: product.orderQty ?? 0,
      revenue: product.orderRevenue ?? 0,
      color: TRADE_COLORS.primary,
    },
    {
      label: 'POS',
      qty: product.posQty ?? 0,
      revenue: product.posRevenue ?? 0,
      color: TRADE_COLORS.warning,
    },
    {
      label: 'Invoices',
      qty: product.invoiceQty ?? 0,
      revenue: product.invoiceRevenue ?? 0,
      color: TRADE_COLORS.accent,
    },
  ].filter((c) => c.qty > 0 || c.revenue > 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-[#014582]/10">
              <Package className="w-5 h-5 text-[#014582]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate">{product.name}</h3>
              <p className="text-xs text-gray-500">
                {product.sku ? `SKU ${product.sku} · ` : ''}
                Sales detail · {periodLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-[10px] uppercase font-bold text-gray-400">Qty Sold</p>
              <p className="text-xl font-extrabold text-gray-900 mt-1">
                {product.quantitySold.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-[10px] uppercase font-bold text-gray-400">Revenue</p>
              <p className="text-xl font-extrabold text-[#014582] mt-1">
                {formatCurrency(product.revenue)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-[10px] uppercase font-bold text-gray-400">Avg Unit Price</p>
              <p className="text-lg font-bold text-gray-800 mt-1">
                {formatCurrency(product.avgUnitPrice ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-[10px] uppercase font-bold text-gray-400">Sale Lines</p>
              <p className="text-lg font-bold text-gray-800 mt-1">
                {(product.orderCount ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
              Channel breakdown
            </h4>
            {channels.length === 0 ? (
              <p className="text-sm text-gray-400">No channel split available</p>
            ) : (
              <div className="space-y-2">
                {channels.map((ch) => (
                  <div
                    key={ch.label}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: ch.color }}
                      />
                      <span className="text-sm font-semibold text-gray-800">{ch.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(ch.revenue)}
                      </p>
                      <p className="text-[11px] text-gray-400">{ch.qty} qty</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeBadge({ percent }: { percent: number }) {
  const up = percent >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
        up ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}
    >
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {percent >= 0 ? '+' : ''}
      {percent.toFixed(1)}%
    </span>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="py-10 text-center text-sm text-gray-400">{label}</div>;
}

function activityMeta(type: string) {
  switch ((type || '').toLowerCase()) {
    case 'pos':
      return { icon: Store, color: 'text-amber-600', bg: 'bg-amber-50' };
    case 'invoice':
      return { icon: Receipt, color: 'text-cyan-600', bg: 'bg-cyan-50' };
    case 'payment':
      return { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    case 'return':
      return { icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-50' };
    default:
      return { icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' };
  }
}

function QuickAction({
  label,
  description,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  description: string;
  icon: typeof ShoppingCart;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#014582]/30 hover:shadow-sm transition-all text-left"
    >
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </button>
  );
}

/** Next.js route shell — real UI mounts via SalesViewHost. */
export default function SalesRoutePlaceholder() {
  return null;
}
