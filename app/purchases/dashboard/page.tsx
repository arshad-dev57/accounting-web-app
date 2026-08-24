'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Receipt,
  DollarSign,
  Clock,
  RefreshCw,
  PackageCheck,
  RotateCcw,
  Plus,
  Loader2,
  ThumbsUp,
  Package,
  XCircle,
  CheckCircle2,
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
import { useFiscalYear } from '../../../lib/fiscal-year-context';
import { getStoredFiscalYearId } from '../../../lib/fiscal-year-service';
import { useLocation } from '@/lib/location-context';

type SpendPoint = {
  date: string;
  label: string;
  invoiceAmount: number;
  paidAmount: number;
  orderValue: number;
};

type OrderStatus = {
  status: string;
  count: number;
  value: number;
  color: string;
};

type DashboardData = {
  orders: {
    total: number;
    approved: number;
    approvedValue: number;
    draft: number;
    sent: number;
    received: number;
    cancelled: number;
  };
  invoices: {
    total: number;
    paid: number;
    paidAmount: number;
    outstanding: number;
    totalSpend: number;
    grossSpend: number;
  };
  returns: { total: number; amount: number };
  payments: { totalPaid: number };
  spendTrend: SpendPoint[];
  orderStatuses: OrderStatus[];
  topSuppliers: Array<{
    supplierName: string;
    totalOrders: number;
    totalValue: number;
    color: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    action: string;
    details: string;
    amount: number;
    createdAt: string;
  }>;
};

const TIME_PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'Last Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
] as const;

const ACCENT = '#00E676';
const STATUS_COLORS = ['#00E676', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

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

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 7) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h ago`;
  const mins = Math.floor(diff / (1000 * 60));
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

export default function PurchasesDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [periodLabel, setPeriodLabel] = useState('This Year');
  const [period, setPeriod] = useState('year');
  const { selectedFiscalYearId, selectedFiscalYear } = useFiscalYear();
  const { selectedLocationId } = useLocation();

  const fetchDashboard = async (p = period, options?: { refresh?: boolean }) => {
    try {
      if (options?.refresh) setRefreshing(true);
      else setLoading(true);

      const fyId = selectedFiscalYearId || getStoredFiscalYearId() || '';
      const qs = new URLSearchParams({ period: p });
      if (fyId) qs.set('fiscalYearId', fyId);
      if (selectedLocationId) qs.set('locationId', selectedLocationId);

      const response = await fetch(`/api/purchases/dashboard?${qs.toString()}`);
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        console.error('Purchases dashboard error:', result.message || response.status);
        setData(result.data || null);
      }
    } catch (e) {
      console.error('Failed to load purchases dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiscalYearId, selectedLocationId]);

  const selectPeriod = (label: string, value: string) => {
    if (loading || refreshing) return;
    setPeriodLabel(label);
    setPeriod(value);
    fetchDashboard(value);
  };

  const orders = data?.orders;
  const invoices = data?.invoices;
  const totalSpend = invoices?.totalSpend ?? 0;
  const paidAmount = invoices?.paidAmount ?? 0;
  const outstanding = invoices?.outstanding ?? 0;
  const returnsTotal = data?.returns?.total ?? 0;

  const trendData = useMemo(() => {
    const trend = data?.spendTrend ?? [];
    if (trend.length === 0) {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => ({
        label,
        invoiced: 0,
        ordered: 0,
        paid: 0,
      }));
    }
    return trend.map((p) => ({
      label: p.label || p.date,
      date: p.date,
      invoiced: p.invoiceAmount ?? 0,
      ordered: p.orderValue,
      paid: p.paidAmount,
    }));
  }, [data?.spendTrend]);

  const statusData = useMemo(
    () =>
      (data?.orderStatuses ?? []).map((s) => ({
        ...s,
        statusLabel: s.status.charAt(0).toUpperCase() + s.status.slice(1),
      })),
    [data?.orderStatuses]
  );

  const overviewRows = [
    { label: 'Total Spend', value: totalSpend, color: ACCENT, isCurrency: true },
    { label: 'Amount Paid', value: paidAmount, color: '#22c55e', isCurrency: true },
    { label: 'Outstanding', value: outstanding, color: '#f59e0b', isCurrency: true },
    { label: 'Total Orders', value: orders?.total ?? 0, color: '#8b5cf6', isCurrency: false },
    { label: 'Approved', value: orders?.approved ?? 0, color: '#06b6d4', isCurrency: false },
    { label: 'Returns', value: returnsTotal, color: '#ef4444', isCurrency: false },
  ];
  const overviewMax = Math.max(1, ...overviewRows.map((r) => r.value));

  const healthItems = [
    { label: 'Approved Orders', count: orders?.approved ?? 0, color: '#22c55e', bg: 'bg-emerald-50 text-emerald-600', icon: ThumbsUp },
    { label: 'Received Orders', count: orders?.received ?? 0, color: '#06b6d4', bg: 'bg-cyan-50 text-cyan-600', icon: Package },
    { label: 'Returns', count: returnsTotal, color: '#f59e0b', bg: 'bg-amber-50 text-amber-600', icon: RotateCcw },
    { label: 'Cancelled', count: orders?.cancelled ?? 0, color: '#ef4444', bg: 'bg-red-50 text-red-600', icon: XCircle },
  ];
  const healthTotal = healthItems.reduce((s, i) => s + i.count, 0);

  const kpis = [
    {
      label: 'Total Spend',
      value: formatCurrency(totalSpend),
      sub: `${orders?.total ?? 0} purchase orders`,
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
      badge: `${orders?.total ?? 0} orders`,
      badgeUp: true,
    },
    {
      label: 'Amount Paid',
      value: formatCurrency(paidAmount),
      sub: `${invoices?.paid ?? 0} settled invoices`,
      icon: CheckCircle2,
      color: 'bg-green-50 text-green-600',
      badge: 'Settled',
      badgeUp: true,
    },
    {
      label: 'Outstanding',
      value: formatCurrency(outstanding),
      sub: `${invoices?.total ?? 0} invoices total`,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      badge: outstanding > 0 ? 'Pending' : 'Clear',
      badgeUp: outstanding <= 0,
    },
    {
      label: 'Returns',
      value: String(returnsTotal),
      sub: formatCurrency(data?.returns?.amount ?? 0),
      icon: RotateCcw,
      color: 'bg-red-50 text-red-600',
      badge: returnsTotal > 0 ? 'Active' : 'None',
      badgeUp: returnsTotal === 0,
    },
  ];

  const isBusy = loading || refreshing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchases Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Orders, spend, payables and supplier activity for {periodLabel.toLowerCase()}
            {selectedFiscalYear?.name ? ` · ${selectedFiscalYear.name}` : ''}
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
                  ? 'bg-[#00E676] text-white shadow-sm'
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
          <Loader2 className="w-8 h-8 animate-spin text-[#00E676] mb-3" />
          <p className="text-sm font-medium text-gray-700">
            Loading {periodLabel.toLowerCase()} data...
          </p>
          <p className="text-xs text-gray-400 mt-1">Please wait while we update the dashboard</p>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Total Spend · {periodLabel}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(totalSpend)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatCurrency(paidAmount)} paid · {formatCurrency(outstanding)} outstanding
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-400">Orders</p>
                  <p className="text-lg font-bold text-gray-800">{orders?.total ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Paid</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(paidAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Outstanding</p>
                  <p className="text-lg font-bold text-amber-600">{formatCurrency(outstanding)}</p>
                </div>
              </div>
            </div>
          </div>

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
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        kpi.badgeUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {kpi.badge}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mt-3">{kpi.value}</p>
                  <p className="text-sm font-medium text-gray-700">{kpi.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-800">Spend Trend</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Invoiced vs ordered value</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                    Invoiced
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00E676]" />
                    Ordered
                  </span>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="invSpendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ordSpendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E676" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
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
                        name === 'invoiced' ? 'Invoiced' : name === 'ordered' ? 'Ordered' : 'Paid',
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="invoiced"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fill="url(#invSpendFill)"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ordered"
                      stroke="#00E676"
                      strokeWidth={2.5}
                      fill="url(#ordSpendFill)"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="mb-4">
                <h2 className="font-bold text-gray-800">Orders by Status</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {statusData.reduce((s, e) => s + e.count, 0)} total orders
                </p>
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
                        dataKey="statusLabel"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-15}
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
                          name === 'count' ? 'Orders' : 'Value',
                        ]}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={42}>
                        {statusData.map((s, i) => (
                          <Cell key={i} fill={s.color || STATUS_COLORS[i % STATUS_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Overview + health */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Purchase Overview</h2>
                <span className="text-xs text-gray-400">{periodLabel}</span>
              </div>
              <div className="space-y-4">
                {overviewRows.map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-600">{row.label}</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {row.isCurrency ? formatCurrency(row.value) : row.value}
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Purchase Health</h2>
                {healthTotal > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                    {healthTotal} orders
                  </span>
                )}
              </div>

              {healthTotal > 0 && (
                <div className="h-2 rounded-full overflow-hidden flex mb-4 bg-gray-100">
                  {healthItems
                    .filter((i) => i.count > 0)
                    .map((item) => (
                      <div
                        key={item.label}
                        style={{
                          width: `${(item.count / healthTotal) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    ))}
                </div>
              )}

              <div className="space-y-2">
                {healthItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.count > 0;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50"
                    >
                      <div className={`p-2 rounded-lg ${active ? item.bg : 'bg-gray-100 text-gray-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`flex-1 text-sm ${active ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                        {item.label}
                      </span>
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          active ? item.bg : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Suppliers + activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Top Suppliers</h2>
                <span className="text-xs text-gray-400">
                  {data?.topSuppliers?.length ?? 0} total
                </span>
              </div>
              {(data?.topSuppliers?.length ?? 0) === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No suppliers in this period</div>
              ) : (
                <div className="space-y-3">
                  {(data?.topSuppliers ?? []).slice(0, 5).map((supplier, idx) => (
                    <div
                      key={`${supplier.supplierName}-${idx}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: supplier.color || ACCENT }}
                      >
                        {(supplier.supplierName?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {supplier.supplierName}
                        </p>
                        <p className="text-xs text-gray-400">{supplier.totalOrders} orders</p>
                      </div>
                      <p className="text-sm font-bold text-gray-800">
                        {formatCurrency(supplier.totalValue)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-800 mb-4">Recent Activity</h2>
              {(data?.activities?.length ?? 0) === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No recent activity</div>
              ) : (
                <div className="space-y-3">
                  {(data?.activities ?? []).slice(0, 5).map((activity, idx) => {
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
                          <p className="text-sm font-medium text-gray-800 truncate">{activity.action}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {activity.details || formatRelativeTime(activity.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          {activity.amount > 0 && (
                            <p className="text-sm font-bold text-gray-800">
                              {formatCurrency(activity.amount)}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {formatRelativeTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickAction
                label="New Order"
                description="Create purchase order"
                icon={Plus}
                color="bg-emerald-50 text-emerald-600"
                onClick={() => router.push('/purchases/purchaseorder')}
              />
              <QuickAction
                label="Receive"
                description="Goods receiving"
                icon={PackageCheck}
                color="bg-cyan-50 text-cyan-600"
                onClick={() => router.push('/purchases/goodsRecieving')}
              />
              <QuickAction
                label="Invoice"
                description="Purchase invoices"
                icon={Receipt}
                color="bg-violet-50 text-violet-600"
                onClick={() => router.push('/purchases/invoices')}
              />
              <QuickAction
                label="Reports"
                description="Filter & download"
                icon={FileText}
                color="bg-sky-50 text-sky-600"
                onClick={() => router.push('/purchases/reports')}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function activityMeta(type: string) {
  switch ((type || '').toLowerCase()) {
    case 'invoice':
      return { icon: Receipt, color: 'text-violet-600', bg: 'bg-violet-50' };
    case 'payment':
      return { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    case 'return':
      return { icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-50' };
    default:
      return { icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' };
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
      className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#00E676]/40 hover:shadow-sm transition-all text-left"
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
