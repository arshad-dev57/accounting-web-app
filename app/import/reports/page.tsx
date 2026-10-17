'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Ship,
  Globe,
  Loader2,
  AlertCircle,
  RefreshCw,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
  TradeTable,
  TradeTableHeader,
  TradeTableBody,
  TradeTableRow,
  TradeTableCell,
  TradeStatCard,
  TRADE_COLORS,
} from '../../../components/trade/TradeUI';
import importApi, { ImportCustomsClearance } from '../../../lib/import-api';
import { useCurrency } from '../../../lib/currency-context';
import { formatImportMoney } from '../../../lib/import-format';

const COLORS = ['#014582', '#0FA3E0', '#10B981', '#F59E0B', '#6366F1'];

export default function ImportReportsPage() {
  const { code: baseCurrencyCode } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [customsList, setCustomsList] = useState<ImportCustomsClearance[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [reports, customs] = await Promise.all([
        importApi.getReports(),
        importApi.listCustoms().catch(() => []),
      ]);
      setReportData(reports);
      setCustomsList(Array.isArray(customs) ? customs : []);
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load import intelligence reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive spend by country from real orders
  const spendByCountry = useMemo(() => {
    if (!reportData?.orders) return [];
    const countryMap: Record<string, { spend: number; suppliers: Set<string> }> = {};
    let totalSpend = 0;

    for (const o of reportData.orders) {
      const country = o.supplierCountry || 'International';
      const spend = Number(o.totalUsd || o.subtotalForeign || 0);
      totalSpend += spend;
      if (!countryMap[country]) {
        countryMap[country] = { spend: 0, suppliers: new Set() };
      }
      countryMap[country].spend += spend;
      if (o.supplierName) countryMap[country].suppliers.add(o.supplierName);
    }

    return Object.entries(countryMap).map(([country, data]) => ({
      country,
      spend: Math.round(data.spend),
      pct: totalSpend > 0 ? `${((data.spend / totalSpend) * 100).toFixed(1)}%` : '0%',
      suppliers: data.suppliers.size,
    }));
  }, [reportData]);

  // Derived KPIs
  const totalSpend = useMemo(() => {
    if (!reportData?.orders) return 0;
    return reportData.orders.reduce((sum: number, o: any) => sum + Number(o.totalUsd || 0), 0);
  }, [reportData]);

  const avgLandedCostMarkup = useMemo(() => {
    const fob = reportData?.landedCostBreakdown?.purchaseFobTotal || 0;
    const exp = reportData?.landedCostBreakdown?.totalLandedExpenses || 0;
    if (fob > 0) return ((exp / fob) * 100).toFixed(1);
    return '0.0';
  }, [reportData]);

  const activeCountriesCount = spendByCountry.length;

  const transitReliability = useMemo(() => {
    if (!reportData?.shipments || reportData.shipments.length === 0) return '100%';
    const delivered = reportData.shipments.filter((s: any) => s.shipmentStatus === 'Delivered' || s.shipmentStatus === 'Customs Cleared').length;
    return `${Math.round((delivered / reportData.shipments.length) * 100)}%`;
  }, [reportData]);

  const handleExportCsv = () => {
    if (!reportData?.orders?.length) {
      alert('No order data available to export.');
      return;
    }
    const headers = ['PO Number', 'Supplier', 'Country', 'Incoterm', 'Currency', 'Total USD', 'Status'];
    const rows = reportData.orders.map((o: any) => [
      o.poNumber,
      `"${o.supplierName || ''}"`,
      `"${o.supplierCountry || ''}"`,
      o.incoterm || '',
      o.currency || 'USD',
      o.totalUsd || 0,
      o.status || '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Import_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Import Intelligence & Analytical Reports"
        subtitle="Spend by origin country, shipping line reliability, customs duty audit and landed cost variance"
        moduleName="Import Reports"
        backHref="/import/dashboard"
        icon={<BarChart3 className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV / Excel
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-all"
            >
              <FileText className="w-4 h-4" /> Print / PDF
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="font-bold underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#014582]" />
          <p className="text-xs font-medium">Computing import analytics and reports...</p>
        </div>
      ) : (
        <>
          {/* Summary KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <TradeStatCard
              label="Total Procurement Spend"
              value={formatImportMoney(totalSpend, baseCurrencyCode, { decimals: 0 })}
              icon={DollarSign}
              color={TRADE_COLORS.primary}
              hint="FOB Contract Commitment"
            />
            <TradeStatCard
              label="Avg Landed Cost Markup"
              value={`+${avgLandedCostMarkup}%`}
              icon={TrendingUp}
              color={TRADE_COLORS.success}
              hint="Total overhead to FOB ratio"
            />
            <TradeStatCard
              label="Active Import Countries"
              value={activeCountriesCount}
              icon={Globe}
              color={TRADE_COLORS.accent}
              hint={spendByCountry.map((c) => c.country).slice(0, 3).join(', ') || 'Global'}
            />
            <TradeStatCard
              label="Transit Reliability"
              value={transitReliability}
              icon={Ship}
              color={TRADE_COLORS.purple}
              hint="Delivered vs Active Shipments"
            />
          </div>

          {/* Spend by Origin Country */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TradeCard
              title="Procurement Spend by Country of Origin"
              subtitle="Total FOB commitment distributed across source territories"
            >
              {spendByCountry.length > 0 ? (
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={spendByCountry} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}k`} />
                      <Tooltip
                        formatter={(val) => [`$${Number(val ?? 0).toLocaleString()}`, 'Spend']}
                        contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Bar dataKey="spend" name="Import Value" fill="#014582" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400 text-xs">
                  No country procurement data recorded yet.
                </div>
              )}
            </TradeCard>

            <TradeCard
              title="Customs Duty & Port Charges Audit"
              subtitle="Breakdown of statutory tariffs and logistics handling overhead"
            >
              {customsList.length > 0 ? (
                <TradeTable>
                  <TradeTableHeader columns={['Declaration No', 'Port of Entry', 'Duty (USD)', 'VAT (USD)', 'Port Charges', 'Total Payable']} />
                  <TradeTableBody>
                    {customsList.map((c) => (
                      <TradeTableRow key={c.id}>
                        <TradeTableCell className="font-mono text-xs font-semibold text-[#014582]">{c.declarationNumber}</TradeTableCell>
                        <TradeTableCell className="text-xs">{c.portOfEntry || '—'}</TradeTableCell>
                        <TradeTableCell className="text-emerald-700 font-semibold">${Number(c.customsDutyUsd || 0).toLocaleString()}</TradeTableCell>
                        <TradeTableCell className="text-gray-600">${Number(c.vatUsd || 0).toLocaleString()}</TradeTableCell>
                        <TradeTableCell className="text-gray-700">${Number(c.portHandlingUsd || 0).toLocaleString()}</TradeTableCell>
                        <TradeTableCell className="font-bold text-gray-900">${Number(c.totalCustomsPayableUsd || 0).toLocaleString()}</TradeTableCell>
                      </TradeTableRow>
                    ))}
                  </TradeTableBody>
                </TradeTable>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400 text-xs">
                  No customs clearances audited yet.
                </div>
              )}
            </TradeCard>
          </div>

          {/* Landed Cost Variance Report */}
          <TradeCard
            title="Landed Cost Variance & Margin Impact"
            subtitle="Itemized comparison between original FOB purchase cost and final warehouse landed valuation"
          >
            {reportData?.landedCosts && reportData.landedCosts.length > 0 ? (
              <TradeTable>
                <TradeTableHeader
                  columns={['Product Item', 'Allocation Ref', 'Purchase FOB ($)', 'Allocated Expenses ($)', 'Final Landed Cost', 'Cost Inflation %']}
                />
                <TradeTableBody>
                  {reportData.landedCosts.flatMap((lc: any) =>
                    (lc.items || []).map((it: any, idx: number) => {
                      const fob = Number(it.unitFobCostUsd || 0);
                      const landed = Number(it.totalLandedUnitCostUsd || fob);
                      const allocated = landed - fob;
                      const variance = fob > 0 ? ((allocated / fob) * 100).toFixed(1) : '0';

                      return (
                        <TradeTableRow key={`${lc.id}-${idx}`}>
                          <TradeTableCell className="font-semibold text-gray-900">{it.productName}</TradeTableCell>
                          <TradeTableCell className="font-mono text-xs font-semibold text-[#014582]">
                            {lc.lcaNumber}
                          </TradeTableCell>
                          <TradeTableCell className="font-medium">${fob.toFixed(2)}</TradeTableCell>
                          <TradeTableCell className="text-amber-700 font-semibold">+${allocated.toFixed(2)}</TradeTableCell>
                          <TradeTableCell className="font-extrabold text-[#014582]">${landed.toFixed(2)}</TradeTableCell>
                          <TradeTableCell className="text-emerald-700 font-bold">+{variance}%</TradeTableCell>
                        </TradeTableRow>
                      );
                    })
                  )}
                </TradeTableBody>
              </TradeTable>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs">
                No landed cost allocation variance data available yet.
              </div>
            )}
          </TradeCard>
        </>
      )}
    </TradePage>
  );
}
