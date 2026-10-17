'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PackageCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Boxes,
  Truck,
  ArrowRight,
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
import type { ExportPackingAndInspection } from '../../../lib/mock/trade-data';

export default function ExportPackingPage() {
  const { state } = useTradeStore();
  const [search, setSearch] = useState('');
  const [selectedPacking, setSelectedPacking] = useState<ExportPackingAndInspection | null>(null);

  const filtered = state.exportPackings.filter(
    (p) =>
      p.packingListNo.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.containerNo.toLowerCase().includes(search.toLowerCase()) ||
      p.orderRef.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TradePage>
      <TradePageHeader
        title="Export Packing & Pre-Shipment Inspection"
        subtitle="Container stuffing, seal numbers, tare/gross weights, volumetric CBM and international SGS/BV certification"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<PackageCheck className="w-5 h-5 text-white" />}
      />

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search packing list, container, buyer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={['Packing List No', 'Order Ref', 'Overseas Customer', 'Container No', 'Seal No', 'Gross Weight (KG)', 'CBM Volume', 'Inspection Agency', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {filtered.map((pk) => (
              <TradeTableRow key={pk.id}>
                <TradeTableCell className="font-bold text-[#014582]">{pk.packingListNo}</TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-800">
                  <Link href={`/export/orders?order=${pk.orderRef}`} className="hover:underline text-blue-700">
                    {pk.orderRef}
                  </Link>
                </TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-900">{pk.customerName}</TradeTableCell>
                <TradeTableCell className="font-mono text-xs font-semibold text-gray-800">{pk.containerNo}</TradeTableCell>
                <TradeTableCell className="font-mono text-xs text-gray-700">{pk.sealNo}</TradeTableCell>
                <TradeTableCell className="font-bold text-gray-900">{pk.totalGrossWeightKg.toLocaleString()} KG</TradeTableCell>
                <TradeTableCell className="text-gray-800 font-medium">{pk.totalCbm} m³</TradeTableCell>
                <TradeTableCell className="text-xs text-blue-800 font-medium">{pk.inspectionAgency}</TradeTableCell>
                <TradeTableCell>
                  <TradeStatusBadge status={pk.inspectionStatus} />
                </TradeTableCell>
                <TradeTableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedPacking(pk)}
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
        isOpen={Boolean(selectedPacking)}
        onClose={() => setSelectedPacking(null)}
        title={selectedPacking?.packingListNo || 'Packing & Inspection'}
        subtitle={`Customer: ${selectedPacking?.customerName} • Seal: ${selectedPacking?.sealNo}`}
        actions={
          <Link
            href="/export/dispatch"
            className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] transition-all flex items-center gap-1.5"
          >
            <Truck className="w-4 h-4" /> Schedule Port Dispatch
          </Link>
        }
      >
        {selectedPacking && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Packing List No</span>
                <span className="font-bold text-gray-900">{selectedPacking.packingListNo}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Container Number</span>
                <span className="font-mono font-bold text-gray-900">{selectedPacking.containerNo}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">High Security Seal</span>
                <span className="font-mono font-bold text-gray-900">{selectedPacking.sealNo}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Container Spec</span>
                <span className="font-semibold text-gray-900">{selectedPacking.containerType}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Gross Weight</span>
                <span className="font-bold text-gray-900">{selectedPacking.totalGrossWeightKg.toLocaleString()} KG</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Net Weight</span>
                <span className="font-bold text-gray-900">{selectedPacking.totalNetWeightKg.toLocaleString()} KG</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Inspection Certificate</span>
                <span className="font-mono font-bold text-emerald-700">{selectedPacking.inspectionCertificateNo}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Inspection Agency</span>
                <span className="font-semibold text-gray-900">{selectedPacking.inspectionAgency}</span>
              </div>
            </div>
          </div>
        )}
      </TradeDetailDrawer>
    </TradePage>
  );
}
