'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFiscalYear } from '../../../lib/fiscal-year-context';
import FiscalYearSelect from '../../../components/FiscalYearSelect';
import { getStoredFiscalYearId } from '../../../lib/fiscal-year-service';
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  Clock,
  RefreshCw,
  Loader2,
  DollarSign,
  Receipt,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type KpiMetric = {
  amount?: number;
  formatted?: string;
  change?: number;
  isPositive?: boolean;
  count?: number;
  margin?: number;
  accountsCount?: number;
  cashOnly?: number;
  sources?: Record<string, number | string>;
};

type DashboardData = {
  kpi: {
    totalRevenue?: KpiMetric;
    totalSales?: KpiMetric;
    totalPurchases?: KpiMetric;
    totalExpenses?: KpiMetric;
    netProfit?: KpiMetric;
    grossProfit?: KpiMetric;
    outstanding?: KpiMetric;
    accountsReceivable?: KpiMetric;
    accountsPayable?: KpiMetric;
    cashBalance?: KpiMetric;
    bankBalance?: KpiMetric;
  };
  chartData?: Array<{
    month?: string;
    label?: string;
    revenue?: number;
    expenses?: number;
    sales?: number;
    purchases?: number;
    profit?: number;
  }>;
  expenseCategories?: Array<{
    name?: string;
    amount?: number;
    percentage?: number;
  }>;
  recentTransactions?: Array<{
    id?: string;
    title?: string;
    amount?: number;
    date?: string;
    type?: string;
    source?: string;
    reference?: string;
  }>;
  weeklyData?: { revenue?: number; expenses?: number; profit?: number };
  dailyData?: { revenue?: number; expenses?: number; profit?: number };
};

const TIME_PERIODS = [
  'Today',
  'Last Week',
  'This Month',
  'Last Month',
  'This Quarter',
  'This Year',
] as const;

const ACCENT = '#1088dd';
const PIE_COLORS = ['#1088dd', '#7c3aed', '#f59e0b', '#22a869', '#ef4444', '#0891b2', '#ec4899'];

function toNum(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

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

function formatTrend(change: number) {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AccountingDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<string>('This Year');
  const [error, setError] = useState<string | null>(null);
  const { selectedFiscalYearId, selectedFiscalYear } = useFiscalYear();

  const fetchDashboard = async (timePeriod = period, options?: { refresh?: boolean }) => {
    try {
      if (options?.refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const fyId = selectedFiscalYearId || getStoredFiscalYearId() || '';
      const qs = new URLSearchParams({
        timePeriod,
        limit: '10',
      });
      if (fyId) qs.set('fiscalYearId', fyId);

      const response = await fetch(`/api/dashboard/overview?${qs.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to load dashboard');
      }
    } catch (e) {
      console.error('Failed to load accounting dashboard:', e);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiscalYearId]);

  const selectPeriod = (label: string) => {
    if (loading || refreshing) return;
    setPeriod(label);
    fetchDashboard(label);
  };

  const kpi = data?.kpi || {};
  const revenue = toNum(kpi.totalRevenue?.amount);
  const expenses = toNum(kpi.totalExpenses?.amount);
  const sales = toNum(kpi.totalSales?.amount);
  const purchases = toNum(kpi.totalPurchases?.amount);
  const bankBalance = toNum(kpi.bankBalance?.amount ?? kpi.cashBalance?.amount);
  const receivables = toNum(kpi.accountsReceivable?.amount ?? kpi.outstanding?.amount);
  const payables = toNum(kpi.accountsPayable?.amount);
  const netProfit = toNum(kpi.netProfit?.amount);
  const profitMargin = toNum(kpi.netProfit?.margin);
  const bankAccountsCount = toNum(
    kpi.bankBalance?.accountsCount ?? kpi.cashBalance?.accountsCount
  );
  const receivableCount = toNum(
    kpi.accountsReceivable?.count ?? kpi.outstanding?.count
  );

  const chartData = useMemo(() => {
    const rows = data?.chartData ?? [];
    if (rows.length === 0) {
      return Array.from({ length: 6 }).map((_, i) => ({
        label: `M${i + 1}`,
        revenue: 0,
        expenses: 0,
      }));
    }
    return rows.map((r) => ({
      label: r.label || r.month || '',
      revenue: toNum(r.revenue),
      expenses: toNum(r.expenses),
      sales: toNum(r.sales),
      purchases: toNum(r.purchases),
      profit: toNum(r.profit),
    }));
  }, [data?.chartData]);

  const expenseCats = useMemo(() => {
    return (data?.expenseCategories ?? [])
      .map((c) => ({
        name: c.name || 'Other',
        amount: toNum(c.amount),
      }))
      .filter((c) => c.amount > 0)
      .slice(0, 7);
  }, [data?.expenseCategories]);

  const expenseTotal = expenseCats.reduce((s, c) => s + c.amount, 0);

  const overviewRows = [
    { label: 'Revenue', value: revenue, color: '#22c55e', source: 'Sales + Income − Credit Notes' },
    { label: 'Sales', value: sales, color: ACCENT, source: `${toNum(kpi.totalSales?.count)} invoice(s) · Paid` },
    { label: 'Purchases', value: purchases, color: '#f59e0b', source: 'Purchase invoices (period)' },
    { label: 'Expenses', value: expenses, color: '#ef4444', source: 'Posted expenses (period)' },
    { label: 'Bank Balance', value: bankBalance, color: '#3b82f6', source: 'Bank accounts' },
    { label: 'Receivables', value: receivables, color: '#f59e0b', source: 'Sales invoices outstanding' },
    { label: 'Payables', value: payables, color: '#f97316', source: 'Bills + purchase invoices' },
    { label: 'Net Profit', value: Math.abs(netProfit), color: netProfit >= 0 ? '#22c55e' : '#ef4444', source: 'Revenue − Expenses', display: formatCurrency(netProfit) },
  ];
  const overviewMax = Math.max(1, ...overviewRows.map((r) => r.value));

  const kpis = [
    {
      label: 'Revenue',
      value: formatCurrency(revenue),
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
      trend: formatTrend(toNum(kpi.totalRevenue?.change)),
      trendUp: !!kpi.totalRevenue?.isPositive,
    },
    {
      label: 'Expenses',
      value: formatCurrency(expenses),
      icon: TrendingDown,
      color: 'bg-red-50 text-red-600',
      trend: formatTrend(toNum(kpi.totalExpenses?.change)),
      trendUp: !!kpi.totalExpenses?.isPositive,
    },
    {
      label: 'Bank Balance',
      value: formatCurrency(bankBalance),
      icon: Landmark,
      color: 'bg-blue-50 text-blue-600',
      trend: bankAccountsCount > 0 ? `${bankAccountsCount} accounts` : 'No accounts',
      trendUp: kpi.bankBalance?.isPositive ?? kpi.cashBalance?.isPositive ?? bankBalance >= 0,
    },
    {
      label: 'Receivables',
      value: formatCurrency(receivables),
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      trend: receivableCount > 0 ? `${receivableCount} open` : 'Clear',
      trendUp: receivables <= 0,
    },
  ];

  const isBusy = loading || refreshing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounting Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Revenue, expenses, cash and receivables for {period.toLowerCase()}
            {selectedFiscalYear ? ` · ${selectedFiscalYear.name}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FiscalYearSelect compact showManageLink={false} />
          {TIME_PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => selectPeriod(p)}
              disabled={isBusy}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                period === p
                  ? 'bg-[#1088dd] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p}
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
          <Loader2 className="w-8 h-8 animate-spin text-[#1088dd] mb-3" />
          <p className="text-sm font-medium text-gray-700">Loading {period.toLowerCase()} data...</p>
          <p className="text-xs text-gray-400 mt-1">Please wait while we update the dashboard</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">{error}</div>
      ) : (
        <>
          {/* Net profit summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Net Profit · {period}
                </p>
                <p
                  className={`text-3xl font-bold mt-1 ${
                    netProfit >= 0 ? 'text-gray-900' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(netProfit)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Margin {profitMargin.toFixed(1)}% · Revenue {formatCurrency(revenue)} − Expenses{' '}
                  {formatCurrency(expenses)}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-400">Revenue</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(revenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Expenses</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(expenses)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Bank</p>
                  <p className="text-lg font-bold text-[#1088dd]">{formatCurrency(bankBalance)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                      {item.trend.includes('%') ? (
                        item.trendUp ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )
                      ) : null}
                      {item.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mt-3">{item.value}</p>
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-800">Revenue Trend</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Revenue vs expenses over time</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Revenue
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    Expenses
                  </span>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
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
                        formatCurrency(Number(value)),
                        name === 'revenue' ? 'Revenue' : 'Expenses',
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      fill="url(#revFill)"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      fill="url(#expFill)"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="mb-4">
                <h2 className="font-bold text-gray-800">Expenses by Category</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {expenseCats.length === 0
                    ? `No data · ${period}`
                    : `${expenseCats.length} types · ${period}`}
                </p>
              </div>
              <div className="h-[280px]">
                {expenseCats.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">
                    No expense categories
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseCats}
                            dataKey="amount"
                            nameKey="name"
                            innerRadius={48}
                            outerRadius={70}
                            paddingAngle={2}
                          >
                            {expenseCats.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number | string) => formatCurrency(Number(value))}
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
                      {expenseCats.slice(0, 5).map((cat, i) => (
                        <div key={cat.name} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="flex-1 truncate text-gray-600">{cat.name}</span>
                          <span className="font-semibold text-gray-800">
                            {expenseTotal > 0
                              ? `${Math.round((cat.amount / expenseTotal) * 100)}%`
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

          {/* Financial overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Financial Overview</h2>
              <span className="text-xs text-gray-400">{period}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {overviewRows.map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <p className="text-sm text-gray-700 font-medium">{row.label}</p>
                      <p className="text-[11px] text-gray-400">{row.source}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {row.display || formatCurrency(row.value)}
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

          {/* Recent activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Recent Activity</h2>
              <button
                onClick={() => router.push('/accounting/general-ledger')}
                className="text-sm text-[#1088dd] font-semibold hover:underline"
              >
                View All →
              </button>
            </div>
            {(data?.recentTransactions?.length ?? 0) === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No recent activity</div>
            ) : (
              <div className="space-y-3">
                {(data?.recentTransactions ?? []).slice(0, 5).map((tx, idx) => {
                  const type = (tx.type || '').toLowerCase();
                  const source = (tx.source || '').toLowerCase();
                  const isPayment = type === 'payment' || source === 'payment_received';
                  const isIncome = type === 'income' || isPayment;
                  const isPurchase = type === 'purchase' || source === 'bill';
                  const typeLabel = isPayment
                    ? 'Payment'
                    : isIncome
                      ? 'Income'
                      : isPurchase
                        ? 'Purchase'
                        : 'Expense';
                  const badgeClass = isPayment
                    ? 'bg-blue-50 text-blue-600'
                    : isIncome
                      ? 'bg-emerald-50 text-emerald-600'
                      : isPurchase
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-red-50 text-red-600';
                  const amountClass = isIncome ? 'text-emerald-600' : 'text-red-600';

                  return (
                    <div
                      key={tx.id || idx}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isIncome ? 'bg-emerald-50' : 'bg-red-50'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{tx.title}</p>
                        <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${amountClass}`}>
                          {isIncome ? '+' : '-'}
                          {formatCurrency(Math.abs(toNum(tx.amount)))}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
                          {typeLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickAction
                label="Income"
                description="Record income"
                icon={Plus}
                color="bg-emerald-50 text-emerald-600"
                onClick={() => router.push('/accounting/income')}
              />
              <QuickAction
                label="Expense"
                description="Add expense"
                icon={Minus}
                color="bg-red-50 text-red-600"
                onClick={() => router.push('/accounting/expenses')}
              />
              <QuickAction
                label="Invoice"
                description="Create invoice"
                icon={Receipt}
                color="bg-blue-50 text-blue-600"
                onClick={() => router.push('/accounting/invoices')}
              />
              <QuickAction
                label="Customers"
                description="Manage customers"
                icon={Users}
                color="bg-amber-50 text-amber-600"
                onClick={() => router.push('/warehouse/customers')}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
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
  icon: typeof DollarSign;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#1088dd]/40 hover:shadow-sm transition-all text-left"
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
