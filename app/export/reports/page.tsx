'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import {
  BarChart4,
  Download,
  FileSpreadsheet,
  FileText,
  DollarSign,
  TrendingUp,
  Globe,
  Send,
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
  TradeCard,
  TradeTable,
  TradeTableHeader,
  TradeTableBody,
  TradeTableRow,
  TradeTableCell,
  TradeStatCard,
  TRADE_COLORS,
} from '../../../components/trade/TradeUI';
import { useTradeStore, getExportKpis } from '../../../lib/mock/trade-store';

const COUNTRY_REPORT = [
  { country: 'Saudi Arabia', orders: 1, revenue: 149500, share: '64.0%', leadTime: '18 Days' },
  { country: 'Singapore', orders: 1, revenue: 84000, share: '36.0%', leadTime: '16 Days' },
];

export default function ExportReportsPage() {
  const { state } = useTradeStore();
  const kpis = getExportKpis(state);

  return (
    <TradePage>
      <TradePageHeader
        title="Export Intelligence & Performance Reports"
        subtitle="Global market penetration, destination country performance, LC settlement ratios and duty drawback recovery"
        moduleName="Export Reports"
        backHref="/export/dashboard"
        icon={<BarChart4 className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert('Simulated export: Export_Executive_Report_2026.xlsx')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
            </button>
            <button
              type="button"
              onClick={() => alert('Simulated export: Export_Compliance_Audit_2026.pdf')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-all"
            >
              <FileText className="w-4 h-4" /> Export PDF
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <TradeStatCard
          label="Contracted Bookings (USD)"
          value={`$${kpis.contractedExportOrderValueUsd.toLocaleString()}`}
          icon={DollarSign}
          color={TRADE_COLORS.primary}
          hint={`Recognized revenue $${kpis.recognizedExportRevenueUsd.toLocaleString()}`}
        />
        <TradeStatCard
          label="LC Cover of Bookings"
          value={`${kpis.lcCoverPct.toFixed(0)}%`}
          icon={TrendingUp}
          color={TRADE_COLORS.warning}
          hint={`$${kpis.lcSecuredReceivablesUsd.toLocaleString()} LC · $${kpis.outstandingInvoicedReceivablesUsd.toLocaleString()} open A/R (non-LC)`}
        />
        <TradeStatCard
          label="Confirmed Markets"
          value="2 Countries"
          icon={Globe}
          color={TRADE_COLORS.accent}
          hint="Saudi Arabia + Singapore (2 pipeline markets)"
        />
        <TradeStatCard
          label="Shipments / Documents"
          value={`${kpis.shipmentCount} / ${kpis.totalExportDocuments}`}
          icon={Send}
          color={TRADE_COLORS.purple}
          hint="Counts match export mock records"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TradeCard
          title="Revenue by Destination Territory"
          subtitle="Territorial sales volume distribution (USD)"
        >
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COUNTRY_REPORT} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  formatter={(val) => [`$${Number(val ?? 0).toLocaleString()}`, 'Export Turnover']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" name="Export Revenue" fill="#014582" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TradeCard>

        <TradeCard
          title="Customs Duty Drawback Recovery"
          subtitle="Government export incentives and drawback eligibility audit"
        >
          <TradeTable>
            <TradeTableHeader columns={['Shipping Bill', 'Export Port', 'FOB Value', 'Drawback Rate', 'Incentive Refund', 'LEO Date']} />
            <TradeTableBody>
              {state.exportCustoms.map((c) => (
                <TradeTableRow key={c.id}>
                  <TradeTableCell className="font-mono text-xs font-semibold">{c.shippingBillNo}</TradeTableCell>
                  <TradeTableCell className="text-xs">{c.exportPort}</TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">${c.fobValueUsd.toLocaleString()}</TradeTableCell>
                  <TradeTableCell className="font-semibold text-emerald-700">3.0%</TradeTableCell>
                  <TradeTableCell className="font-bold text-emerald-700">
                    ${c.dutyDrawbackEstimatedUsd.toLocaleString()}
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-600">{c.leoDate}</TradeTableCell>
                </TradeTableRow>
              ))}
            </TradeTableBody>
          </TradeTable>
        </TradeCard>
      </div>

      <TradeCard
        title="Territorial Export Performance Matrix"
        subtitle="Country-level order volume, revenue share and transit velocity"
      >
        <TradeTable>
          <TradeTableHeader columns={['Destination Country', 'Active Orders', 'Total Sales Revenue (USD)', 'Volume Share %', 'Average Lead Time', 'LC Coverage']} />
          <TradeTableBody>
            {COUNTRY_REPORT.map((c) => (
              <TradeTableRow key={c.country}>
                <TradeTableCell className="font-bold text-gray-900">{c.country}</TradeTableCell>
                <TradeTableCell className="text-gray-700 font-semibold">{c.orders}</TradeTableCell>
                <TradeTableCell className="font-extrabold text-[#014582]">${c.revenue.toLocaleString()}</TradeTableCell>
                <TradeTableCell className="font-bold text-emerald-700">{c.share}</TradeTableCell>
                <TradeTableCell className="text-gray-700">{c.leadTime}</TradeTableCell>
                <TradeTableCell>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      c.country === 'Saudi Arabia'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {c.country === 'Saudi Arabia' ? 'Confirmed LC' : 'Open Account / CAD'}
                  </span>
                </TradeTableCell>
              </TradeTableRow>
            ))}
          </TradeTableBody>
        </TradeTable>
      </TradeCard>
    </TradePage>
  );
}
