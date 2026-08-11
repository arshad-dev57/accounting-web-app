'use client';

import { useEffect, useMemo, useState } from 'react';
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
  TrendingUp,
  RotateCcw,
  Plus,
  Loader2,
  Store,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { usePermissions } from '../../../lib/usePermissions';

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
  topProducts: Array<{
    id: string;
    name: string;
    sku: string;
    quantitySold: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    orderCount: number;
    totalSpent: number;
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

const STATUS_COLORS = ['#014582', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#06b6d4'];

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

function isTrendUp(trend: string) {
  return (trend || '').startsWith('+') || trend === 'Clear';
}

function toNum(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function SalesDashboardPage() {
  const router = useRouter();
  const { isAdmin, hasSubPageAccess } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [periodLabel, setPeriodLabel] = useState('This Month');
  const [period, setPeriod] = useState('month');

  const canSeeCredits = isAdmin || hasSubPageAccess('sales', 'credits');

  const fetchDashboard = async (p = period, options?: { refresh?: boolean }) => {
    try {
      if (options?.refresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`/api/sales/dashboard?period=${p}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (e) {
      console.error('Failed to load sales dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectPeriod = (label: string, value: string) => {
    if (loading || refreshing) return;
    setPeriodLabel(label);
    setPeriod(value);
    fetchDashboard(value);
  };

  const orders = data?.orders;
  const pos = data?.pos;
  const invoices = data?.invoices;
  const invoiceTotal = invoices?.stats?.grandTotal ?? invoices?.stats?.revenue ?? 0;
  const collected = invoices?.stats?.paidAmount ?? 0;
  const outstanding = invoices?.stats?.outstanding ?? 0;
  const creditAmount = data?.credits?.creditAmount ?? 0;
  const creditRemaining = data?.credits?.remainingAmount ?? 0;
  const creditCount = data?.credits?.total ?? 0;
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

    return sorted.map((d) => {
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

  const statusData = useMemo(
    () =>
      (orders?.byStatus ?? [])
        .filter((s) => s.count > 0)
        .map((s) => ({
          status: s.status,
          count: s.count,
          revenue: s.revenue,
        })),
    [orders?.byStatus]
  );

  const overviewRows = [
    { label: 'POS Revenue', value: posRevenue, color: '#f59e0b' },
    { label: 'Order Revenue', value: orders?.revenue ?? 0, color: '#014582' },
    { label: 'Combined Sales', value: combinedRevenue, color: '#1088dd' },
    { label: 'Invoice Total', value: invoiceTotal, color: '#22c55e' },
    { label: 'Collected', value: collected, color: '#06b6d4' },
    { label: 'Outstanding', value: outstanding, color: '#f59e0b' },
    { label: 'Sales Credits', value: creditAmount, color: '#8b5cf6' },
    { label: 'POS Today', value: pos?.todayRevenue ?? 0, color: '#ea580c' },
  ];
  const overviewMax = Math.max(1, ...overviewRows.map((r) => r.value));

  const kpis = [
    {
      label: 'POS Revenue',
      value: formatCurrency(posRevenue),
      sub: `${posCount} POS sales · ${periodLabel}`,
      icon: Store,
      color: 'bg-amber-50 text-amber-600',
      trend: `${pos?.todayCount ?? 0} today`,
      trendUp: (pos?.todayCount ?? 0) >= 0,
    },
    {
      label: 'Order Revenue',
      value: formatCurrency(orders?.revenue ?? 0),
      sub: `${orders?.count ?? 0} orders · ${periodLabel}`,
      icon: ShoppingCart,
      color: 'bg-indigo-50 text-indigo-600',
      trend: orders?.revenueGrowth ?? '0%',
      trendUp: isTrendUp(orders?.revenueGrowth ?? ''),
    },
    {
      label: 'Invoice Total',
      value: formatCurrency(invoiceTotal),
      sub: `${invoices?.stats?.total ?? 0} invoices`,
      icon: Receipt,
      color: 'bg-emerald-50 text-emerald-600',
      trend: invoices?.grandTotalGrowth ?? '0%',
      trendUp: isTrendUp(invoices?.grandTotalGrowth ?? ''),
    },
    {
      label: 'Collected',
      value: formatCurrency(collected),
      sub: `POS today ${formatCurrency(pos?.todayRevenue ?? 0)}`,
      icon: DollarSign,
      color: 'bg-cyan-50 text-cyan-600',
      trend: invoices?.paidAmountGrowth ?? '0%',
      trendUp: isTrendUp(invoices?.paidAmountGrowth ?? ''),
    },
  ];

  const comparisons = [
    { title: 'Today vs Yesterday', data: data?.comparison?.today },
    { title: 'This Week vs Last Week', data: data?.comparison?.week },
    { title: 'This Month vs Last Month', data: data?.comparison?.month },
    { title: 'This Year vs Last Year', data: data?.comparison?.year },
  ];

  const isBusy = loading || refreshing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            POS, orders, invoices and collections for {periodLabel.toLowerCase()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TIME_PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => selectPeriod(p.label, p.value)}
              disabled={isBusy}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                periodLabel === p.label
                  ? 'bg-[#014582] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => fetchDashboard(period, { refresh: true })}
            disabled={isBusy}
            className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${isBusy ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[420px] bg-white rounded-xl border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582] mb-3" />
          <p className="text-sm font-medium text-gray-700">Loading {periodLabel.toLowerCase()} data...</p>
          <p className="text-xs text-gray-400 mt-1">Please wait while we update the dashboard</p>
        </div>
      ) : (
      <>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    kpi.trendUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {kpi.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {kpi.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-3">{kpi.value}</p>
              <p className="text-sm font-medium text-gray-700">{kpi.label}</p>
              <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Credits banner */}
      {canSeeCredits && (
        <button
          onClick={() => router.push('/accounting/credit-notes')}
          className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 text-left hover:shadow-md transition-all"
        >
          <div className="p-3 rounded-xl bg-violet-50 text-violet-600">
            <StickyNote className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800">Sales Credits</p>
            <p className="text-sm text-gray-500">
              {creditCount === 0
                ? 'Credit notes posting to AR & GL'
                : `${creditCount} notes · ${formatCurrency(creditAmount)} issued`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-violet-600">{formatCurrency(creditRemaining)}</p>
            <p className="text-xs text-gray-400">Unapplied</p>
          </div>
        </button>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-800">Revenue Trend</h2>
              <p className="text-xs text-gray-400 mt-0.5">POS vs invoices vs orders over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                POS
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                Invoices
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#014582]" />
                Orders
              </span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="posFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="invFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ordFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#014582" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#014582" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={formatAxis}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(value: number | string, name: string) => [
                    formatCurrency(Number(value)),
                    name === 'pos' ? 'POS' : name === 'invoices' ? 'Invoices' : 'Orders',
                  ]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pos"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="url(#posFill)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="invoices"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#invFill)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#014582"
                  strokeWidth={2.5}
                  fill="url(#ordFill)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-800">Orders by Status</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {statusData.reduce((s, e) => s + e.count, 0)} total orders
              </p>
            </div>
          </div>
          <div className="h-[280px]">
            {statusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No orders for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 8, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    formatter={(value: number | string, name: string) => [
                      name === 'count' ? value : formatCurrency(Number(value)),
                      name === 'count' ? 'Orders' : 'Revenue',
                    ]}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={42}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Overview + comparisons */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Sales Overview</h2>
            <span className="text-xs text-gray-400">{periodLabel}</span>
          </div>
          <div className="space-y-4">
            {overviewRows.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600">{row.label}</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatCurrency(row.value)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (row.value / overviewMax) * 100)}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {comparisons.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {card.title}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sales</p>
                  <p className="text-lg font-bold text-gray-800">
                    {formatCurrency(card.data?.currentSales ?? 0)}
                  </p>
                  <ChangeBadge percent={card.data?.salesChangePercent ?? 0} />
                </div>
                <div className="border-l border-gray-100 pl-4">
                  <p className="text-xs text-gray-500 mb-1">Returns</p>
                  <p className="text-lg font-bold text-gray-800">
                    {formatCurrency(card.data?.currentReturns ?? 0)}
                  </p>
                  <ChangeBadge percent={card.data?.returnsChangePercent ?? 0} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top products & customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Top Products</h2>
            <span className="text-xs text-gray-400">{data?.topProducts?.length ?? 0} items</span>
          </div>
          {(data?.topProducts?.length ?? 0) === 0 ? (
            <EmptyState label="No product sales in this period" />
          ) : (
            <div className="space-y-3">
              {(data?.topProducts ?? []).slice(0, 5).map((product, idx) => (
                <div
                  key={product.id || idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.quantitySold} sold</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Top Customers</h2>
            <span className="text-xs text-gray-400">{data?.topCustomers?.length ?? 0} total</span>
          </div>
          {(data?.topCustomers?.length ?? 0) === 0 ? (
            <EmptyState label="No customers in this period" />
          ) : (
            <div className="space-y-3">
              {(data?.topCustomers ?? []).slice(0, 5).map((customer, idx) => (
                <div
                  key={customer.id || idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">
                    {(customer.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{customer.name}</p>
                    <p className="text-xs text-gray-400">{customer.orderCount} orders</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(data?.recentActivity?.length ?? 0) > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#014582]" />
                Recent Activity
              </h2>
            </div>
            <div className="space-y-3">
              {(data?.recentActivity ?? []).slice(0, 5).map((activity, idx) => {
                const meta = activityMeta(activity.type);
                const Icon = meta.icon;
                return (
                  <div
                    key={activity.id || idx}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.bg}`}>
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
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">
                        {formatCurrency(activity.amount)}
                      </p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                        {activity.type
                          ? activity.type[0].toUpperCase() + activity.type.slice(1)
                          : 'Order'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(data?.revenueBreakdown?.items?.length ?? 0) > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-4">Revenue Breakdown</h2>
            <div className="space-y-4">
              {(data?.revenueBreakdown?.items ?? []).map((item, idx) => {
                const color = STATUS_COLORS[idx % STATUS_COLORS.length];
                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-600">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {formatCurrency(item.amount)}
                        </span>
                        <span className="text-xs font-bold" style={{ color }}>
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
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
            onClick={() => router.push('/warehouse/customers')}
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
      </div>
      </>
      )}
    </div>
  );
}

function ChangeBadge({ percent }: { percent: number }) {
  const up = percent >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
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
  return (
    <div className="py-10 text-center text-sm text-gray-400">{label}</div>
  );
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
