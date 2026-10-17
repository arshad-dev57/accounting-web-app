'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  DollarSign,
  Building2,
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
import type { ExportFinanceLC } from '../../../lib/mock/trade-data';

export default function ExportFinancePage() {
  const { state } = useTradeStore();
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState('');
  const [selectedLC, setSelectedLC] = useState<ExportFinanceLC | null>(null);

  const filtered = state.exportFinanceLCs.filter(
    (l) =>
      l.lcAdviceNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.applicant.toLowerCase().includes(search.toLowerCase()) ||
      l.issuingBank.toLowerCase().includes(search.toLowerCase()) ||
      l.orderRef.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TradePage>
      <TradePageHeader
        title="Export Trade Finance & LC Advice"
        subtitle="Overseas buyer Letters of Credit, bank confirmations, document negotiations and export discounting"
        moduleName="Export Finance"
        backHref="/export/dashboard"
        icon={<Landmark className="w-5 h-5 text-white" />}
      />

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search LC advice, applicant, bank, order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={['LC Advice No', 'Order Ref', 'Overseas Issuing Bank', 'Buyer Applicant', 'LC Value (USD)', 'Currency', 'Presentation Limit', 'Discrepancy Status', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {filtered.map((lc) => (
              <TradeTableRow key={lc.id}>
                <TradeTableCell className="font-bold text-[#014582]">{lc.lcAdviceNumber}</TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-800">
                  <Link href={`/export/orders?order=${lc.orderRef}`} className="hover:underline text-blue-700">
                    {lc.orderRef}
                  </Link>
                </TradeTableCell>
                <TradeTableCell className="text-gray-800 text-xs">{lc.issuingBank}</TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-900">{lc.applicant}</TradeTableCell>
                <TradeTableCell className="font-bold text-gray-900">{formatAmount(lc.lcValueUsd)}</TradeTableCell>
                <TradeTableCell className="font-mono text-xs">{lc.currency}</TradeTableCell>
                <TradeTableCell className="text-xs text-gray-600">{lc.presentationDays} Days from B/L</TradeTableCell>
                <TradeTableCell>
                  <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded">
                    {lc.discrepancyStatus}
                  </span>
                </TradeTableCell>
                <TradeTableCell>
                  <TradeStatusBadge status={lc.status} />
                </TradeTableCell>
                <TradeTableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedLC(lc)}
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
        isOpen={Boolean(selectedLC)}
        onClose={() => setSelectedLC(null)}
        title={selectedLC?.lcAdviceNumber || 'Export LC Details'}
        subtitle={`Applicant: ${selectedLC?.applicant} • Issuing Bank: ${selectedLC?.issuingBank}`}
      >
        {selectedLC && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">LC Advice Ref</span>
                <span className="font-bold text-gray-900">{selectedLC.lcAdviceNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Buyer Applicant</span>
                <span className="font-semibold text-gray-900">{selectedLC.applicant}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Confirmed Value</span>
                <span className="font-extrabold text-[#014582] text-sm">{formatAmount(selectedLC.lcValueUsd)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Expiry Date</span>
                <span className="font-bold text-gray-900">{selectedLC.expiryDate}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Advising / Confirming Bank</span>
                <span className="font-medium text-gray-800">{selectedLC.advisingBank}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selectedLC.status} />
              </div>
            </div>
          </div>
        )}
      </TradeDetailDrawer>
    </TradePage>
  );
}
