'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Ship,
  ShoppingCart,
  TrendingUp,
  Clock,
  ShieldAlert,
  CalendarDays,
  DollarSign,
  Receipt,
  Calculator,
  FolderOpen,
  ArrowRight,
  Plus,
  RefreshCw,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertTriangle,
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
  LineChart,
  Line,
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
import importApi, { ImportKpis } from '../../../lib/import-api';
import { useCurrency } from '../../../lib/currency-context';
import { formatImportMoney } from '../../../lib/import-format';

const PIE_COLORS = ['#014582', '#0FA3E0', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

const EMPTY_KPIS: ImportKpis = {
  totalImportOrders: 0,
  totalImportValueUsd: 0,
  activeShipmentsInTransit: 0,
  inTransitValueUsd: 0,
  customsPendingClearance: 0,
  customsDutyPayableUsd: 0,
  completedReceivedOrders: 0,
  totalLandedCostAllocatedUsd: 0,
  averageLandedCostExpensePct: 0,
  supplierLiabilitiesUsd: 0,
  recentOrders: [],
  liveShipments: [],
  pendingDocs: [],
};

export default function ImportDashboardPage() {
  const { code: baseCurrencyCode } = useCurrency();
  const [kpis, setKpis] = React.useState<ImportKpis>(EMPTY_KPIS);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Transit' | 'Customs'>('All');

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    importApi.getDashboard()
      .then((data) => { if (!cancelled) setKpis(data); })
      .catch((err) => { if (!cancelled) setError(err?.response?.data?.message || err.message || 'Failed to load dashboard'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Live company-scoped figures only — no illustrative prior months.
  const MONTHLY_IMPORT_TREND = [
    {
      month: 'Open PO Commitment',
      value: kpis.totalImportValueUsd,
      landedCost: Math.round(
        kpis.totalImportValueUsd + (kpis.totalLandedCostAllocatedUsd || 0)
      ),
    },
    {
      month: 'In Transit Value',
      value: kpis.inTransitValueUsd,
      landedCost: kpis.inTransitValueUsd,
    },
    {
      month: 'Landed Expenses',
      value: 0,
      landedCost: kpis.totalLandedCostAllocatedUsd,
    },
    {
      month: 'Open AP (Bills)',
      value: kpis.supplierLiabilitiesUsd,
      landedCost: kpis.supplierLiabilitiesUsd,
    },
  ].filter((r) => r.value > 0 || r.landedCost > 0);

  const statusDistribution = [
    { name: 'In Transit', value: kpis.activeShipmentsInTransit },
    { name: 'Customs Pending', value: kpis.customsPendingClearance },
    { name: 'Completed / Received', value: kpis.completedReceivedOrders },
  ].filter((s) => s.value > 0);

  const recentOrders = kpis.recentOrders.slice(0, 5);
  const liveShipments = kpis.liveShipments.slice(0, 4);
  const pendingDocs = kpis.pendingDocs;

  return (
    <TradePage>
      <TradePageHeader
        title="Import Management Dashboard"
        subtitle="End-to-end international procurement, customs clearance, transit tracking and landed costs"
        moduleName="Import Operations"
        icon={<Ship className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/purchases/purchaseorder"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Purchase Order (ERP)
            </Link>
            <Link
              href="/import/reports"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Reports
            </Link>
          </div>
        }
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading import data…
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <TradeStatCard
          label="Total Import Orders"
          value={kpis.totalImportOrders}
          icon={ShoppingCart}
          color={TRADE_COLORS.primary}
          hint={`${kpis.activeShipmentsInTransit} in transit`}
          href="/import/purchase-orders"
        />
        <TradeStatCard
          label="Goods in Transit"
          value={kpis.activeShipmentsInTransit}
          icon={Ship}
          color={TRADE_COLORS.accent}
          hint={`$${kpis.inTransitValueUsd.toLocaleString()} USD value`}
          href="/import/shipments"
        />
        <TradeStatCard
          label="Customs Clearance Pending"
          value={kpis.customsPendingClearance}
          icon={ShieldAlert}
          color={TRADE_COLORS.warning}
          hint={`$${kpis.customsDutyPayableUsd.toLocaleString()} duties`}
          href="/import/customs"
        />
        <TradeStatCard
          label="Completed Orders"
          value={kpis.completedReceivedOrders}
          icon={CheckCircle2}
          color={TRADE_COLORS.success}
          hint="Received & closed"
          href="/import/grn"
        />
        <TradeStatCard
          label="Total Import Value (USD)"
          value={`$${kpis.totalImportValueUsd.toLocaleString()}`}
          icon={DollarSign}
          color={TRADE_COLORS.primary}
          hint="Sum of all import purchase orders"
          href="/import/purchase-orders"
        />
        <TradeStatCard
          label="Open Supplier Liabilities (USD)"
          value={`$${kpis.supplierLiabilitiesUsd.toLocaleString()}`}
          icon={Receipt}
          color={TRADE_COLORS.danger}
          hint="Outstanding import supplier bill balances"
          href="/import/bills"
        />
        <TradeStatCard
          label="Avg Landed Expense %"
          value={`+${kpis.averageLandedCostExpensePct.toFixed(1)}%`}
          icon={Calculator}
          color={TRADE_COLORS.accent}
          hint={`$${kpis.totalLandedCostAllocatedUsd.toLocaleString()} allocated`}
          href="/import/landed-costs"
        />
        <TradeStatCard
          label="Pending Documents"
          value={kpis.pendingDocs.length}
          icon={FolderOpen}
          color={TRADE_COLORS.warning}
          hint="Awaiting review in document centre"
          href="/import/documents"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Import Value & Landed Cost Trend */}
        <div className="lg:col-span-2">
          <TradeCard
            title="Monthly Import Value & Landed Cost Trend"
            subtitle="FOB Purchase commitment vs Final Landed Valuation (USD)"
            action={
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Landed Multiplier: ~1.17x
              </span>
            }
          >
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_IMPORT_TREND} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    formatter={(val) => [`$${Number(val ?? 0).toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                  <Bar dataKey="value" name="FOB Purchase Value" fill="#014582" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="landedCost" name="Total Landed Cost" fill="#0FA3E0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TradeCard>
        </div>

        {/* Import Status Distribution */}
        <div>
          <TradeCard
            title="Import Status Distribution"
            subtitle="Pipeline breakdown across foreign trade stages"
          >
            <div className="h-[280px] w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] w-full mt-2">
                {statusDistribution.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="text-gray-600 truncate">{item.name}</span>
                    <strong className="text-gray-900 ml-auto">{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </TradeCard>
        </div>
      </div>

      {/* Shipment Tracking Overview & Upcoming Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TradeCard
          title="Shipment Tracking Overview"
          subtitle="Real-time container logistics and carrier milestones"
          action={
            <Link
              href="/import/shipments"
              className="text-xs font-semibold text-[#014582] hover:underline flex items-center gap-1"
            >
              View All Shipments <ArrowRight className="w-3.5 h-3.5" />
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
                    <Ship className="w-4 h-4 text-[#014582]" />
                    <span className="text-xs font-bold text-gray-900">{shp.shipmentNumber}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600">{shp.blAwbNumber}</span>
                  </div>
                  <TradeStatusBadge status={shp.shipmentStatus} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Route</span>
                    <span className="font-medium text-gray-800 truncate block">
                      {shp.originPort} → {shp.destinationPort}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Carrier & Vessel</span>
                    <span className="font-medium text-gray-800 truncate block">
                      {shp.carrierName}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start gap-2 text-xs text-blue-900">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <span className="text-[11px] leading-tight font-medium">{shp.shipmentStatus}</span>
                  <span className="ml-auto text-[11px] font-bold text-blue-700 whitespace-nowrap">
                    ETA: {shp.eta ? new Date(shp.eta).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </TradeCard>

        {/* Recent Import Orders */}
        <TradeCard
          title="Recent Import Orders"
          subtitle="Latest Purchase Orders raised with overseas suppliers"
          action={
            <Link
              href="/import/purchase-orders"
              className="text-xs font-semibold text-[#014582] hover:underline flex items-center gap-1"
            >
              All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <TradeTable>
            <TradeTableHeader columns={['PO Number', 'Supplier', 'Incoterm', 'Value (USD)', 'Status']} />
            <TradeTableBody>
              {recentOrders.map((po) => (
                <TradeTableRow key={po.id}>
                  <TradeTableCell className="font-bold text-[#014582]">
                    <Link href={`/import/purchase-orders?po=${po.poNumber}`} className="hover:underline">
                      {po.poNumber}
                    </Link>
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="font-medium text-gray-800 block truncate max-w-[130px]">{po.supplierName}</span>
                    <span className="text-[10px] text-gray-400">{po.supplierCountry}</span>
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="px-2 py-0.5 rounded bg-gray-100 font-bold text-[11px] text-gray-700">
                      {po.incoterm}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {formatImportMoney(po.totalUsd, baseCurrencyCode, { decimals: 0 })}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={po.status} />
                  </TradeTableCell>
                </TradeTableRow>
              ))}
            </TradeTableBody>
          </TradeTable>
        </TradeCard>
      </div>

      {/* Pending Documents & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TradeCard
            title="Required Trade Documents Checklist"
            subtitle="Customs clearance and bank LC compliance documents"
            action={
              <Link
                href="/import/documents"
                className="text-xs font-semibold text-[#014582] hover:underline flex items-center gap-1"
              >
                Document Center <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-3">
              {pendingDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#014582] flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{doc.documentType}</p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {doc.documentNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-gray-500 hidden sm:inline">{doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : ''}</span>
                    <TradeStatusBadge status={doc.status} />
                  </div>
                </div>
              ))}
            </div>
          </TradeCard>
        </div>

        {/* Recent Import Activities */}
        <div>
          <TradeCard title="Recent Activity" subtitle="Real-time operations log">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">Customs BOE-DXB-998124 Assessed</p>
                  <p className="text-gray-500 text-[11px]">Duty USD 2,940 assessed at DXB Cargo terminal.</p>
                  <span className="text-[10px] text-gray-400">Today at 14:20</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">Shipment ISHP-2026-0182 Transshipment</p>
                  <p className="text-gray-500 text-[11px]">Container TGHU9231450 arrived Singapore port.</p>
                  <span className="text-[10px] text-gray-400">Yesterday at 18:45</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">LC Issued by Emirates NBD</p>
                  <p className="text-gray-500 text-[11px]">LC-DXB-2026-0994 for USD 81,214 advised.</p>
                  <span className="text-[10px] text-gray-400">2 days ago</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">Landed Cost Allocated</p>
                  <p className="text-gray-500 text-[11px]">LCA-2026-0021 posted USD 6,040 to inventory.</p>
                  <span className="text-[10px] text-gray-400">3 days ago</span>
                </div>
              </div>
            </div>
          </TradeCard>
        </div>
      </div>
    </TradePage>
  );
}
