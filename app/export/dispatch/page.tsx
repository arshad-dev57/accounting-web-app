'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  MapPin,
  Calendar,
  Building2,
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
  ErpLinkedBanner,
} from '../../../components/trade/TradeUI';
import { useTradeStore } from '../../../lib/mock/trade-store';
import type { ExportDispatch } from '../../../lib/mock/trade-data';

export default function ExportDispatchPage() {
  const { state } = useTradeStore();
  const [search, setSearch] = useState('');
  const [selectedDispatch, setSelectedDispatch] = useState<ExportDispatch | null>(null);

  const filtered = state.exportDispatches.filter(
    (d) =>
      d.dispatchNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.truckNo.toLowerCase().includes(search.toLowerCase()) ||
      d.transporterName.toLowerCase().includes(search.toLowerCase()) ||
      d.orderRef.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TradePage>
      <TradePageHeader
        title="Export Dispatch & Port Gate-In"
        subtitle="Warehouse gate-out, heavy container haulage, port gate pass validation and shipping wharf handover"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<Truck className="w-5 h-5 text-white" />}
        actions={
          <Link
            href="/sales/deliveries"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
          >
            Open Sales Deliveries
          </Link>
        }
      />

      <ErpLinkedBanner
        moduleLabel="Export Dispatch"
        erpModuleLabel="Sales Deliveries"
        erpHref="/sales/deliveries"
        description="Export port gate-in view linked to Sales Deliveries. Stage and confirm dispatches in Sales so delivery notes and inventory issues are not duplicated."
      />

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search dispatch no, truck, driver, order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={['Dispatch No', 'Order Ref', 'Transporter', 'Vehicle / Trailer No', 'Driver Info', 'Destination Port', 'Container Seal', 'Gate Pass No', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {filtered.map((d) => (
              <TradeTableRow key={d.id}>
                <TradeTableCell className="font-bold text-[#014582]">{d.dispatchNumber}</TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-800">
                  <Link href={`/export/orders?order=${d.orderRef}`} className="hover:underline text-blue-700">
                    {d.orderRef}
                  </Link>
                </TradeTableCell>
                <TradeTableCell className="font-medium text-gray-900">{d.transporterName}</TradeTableCell>
                <TradeTableCell className="font-mono text-xs font-semibold text-gray-800">{d.truckNo}</TradeTableCell>
                <TradeTableCell>
                  <span className="font-medium text-gray-800 block text-xs">{d.driverName}</span>
                  <span className="text-[10px] text-gray-400">{d.driverPhone}</span>
                </TradeTableCell>
                <TradeTableCell className="text-xs text-gray-800">{d.destinationPort}</TradeTableCell>
                <TradeTableCell className="font-mono text-xs text-gray-700">{d.sealNo}</TradeTableCell>
                <TradeTableCell className="font-mono text-xs font-bold text-blue-700">{d.gatePassNo}</TradeTableCell>
                <TradeTableCell>
                  <TradeStatusBadge status={d.status} />
                </TradeTableCell>
                <TradeTableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedDispatch(d)}
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
        isOpen={Boolean(selectedDispatch)}
        onClose={() => setSelectedDispatch(null)}
        title={selectedDispatch?.dispatchNumber || 'Export Dispatch'}
        subtitle={`Order: ${selectedDispatch?.orderRef} • Transporter: ${selectedDispatch?.transporterName}`}
      >
        {selectedDispatch && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Dispatch Date</span>
                <span className="font-semibold text-gray-900">{selectedDispatch.dispatchDate}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Trailer Vehicle No</span>
                <span className="font-mono font-bold text-gray-900">{selectedDispatch.truckNo}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Driver Name & Mobile</span>
                <span className="font-semibold text-gray-900">
                  {selectedDispatch.driverName} ({selectedDispatch.driverPhone})
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Port Terminal</span>
                <span className="font-semibold text-gray-900">{selectedDispatch.destinationPort}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Terminal Gate Pass</span>
                <span className="font-mono font-bold text-[#014582]">{selectedDispatch.gatePassNo}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selectedDispatch.status} />
              </div>
            </div>
          </div>
        )}
      </TradeDetailDrawer>
    </TradePage>
  );
}
