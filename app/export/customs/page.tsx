'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  DollarSign,
  FileCheck,
} from 'lucide-react';
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
  TradeDetailDrawer,
} from '../../../components/trade/TradeUI';
import { useTradeStore } from '../../../lib/mock/trade-store';
import { useCurrency } from '../../../lib/currency-context';
import type { ExportCustomsDeclaration } from '../../../lib/mock/trade-data';

export default function ExportCustomsPage() {
  const { state } = useTradeStore();
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState('');
  const [selectedCustoms, setSelectedCustoms] = useState<ExportCustomsDeclaration | null>(null);

  const filtered = state.exportCustoms.filter(
    (c) =>
      c.shippingBillNo.toLowerCase().includes(search.toLowerCase()) ||
      c.orderRef.toLowerCase().includes(search.toLowerCase()) ||
      c.exportPort.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TradePage>
      <TradePageHeader
        title="Export Customs & Shipping Bill Declaration"
        subtitle="Customs export declaration filing, physical dock cargo inspection and Let Export Order (LEO) grants"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<ShieldAlert className="w-5 h-5 text-white" />}
      />

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Shipping Bill, order, port..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={['Shipping Bill No', 'Order Ref', 'Export Port', 'Filing Date', 'FOB Value (USD)', 'Duty Drawback Eligible', 'Est. Drawback Refund', 'LEO Granted Date', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {filtered.map((c) => (
              <TradeTableRow key={c.id}>
                <TradeTableCell className="font-bold text-[#014582]">{c.shippingBillNo}</TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-800">
                  <Link href={`/export/orders?order=${c.orderRef}`} className="hover:underline text-blue-700">
                    {c.orderRef}
                  </Link>
                </TradeTableCell>
                <TradeTableCell className="text-gray-800 text-xs">{c.exportPort}</TradeTableCell>
                <TradeTableCell className="text-gray-600">{c.declarationDate}</TradeTableCell>
                <TradeTableCell className="font-bold text-gray-900">{formatAmount(c.fobValueUsd)}</TradeTableCell>
                <TradeTableCell>
                  {c.dutyDrawbackEligible ? (
                    <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded">
                      Eligible (3%)
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Not Applicable</span>
                  )}
                </TradeTableCell>
                <TradeTableCell className="font-bold text-emerald-700">
                  ${c.dutyDrawbackEstimatedUsd.toLocaleString()}
                </TradeTableCell>
                <TradeTableCell className="text-gray-600">{c.leoDate || 'Pending LEO'}</TradeTableCell>
                <TradeTableCell>
                  <TradeStatusBadge status={c.exportDeclarationStatus} />
                </TradeTableCell>
                <TradeTableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedCustoms(c)}
                    className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </TradeTableCell>
              </TradeTableRow>
            ))}
          </TradeTableBody>
        </TradeTable>
      </TradeCard>

      <TradeDetailDrawer
        isOpen={Boolean(selectedCustoms)}
        onClose={() => setSelectedCustoms(null)}
        title={selectedCustoms?.shippingBillNo || 'Customs Declaration'}
        subtitle={`Export Port: ${selectedCustoms?.exportPort}`}
      >
        {selectedCustoms && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Shipping Bill Number</span>
                <span className="font-bold text-gray-900">{selectedCustoms.shippingBillNo}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Customs Clearing Agent</span>
                <span className="font-semibold text-gray-900">{selectedCustoms.customsAgent}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Declared FOB Value</span>
                <span className="font-extrabold text-[#014582] text-sm">{formatAmount(selectedCustoms.fobValueUsd)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Duty Drawback Incentive</span>
                <span className="font-bold text-emerald-700">${selectedCustoms.dutyDrawbackEstimatedUsd.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Filing Date</span>
                <span className="font-medium text-gray-800">{selectedCustoms.declarationDate}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Let Export Order (LEO)</span>
                <span className="font-bold text-emerald-700">{selectedCustoms.leoDate}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-950 text-xs">Let Export Order (LEO) Granted</p>
                <p className="text-[11px] text-emerald-700">
                  Cargo cleared for container loading and maritime voyage departure.
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        )}
      </TradeDetailDrawer>
    </TradePage>
  );
}
