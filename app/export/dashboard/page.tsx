'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Send,
  FileCheck2,
  ShieldCheck,
  DollarSign,
  Receipt,
  FolderArchive,
  ArrowRight,
  Plus,
  ExternalLink,
  MapPin,
  BadgeDollarSign,
  Landmark,
  Coins,
  RefreshCw,
  AlertTriangle,
  Search,
  FileText,
  CircleDollarSign,
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
  TradeStatCard,
  TradeCard,
  TradeStatusBadge,
  TradeTable,
  TradeTableHeader,
  TradeTableBody,
  TradeTableRow,
  TradeTableCell,
  TRADE_COLORS,
} from '../../../components/trade/TradeUI';
import exportApi, {
  errorMessage,
  formatDate,
  formatMoney,
  type ExportDashboard,
} from '../../../lib/export-api';
import { useFiscalYear } from '../../../lib/fiscal-year-context';

const PIE_COLORS = ['#014582', '#0FA3E0', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

const EMPTY_DASHBOARD: ExportDashboard = {
  reportingCurrency: 'USD',
  range: { start: '', end: '' },
  kpis: {
    openInquiries: 0,
    openQuotations: 0,
    openOrders: 0,
    pendingApprovals: 0,
    contractedValue: 0,
    invoicedValue: 0,
    receiptsValue: 0,
    advanceValue: 0,
    receivableValue: 0,
    invoiceCount: 0,
    shipmentsInTransit: 0,
    documentsCount: 0,
  },
  conversionWarnings: [],
  byCountry: [],
  monthly: [],
  shipmentStatus: {},
  recentOrders: [],
  liveShipments: [],
  recentReceipts: [],
};

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  });
}

export default function ExportDashboardPage() {
  const { selectedFiscalYearId, selectedFiscalYear } = useFiscalYear();
  const [data, setData] = useState<ExportDashboard>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: Record<string, unknown> = {};
      if (useCustomRange && startDate && endDate) {
        query.startDate = startDate;
        query.endDate = endDate;
      } else if (selectedFiscalYearId) {
        query.fiscalYearId = selectedFiscalYearId;
      }
      const res = await exportApi.getDashboard(query);
      setData(res && res.kpis ? res : EMPTY_DASHBOARD);
    } catch (e) {
      setError(errorMessage(e, 'Failed to load export dashboard'));
      setData(EMPTY_DASHBOARD);
    } finally {
      setLoading(false);
    }
  }, [selectedFiscalYearId, useCustomRange, startDate, endDate]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const currency = data.reportingCurrency || 'USD';
  const money = (value: number) => formatMoney(value, currency);

  const destinationChartData = useMemo(
    () => (data.byCountry || []).map((c) => ({ name: c.country, value: c.value })),
    [data.byCountry]
  );
  const destinationTotal = destinationChartData.reduce((s, c) => s + Number(c.value || 0), 0);

  const monthlyData = useMemo(
    () =>
      (data.monthly || []).map((m) => ({
        month: monthLabel(m.month),
        contracted: Number(m.contracted || 0),
        invoiced: Number(m.invoiced || 0),
      })),
    [data.monthly]
  );

  const shipmentStatusRows = useMemo(
    () =>
      Object.entries(data.shipmentStatus || {})
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
    [data.shipmentStatus]
  );

  const kpis = data.kpis;
  const recentOrders = (data.recentOrders || []).slice(0, 5);
  const liveShipments = (data.liveShipments || []).slice(0, 4);
  const recentReceipts = (data.recentReceipts || []).slice(0, 5);

  const rangeLabel = useCustomRange
    ? `${startDate || '…'} → ${endDate || '…'}`
    : selectedFiscalYear?.name || (data.range?.start && data.range?.end
        ? `${formatDate(data.range.start)} → ${formatDate(data.range.end)}`
        : 'Current fiscal year');

  return (
    <TradePage>
      <TradePageHeader
        title="Export Management Dashboard"
        subtitle="Global buyer orders, commercial invoices, shipping declarations and international remittances"
        moduleName="Export Operations"
        icon={<Send className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/export/inquiries"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Export Inquiry
            </Link>
            <Link
              href="/export/reports"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Export Reports
            </Link>
          </div>
        }
      />

      {/* Reporting basis + period filter */}
      <div className="mb-4 p-3 rounded-xl bg-[#014582]/5 border border-[#014582]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-800">
          <Coins className="w-4 h-4 text-[#014582] shrink-0" />
          <span className="font-semibold">Reporting currency:</span>
          <span className="text-slate-600">
            Consolidated in <strong>{currency}</strong> · Period: <strong>{rangeLabel}</strong>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1 text-[11px] text-slate-600">
            <input
              type="checkbox"
              checked={useCustomRange}
              onChange={(e) => setUseCustomRange(e.target.checked)}
              className="w-3.5 h-3.5"
            />
            Custom dates
          </label>
          {useCustomRange ? (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-[#014582]/20 bg-white px-2 py-1 text-[11px] text-slate-700"
              />
              <span className="text-slate-400">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-[#014582]/20 bg-white px-2 py-1 text-[11px] text-slate-700"
              />
            </>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white text-[#014582] border border-[#014582]/20">
              Fiscal year: {selectedFiscalYear?.name || 'Auto'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setReloadKey((v) => v + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white text-[#014582] border border-[#014582]/20 hover:bg-[#014582]/5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </span>
          <button
            type="button"
            onClick={() => setReloadKey((v) => v + 1)}
            className="text-xs font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      {(data.conversionWarnings || []).length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Currency consolidation warnings
          </p>
          {data.conversionWarnings.map((w) => (
            <p key={w}>• {w}</p>
          ))}
        </div>
      )}

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading export book…
        </div>
      )}

      {/* Primary financial cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <TradeStatCard
          label={`Contracted Export Order Value (${currency})`}
          value={money(kpis.contractedValue)}
          icon={FileCheck2}
          color={TRADE_COLORS.primary}
          hint={`${kpis.openOrders} open order(s) · invoiced ${money(kpis.invoicedValue)}`}
          href="/export/orders"
        />
        <TradeStatCard
          label={`Recognized Export Revenue (${currency})`}
          value={money(kpis.invoicedValue)}
          icon={DollarSign}
          color={TRADE_COLORS.accent}
          hint={`${kpis.invoiceCount} order(s) with commercial invoice posted`}
          href="/export/shipments"
        />
        <TradeStatCard
          label={`Collected Receipts — Gross Realized (${currency})`}
          value={money(kpis.receiptsValue)}
          icon={BadgeDollarSign}
          color={TRADE_COLORS.success}
          hint={`Advances ${money(kpis.advanceValue)} · settled through export receipts`}
          href="/export/receipts"
        />
      </div>

      {/* Operational cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <TradeStatCard
          label={`Outstanding Export A/R (${currency})`}
          value={money(kpis.receivableValue)}
          icon={Receipt}
          color={TRADE_COLORS.danger}
          hint="Open balances after allocated advances and receipts"
          href="/export/receipts"
        />
        <TradeStatCard
          label="Open Export Orders"
          value={kpis.openOrders}
          icon={Landmark}
          color={TRADE_COLORS.purple}
          hint={`${kpis.pendingApprovals} quotation(s) awaiting approval`}
          href="/export/orders"
        />
        <TradeStatCard
          label="Ocean Shipments in Transit"
          value={kpis.shipmentsInTransit}
          icon={Send}
          color={TRADE_COLORS.accent}
          hint={`${shipmentStatusRows.length} shipment stage(s) recorded`}
          href="/export/shipments"
        />
        <TradeStatCard
          label="Open Inquiry Pipeline"
          value={kpis.openInquiries}
          icon={Search}
          color={TRADE_COLORS.primary}
          hint={`${kpis.openQuotations} open quotation(s) in negotiation`}
          href="/export/inquiries"
        />
        <TradeStatCard
          label="Export Shipping Documents"
          value={kpis.documentsCount}
          icon={FolderArchive}
          color={TRADE_COLORS.warning}
          hint="Document centre records for export orders"
          href="/export/documents"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <TradeCard
            title={`Monthly Export Performance (${currency})`}
            subtitle="Contracted bookings and recognized invoiced revenue by order month"
            action={
              <span className="text-xs font-semibold text-[#014582] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                {monthlyData.length} month(s) in range
              </span>
            }
          >
            <div className="h-[280px] w-full pt-2">
              {monthlyData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No export orders in the selected period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${currency} ${val / 1000}k`} />
                    <Tooltip
                      formatter={(val, name) => [formatMoney(Number(val ?? 0), currency), String(name ?? '')]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                    <Bar dataKey="contracted" name="Contracted Bookings" fill="#014582" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="invoiced" name="Recognized Invoiced Revenue" fill="#0FA3E0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TradeCard>
        </div>

        <div>
          <TradeCard
            title="Export Sales by Destination"
            subtitle="Contracted value by buyer country"
          >
            <div className="h-[280px] w-full flex flex-col justify-between">
              <div className="h-[150px] w-full">
                {destinationChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No destination data in range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={destinationChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        innerRadius={40}
                        paddingAngle={3}
                      >
                        {destinationChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [formatMoney(Number(val ?? 0), currency), 'Contracted']}
                        contentStyle={{ borderRadius: '10px', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-1.5 text-xs pt-2 border-t border-gray-100 overflow-y-auto max-h-[120px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Contracted {money(destinationTotal)}
                </p>
                {data.byCountry.map((c) => (
                  <div key={c.country} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-medium text-gray-700 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#014582] shrink-0" />
                      <span className="truncate max-w-[120px]">{c.country}</span>
                      <span className="text-[10px] text-slate-400">({c.orders})</span>
                    </span>
                    <span className="font-bold text-gray-900 whitespace-nowrap">{money(c.value)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-dashed border-gray-200">
                <Link
                  href="/export/reports"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#014582] hover:underline"
                >
                  Open territorial report <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </TradeCard>
        </div>
      </div>

      {/* Shipments + orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TradeCard
          title="Outbound Shipment Tracking"
          subtitle="Vessel voyages, carrier status and ports of discharge"
          action={
            <Link
              href="/export/shipments"
              className="text-xs font-semibold text-[#014582] hover:underline flex items-center gap-1"
            >
              All Shipments <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-4">
            {liveShipments.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No live export shipments.</p>
            ) : (
              liveShipments.map((shp) => (
                <div
                  key={shp.id}
                  className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white hover:border-[#014582]/40 transition-all shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Send className="w-4 h-4 text-[#014582] shrink-0" />
                      <span className="text-xs font-bold text-gray-900">{shp.shipmentNumber}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-600 truncate">{shp.blNumber || 'B/L pending'}</span>
                    </div>
                    <TradeStatusBadge status={shp.shipmentStatus} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Route</span>
                      <span className="font-medium text-gray-800 truncate block">
                        {shp.portOfLoading || '—'} → {shp.portOfDischarge || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Shipping Line & Vessel</span>
                      <span className="font-medium text-gray-800 truncate block">
                        {shp.shippingLine || '—'} ({shp.vesselName || '—'})
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-start gap-2 text-xs text-emerald-900">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="text-[11px] leading-tight font-medium">
                      {shp.currentPosition || 'Position not updated'}
                    </span>
                    <span className="ml-auto text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                      ETA: {formatDate(shp.eta)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </TradeCard>

        <TradeCard
          title="Recent Export Sales Orders"
          subtitle="Overseas contracts confirmed and in fulfillment"
          action={
            <Link
              href="/export/orders"
              className="text-xs font-semibold text-[#014582] hover:underline flex items-center gap-1"
            >
              All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No export orders yet.</p>
          ) : (
            <TradeTable>
              <TradeTableHeader columns={['Order No', 'Customer', 'Destination', 'Contract Value', 'Payment Term', 'Status']} />
              <TradeTableBody>
                {recentOrders.map((ord) => (
                  <TradeTableRow key={ord.id}>
                    <TradeTableCell className="font-bold text-[#014582]">
                      <Link href={`/export/orders?order=${ord.orderNumber}`} className="hover:underline">
                        {ord.orderNumber}
                      </Link>
                    </TradeTableCell>
                    <TradeTableCell>
                      <span className="font-medium text-gray-800 block truncate max-w-[130px]">{ord.customerName}</span>
                      <span className="text-[10px] text-gray-400">{ord.customerCountry || '—'}</span>
                    </TradeTableCell>
                    <TradeTableCell>
                      <span className="text-xs text-gray-700 truncate max-w-[120px] block">
                        {ord.destinationPort || '—'}
                      </span>
                    </TradeTableCell>
                    <TradeTableCell className="font-bold text-gray-900">
                      {formatMoney(ord.totalForeign, ord.currency)}
                      {ord.currency !== currency ? (
                        <span className="block text-[10px] font-normal text-gray-400">
                          ≈ {formatMoney(ord.totalBase, currency)}
                        </span>
                      ) : null}
                    </TradeTableCell>
                    <TradeTableCell>
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[130px] block">
                        {ord.paymentTerms || '—'}
                      </span>
                    </TradeTableCell>
                    <TradeTableCell>
                      <TradeStatusBadge status={ord.status} />
                    </TradeTableCell>
                  </TradeTableRow>
                ))}
              </TradeTableBody>
            </TradeTable>
          )}
        </TradeCard>
      </div>

      {/* Receipts + workflow snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TradeCard
            title="Recent Export Receipts"
            subtitle="Advances and settlement remittances recorded against export orders"
            action={
              <Link
                href="/export/receipts"
                className="text-xs font-semibold text-[#014582] hover:underline flex items-center gap-1"
              >
                Receipt Ledger <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {recentReceipts.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No export receipts recorded yet.</p>
            ) : (
              <TradeTable>
                <TradeTableHeader columns={['Receipt No', 'Buyer', 'Type', 'Date', 'Foreign Amount', 'Net (base)', 'Status']} />
                <TradeTableBody>
                  {recentReceipts.map((r) => (
                    <TradeTableRow key={r.id}>
                      <TradeTableCell className="font-bold text-[#014582]">{r.receiptNumber}</TradeTableCell>
                      <TradeTableCell className="text-gray-800 font-medium truncate max-w-[150px]">
                        {r.customerName}
                      </TradeTableCell>
                      <TradeTableCell>
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {r.receiptType}
                        </span>
                      </TradeTableCell>
                      <TradeTableCell className="text-gray-600 text-xs">{formatDate(r.receiptDate)}</TradeTableCell>
                      <TradeTableCell className="font-semibold text-gray-900">
                        {formatMoney(r.foreignAmount, r.currency)}
                      </TradeTableCell>
                      <TradeTableCell className="font-bold text-emerald-700">
                        {formatMoney(r.netBase, currency)}
                      </TradeTableCell>
                      <TradeTableCell>
                        <TradeStatusBadge status={r.status} />
                      </TradeTableCell>
                    </TradeTableRow>
                  ))}
                </TradeTableBody>
              </TradeTable>
            )}
          </TradeCard>
        </div>

        <div>
          <TradeCard title="Export Workflow Snapshot" subtitle="Live pipeline and shipment milestones">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-600 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#014582]" /> Open inquiries
                </span>
                <strong className="text-sm text-gray-900">{kpis.openInquiries}</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-600 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#014582]" /> Open quotations
                </span>
                <strong className="text-sm text-gray-900">{kpis.openQuotations}</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-600 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Pending approvals
                </span>
                <strong className="text-sm text-gray-900">{kpis.pendingApprovals}</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-600 flex items-center gap-2">
                  <FolderArchive className="w-3.5 h-3.5 text-purple-600" /> Shipping documents
                </span>
                <strong className="text-sm text-gray-900">{kpis.documentsCount}</strong>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1.5">Shipment stages</p>
                {shipmentStatusRows.length === 0 ? (
                  <p className="text-xs text-gray-400">No shipment records in this company.</p>
                ) : (
                  <div className="space-y-1.5">
                    {shipmentStatusRows.map((row) => (
                      <div key={row.status} className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-600 truncate max-w-[150px]">{row.status}</span>
                        <strong className="text-gray-900">{row.count}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TradeCard>
        </div>
      </div>
    </TradePage>
  );
}
