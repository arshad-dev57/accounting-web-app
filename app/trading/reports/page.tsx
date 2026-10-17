'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import {
  Download as FiDownload,
  Calendar as FiCalendar,
} from 'lucide-react';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
  ErpLinkedBanner,
  formatUsd,
} from '@/components/trade/TradeUI';
import { tradingService, mapKpisToUi } from '@/lib/trading-service';

const EMPTY = mapKpisToUi({
  totalTradingSales: 0,
  totalTradingPurchases: 0,
  recognizedSalesInvoices: 0,
  cogsTotal: 0,
  grossTradingProfit: 0,
  grossMarginPercentage: 0,
  currentTradingStockValue: 0,
  openSalesOrders: 0,
  pendingPurchaseOrders: 0,
  openPurchaseCommitments: 0,
  outstandingReceivables: 0,
  lowStockItemsCount: 0,
  deliveryCount: 0,
  grnCount: 0,
});

export default function TradingReportsPage() {
  const [kpis, setKpis] = useState(EMPTY);
  const [period, setPeriod] = useState('YTD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await tradingService.getDashboard();
        if (!cancelled) setKpis(mapKpisToUi(data));
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load trading report');
          setKpis(EMPTY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const cogs = kpis.cogsTotal > 0 ? kpis.cogsTotal : Math.max(0, kpis.totalTradingSalesUsd - kpis.grossTradingProfitUsd);

  return (
    <TradePage>
      <TradePageHeader
        title="Trading Performance & Profitability Reports"
        description="Company-scoped trading P&L lens. Gross profit uses recognized sales and COGS — not sales minus purchases."
        badge="Financial Reporting"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm">
              <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs font-semibold text-slate-800"
              >
                <option value="YTD">Year to Date</option>
                <option value="QTD">Quarter to Date</option>
                <option value="30D">Last 30 Days</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              <FiDownload className="w-4 h-4" />
              Print / Export
            </button>
          </div>
        }
      />

      <ErpLinkedBanner
        moduleLabel="Trading Reports"
        erpModuleLabel="Accounting Reports"
        erpHref="/reports"
        description="Trading KPIs filter classified documents only. Trial Balance, P&L and Balance Sheet remain the authoritative Accounting statements."
      />

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">{error}</div>
      )}
      {loading && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          Loading report…
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <TradeCard className="p-4 border-l-4 border-l-emerald-500">
          <div className="text-xs text-slate-500 font-medium">Gross Trading Revenue</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatUsd(kpis.totalTradingSalesUsd)}
          </div>
        </TradeCard>
        <TradeCard className="p-4 border-l-4 border-l-slate-400">
          <div className="text-xs text-slate-500 font-medium">Cost of Goods Sold (COGS)</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatUsd(cogs)}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">From posted *-COGS journals when available</div>
        </TradeCard>
        <TradeCard className="p-4 border-l-4 border-l-emerald-600">
          <div className="text-xs text-slate-500 font-medium">Gross Trading Profit</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatUsd(kpis.grossTradingProfitUsd)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {kpis.grossMarginPercentage.toFixed(1)}% margin
          </div>
        </TradeCard>
        <TradeCard className="p-4 border-l-4 border-l-amber-500">
          <div className="text-xs text-slate-500 font-medium">Open PO Commitments</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatUsd(kpis.openPurchaseCommitmentsUsd)}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Not Accounts Payable</div>
        </TradeCard>
      </div>

      <TradeCard className="p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Trading book notes</h3>
        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
          <li>Stock valuation: {formatUsd(kpis.currentTradingStockValueUsd)} (ProductStock)</li>
          <li>Outstanding receivables (linked invoices): {formatUsd(kpis.outstandingReceivablesUsd)}</li>
          <li>Open sales orders: {kpis.openSalesOrders} · Pending POs: {kpis.pendingPurchaseOrders}</li>
          <li>Purchases shown separately ({formatUsd(kpis.totalTradingPurchasesUsd)}) are not used as COGS.</li>
          <li>Import/Export books are excluded unless their documents are explicitly classified as Trading.</li>
        </ul>
      </TradeCard>
    </TradePage>
  );
}
