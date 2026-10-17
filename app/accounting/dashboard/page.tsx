'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '../../../lib/usePermissions';
import { useDashboardFiltersReady } from '../../../lib/use-dashboard-filters-ready';
import { useFiscalYear } from '../../../lib/fiscal-year-context';
import { useCurrency } from '../../../lib/currency-context';
import { getStoredFiscalYearId } from '../../../lib/fiscal-year-service';
import { browserCompanyAuthHeaders } from '../../../lib/company-api-headers';
import { useCompanyOptional } from '../../../lib/company-context';
import {
  TradePage,
  TradePageHeader,
  TradeStatCard,
  TradeCard,
  TRADE_COLORS,
} from '../../../components/trade/TradeUI';
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  Clock,
  Wallet,
  RefreshCw,
  Loader2,
  DollarSign,
  Receipt,
  FileText,
  Users,
  ArrowRight,
  Plus,
  Minus,
  Scale,
  CreditCard,
  BookOpen,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

type AgingBuckets = {
  '0-30'?: number;
  '31-60'?: number;
  '60+'?: number;
  total?: number;
  count?: number;
};

type KpiMetric = {
  amount?: number | null;
  formatted?: string;
  change?: number | null;
  changeLabel?: string | null;
  isPositive?: boolean;
  count?: number;
  margin?: number;
  accountsCount?: number;
  cashOnly?: number;
  bankOnly?: number;
  excludedCashMirrors?: number;
  name?: string;
  code?: string;
  sources?: Record<string, number | string>;
  aging?: AgingBuckets;
  warning?: { message?: string; amount?: number } | null;
  formula?: string;
  components?: Record<string, number>;
};

type DashboardData = {
  kpi: {
    totalRevenue?: KpiMetric;
    totalSales?: KpiMetric;
    salesCollections?: KpiMetric;
    posSales?: KpiMetric;
    totalPurchases?: KpiMetric;
    totalExpenses?: KpiMetric;
    costOfGoodsSold?: KpiMetric;
    operatingExpenses?: KpiMetric;
    operatingProfit?: KpiMetric;
    netProfit?: KpiMetric;
    grossProfit?: KpiMetric;
    outstanding?: KpiMetric;
    accountsReceivable?: KpiMetric;
    accountsPayable?: KpiMetric;
    cashBalance?: KpiMetric;
    cashInHand?: KpiMetric;
    bankBalance?: KpiMetric;
    inventory?: KpiMetric;
    workingCapital?: KpiMetric;
    totalAssets?: KpiMetric;
    totalLiabilities?: KpiMetric;
    currentRatio?: KpiMetric;
    quickRatio?: KpiMetric;
    dso?: KpiMetric;
    dpo?: KpiMetric;
    capital?: KpiMetric;
  };
  warnings?: Array<{ message?: string; amount?: number; code?: string | null }>;
  aging?: { receivables?: AgingBuckets; payables?: AgingBuckets };
  topCustomers?: Array<{ name?: string; amount?: number; formatted?: string }>;
  capital?: {
    openingCapital?: number;
    currentEquity?: number;
    periodEarnings?: number;
    changeOnCapital?: number;
    isIncrease?: boolean;
    chartNote?: string;
    chart?: Array<{
      month?: string;
      label?: string;
      opening?: number;
      capital?: number;
      earnings?: number;
    }>;
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
};

const TIME_PERIODS = [
  'Today',
  'Last Week',
  'This Month',
  'Last Month',
  'This Quarter',
  'This Year',
] as const;

const PIE_COLORS = ['#014582', '#0FA3E0', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

function toNum(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatAxis(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(Math.round(value));
}

function formatTrend(
  change: number | null | undefined,
  changeLabel?: string | null
) {
  if (change == null || !Number.isFinite(Number(change))) {
    return changeLabel || '—';
  }
  const n = Number(change);
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  const n = toNum(count);
  return `${n} ${n === 1 ? singular : plural}`;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AccountingDashboard() {
  const router = useRouter();
  const companyCtx = useCompanyOptional();
  const { canWidget } = usePermissions();
  const { symbol: currencySymbol } = useCurrency();
  const formatCurrency = (amount: number) => {
    const n = toNum(amount);
    const abs = Math.abs(n).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    if (n < 0) return `(${currencySymbol} ${abs})`;
    return `${currencySymbol} ${abs}`;
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<string>('This Month');
  const [error, setError] = useState<string | null>(null);
  const { selectedFiscalYear } = useFiscalYear();
  const { ready: filtersReady, selectedFiscalYearId } = useDashboardFiltersReady();
  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchDashboard = async (
    timePeriod = period,
    options?: { refresh?: boolean; signal?: AbortSignal }
  ) => {
    try {
      if (options?.refresh) setRefreshing(true);
      else if (!data) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const fyId = selectedFiscalYearId || getStoredFiscalYearId() || '';
      const qs = new URLSearchParams({ timePeriod, limit: '10' });
      if (fyId) qs.set('fiscalYearId', fyId);

      const response = await fetch(`/api/dashboard/overview?${qs.toString()}`, {
        headers: browserCompanyAuthHeaders(),
        signal: options?.signal,
      });
      const result = await response.json();
      if (options?.signal?.aborted) return;

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to load dashboard');
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      console.error('Failed to load accounting dashboard:', e);
      setError('Failed to load dashboard');
    } finally {
      if (!options?.signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!filtersReady) return;
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    void fetchDashboard(period, { signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersReady, selectedFiscalYearId, companyCtx?.activeCompanyId]);

  const isBusy = loading || refreshing;

  const selectPeriod = (label: string) => {
    if (label === period && isBusy) return;
    setPeriod(label);
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    void fetchDashboard(label, { refresh: true, signal: controller.signal });
  };

  const kpi = data?.kpi || {};
  const revenue = toNum(kpi.totalRevenue?.amount);
  const expenses = toNum(kpi.totalExpenses?.amount);
  const sales = toNum(kpi.totalSales?.amount);
  const salesCollected = toNum(kpi.salesCollections?.amount);
  const posSales = toNum(kpi.posSales?.amount);
  const purchases = toNum(kpi.totalPurchases?.amount);
  const bankBalance = toNum(kpi.bankBalance?.amount);
  const cashInHand = toNum(kpi.cashInHand?.amount ?? kpi.cashBalance?.cashOnly);
  const liquidCash = toNum(kpi.cashBalance?.amount ?? bankBalance + cashInHand);
  const receivables = toNum(kpi.accountsReceivable?.amount ?? kpi.outstanding?.amount);
  const payables = toNum(kpi.accountsPayable?.amount);
  const netProfit = toNum(kpi.netProfit?.amount);
  const grossProfit = toNum(kpi.grossProfit?.amount);
  const operatingProfit = toNum(kpi.operatingProfit?.amount);
  const profitMargin = toNum(kpi.netProfit?.margin);
  const inventory = toNum(kpi.inventory?.amount);
  const workingCapital = toNum(
    kpi.workingCapital?.amount ??
      bankBalance + cashInHand + inventory + receivables - payables
  );
  const totalAssets = toNum(kpi.totalAssets?.amount);
  const totalLiabilities = toNum(kpi.totalLiabilities?.amount);
  const bankAccountsCount = toNum(
    kpi.bankBalance?.accountsCount ?? kpi.cashBalance?.accountsCount
  );
  const receivableCount = toNum(kpi.accountsReceivable?.count ?? kpi.outstanding?.count);
  const payableCount = toNum(kpi.accountsPayable?.count);

  const chartData = useMemo(() => {
    const rows = data?.chartData ?? [];
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
      .filter((c) => c.amount > 0 && !/cost of goods sold|^cogs$/i.test(c.name))
      .slice(0, 7);
  }, [data?.expenseCategories]);

  const expenseTotal = expenseCats.reduce((s, c) => s + c.amount, 0);
  const cogs = toNum(kpi.costOfGoodsSold?.amount ?? kpi.totalExpenses?.sources?.cogs);
  const operatingExpenses = toNum(
    kpi.operatingExpenses?.amount ?? Math.max(0, expenses - cogs)
  );
  const grossMargin =
    revenue > 0 ? Math.round((grossProfit / revenue) * 1000) / 10 : 0;

  type OverviewRow = {
    label: string;
    value: number;
    color: string;
    source: string;
    display?: string;
  };

  const pnlRows: OverviewRow[] = [
    {
      label: 'Revenue',
      value: revenue,
      color: TRADE_COLORS.success,
      source: 'Accrual · posted revenue accounts',
    },
    {
      label: 'Cost of Goods Sold',
      value: cogs,
      color: TRADE_COLORS.warning,
      source: 'COGS ledger (excluded from expense pie)',
    },
    {
      label: 'Gross Profit',
      value: Math.abs(grossProfit),
      color: grossProfit >= 0 ? TRADE_COLORS.success : TRADE_COLORS.danger,
      source: `Revenue − COGS · margin ${grossMargin}%`,
      display: formatCurrency(grossProfit),
    },
    {
      label: 'Operating Expenses',
      value: operatingExpenses,
      color: TRADE_COLORS.danger,
      source: 'Expense accounts excluding COGS',
    },
    {
      label: 'Operating Profit (EBIT)',
      value: Math.abs(operatingProfit),
      color: operatingProfit >= 0 ? TRADE_COLORS.accent : TRADE_COLORS.danger,
      source: 'Gross profit − operating expenses',
      display: formatCurrency(operatingProfit),
    },
    {
      label: 'Net Profit / (Loss)',
      value: Math.abs(netProfit),
      color: netProfit >= 0 ? TRADE_COLORS.success : TRADE_COLORS.danger,
      source: 'Gross profit − operating & other expenses',
      display: formatCurrency(netProfit),
    },
  ];

  const positionRows: OverviewRow[] = [
    {
      label: 'Cash in Hand',
      value: Math.abs(cashInHand),
      color: cashInHand >= 0 ? '#14b8a6' : TRADE_COLORS.danger,
      source: 'COA Cash · bank mirrors excluded',
      display: formatCurrency(cashInHand),
    },
    {
      label: 'Bank',
      value: Math.abs(bankBalance),
      color: bankBalance >= 0 ? TRADE_COLORS.accent : TRADE_COLORS.danger,
      source: `${pluralize(bankAccountsCount, 'account')} · cash mirrors excluded`,
      display: formatCurrency(bankBalance),
    },
    {
      label: 'Inventory',
      value: Math.abs(inventory),
      color: TRADE_COLORS.purple,
      source: kpi.inventory?.name || 'COA inventory',
      display: formatCurrency(inventory),
    },
    {
      label: 'Trade Receivables (AR)',
      value: receivables,
      color: TRADE_COLORS.warning,
      source: 'Unpaid customer invoices',
    },
    {
      label: 'Trade Payables (AP)',
      value: payables,
      color: '#f97316',
      source: 'Unpaid supplier bills & purchases',
    },
    {
      label: 'Net Working Capital',
      value: Math.abs(workingCapital),
      color: workingCapital >= 0 ? TRADE_COLORS.accent : TRADE_COLORS.danger,
      source: kpi.workingCapital?.formula || 'Current assets − current liabilities',
      display: formatCurrency(workingCapital),
    },
    ...(totalAssets !== 0 || totalLiabilities !== 0
      ? [
          {
            label: 'Total Assets',
            value: Math.abs(totalAssets),
            color: TRADE_COLORS.primary,
            source: 'Balance sheet · ledger',
            display: formatCurrency(totalAssets),
          },
          {
            label: 'Total Liabilities',
            value: Math.abs(totalLiabilities),
            color: TRADE_COLORS.slate,
            source: 'Balance sheet · ledger',
            display: formatCurrency(totalLiabilities),
          },
        ]
      : []),
  ];

  const opsRows: OverviewRow[] = [
    {
      label: 'Sales Invoices Issued',
      value: sales,
      color: TRADE_COLORS.primary,
      source: `${pluralize(toNum(kpi.totalSales?.count), 'invoice')} billed`,
    },
    {
      label: 'Customer Collections',
      value: salesCollected,
      color: TRADE_COLORS.accent,
      source: 'Cash received against invoices',
    },
    {
      label: 'POS Sales',
      value: posSales,
      color: TRADE_COLORS.purple,
      source: `${pluralize(toNum(kpi.posSales?.count), 'completed sale')}`,
    },
    {
      label: 'Purchase Invoices',
      value: purchases,
      color: TRADE_COLORS.warning,
      source: 'Supplier invoices this period',
    },
  ];

  const renderOverviewGroup = (title: string, hint: string, rows: OverviewRow[]) => {
    const max = Math.max(1, ...rows.map((r) => r.value));
    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A2E]">{title}</h3>
          <p className="text-[11px] text-[#7A8FA6] mt-0.5">{hint}</p>
        </div>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between mb-1.5 gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 font-medium">{row.label}</p>
                  <p className="text-[11px] text-[#7A8FA6]">{row.source}</p>
                </div>
                <span className="text-sm font-bold text-[#1A1A2E] shrink-0">
                  {row.display || formatCurrency(row.value)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (row.value / max) * 100)}%`,
                    backgroundColor: row.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const cap = data?.capital;
  const opening = toNum(cap?.openingCapital);
  const equityNow = toNum(cap?.currentEquity);
  const earned = toNum(cap?.periodEarnings);
  const equityUp = cap?.isIncrease ?? earned >= 0;
  const capChart =
    (cap?.chart || []).length > 0
      ? (cap?.chart || []).map((r) => ({
          label: r.label || r.month || '',
          capital: toNum(r.capital),
        }))
      : [
          { label: 'Owner capital', capital: opening },
          { label: 'Total equity (now)', capital: equityNow },
        ];

  const showProfit = canWidget('profit') || canWidget('financial');
  const showRevenue = canWidget('revenue') || canWidget('financial');
  const showExpenses = canWidget('expenses') || canWidget('financial');
  const showBank = canWidget('bank') || canWidget('cash_bank');
  const showCash = canWidget('cash') || canWidget('cash_bank');
  const showAr = canWidget('ar_ap') || canWidget('sales');
  const showAp = canWidget('ar_ap') || canWidget('purchases');

  return (
    <TradePage fullWidth className="-mx-6 px-3 sm:px-4">
      <TradePageHeader
        title="Accounting Dashboard"
        subtitle={`Accrual P&L · AR/AP subledger · cash/bank snapshots · ${period.toLowerCase()}${
          selectedFiscalYear ? ` · ${selectedFiscalYear.name}` : ''
        }`}
        moduleName="Accounting"
        icon={<BookOpen className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center flex-wrap gap-2">
            {TIME_PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => selectPeriod(p)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  period === p
                    ? 'bg-white text-[#014582] shadow-sm'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                fetchAbortRef.current?.abort();
                const controller = new AbortController();
                fetchAbortRef.current = controller;
                void fetchDashboard(period, { refresh: true, signal: controller.signal });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-all"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/accounting/reports"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Reports
            </Link>
          </div>
        }
      />

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center min-h-[420px] bg-white rounded-2xl border border-[#DDE4EE] shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582] mb-3" />
          <p className="text-sm font-medium text-gray-700">Loading {period.toLowerCase()} data...</p>
          <p className="text-xs text-[#7A8FA6] mt-1">Please wait while we update the dashboard</p>
        </div>
      ) : error && !data ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">{error}</div>
      ) : (
        <div className="relative space-y-6">
          {refreshing && (
            <div
              className="absolute inset-0 z-20 flex items-start justify-center pt-28 rounded-xl bg-white/55 backdrop-blur-[1px]"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="sticky top-28 flex items-center gap-3 rounded-xl border border-[#DDE4EE] bg-white px-5 py-3 shadow-lg">
                <Loader2 className="w-5 h-5 animate-spin text-[#014582]" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Updating Dashboard</p>
                  <p className="text-xs text-gray-500">Loading {period.toLowerCase()} data...</p>
                </div>
              </div>
            </div>
          )}

          <div
            className={`space-y-6 transition-opacity duration-200 ${
              refreshing ? 'opacity-50 pointer-events-none select-none' : ''
            }`}
          >
            {(data?.warnings?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {(data?.warnings || []).map((w, i) => (
                    <p key={i}>
                      {w.message}
                      {w.amount != null ? ` (${formatCurrency(toNum(w.amount))})` : ''}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* KPI Cards — Import-style TradeStatCard grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {showRevenue && (
                <TradeStatCard
                  label="Revenue"
                  value={formatCurrency(revenue)}
                  icon={TrendingUp}
                  color={TRADE_COLORS.success}
                  hint={`${formatTrend(kpi.totalRevenue?.change, kpi.totalRevenue?.changeLabel)} vs prior · Accrual`}
                  href="/accounting/income"
                />
              )}
              {showProfit && (
                <TradeStatCard
                  label="Gross Profit"
                  value={formatCurrency(grossProfit)}
                  icon={Scale}
                  color={TRADE_COLORS.primary}
                  hint={`Margin ${grossMargin}% · Accrual`}
                />
              )}
              {showProfit && (
                <TradeStatCard
                  label="Net Profit"
                  value={formatCurrency(netProfit)}
                  icon={DollarSign}
                  color={netProfit >= 0 ? TRADE_COLORS.success : TRADE_COLORS.danger}
                  hint={`Margin ${profitMargin.toFixed(1)}% · ${formatTrend(kpi.netProfit?.change, kpi.netProfit?.changeLabel)}`}
                />
              )}
              {showExpenses && (
                <TradeStatCard
                  label="Expenses (incl. COGS)"
                  value={formatCurrency(expenses)}
                  icon={TrendingDown}
                  color={TRADE_COLORS.danger}
                  hint={`${formatTrend(kpi.totalExpenses?.change, kpi.totalExpenses?.changeLabel)} vs prior`}
                  href="/accounting/expenses"
                />
              )}
              {showBank && (
                <TradeStatCard
                  label="Bank Balance"
                  value={formatCurrency(bankBalance)}
                  icon={Landmark}
                  color={TRADE_COLORS.accent}
                  hint={
                    bankAccountsCount > 0
                      ? pluralize(bankAccountsCount, 'account')
                      : 'No accounts'
                  }
                  href="/accounting/bank-Accounts"
                />
              )}
              {showCash && (
                <TradeStatCard
                  label="Cash in Hand"
                  value={formatCurrency(cashInHand)}
                  icon={Wallet}
                  color={cashInHand >= 0 ? '#14b8a6' : TRADE_COLORS.danger}
                  hint={cashInHand < 0 ? 'Negative ledger balance' : 'COA cash snapshot'}
                />
              )}
              {showAr && (
                <TradeStatCard
                  label="Receivables"
                  value={formatCurrency(receivables)}
                  icon={Clock}
                  color={TRADE_COLORS.warning}
                  hint={receivableCount > 0 ? `${receivableCount} open` : 'Clear'}
                  href="/sales/invoices"
                />
              )}
              {showAp && (
                <TradeStatCard
                  label="Payables"
                  value={formatCurrency(payables)}
                  icon={CreditCard}
                  color="#f97316"
                  hint={payableCount > 0 ? `${payableCount} open` : 'Clear'}
                  href="/purchases/invoices"
                />
              )}
            </div>

            {/* Charts — Import layout: BarChart 2/3 + Pie 1/3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TradeCard
                  title="Revenue & Expenses Trend"
                  subtitle="Posted ledger revenue vs expenses (same as P&L)"
                  action={
                    <span className="text-xs font-semibold text-[#014582] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                      Liquid {formatCurrency(liquidCash)}
                    </span>
                  }
                >
                  <div className="h-[280px] w-full pt-2">
                    {chartData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-sm text-[#7A8FA6]">
                        No posted revenue/expense activity in this period
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatAxis} />
                          <Tooltip
                            formatter={((val: number | string, name: string) => [
                              formatCurrency(Number(val ?? 0)),
                              name === 'revenue' ? 'Revenue' : 'Expenses',
                            ]) as never}
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              fontSize: '12px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                          <Bar
                            dataKey="revenue"
                            name="Revenue"
                            fill={TRADE_COLORS.primary}
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="expenses"
                            name="Expenses"
                            fill={TRADE_COLORS.accent}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </TradeCard>
              </div>

              <div>
                <TradeCard
                  title="Operating Expenses by Category"
                  subtitle={
                    expenseCats.length === 0
                      ? `No data · ${period}`
                      : `${pluralize(expenseCats.length, 'type')} · COGS excluded · ${period}`
                  }
                >
                  <div className="h-[280px] w-full flex flex-col items-center justify-center">
                    {expenseCats.length === 0 ? (
                      <p className="text-sm text-[#7A8FA6]">No expense categories</p>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={210}>
                          <PieChart>
                            <Pie
                              data={expenseCats}
                              dataKey="amount"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              innerRadius={50}
                              paddingAngle={3}
                            >
                              {expenseCats.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
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
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] w-full mt-2">
                          {expenseCats.slice(0, 6).map((item, idx) => (
                            <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                                }}
                              />
                              <span className="text-gray-600 truncate">{item.name}</span>
                              <strong className="text-gray-900 ml-auto shrink-0">
                                {expenseTotal > 0
                                  ? `${Math.round((item.amount / expenseTotal) * 100)}%`
                                  : '0%'}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </TradeCard>
              </div>
            </div>

            {/* Equity + Financial overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TradeCard
                title="Equity Position"
                subtitle={
                  cap?.chartNote ||
                  'Snapshot bars (owner capital vs total equity now) — not interpolated history'
                }
              >
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl bg-blue-50 p-3 border border-blue-100">
                    <p className="text-[10px] font-bold uppercase text-[#014582]">Owner capital</p>
                    <p className="text-base font-extrabold text-[#014582] mt-1">
                      {formatCurrency(opening)}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl p-3 border ${
                      equityUp
                        ? 'bg-emerald-50 border-emerald-100'
                        : 'bg-red-50 border-red-100'
                    }`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase ${
                        equityUp ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {equityUp ? 'Period profit' : 'Period loss'}
                    </p>
                    <p
                      className={`text-base font-extrabold mt-1 ${
                        equityUp ? 'text-emerald-800' : 'text-red-800'
                      }`}
                    >
                      {formatCurrency(earned)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-violet-50 p-3 border border-violet-100">
                    <p className="text-[10px] font-bold uppercase text-violet-700">Total equity</p>
                    <p className="text-base font-extrabold text-violet-800 mt-1">
                      {formatCurrency(equityNow)}
                    </p>
                  </div>
                </div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={capChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={formatAxis} />
                      <Tooltip
                        formatter={((value: number | string) => [
                          formatCurrency(Number(value)),
                          'Equity',
                        ]) as never}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="capital"
                        name="Equity"
                        fill={TRADE_COLORS.purple}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={64}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TradeCard>

              <TradeCard
                title="Period Snapshot"
                subtitle={`Net profit headline · ${period}`}
                action={
                  showProfit ? (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        netProfit >= 0
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-red-700 bg-red-50 border-red-200'
                      }`}
                    >
                      {formatCurrency(netProfit)}
                    </span>
                  ) : null
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60">
                    <p className="text-[10px] uppercase text-[#7A8FA6] font-bold">Revenue</p>
                    <p className="text-lg font-extrabold text-emerald-600 mt-1">
                      {formatCurrency(revenue)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60">
                    <p className="text-[10px] uppercase text-[#7A8FA6] font-bold">Gross Profit</p>
                    <p
                      className={`text-lg font-extrabold mt-1 ${
                        grossProfit >= 0 ? 'text-[#014582]' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(grossProfit)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60">
                    <p className="text-[10px] uppercase text-[#7A8FA6] font-bold">COGS</p>
                    <p className="text-lg font-extrabold text-orange-600 mt-1">
                      {formatCurrency(cogs)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60">
                    <p className="text-[10px] uppercase text-[#7A8FA6] font-bold">
                      Liquid (Cash + Bank)
                    </p>
                    <p className="text-lg font-extrabold text-[#0FA3E0] mt-1">
                      {formatCurrency(liquidCash)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[#7A8FA6]">Current / Quick ratio</p>
                    <p className="font-bold text-[#1A1A2E] mt-0.5">
                      {kpi.currentRatio?.formatted || '—'} / {kpi.quickRatio?.formatted || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7A8FA6]">DSO / DPO</p>
                    <p className="font-bold text-[#1A1A2E] mt-0.5">
                      {kpi.dso?.formatted || '—'} / {kpi.dpo?.formatted || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7A8FA6]">AR aging 0–30 / 31–60 / 60+</p>
                    <p className="font-bold text-[#1A1A2E] mt-0.5">
                      {formatCurrency(toNum(kpi.accountsReceivable?.aging?.['0-30']))}
                      {' · '}
                      {formatCurrency(toNum(kpi.accountsReceivable?.aging?.['31-60']))}
                      {' · '}
                      {formatCurrency(toNum(kpi.accountsReceivable?.aging?.['60+']))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7A8FA6]">Top customer</p>
                    <p className="font-bold text-[#1A1A2E] mt-0.5 truncate">
                      {data?.topCustomers?.[0]
                        ? `${data.topCustomers[0].name} · ${formatCurrency(toNum(data.topCustomers[0].amount))}`
                        : '—'}
                    </p>
                  </div>
                </div>
              </TradeCard>
            </div>

            {/* Financial Overview */}
            <TradeCard
              title="Financial Overview"
              subtitle="Grouped by accounting basis · bars compare within each group only"
              action={<span className="text-xs font-semibold text-[#7A8FA6]">{period}</span>}
            >
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {renderOverviewGroup(
                  'Profit & Loss',
                  'Period performance (accrual · posted ledger)',
                  pnlRows
                )}
                {renderOverviewGroup(
                  'Financial Position',
                  'Point-in-time balances (not period totals)',
                  positionRows
                )}
                {renderOverviewGroup(
                  'Operations',
                  'Sales / purchase documents this period',
                  opsRows
                )}
              </div>
            </TradeCard>

            {/* Recent activity + Quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TradeCard
                  title="Recent Activity"
                  subtitle="Latest accounting movements"
                  action={
                    <button
                      type="button"
                      onClick={() => router.push('/accounting/general-ledger')}
                      className="text-xs font-semibold text-[#014582] hover:underline flex items-center gap-1"
                    >
                      View All <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  }
                >
                  {(data?.recentTransactions?.length ?? 0) === 0 ? (
                    <div className="py-10 text-center text-sm text-[#7A8FA6]">No recent activity</div>
                  ) : (
                    <div className="space-y-3">
                      {(data?.recentTransactions ?? []).slice(0, 6).map((tx, idx) => {
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
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : isIncome
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : isPurchase
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-red-50 text-red-700 border-red-100';

                        return (
                          <div
                            key={tx.id || idx}
                            className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50/70 transition-colors gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#014582] flex items-center justify-center shrink-0">
                                <Receipt className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {tx.title}
                                </p>
                                <p className="text-[11px] text-gray-500">{formatDate(tx.date)}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p
                                className={`text-sm font-bold ${
                                  isIncome ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                {isIncome ? '+' : '-'}
                                {formatCurrency(Math.abs(toNum(tx.amount)))}
                              </p>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}
                              >
                                {typeLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TradeCard>
              </div>

              <TradeCard title="Quick Actions" subtitle="Jump into common accounting tasks">
                <div className="space-y-2.5">
                  {[
                    {
                      label: 'Record Income',
                      href: '/accounting/income',
                      icon: Plus,
                      color: TRADE_COLORS.success,
                    },
                    {
                      label: 'Add Expense',
                      href: '/accounting/expenses',
                      icon: Minus,
                      color: TRADE_COLORS.danger,
                    },
                    {
                      label: 'Sales Invoices',
                      href: '/sales/invoices',
                      icon: Receipt,
                      color: TRADE_COLORS.accent,
                    },
                    {
                      label: 'Purchase Invoices',
                      href: '/purchases/invoices',
                      icon: FileText,
                      color: TRADE_COLORS.primary,
                    },
                    {
                      label: 'Customers',
                      href: '/warehouse/customers',
                      icon: Users,
                      color: TRADE_COLORS.warning,
                    },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.href}
                        href={action.href}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-[#014582]/40 hover:bg-gray-50/70 transition-all"
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${action.color}1A` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: action.color }} />
                        </div>
                        <span className="text-xs font-bold text-[#1A1A2E]">{action.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                      </Link>
                    );
                  })}
                </div>
              </TradeCard>
            </div>
          </div>
        </div>
      )}
    </TradePage>
  );
}

export { AccountingDashboard };
