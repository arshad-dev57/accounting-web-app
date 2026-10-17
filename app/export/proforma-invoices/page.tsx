'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Search,
  Filter,
  Eye,
  DollarSign,
  Landmark,
  ExternalLink,
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
import type { ExportProformaInvoice } from '../../../lib/mock/trade-data';

export default function ExportProformaInvoicesPage() {
  const { state } = useTradeStore();
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState('');
  const [selectedPI, setSelectedPI] = useState<ExportProformaInvoice | null>(null);

  const filtered = state.exportPIs.filter(
    (pi) =>
      pi.piNumber.toLowerCase().includes(search.toLowerCase()) ||
      pi.customerName.toLowerCase().includes(search.toLowerCase()) ||
      pi.orderRef.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TradePage>
      <TradePageHeader
        title="Export Proforma Invoices"
        subtitle="Commercial export invoices for advance foreign remittance, wire transfers and buyer LC applications"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<FileCheck2 className="w-5 h-5 text-white" />}
      />

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search PI number, buyer, order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={['PI Number', 'Order Ref', 'Overseas Customer', 'Date', 'Currency', 'Amount (USD)', 'SWIFT Code', 'LC Reference', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {filtered.map((pi) => (
              <TradeTableRow key={pi.id}>
                <TradeTableCell className="font-bold text-[#014582]">{pi.piNumber}</TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-800">
                  <Link href={`/export/orders?order=${pi.orderRef}`} className="hover:underline text-blue-700">
                    {pi.orderRef}
                  </Link>
                </TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-900">{pi.customerName}</TradeTableCell>
                <TradeTableCell className="text-gray-600">{pi.date}</TradeTableCell>
                <TradeTableCell className="font-mono text-xs">{pi.currency}</TradeTableCell>
                <TradeTableCell className="font-bold text-gray-900">{formatAmount(pi.amountUsd)}</TradeTableCell>
                <TradeTableCell className="font-mono text-xs text-gray-700">{pi.bankSwiftCode}</TradeTableCell>
                <TradeTableCell className="text-xs text-gray-600">{pi.lcNumber || 'Wire Transfer'}</TradeTableCell>
                <TradeTableCell>
                  <TradeStatusBadge status={pi.status} />
                </TradeTableCell>
                <TradeTableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedPI(pi)}
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
        isOpen={Boolean(selectedPI)}
        onClose={() => setSelectedPI(null)}
        title={selectedPI?.piNumber || 'Export Proforma Invoice'}
        subtitle={`Buyer: ${selectedPI?.customerName}`}
      >
        {selectedPI && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">PI Number</span>
                <span className="font-bold text-gray-900">{selectedPI.piNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Export Order Ref</span>
                <span className="font-semibold text-gray-900">{selectedPI.orderRef}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Issue Date</span>
                <span className="font-semibold text-gray-900">{selectedPI.date}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Invoice Value</span>
                <span className="font-extrabold text-[#014582] text-sm">{formatAmount(selectedPI.amountUsd)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Beneficiary SWIFT</span>
                <span className="font-mono font-bold text-gray-900">{selectedPI.bankSwiftCode}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Beneficiary Account</span>
                <span className="font-mono text-gray-800">{selectedPI.beneficiaryAccount}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selectedPI.status} />
              </div>
            </div>
          </div>
        )}
      </TradeDetailDrawer>
    </TradePage>
  );
}
