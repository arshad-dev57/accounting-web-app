'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Ban,
  BarChart3,
  CalendarClock,
  Gauge,
  Loader2,
  MapPin,
  Package,
  Percent,
  RefreshCw,
  Warehouse,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLocation } from '@/lib/location-context';
import { loadCurrencyLocal } from '@/lib/currency-service';
import { browserCompanyAuthHeaders } from '../../../lib/company-api-headers';

type WarehouseRow = {
  locationId: string;
  name: string;
  code: string;
  productCount: number;
  stockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  quantityOnHand: number;
};

type Metrics = {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  expiringCount: number;
  inStockCount: number;
  todayStockIn: number;
  todayStockOut: number;
  periodStockIn: number;
  periodStockOut: number;
  pendingOrders: number;
  todayRevenue: number;
  inventoryHealthScore: number;
  stockAvailabilityRate: number;
  warehouseBreakdown: WarehouseRow[];
};

type MovementPoint = {
  label: string;
  stockIn: number;
  stockOut: number;
  date: string;
};

type CategoryItem = {
  categoryName: string;
  productCount: number;
  percentage: number;
  color: string;
};

type ActivityItem = {
  id: string;
  user: string;
  action: string;
  details: string;
  createdAt: string;
};

type DashboardData = {
  metrics: Metrics;
  stockMovement: MovementPoint[];
  categories: CategoryItem[];
  topProducts: Array<{ label: string; value: number; color: string }>;
  orderStatus: Record<string, number>;
  activities: ActivityItem[];
};

const TIME_PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
] as const;

const ACCENT = '#1088dd';
const PIE_COLORS = ['#1088dd', '#7c3aed', '#f59e0b', '#22a869', '#ef4444', '#0891b2', '#ec4899'];

function emptyMetrics(): Metrics {
  return {
    totalProducts: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    overstockCount: 0,
    expiringCount: 0,
    inStockCount: 0,
    todayStockIn: 0,
    todayStockOut: 0,
    periodStockIn: 0,
    periodStockOut: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    inventoryHealthScore: 100,
    stockAvailabilityRate: 100,
    warehouseBreakdown: [],
  };
}

function formatCurrency(amount: number) {
  const { code, symbol } = loadCurrencyLocal();
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code || 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${symbol || 'Rs'} ${(amount || 0).toLocaleString()}`;
  }
}

function formatAxis(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(Math.round(value));
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function authHeaders(): HeadersInit {
  return browserCompanyAuthHeaders();
}

function healthTone(score: number) {
  if (score >= 85) return { label: 'Excellent', className: 'bg-emerald-100 text-emerald-700' };
  if (score >= 70) return { label: 'Good', className: 'bg-sky-100 text-sky-700' };
  if (score >= 50) return { label: 'Fair', className: 'bg-amber-100 text-amber-700' };
  return { label: 'At risk', className: 'bg-red-100 text-red-700' };
}

export default function WarehouseDashboardPage() {
  const router = useRouter();
  const {
    selectedLocationId,
    selectedLocation,
    locationIdForApi,
    isAllLocations,
    loading: locationLoading,
  } = useLocation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState('This Month');
  const [periodValue, setPeriodValue] = useState('month');
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (
    value = periodValue,
    label = period,
    options?: { refresh?: boolean }
  ) => {
    if (locationLoading || !selectedLocationId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      if (options?.refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const qs = new URLSearchParams({ period: value });
      if (locationIdForApi) qs.set('locationId', locationIdForApi);
      const response = await fetch(`/api/warehouse/dashboard?${qs.toString()}`, {
        headers: authHeaders(),
      });
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to load dashboard');
        if (result.data) setData(result.data);
      }
    } catch (e) {
      console.error('Failed to load Inventory dashboard:', e);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(periodValue, period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId, locationIdForApi, locationLoading]);

  const selectPeriod = (label: string, value: string) => {
    if (loading || refreshing) return;
    setPeriod(label);
    setPeriodValue(value);
    fetchDashboard(value, label);
  };

  const m = data?.metrics || emptyMetrics();
  const inStock = m.inStockCount || Math.max(0, m.totalProducts - m.outOfStockCount);
  const todayMoves = m.todayStockIn + m.todayStockOut;
  const periodMoves = m.periodStockIn + m.periodStockOut;
  const healthAlerts =
    m.lowStockCount + m.outOfStockCount + m.expiringCount + m.overstockCount;
  const health = healthTone(m.inventoryHealthScore || 100);
  const scopeLabel = isAllLocations
    ? 'All warehouses'
    : selectedLocation?.name || 'Selected warehouse';

  const movementChart = useMemo(() => {
    const rows = data?.stockMovement ?? [];
    if (rows.length === 0) {
      return Array.from({ length: 7 }).map((_, i) => ({
        label: `D${i + 1}`,
        stockIn: 0,
        stockOut: 0,
      }));
    }
    return rows.map((r) => ({
      label: r.label || '',
      stockIn: r.stockIn || 0,
      stockOut: r.stockOut || 0,
    }));
  }, [data?.stockMovement]);

  const categories = useMemo(() => {
    return (data?.categories ?? [])
      .map((c) => ({
        name: c.categoryName || 'Other',
        amount: c.productCount || 0,
        color: c.color,
      }))
      .filter((c) => c.amount > 0)
      .slice(0, 7);
  }, [data?.categories]);

  const categoryTotal = categories.reduce((s, c) => s + c.amount, 0);
  const topProducts = (data?.topProducts ?? []).slice(0, 8);
  const warehouseRows = m.warehouseBreakdown || [];
  const warehouseMax = Math.max(1, ...warehouseRows.map((w) => w.stockValue));

  const overviewRows = [
    {
      label: 'SKU Count',
      value: m.totalProducts,
      color: ACCENT,
      source: 'Active inventory items (SKUs)',
      display: String(m.totalProducts),
    },
    {
      label: 'In Stock',
      value: inStock,
      color: '#22c55e',
      source: 'Items with available quantity',
      display: String(inStock),
    },
    {
      label: 'Low Stock',
      value: m.lowStockCount,
      color: '#f59e0b',
      source: 'At or below reorder point',
      display: String(m.lowStockCount),
    },
    {
      label: 'Out of Stock',
      value: m.outOfStockCount,
      color: '#ef4444',
      source: 'Zero on-hand quantity',
      display: String(m.outOfStockCount),
    },
    {
      label: 'Overstock',
      value: m.overstockCount,
      color: '#7c3aed',
      source: 'Above max stock threshold',
      display: String(m.overstockCount),
    },
    {
      label: 'Expiring Soon',
      value: m.expiringCount,
      color: '#ef4444',
      source: 'Expiry within 30 days',
      display: String(m.expiringCount),
    },
    {
      label: 'Inventory Value',
      value: m.totalStockValue,
      color: '#22c55e',
      source: 'On-hand qty × unit cost',
      display: formatCurrency(m.totalStockValue),
    },
    {
      label: 'Period Movements',
      value: periodMoves,
      color: '#0891b2',
      source: `In ${m.periodStockIn} · Out ${m.periodStockOut}`,
      display: String(periodMoves),
    },
  ];
  const overviewMax = Math.max(1, ...overviewRows.map((r) => r.value));

  const kpis = [
    {
      label: 'Inventory Value',
      value: formatCurrency(m.totalStockValue),
      icon: Wallet,
      color: 'bg-emerald-50 text-emerald-600',
      trend: scopeLabel,
      trendUp: true,
    },
    {
      label: 'SKU Count',
      value: String(m.totalProducts),
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      trend: `${inStock} available`,
      trendUp: true,
    },
    {
      label: 'Availability Rate',
      value: `${m.stockAvailabilityRate ?? 0}%`,
      icon: Percent,
      color: 'bg-sky-50 text-sky-600',
      trend: m.outOfStockCount > 0 ? `${m.outOfStockCount} OOS` : 'Fully available',
      trendUp: (m.stockAvailabilityRate ?? 0) >= 90,
    },
    {
      label: 'Inventory Health',
      value: String(m.inventoryHealthScore ?? 100),
      icon: Gauge,
      color: 'bg-violet-50 text-violet-600',
      trend: health.label,
      trendUp: (m.inventoryHealthScore ?? 100) >= 70,
    },
    {
      label: 'Low Stock Alerts',
      value: String(m.lowStockCount),
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600',
      trend: m.lowStockCount > 0 ? 'Action needed' : 'Clear',
      trendUp: m.lowStockCount === 0,
    },
    {
      label: `Movements · ${period}`,
      value: String(periodMoves),
      icon: ArrowLeftRight,
      color: 'bg-cyan-50 text-cyan-600',
      trend: `In ${m.periodStockIn} · Out ${m.periodStockOut}`,
      trendUp: true,
    },
  ];

  const isBusy = loading || refreshing;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50 border border-sky-100 text-sm text-sky-800">
        {isAllLocations ? (
          <Warehouse className="w-4 h-4 flex-shrink-0" />
        ) : (
          <MapPin className="w-4 h-4 flex-shrink-0" />
        )}
        <span>
          Dashboard for <strong>{scopeLabel}</strong>
          {selectedLocation ? (
            <span className="text-sky-600 font-mono text-xs ml-1">({selectedLocation.code})</span>
          ) : isAllLocations ? (
            <span className="text-sky-600 text-xs ml-1">· company-wide totals</span>
          ) : null}
        </span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            On-hand value, availability, movements and warehouse health · {period.toLowerCase()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TIME_PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => selectPeriod(p.label, p.value)}
              disabled={isBusy}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                period === p.label
                  ? 'bg-[#1088dd] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => fetchDashboard(periodValue, period, { refresh: true })}
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
          <Loader2 className="w-8 h-8 animate-spin text-[#1088dd] mb-3" />
          <p className="text-sm font-medium text-gray-700">Loading {period.toLowerCase()} data...</p>
          <p className="text-xs text-gray-400 mt-1">Please wait while we update the dashboard</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">{error}</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Inventory Value · {scopeLabel}
                </p>
                <p className="text-3xl font-bold mt-1 text-gray-900">
                  {formatCurrency(m.totalStockValue)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {m.totalProducts} SKUs · {m.stockAvailabilityRate}% availability · {healthAlerts}{' '}
                  alerts
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-gray-400">Health Score</p>
                  <p className="text-lg font-bold text-violet-600">{m.inventoryHealthScore}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Stock In ({period})</p>
                  <p className="text-lg font-bold text-emerald-600">{m.periodStockIn}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Stock Out ({period})</p>
                  <p className="text-lg font-bold text-red-600">{m.periodStockOut}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Today&apos;s Moves</p>
                  <p className="text-lg font-bold text-cyan-600">{todayMoves}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {kpis.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        item.trendUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {item.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mt-3">{item.value}</p>
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                </div>
              );
            })}
          </div>

          {isAllLocations && warehouseRows.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-800">Warehouse Breakdown</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Inventory value and SKU coverage by warehouse
                  </p>
                </div>
                <BarChart3 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                {warehouseRows.map((wh) => (
                  <div key={wh.locationId} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {wh.name}{' '}
                          <span className="font-mono text-xs text-gray-400">({wh.code})</span>
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {wh.productCount} SKUs · Qty {Math.round(wh.quantityOnHand).toLocaleString()}{' '}
                          · Low {wh.lowStockCount} · OOS {wh.outOfStockCount}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-800 shrink-0">
                        {formatCurrency(wh.stockValue)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1088dd]"
                        style={{
                          width: `${Math.min(100, (wh.stockValue / warehouseMax) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-800">Stock Movement Trend</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Receipts vs issues over {period.toLowerCase()}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Stock In
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    Stock Out
                  </span>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={movementChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stockInFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="stockOutFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                        Number(value).toLocaleString(),
                        name === 'stockIn' ? 'Stock In' : 'Stock Out',
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="stockIn"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      fill="url(#stockInFill)"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="stockOut"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      fill="url(#stockOutFill)"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="mb-4">
                <h2 className="font-bold text-gray-800">Products by Category</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {categories.length === 0
                    ? `No data · ${period}`
                    : `${categories.length} categories · ${period}`}
                </p>
              </div>
              <div className="h-[280px]">
                {categories.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">
                    No category data
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categories}
                            dataKey="amount"
                            nameKey="name"
                            innerRadius={48}
                            outerRadius={70}
                            paddingAngle={2}
                          >
                            {categories.map((c, i) => (
                              <Cell
                                key={c.name}
                                fill={c.color || PIE_COLORS[i % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number | string) => [
                              `${Number(value)} products`,
                              'Count',
                            ]}
                            contentStyle={{
                              borderRadius: 12,
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-2 overflow-auto">
                      {categories.slice(0, 5).map((cat, i) => (
                        <div key={cat.name} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: cat.color || PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                          <span className="flex-1 truncate text-gray-600">{cat.name}</span>
                          <span className="font-semibold text-gray-800">
                            {categoryTotal > 0
                              ? `${Math.round((cat.amount / categoryTotal) * 100)}%`
                              : '0%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-800">Top SKUs by Stock</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Highest on-hand quantity / value movers</p>
                </div>
                <Activity className="w-4 h-4 text-gray-400" />
              </div>
              {topProducts.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No top product data</div>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProducts}
                      layout="vertical"
                      margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={110}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <Tooltip
                        formatter={(value: number | string) => [Number(value).toLocaleString(), 'Qty']}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {topProducts.map((p, i) => (
                          <Cell key={p.label} fill={p.color || PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Stock Overview</h2>
                <span className="text-xs text-gray-400">{period}</span>
              </div>
              <div className="space-y-3">
                {overviewRows.map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm text-gray-700 font-medium">{row.label}</p>
                        <p className="text-[11px] text-gray-400">{row.source}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{row.display}</span>
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
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Stock Health</h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${health.className}`}>
                  {health.label} · {m.inventoryHealthScore}
                </span>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: 'Low Stock',
                    count: m.lowStockCount,
                    icon: AlertTriangle,
                    color: 'bg-amber-50 text-amber-600',
                    href: '/warehouse/reports/low-stock',
                  },
                  {
                    label: 'Out of Stock',
                    count: m.outOfStockCount,
                    icon: Ban,
                    color: 'bg-red-50 text-red-600',
                    href: '/warehouse/reports/low-stock',
                  },
                  {
                    label: 'Expiring Soon',
                    count: m.expiringCount,
                    icon: CalendarClock,
                    color: 'bg-red-50 text-red-600',
                    href: '/warehouse/reports/expiry',
                  },
                  {
                    label: 'Overstock',
                    count: m.overstockCount,
                    icon: Package,
                    color: 'bg-violet-50 text-violet-600',
                    href: '/warehouse/reports/stock-summary',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => router.push(item.href)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{item.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Recent Activity</h2>
                <button
                  onClick={() => router.push('/warehouse/stock-movement')}
                  className="text-sm text-[#1088dd] font-semibold hover:underline"
                >
                  View All →
                </button>
              </div>
              {(data?.activities?.length ?? 0) === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No recent activity</div>
              ) : (
                <div className="space-y-3">
                  {(data?.activities ?? []).slice(0, 8).map((activity, idx) => {
                    const isIn = (activity.action || '').toLowerCase().includes('in');
                    return (
                      <div
                        key={activity.id || `${activity.action}-${idx}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`p-2.5 rounded-xl ${
                            isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {isIn ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {activity.action || 'Movement'}
                            </p>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isIn
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-red-50 text-red-600'
                              }`}
                            >
                              {isIn ? 'In' : 'Out'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {activity.details || activity.user || 'Warehouse event'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export { WarehouseDashboardPage };
