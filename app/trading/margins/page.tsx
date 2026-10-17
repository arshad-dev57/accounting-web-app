'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Search as FiSearch } from 'lucide-react';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
  TradeTable,
  TradeTableHeader,
  TradeTableBody,
  TradeTableRow,
  TradeTableCell,
  TradeStatusBadge,
  TradePagination,
  ErpLinkedBanner,
  formatUsd,
} from '@/components/trade/TradeUI';
import { tradingService, type TradingMarginRow } from '@/lib/trading-service';

const COST_BASES = [
  { value: 'CostPrice', label: 'Cost price' },
  { value: 'AverageCost', label: 'Average cost' },
  { value: 'LastPurchase', label: 'Last purchase' },
  { value: 'StandardCost', label: 'Standard cost' },
];

export default function TradingMarginsPage() {
  const [margins, setMargins] = useState<TradingMarginRow[]>([]);
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('ALL');
  const [costBasis, setCostBasis] = useState('CostPrice');
  const [targetMarginPct, setTargetMarginPct] = useState(20);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await tradingService.getMargins({ costBasis, targetMarginPct });
        if (!cancelled) setMargins(data);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load margins');
          setMargins([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [costBasis, targetMarginPct]);

  const filtered = margins.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      (item.name || '').toLowerCase().includes(q) ||
      (item.sku || '').toLowerCase().includes(q) ||
      (item.customerName || '').toLowerCase().includes(q);
    const health = item.health || 'Healthy';
    const matchHealth = healthFilter === 'ALL' || health === healthFilter;
    return matchSearch && matchHealth;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const avgMargin =
    margins.length > 0
      ? margins.reduce((acc, m) => acc + m.grossMarginPct, 0) / margins.length
      : 0;
  const healthyCount = margins.filter((m) => (m.health || '') === 'Healthy').length;
  const underReviewCount = margins.filter((m) => (m.health || '') === 'Under Review').length;
  const belowTarget = margins.filter((m) => (m.variancePct || 0) < 0).length;

  return (
    <TradePage>
      <TradePageHeader
        title="Trading Margins Analysis"
        description="Gross margin and markup vs cost basis, with target margin and variance — standard commercial control view."
        badge="Profitability Analytics"
      />

      <ErpLinkedBanner
        moduleLabel="Trading Margins"
        erpModuleLabel="Customer Pricing"
        erpHref="/trading/customer-pricing"
        description="Uses negotiated customer prices vs selected product cost basis (cost / average / last purchase / standard). P&L COGS still posts only via Sales invoices."
      />

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <TradeCard className="p-4 border-l-4 border-l-emerald-500">
          <div className="text-xs text-slate-500 font-medium">Portfolio Avg Gross Margin</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{avgMargin.toFixed(2)}%</div>
        </TradeCard>
        <TradeCard className="p-4 border-l-4 border-l-blue-500">
          <div className="text-xs text-slate-500 font-medium">Healthy Lines</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{healthyCount}</div>
        </TradeCard>
        <TradeCard className="p-4 border-l-4 border-l-amber-500">
          <div className="text-xs text-slate-500 font-medium">Below Target</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{belowTarget}</div>
        </TradeCard>
        <TradeCard className="p-4 border-l-4 border-l-red-500">
          <div className="text-xs text-slate-500 font-medium">Under Review</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{underReviewCount}</div>
        </TradeCard>
      </div>

      <TradeCard>
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customer, product, SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] text-slate-500">Cost basis</label>
            <select
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              {COST_BASES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <label className="text-[11px] text-slate-500 ml-2">Default target %</label>
            <input
              type="number"
              step="0.1"
              value={targetMarginPct}
              onChange={(e) => setTargetMarginPct(Number(e.target.value))}
              className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
            {['ALL', 'Healthy', 'Watch', 'Under Review'].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHealthFilter(h)}
                className={`px-3 py-1 text-xs font-medium rounded-lg ${
                  healthFilter === h ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={[
              'Customer',
              'SKU',
              'Product',
              'Cost Basis',
              'Cost',
              'List',
              'Sell',
              'Gross $',
              'Margin %',
              'Markup %',
              'Target',
              'Variance',
              'Health',
            ]}
          />
          <TradeTableBody>
            {loading ? (
              <TradeTableRow>
                <TradeTableCell className="py-10 text-center text-slate-500">
                  Loading…
                </TradeTableCell>
              </TradeTableRow>
            ) : paginated.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="py-10 text-center text-slate-500">
                  No margin rows yet. Add customer pricing agreements first.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              paginated.map((item) => (
                <TradeTableRow key={item.id || `${item.productId}-${item.customerId}`}>
                  <TradeTableCell className="font-medium">
                    {item.customerName || '—'}
                  </TradeTableCell>
                  <TradeTableCell className="font-semibold">{item.sku || '—'}</TradeTableCell>
                  <TradeTableCell>{item.name || '—'}</TradeTableCell>
                  <TradeTableCell className="text-[11px] text-slate-500">
                    {item.costBasis || costBasis}
                  </TradeTableCell>
                  <TradeTableCell>{formatUsd(item.avgPurchaseCost)}</TradeTableCell>
                  <TradeTableCell>{formatUsd(item.listPrice || 0)}</TradeTableCell>
                  <TradeTableCell>{formatUsd(item.avgSellingPrice)}</TradeTableCell>
                  <TradeTableCell className="text-emerald-700 font-semibold">
                    {formatUsd(item.grossMargin)}
                  </TradeTableCell>
                  <TradeTableCell>{item.grossMarginPct.toFixed(1)}%</TradeTableCell>
                  <TradeTableCell>{(item.markupPct || 0).toFixed(1)}%</TradeTableCell>
                  <TradeTableCell>{(item.targetMarginPct || targetMarginPct).toFixed(1)}%</TradeTableCell>
                  <TradeTableCell
                    className={
                      (item.variancePct || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'
                    }
                  >
                    {(item.variancePct || 0) >= 0 ? '+' : ''}
                    {(item.variancePct || 0).toFixed(1)}%
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={item.health || 'Healthy'} />
                  </TradeTableCell>
                </TradeTableRow>
              ))
            )}
          </TradeTableBody>
        </TradeTable>

        <div className="p-4 border-t border-slate-100">
          <TradePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </TradeCard>
    </TradePage>
  );
}
