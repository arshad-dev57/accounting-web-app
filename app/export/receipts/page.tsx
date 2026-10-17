'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BadgeDollarSign,
  Search,
  Filter,
  Eye,
  DollarSign,
  ExternalLink,
  CheckCircle2,
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
import { useCurrency } from '../../../lib/currency-context';
import type { ExportReceiptSettlement } from '../../../lib/mock/trade-data';

export default function ExportReceiptsPage() {
  const { state } = useTradeStore();
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ExportReceiptSettlement | null>(null);

  const filtered = state.exportReceipts.filter(
    (r) =>
      r.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.orderRef.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TradePage>
      <TradePageHeader
        title="Export Receipts & Forex Settlement"
        subtitle="Inward overseas remittances, foreign exchange realization, Nostro account credits and Sales settlement"
        moduleName="Export Finance"
        backHref="/export/dashboard"
        icon={<BadgeDollarSign className="w-5 h-5 text-white" />}
        actions={
          <Link
            href="/sales/sales-payment"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
          >
            <ExternalLink className="w-4 h-4" /> Open Sales Payment Ledger
          </Link>
        }
      />

      <ErpLinkedBanner
        moduleLabel="Export Receipts"
        erpModuleLabel="Sales Payments"
        erpHref="/sales/sales-payment"
        description="Export forex settlement view linked to Sales Payments. Record remittances in Sales Payments so AR and bank postings are not duplicated."
      />

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search receipt, buyer, order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={['Receipt No', 'Export Order', 'Overseas Customer', 'Date', 'Remittance FX', 'FX Amount', 'Bank Charges', 'Net Realized (USD)', 'Nostro Account', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {filtered.map((r) => (
              <TradeTableRow key={r.id}>
                <TradeTableCell className="font-bold text-[#014582]">{r.receiptNumber}</TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-800">
                  <Link href={`/export/orders?order=${r.orderRef}`} className="hover:underline text-blue-700">
                    {r.orderRef}
                  </Link>
                </TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-900">{r.customerName}</TradeTableCell>
                <TradeTableCell className="text-gray-600">{r.settlementDate}</TradeTableCell>
                <TradeTableCell className="font-mono text-xs font-semibold">{r.remittanceCurrency}</TradeTableCell>
                <TradeTableCell className="font-bold text-gray-900">${r.foreignAmount.toLocaleString()}</TradeTableCell>
                <TradeTableCell className="text-gray-600 text-xs">${r.bankChargesUsd}</TradeTableCell>
                <TradeTableCell className="font-extrabold text-emerald-700">{formatAmount(r.netRealizedUsd)}</TradeTableCell>
                <TradeTableCell className="font-mono text-xs text-gray-600">{r.nostroAccountRef}</TradeTableCell>
                <TradeTableCell>
                  <TradeStatusBadge status={r.status} />
                </TradeTableCell>
                <TradeTableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedReceipt(r)}
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
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title={selectedReceipt?.receiptNumber || 'Export Receipt'}
        subtitle={`Customer: ${selectedReceipt?.customerName}`}
      >
        {selectedReceipt && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Receipt Number</span>
                <span className="font-bold text-gray-900">{selectedReceipt.receiptNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Export Order</span>
                <span className="font-semibold text-gray-900">{selectedReceipt.orderRef}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Gross Foreign Remittance</span>
                <span className="font-bold text-gray-900">
                  {selectedReceipt.remittanceCurrency} {selectedReceipt.foreignAmount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Exchange Rate</span>
                <span className="font-mono font-bold text-gray-900">1.00 USD</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Net Realized into Bank</span>
                <span className="font-extrabold text-emerald-700 text-sm">{formatAmount(selectedReceipt.netRealizedUsd)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Nostro Routing Ref</span>
                <span className="font-mono text-gray-800">{selectedReceipt.nostroAccountRef}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-950 text-xs">Export Proceeds Realized</p>
                <p className="text-[11px] text-emerald-700">
                  Inward remittance credited to corporate bank account and closed in Sales Accounts Receivable.
                </p>
              </div>
              <Link
                href="/sales/sales-payment"
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                Open in Sales Payments <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </TradeDetailDrawer>
    </TradePage>
  );
}
