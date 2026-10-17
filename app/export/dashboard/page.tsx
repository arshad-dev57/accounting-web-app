'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import {
  Send,
  FileCheck2,
  ShieldCheck,
  DollarSign,
  Receipt,
  FolderArchive,
  Truck,
  ArrowRight,
  Plus,
  ExternalLink,
  MapPin,
  BadgeDollarSign,
  Landmark,
  Coins,
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
  MockBookBanner,
  TRADE_COLORS,
} from '../../../components/trade/TradeUI';
import { useTradeStore, getExportKpis } from '../../../lib/mock/trade-store';
import { useCurrency } from '../../../lib/currency-context';

// Mathematically consistent monthly performance series in USD
// Target: $210,000 | Actual Bookings: $233,500 (+11.19% ~ +11.2% above target)
// Recognized Revenue: $84,000 (shipped/invoiced orders) | Realized Receipts: $25,200
const MONTHLY_EXPORT_PERFORMANCE = [
  { month: 'May 2026', target: 80000, bookings: 95000, recognizedRevenue: 95000 },
  { month: 'Jun 2026', target: 100000, bookings: 110000, recognizedRevenue: 110000 },
  { month: 'Jul 2026', target: 120000, bookings: 135000, recognizedRevenue: 135000 },
  { month: 'Aug 2026', target: 150000, bookings: 168000, recognizedRevenue: 168000 },
  { month: 'Sep 2026', target: 175000, bookings: 182000, recognizedRevenue: 182000 },
  { month: 'Oct 2026 (MTD)', target: 210000, bookings: 233500, recognizedRevenue: 84000 },
];

// Breakdown of confirmed export contracts:
// Total Confirmed = $149,500 (Saudi Arabia, 64.0%) + $84,000 (Singapore, 36.0%) = $233,500 (100.0%)
const CONFIRMED_DESTINATIONS = [
  { country: 'Saudi Arabia', revenue: 149500, percentage: 64.0, flag: '🇸🇦', port: 'Riyadh Dry Port', terms: 'LC 60 Days Usance' },
  { country: 'Singapore', revenue: 84000, percentage: 36.0, flag: '🇸🇬', port: 'Port of Singapore', terms: '30% Adv, 70% vs BL' },
];

// Active quotation pipeline (uncontracted inquiries / quotes)
const PIPELINE_DESTINATIONS = [
  { country: 'Australia', value: 91500, stage: 'Quotation Sent (EQT-2026-0082)', flag: '🇦🇺' },
  { country: 'United Kingdom', value: 65000, stage: 'Technical Review (EINQ-2026-0061)', flag: '🇬🇧' },
];

const PIE_COLORS = ['#014582', '#0FA3E0'];

export default function ExportDashboardPage() {
  const { state } = useTradeStore();
  const { code: systemCurrencyCode } = useCurrency();
  const kpis = getExportKpis(state);

  // Exchange rate basis indicator for dual-currency reporting
  const fxUsdToPkr = 278.50;
  const formatDual = (usdVal: number) => {
    const usdStr = `$${usdVal.toLocaleString()}`;
    if (systemCurrencyCode === 'PKR') {
      const pkrVal = Math.round(usdVal * fxUsdToPkr);
      return `${usdStr} (PKR ${pkrVal.toLocaleString()})`;
    }
    return usdStr;
  };

  const destinationChartData = CONFIRMED_DESTINATIONS.map((c) => ({
    name: c.country,
    value: c.revenue,
  }));

  const recentOrders = state.exportOrders.slice(0, 5);
  const liveShipments = state.exportShipments.slice(0, 4);
  const dispatches = state.exportDispatches.slice(0, 3);

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
              href="/sales/orders"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Sales Order (ERP)
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

      <MockBookBanner
        moduleName="Export Management"
        ownershipNote="International export book only (ESO-* / ESHP-* / EREC-*). Domestic trading orders (TSO-*) are owned by Trading and are not included here."
      />

      {/* Explicit Currency and Valuation Basis Banner */}
      <div className="mb-4 p-3 rounded-xl bg-[#014582]/5 border border-[#014582]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-800">
          <Coins className="w-4 h-4 text-[#014582] shrink-0" />
          <span className="font-semibold">Reporting currency:</span>
          <span className="text-slate-600">
            Contract amounts in <strong>USD</strong>. ERP display currency:{' '}
            <strong>{systemCurrencyCode}</strong>. Dual labels use illustrative FX{' '}
            <strong>1 USD = {fxUsdToPkr.toFixed(2)} PKR</strong> (demo rate — not live Accounting FX).
          </span>
        </div>
        <Link
          href="/sales/orders"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white text-[#014582] border border-[#014582]/20 hover:bg-[#014582]/5"
        >
          <ExternalLink className="w-3 h-3" /> Sales Orders (ERP)
        </Link>
      </div>

      {/* Primary Financial Distinction Cards: Bookings vs Recognized Revenue vs Collected Receipts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <TradeStatCard
          label="Contracted Export Order Value (USD)"
          value={formatDual(kpis.contractedExportOrderValueUsd)}
          icon={FileCheck2}
          color={TRADE_COLORS.primary}
          hint={`Backlog $${kpis.unfulfilledBacklogUsd.toLocaleString()} + recognized $${kpis.recognizedExportRevenueUsd.toLocaleString()}`}
          href="/export/orders"
        />
        <TradeStatCard
          label="Recognized Export Revenue (USD)"
          value={formatDual(kpis.recognizedExportRevenueUsd)}
          icon={DollarSign}
          color={TRADE_COLORS.accent}
          hint="Shipped / on-board / dispatched orders with commercial invoice"
          href="/export/shipments"
        />
        <TradeStatCard
          label="Collected Receipts — Net Realized (USD)"
          value={formatDual(kpis.realizedReceiptsUsd)}
          icon={BadgeDollarSign}
          color={TRADE_COLORS.success}
          hint={`Gross remittance $${kpis.grossRemittanceUsd.toLocaleString()} less bank charges`}
          href="/export/receipts"
        />
      </div>

      {/* Secondary Operational & Balance Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <TradeStatCard
          label="Outstanding Invoiced A/R (USD)"
          value={formatDual(kpis.outstandingInvoicedReceivablesUsd)}
          icon={Receipt}
          color={TRADE_COLORS.danger}
          hint="Open invoice balances after allocated receipts (not LC-backed)"
          href="/export/receipts"
        />
        <TradeStatCard
          label="LC-Secured Unshipped (USD)"
          value={formatDual(kpis.lcSecuredReceivablesUsd)}
          icon={Landmark}
          color={TRADE_COLORS.purple}
          hint={`Only confirmed LC cover (${kpis.lcCoverPct.toFixed(0)}% of bookings) — Al-Noor`}
          href="/export/finance"
        />
        <TradeStatCard
          label="Ocean Shipments in Transit"
          value={kpis.inTransit}
          icon={Send}
          color={TRADE_COLORS.accent}
          hint={`${kpis.shipmentCount} shipment record(s) in mock book`}
          href="/export/shipments"
        />
        <TradeStatCard
          label="Customs LEO Granted"
          value={kpis.customsCleared}
          icon={ShieldCheck}
          color={TRADE_COLORS.primary}
          hint={`${kpis.customsPending} declaration(s) still pending`}
          href="/export/customs"
        />
        <TradeStatCard
          label="Export Shipping Documents"
          value={kpis.totalExportDocuments}
          icon={FolderArchive}
          color={TRADE_COLORS.warning}
          hint={`${kpis.pendingExportDocuments} pending, ${kpis.legalizedOrDispatchedDocuments} legalized/dispatched`}
          href="/export/documents"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly Export Revenue Chart */}
        <div className="lg:col-span-2">
          <TradeCard
            title="Monthly Export Performance (USD)"
            subtitle="Contracted Bookings & Recognized Revenue vs Target (All amounts in USD)"
            action={
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Bookings: +11.2% Above Target
              </span>
            }
          >
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_EXPORT_PERFORMANCE} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    formatter={(val, name) => [`$${Number(val ?? 0).toLocaleString()} USD`, String(name ?? '')]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                  <Bar dataKey="bookings" name="Contracted Bookings ($)" fill="#014582" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recognizedRevenue" name="Recognized Shipped Revenue ($)" fill="#0FA3E0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="Monthly Target ($)" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TradeCard>
        </div>

        {/* Destination Countries */}
        <div>
          <TradeCard
            title="Export Sales by Destination"
            subtitle="Confirmed Contracts & Pipeline (USD)"
          >
            <div className="h-[280px] w-full flex flex-col justify-between">
              <div className="h-[150px] w-full">
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
                      formatter={(val) => [`$${Number(val ?? 0).toLocaleString()} USD`, 'Confirmed']}
                      contentStyle={{ borderRadius: '10px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Confirmed Contracts Breakdown */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-gray-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Confirmed Contracts ($233.5K Total)
                </p>
                {CONFIRMED_DESTINATIONS.map((c) => (
                  <div key={c.country} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-gray-700">
                      <span>{c.flag}</span>
                      <span className="truncate max-w-[120px]">{c.country}</span>
                      <span className="text-[10px] text-slate-400">({c.percentage}%)</span>
                    </span>
                    <span className="font-bold text-gray-900">${c.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Active Pipeline Preview */}
              <div className="pt-2 border-t border-dashed border-gray-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Active Pipeline (Inquiries & Quotes)
                </p>
                {PIPELINE_DESTINATIONS.map((p) => (
                  <div key={p.country} className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <span>{p.flag}</span>
                      <span className="truncate max-w-[130px]">{p.country}: {p.stage}</span>
                    </span>
                    <span className="font-semibold text-slate-800">${p.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </TradeCard>
        </div>
      </div>

      {/* Shipment Tracking & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Shipment Tracking */}
        <TradeCard
          title="Outbound Shipment Tracking"
          subtitle="Live vessel voyages, carrier status and ports of discharge"
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
            {liveShipments.map((shp) => (
              <div
                key={shp.id}
                className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white hover:border-[#014582]/40 transition-all shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#014582]" />
                    <span className="text-xs font-bold text-gray-900">{shp.shipmentNumber}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600">{shp.blNumber}</span>
                  </div>
                  <TradeStatusBadge status={shp.shipmentStatus} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Route</span>
                    <span className="font-medium text-gray-800 truncate block">
                      {shp.portOfLoading} → {shp.portOfDischarge}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Shipping Line & Vessel</span>
                    <span className="font-medium text-gray-800 truncate block">
                      {shp.shippingLine} ({shp.vesselName})
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-start gap-2 text-xs text-emerald-900">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-[11px] leading-tight font-medium">{shp.currentPosition}</span>
                  <span className="ml-auto text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                    ETA: {shp.eta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </TradeCard>

        {/* Recent Export Orders */}
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
                    <span className="text-[10px] text-gray-400">{ord.customerCountry}</span>
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="text-xs text-gray-700 truncate max-w-[120px] block">{ord.destinationPort}</span>
                  </TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {formatDual(ord.totalOrderUsd)}
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[130px] block">
                      {ord.paymentTerms}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={ord.status} />
                  </TradeTableCell>
                </TradeTableRow>
              ))}
            </TradeTableBody>
          </TradeTable>
        </TradeCard>
      </div>

      {/* Dispatches & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TradeCard
            title="Upcoming & Live Port Dispatches"
            subtitle="Factory gate-out to container terminal gate-in status"
            action={
              <Link
                href="/export/dispatch"
                className="text-xs font-semibold text-[#014582] hover:underline flex items-center gap-1"
              >
                Dispatch Hub <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-3">
              {dispatches.map((disp) => (
                <div
                  key={disp.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#014582] flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900">{disp.dispatchNumber} ({disp.orderRef})</p>
                      <p className="text-[11px] text-gray-500">
                        {disp.transporterName} • Vehicle: {disp.truckNo} • Driver: {disp.driverName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      Seal: {disp.sealNo}
                    </span>
                    <TradeStatusBadge status={disp.status} />
                  </div>
                </div>
              ))}
            </div>
          </TradeCard>
        </div>

        <div>
          <TradeCard title="Export Operations Stream" subtitle="Live milestones & alerts">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">Let Export Order (LEO) Granted</p>
                  <p className="text-gray-500 text-[11px]">Shipping Bill EXP-SB-2026-9921 cleared by Dubai Customs.</p>
                  <span className="text-[10px] text-gray-400">Oct 7, 2026 • Port Jebel Ali</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">Container Stuffed & Sealed</p>
                  <p className="text-gray-500 text-[11px]">CMAU7719280 passed SGS pre-shipment inspection.</p>
                  <span className="text-[10px] text-gray-400">Oct 12, 2026 • Certificate SGS-CERT-AE-8819</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">Forex Advance Remittance Realized</p>
                  <p className="text-gray-500 text-[11px]">USD 25,165 credited to Nostro account from SingaTrade.</p>
                  <span className="text-[10px] text-gray-400">Aug 25, 2026 • Ref EREC-2026-0019</span>
                </div>
              </div>
            </div>
          </TradeCard>
        </div>
      </div>
    </TradePage>
  );
}
