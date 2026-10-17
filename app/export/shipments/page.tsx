'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Send,
  Search,
  Filter,
  Eye,
  MapPin,
  CheckCircle2,
  Calendar,
  Ship,
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
import type { ExportShipment } from '../../../lib/mock/trade-data';

export default function ExportShipmentsPage() {
  const { state } = useTradeStore();
  const [search, setSearch] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<ExportShipment | null>(null);

  const filtered = state.exportShipments.filter(
    (s) =>
      s.shipmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.blNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.vesselName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TradePage>
      <TradePageHeader
        title="Export Shipments & Ocean Tracking"
        subtitle="Vessel departures, carrier bookings, Ocean Bill of Lading manifests and destination arrival tracking"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<Send className="w-5 h-5 text-white" />}
      />

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search shipment, BL, vessel, buyer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={['Shipment No', 'Order Ref', 'Overseas Buyer', 'Shipping Line', 'Ocean B/L No', 'Port of Loading', 'Destination Port', 'ETD Departure', 'ETA Destination', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {filtered.map((s) => (
              <TradeTableRow key={s.id}>
                <TradeTableCell className="font-bold text-[#014582]">{s.shipmentNumber}</TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-800">
                  <Link href={`/export/orders?order=${s.orderRef}`} className="hover:underline text-blue-700">
                    {s.orderRef}
                  </Link>
                </TradeTableCell>
                <TradeTableCell>
                  <span className="font-semibold text-gray-900 block">{s.customerName}</span>
                  <span className="text-[10px] text-gray-400">{s.customerCountry}</span>
                </TradeTableCell>
                <TradeTableCell className="text-gray-800 font-medium">
                  {s.shippingLine}
                  <span className="text-[10px] text-gray-400 block">{s.vesselName}</span>
                </TradeTableCell>
                <TradeTableCell className="font-mono text-xs font-semibold">{s.blNumber}</TradeTableCell>
                <TradeTableCell className="text-xs text-gray-600">{s.portOfLoading}</TradeTableCell>
                <TradeTableCell className="text-xs text-gray-800 font-medium">{s.portOfDischarge}</TradeTableCell>
                <TradeTableCell className="text-gray-600">{s.etd}</TradeTableCell>
                <TradeTableCell className="font-bold text-gray-900">{s.eta}</TradeTableCell>
                <TradeTableCell>
                  <TradeStatusBadge status={s.shipmentStatus} />
                </TradeTableCell>
                <TradeTableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedShipment(s)}
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
        isOpen={Boolean(selectedShipment)}
        onClose={() => setSelectedShipment(null)}
        title={selectedShipment?.shipmentNumber || 'Shipment Tracking'}
        subtitle={`Carrier: ${selectedShipment?.shippingLine} • Vessel: ${selectedShipment?.vesselName}`}
      >
        {selectedShipment && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-emerald-900 text-xs">Vessel Voyage Position</span>
              </div>
              <p className="text-xs text-emerald-800">{selectedShipment.currentPosition}</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Ocean Bill of Lading</span>
                <span className="font-mono font-bold text-gray-900">{selectedShipment.blNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Booking Reference</span>
                <span className="font-mono font-semibold text-gray-900">{selectedShipment.bookingRef}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Port of Loading</span>
                <span className="font-semibold text-gray-900">{selectedShipment.portOfLoading}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Port of Discharge</span>
                <span className="font-bold text-gray-900">{selectedShipment.portOfDischarge}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Sailed Date (ETD)</span>
                <span className="font-medium text-gray-800">{selectedShipment.etd}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Destination Arrival (ETA)</span>
                <span className="font-bold text-[#014582]">{selectedShipment.eta}</span>
              </div>
            </div>
          </div>
        )}
      </TradeDetailDrawer>
    </TradePage>
  );
}
