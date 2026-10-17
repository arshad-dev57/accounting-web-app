'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
  FileCheck2,
  PackageCheck,
  Plus,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TradePage,
  TradePageHeader,
  TradeStatCard,
  TradeCard,
  TRADE_COLORS,
} from '../../../components/trade/TradeUI';
import { useCurrency } from '../../../lib/currency-context';
import { browserCompanyAuthHeaders } from '../../../lib/company-api-headers';
import { getStoredFiscalYearId } from '../../../lib/fiscal-year-service';
import { useFiscalYear } from '../../../lib/fiscal-year-context';
import { useCompanyOptional } from '../../../lib/company-context';

type SalesDash = {
  orders?: { count?: number; revenue?: number; pendingCount?: number };
  invoices?: {
    stats?: {
      grandTotal?: number;
      revenue?: number;
      paidAmount?: number;
      outstanding?: number;
      total?: number;
    };
  };
  deliveries?: { count?: number; pendingCount?: number };
};

type PurchasesDash = {
  orders?: { count?: number; totalSpend?: number; pendingCount?: number; revenue?: number };
  invoices?: {
    totalSpend?: number;
    paidAmount?: number;
    outstanding?: number;
    count?: number;
  };
  goodsReceiving?: { count?: number; pendingCount?: number };
};

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function TradingDashboardPage() {
  const { formatAmount } = useCurrency();
  const { selectedFiscalYearId } = useFiscalYear();
  const companyCtx = useCompanyOptional();
  const [sales, setSales] = useState<SalesDash | null>(null);
  const [purchases, setPurchases] = useState<PurchasesDash | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');

  const load = async (p = period) => {
    try {
      setLoading(true);
      setError(null);
      const fyId = selectedFiscalYearId || getStoredFiscalYearId() || '';
      const qs = new URLSearchParams({ period: p });
      if (fyId) qs.set('fiscalYearId', fyId);
      const headers = browserCompanyAuthHeaders();

      const [salesRes, purchRes] = await Promise.all([
        fetch(`/api/sales/dashboard?${qs}`, { headers }),
        fetch(`/api/purchases/dashboard?${qs}`, { headers }),
      ]);
      const [salesJson, purchJson] = await Promise.all([salesRes.json(), purchRes.json()]);

      if (salesJson.success) setSales(salesJson.data || null);
      else setSales(null);

      if (purchJson.success) setPurchases(purchJson.data || null);
      else setPurchases(null);

      if (!salesJson.success && !purchJson.success) {
        setError(salesJson.message || purchJson.message || 'Failed to load trading dashboard');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load trading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedFiscalYearId, companyCtx?.activeCompanyId]);

  const salesRevenue = num(sales?.invoices?.stats?.revenue ?? sales?.invoices?.stats?.grandTotal ?? sales?.orders?.revenue);
  const purchaseSpend = num(
    purchases?.invoices?.totalSpend ?? purchases?.orders?.totalSpend ?? purchases?.orders?.revenue
  );
  const grossSpread = salesRevenue - purchaseSpend;
  const marginPct = salesRevenue > 0 ? (grossSpread / salesRevenue) * 100 : 0;

  const chartRows = useMemo(
    () => [
      {
        label: 'Current period',
        sales: salesRevenue,
        purchases: purchaseSpend,
      },
    ],
    [salesRevenue, purchaseSpend]
  );

  return (
    <TradePage>
      <TradePageHeader
        title="Trading Management Dashboard"
        subtitle="Live Sales + Purchases data for this company (same ERP documents and postings)"
        moduleName="Trading Operations"
        icon={<ArrowLeftRight className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-white/15 text-white text-xs border border-white/20"
            >
              <option value="month" className="text-slate-900">This Month</option>
              <option value="quarter" className="text-slate-900">This Quarter</option>
              <option value="year" className="text-slate-900">This Year</option>
            </select>
            <button
              type="button"
              onClick={() => void load(period)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <Link
              href="/trading/sales-orders"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Sales Order
            </Link>
            <Link
              href="/trading/purchase-orders"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Purchase Order
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">{error}</div>
      )}
      {loading && !sales && !purchases && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          Loading Sales & Purchases KPIs…
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <TradeStatCard
          label="Sales Revenue"
          value={formatAmount(salesRevenue)}
          icon={TrendingUp}
          color={TRADE_COLORS.primary}
          hint="From Sales invoices / orders"
          href="/trading/invoices"
        />
        <TradeStatCard
          label="Purchase Spend"
          value={formatAmount(purchaseSpend)}
          icon={ShoppingCart}
          color={TRADE_COLORS.accent}
          hint="From Purchase invoices / orders"
          href="/trading/purchase-invoices"
        />
        <TradeStatCard
          label="Sales − Purchases"
          value={formatAmount(grossSpread)}
          icon={DollarSign}
          color={TRADE_COLORS.success}
          hint="Operational spread (not COGS GP)"
          href="/trading/margins"
        />
        <TradeStatCard
          label="Spread %"
          value={`${marginPct.toFixed(1)}%`}
          icon={Receipt}
          color={TRADE_COLORS.purple}
          hint="(Sales − Purchases) ÷ Sales"
          href="/trading/reports"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <TradeStatCard
          label="Sales Orders"
          value={num(sales?.orders?.count)}
          icon={FileCheck2}
          color={TRADE_COLORS.primary}
          hint={`${num(sales?.orders?.pendingCount)} pending`}
          href="/trading/sales-orders"
        />
        <TradeStatCard
          label="AR Outstanding"
          value={formatAmount(num(sales?.invoices?.stats?.outstanding))}
          icon={Receipt}
          color={TRADE_COLORS.danger}
          hint="Unpaid sales invoices"
          href="/trading/invoices"
        />
        <TradeStatCard
          label="Purchase Orders"
          value={num(purchases?.orders?.count)}
          icon={PackageCheck}
          color={TRADE_COLORS.accent}
          hint={`${num(purchases?.orders?.pendingCount)} pending`}
          href="/trading/purchase-orders"
        />
        <TradeStatCard
          label="AP Outstanding"
          value={formatAmount(num(purchases?.invoices?.outstanding))}
          icon={Receipt}
          color={TRADE_COLORS.warning}
          hint="Unpaid purchase invoices"
          href="/trading/purchase-invoices"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TradeCard title="Sales vs Purchases" subtitle="Same company documents used in Sales & Purchases modules">
          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${Number(val) / 1000}k`} />
                <Tooltip formatter={(val) => [formatAmount(Number(val ?? 0)), '']} />
                <Legend />
                <Bar dataKey="sales" name="Sales" fill="#014582" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Purchases" fill="#0FA3E0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TradeCard>

        <TradeCard title="Quick links" subtitle="Open the same forms under Trading naming">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1">
            {[
              { href: '/trading/sales-quotations', label: 'Sales Quotations' },
              { href: '/trading/sales-orders', label: 'Sales Orders' },
              { href: '/trading/deliveries', label: 'Deliveries' },
              { href: '/trading/invoices', label: 'Sales Invoices' },
              { href: '/trading/requisitions', label: 'Purchase Requisitions' },
              { href: '/trading/purchase-orders', label: 'Purchase Orders' },
              { href: '/trading/goods-receiving', label: 'Goods Receiving' },
              { href: '/trading/purchase-invoices', label: 'Purchase Invoices' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800"
              >
                {item.label}
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            ))}
          </div>
        </TradeCard>
      </div>
    </TradePage>
  );
}
