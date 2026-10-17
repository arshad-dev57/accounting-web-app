'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MailQuestion,
  Search,
  Filter,
  Eye,
  Plus,
  Send,
  CheckCircle2,
  Globe,
  ArrowRight,
  FileSpreadsheet,
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
  TradePagination,
  TradeWorkflowStepper,
} from '../../../components/trade/TradeUI';
import { useTradeStore } from '../../../lib/mock/trade-store';
import { useCurrency } from '../../../lib/currency-context';
import type { ExportInquiry } from '../../../lib/mock/trade-data';

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

export default function ExportInquiriesPage() {
  const { state, updateState, customers, products } = useTradeStore();
  const { formatAmount } = useCurrency();

  const [search, setSearch] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<ExportInquiry | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Inquiry form state
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [incoterm, setIncoterm] = useState<'FOB' | 'CIF' | 'CFR' | 'DDP'>('CIF');
  const [targetPort, setTargetPort] = useState('Riyadh Dry Port (SARUH)');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState(10);
  const [targetPrice, setTargetPrice] = useState(5850);
  const [notes, setNotes] = useState('');

  const filtered = state.exportInquiries.filter(
    (iq) =>
      iq.inquiryNumber.toLowerCase().includes(search.toLowerCase()) ||
      iq.customerName.toLowerCase().includes(search.toLowerCase()) ||
      iq.customerCountry.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    const prod = products.find((p) => p.id === productId);
    if (!cust || !prod) return;

    const totalEst = Number(qty) * Number(targetPrice);
    const newInq: ExportInquiry = {
      id: `einq-${Date.now()}`,
      inquiryNumber: `EINQ-2026-${String(state.exportInquiries.length + 65).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      customerId: cust.id,
      customerName: cust.name,
      customerCountry: cust.country,
      targetDestinationPort: targetPort,
      incoterm,
      currency: cust.currency,
      targetDispatchDate: '2026-12-15',
      leadStage: 'New Inquiry',
      estimatedRevenueUsd: totalEst,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          requestedQty: Number(qty),
          uom: prod.uom,
          targetPriceUsd: Number(targetPrice),
        },
      ],
      notes: notes || 'Overseas prospective buyer inquiry received via trade desk.',
    };

    updateState((s) => {
      s.exportInquiries = [newInq, ...s.exportInquiries];
    });

    setIsCreateOpen(false);
  };

  const handleConvertToQuotation = (inq: ExportInquiry) => {
    updateState((s) => {
      const target = s.exportInquiries.find((i) => i.id === inq.id);
      if (target) target.leadStage = 'Quoted';

      const newQuote = {
        id: `eqt-${Date.now()}`,
        quoteNumber: `EQT-2026-${String(s.exportQuotations.length + 85).padStart(4, '0')}`,
        inquiryRef: inq.inquiryNumber,
        quoteDate: new Date().toISOString().split('T')[0],
        validUntil: '2026-11-30',
        customerName: inq.customerName,
        customerCountry: inq.customerCountry,
        incoterm: inq.incoterm,
        currency: inq.currency,
        portOfLoading: 'Jebel Ali Port (AEJEA)',
        portOfDischarge: inq.targetDestinationPort,
        subtotalUsd: inq.estimatedRevenueUsd,
        freightEstimateUsd: 3500,
        insuranceEstimateUsd: 650,
        totalQuoteUsd: inq.estimatedRevenueUsd + 4150,
        paymentTerms: 'Confirmed Irrevocable LC at Sight',
        status: 'Sent to Buyer' as const,
        items: inq.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          sku: it.sku,
          quantity: it.requestedQty,
          uom: it.uom,
          unitPriceUsd: it.targetPriceUsd,
          totalAmountUsd: it.requestedQty * it.targetPriceUsd,
        })),
      };

      s.exportQuotations = [newQuote, ...s.exportQuotations];
    });

    setSelectedInquiry(null);
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Export Inquiries & Leads"
        subtitle="Overseas prospective buyer RFQs, technical requirement reviews and foreign trade opportunities"
        moduleName="Export Management"
        backHref="/export/dashboard"
        icon={<MailQuestion className="w-5 h-5 text-white" />}
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Log Export Inquiry
          </button>
        }
      />

      <TradeCard>
        <div className="mb-4">
          <TradeWorkflowStepper steps={EXPORT_WORKFLOW_STEPS} currentStepIndex={0} />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search inquiry, buyer, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={['Inquiry No', 'Date', 'Overseas Buyer', 'Country', 'Destination Port', 'Incoterm', 'Est. Revenue', 'Stage', 'Actions']}
          />
          <TradeTableBody>
            {filtered.map((iq) => (
              <TradeTableRow key={iq.id}>
                <TradeTableCell className="font-bold text-[#014582]">{iq.inquiryNumber}</TradeTableCell>
                <TradeTableCell className="text-gray-600">{iq.date}</TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-900">{iq.customerName}</TradeTableCell>
                <TradeTableCell className="text-gray-700">{iq.customerCountry}</TradeTableCell>
                <TradeTableCell className="text-xs text-gray-800">{iq.targetDestinationPort}</TradeTableCell>
                <TradeTableCell>
                  <span className="px-2 py-0.5 rounded bg-gray-100 font-bold text-[11px] text-gray-700">
                    {iq.incoterm}
                  </span>
                </TradeTableCell>
                <TradeTableCell className="font-bold text-gray-900">{formatAmount(iq.estimatedRevenueUsd)}</TradeTableCell>
                <TradeTableCell>
                  <TradeStatusBadge status={iq.leadStage} />
                </TradeTableCell>
                <TradeTableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedInquiry(iq)}
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
        isOpen={Boolean(selectedInquiry)}
        onClose={() => setSelectedInquiry(null)}
        title={selectedInquiry?.inquiryNumber || 'Export Inquiry Details'}
        subtitle={`Buyer: ${selectedInquiry?.customerName} (${selectedInquiry?.customerCountry})`}
        actions={
          selectedInquiry && (
            <div className="flex items-center gap-2">
              {selectedInquiry.leadStage !== 'Order Won' && (
                <button
                  type="button"
                  onClick={() => handleConvertToQuotation(selectedInquiry)}
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Generate Export Quotation
                </button>
              )}
            </div>
          )
        }
      >
        {selectedInquiry && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Inquiry Number</span>
                <span className="font-bold text-gray-900">{selectedInquiry.inquiryNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Destination Port</span>
                <span className="font-semibold text-gray-900">{selectedInquiry.targetDestinationPort}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Trade Term</span>
                <span className="font-bold text-gray-900">{selectedInquiry.incoterm}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Lead Stage</span>
                <TradeStatusBadge status={selectedInquiry.leadStage} />
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Est. Export Value</span>
                <span className="font-extrabold text-[#014582] text-sm">
                  {formatAmount(selectedInquiry.estimatedRevenueUsd)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Requested Catalog Items</h4>
              <TradeTable>
                <TradeTableHeader columns={['SKU', 'Product Name', 'Requested Qty', 'Target Price (USD)']} />
                <TradeTableBody>
                  {selectedInquiry.items.map((it, idx) => (
                    <TradeTableRow key={idx}>
                      <TradeTableCell className="font-mono">{it.sku}</TradeTableCell>
                      <TradeTableCell className="font-medium text-gray-900">{it.productName}</TradeTableCell>
                      <TradeTableCell className="font-bold">{it.requestedQty} {it.uom}</TradeTableCell>
                      <TradeTableCell className="font-bold text-gray-900">${it.targetPriceUsd}</TradeTableCell>
                    </TradeTableRow>
                  ))}
                </TradeTableBody>
              </TradeTable>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
              <span className="font-bold block text-xs mb-1">Buyer Technical Requirements & Notes</span>
              <p className="text-xs">{selectedInquiry.notes}</p>
            </div>
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log New Overseas Export Inquiry"
      >
        <form onSubmit={handleCreateInquiry} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Buyer / Customer *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Incoterm *</label>
              <select
                value={incoterm}
                onChange={(e) => setIncoterm(e.target.value as typeof incoterm)}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs"
              >
                <option value="CIF">CIF — Cost, Insurance & Freight</option>
                <option value="FOB">FOB — Free On Board</option>
                <option value="CFR">CFR — Cost & Freight</option>
                <option value="DDP">DDP — Delivered Duty Paid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Destination Discharge Port</label>
            <input
              type="text"
              value={targetPort}
              onChange={(e) => setTargetPort(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-xs"
              required
            />
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
            <span className="font-bold text-gray-800 block text-xs">Product Details</span>
            <div>
              <label className="block text-gray-600 mb-1">Export Item</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Target Price (USD)</label>
                <input
                  type="number"
                  min="1"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Notes / Compliance Requirements</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. SASO Saber certificate needed, sea-worthy crating..."
              className="w-full p-2 border border-gray-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#014582] text-white hover:bg-[#01366a] text-xs font-bold"
            >
              Save Export Lead
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
