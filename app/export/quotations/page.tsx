'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Eye,
  Plus,
  CheckCircle2,
  FileCheck2,
  ArrowRight,
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
  TradeModal,
  TradeWorkflowStepper,
} from '../../../components/trade/TradeUI';
import { useTradeStore } from '../../../lib/mock/trade-store';
import { useCurrency } from '../../../lib/currency-context';
import type { ExportQuotation } from '../../../lib/mock/trade-data';

const EXPORT_WORKFLOW_STEPS = [
  'Inquiry',
  'Quotation',
  'Sales Order',
  'Proforma Invoice',
  'Packing & Inspection',
  'Customs Declaration',
  'Dispatch / Shipment',
  'Commercial Invoice',
  'Settlement',
];

export default function ExportQuotationsPage() {
  const { state, updateState } = useTradeStore();
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<ExportQuotation | null>(null);

  const filtered = state.exportQuotations.filter(
    (q) =>
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.customerName.toLowerCase().includes(search.toLowerCase()) ||
      q.customerCountry.toLowerCase().includes(search.toLowerCase())
  );

  const handleConvertToOrder = (quote: ExportQuotation) => {
    updateState((s) => {
      const target = s.exportQuotations.find((q) => q.id === quote.id);
      if (target) target.status = 'Converted to Order';

      const newOrder = {
        id: `eso-${Date.now()}`,
        orderNumber: `ESO-2026-${String(s.exportOrders.length + 35).padStart(4, '0')}`,
        quoteRef: quote.quoteNumber,
        customerName: quote.customerName,
        customerCountry: quote.customerCountry,
        destinationPort: quote.portOfDischarge,
        incoterm: quote.incoterm,
        currency: quote.currency,
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDeadline: '2026-12-20',
        subtotalUsd: quote.subtotalUsd,
        freightAndChargesUsd: quote.freightEstimateUsd + quote.insuranceEstimateUsd,
        totalOrderUsd: quote.totalQuoteUsd,
        advanceReceivedUsd: 0,
        outstandingBalanceUsd: quote.totalQuoteUsd,
        paymentTerms: quote.paymentTerms,
        status: 'Confirmed' as const,
        items: quote.items,
      };

      s.exportOrders = [newOrder, ...s.exportOrders];
    });

    setSelectedQuote(null);
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Export Quotations"
        subtitle="Formal international sales quotes, ocean freight & insurance estimates and payment conditions"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<FileSpreadsheet className="w-5 h-5 text-white" />}
      />

      <TradeCard>
        <div className="mb-4">
          <TradeWorkflowStepper steps={EXPORT_WORKFLOW_STEPS} currentStepIndex={1} />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotation no, buyer, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={['Quote Number', 'Date', 'Overseas Customer', 'Incoterm', 'Discharge Port', 'Total CIF (USD)', 'Valid Until', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {filtered.map((quote) => (
              <TradeTableRow key={quote.id}>
                <TradeTableCell className="font-bold text-[#014582]">{quote.quoteNumber}</TradeTableCell>
                <TradeTableCell className="text-gray-600">{quote.quoteDate}</TradeTableCell>
                <TradeTableCell>
                  <span className="font-semibold text-gray-900 block">{quote.customerName}</span>
                  <span className="text-[10px] text-gray-400">{quote.customerCountry}</span>
                </TradeTableCell>
                <TradeTableCell>
                  <span className="px-2 py-0.5 rounded bg-gray-100 font-bold text-[11px] text-gray-700">
                    {quote.incoterm}
                  </span>
                </TradeTableCell>
                <TradeTableCell className="text-xs text-gray-700">{quote.portOfDischarge}</TradeTableCell>
                <TradeTableCell className="font-bold text-gray-900">{formatAmount(quote.totalQuoteUsd)}</TradeTableCell>
                <TradeTableCell className="text-gray-600">{quote.validUntil}</TradeTableCell>
                <TradeTableCell>
                  <TradeStatusBadge status={quote.status} />
                </TradeTableCell>
                <TradeTableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedQuote(quote)}
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
        isOpen={Boolean(selectedQuote)}
        onClose={() => setSelectedQuote(null)}
        title={selectedQuote?.quoteNumber || 'Export Quotation'}
        subtitle={`Customer: ${selectedQuote?.customerName}`}
        actions={
          selectedQuote && (
            <div className="flex items-center gap-2">
              {selectedQuote.status !== 'Converted to Order' && (
                <button
                  type="button"
                  onClick={() => handleConvertToOrder(selectedQuote)}
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] transition-all flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-4 h-4" /> Convert to Export Sales Order
                </button>
              )}
            </div>
          )
        }
      >
        {selectedQuote && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Quotation Number</span>
                <span className="font-bold text-gray-900">{selectedQuote.quoteNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Port of Discharge</span>
                <span className="font-semibold text-gray-900">{selectedQuote.portOfDischarge}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">FOB Subtotal</span>
                <span className="font-bold text-gray-900">${selectedQuote.subtotalUsd.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Freight & Insurance</span>
                <span className="font-semibold text-gray-900">
                  ${(selectedQuote.freightEstimateUsd + selectedQuote.insuranceEstimateUsd).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Contract Value</span>
                <span className="font-extrabold text-[#014582] text-sm">
                  {formatAmount(selectedQuote.totalQuoteUsd)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Payment Terms</span>
                <span className="font-medium text-gray-800">{selectedQuote.paymentTerms}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Quotation Items</h4>
              <TradeTable>
                <TradeTableHeader columns={['SKU', 'Item Name', 'Quantity', 'Unit Price (USD)', 'Line Total']} />
                <TradeTableBody>
                  {selectedQuote.items.map((it, idx) => (
                    <TradeTableRow key={idx}>
                      <TradeTableCell className="font-mono">{it.sku}</TradeTableCell>
                      <TradeTableCell className="font-medium text-gray-900">{it.productName}</TradeTableCell>
                      <TradeTableCell className="font-bold">{it.quantity} {it.uom}</TradeTableCell>
                      <TradeTableCell>${it.unitPriceUsd}</TradeTableCell>
                      <TradeTableCell className="font-bold text-gray-900">${it.totalAmountUsd.toLocaleString()}</TradeTableCell>
                    </TradeTableRow>
                  ))}
                </TradeTableBody>
              </TradeTable>
            </div>
          </div>
        )}
      </TradeDetailDrawer>
    </TradePage>
  );
}
