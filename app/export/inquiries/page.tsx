'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MailQuestion,
  Search,
  Eye,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
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
import {
  CustomerSelectField,
  ProductPickerModal,
  PortSelect,
  CurrencySelect,
  FormSection,
  FieldLabel,
} from '../../../components/export/ExportSelectors';
import type { Customer } from '@/api/customer/route';
import type { Product } from '@/api/product/route';
import exportApi, {
  errorMessage,
  formatDate,
  formatMoney,
  type ExportInquiry,
} from '../../../lib/export-api';
import { useExportList } from '../../../lib/use-export-list';
import { usePermissions } from '../../../lib/usePermissions';

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

const INQUIRY_STATUSES = ['Draft', 'Open', 'Converted', 'Closed'];
const LEAD_STAGES = ['New Inquiry', 'Technical Review', 'Quoted', 'Negotiation', 'Order Won', 'Lost'];
const INCOTERMS = ['FOB', 'CIF', 'CFR', 'DDP', 'EXW', 'FCA', 'CPT', 'CIP'];

function customerCountry(c?: Customer | null) {
  return c?.address?.country || c?.shippingAddress?.country || '';
}

export default function ExportInquiriesPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can('export.inquiries.create');
  const canEdit = can('export.inquiries.edit');

  const list = useExportList<ExportInquiry>((query) => exportApi.listInquiries(query), {
    limit: 20,
    initialStatus: '',
  });

  const [selectedInquiry, setSelectedInquiry] = useState<ExportInquiry | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [incoterm, setIncoterm] = useState('CIF');
  const [destinationPort, setDestinationPort] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [inquiryDate, setInquiryDate] = useState(new Date().toISOString().slice(0, 10));
  const [targetDispatchDate, setTargetDispatchDate] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [productOpen, setProductOpen] = useState(false);
  const [qty, setQty] = useState<number | ''>('');
  const [targetPrice, setTargetPrice] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setCustomer(null);
    setIncoterm('CIF');
    setDestinationPort('');
    setCurrency('USD');
    setInquiryDate(new Date().toISOString().slice(0, 10));
    setTargetDispatchDate('');
    setProduct(null);
    setQty('');
    setTargetPrice('');
    setNotes('');
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!customer?.id) {
      setFormError('Select an overseas buyer.');
      return;
    }
    if (!product?.id) {
      setFormError('Select an export product.');
      return;
    }
    if (!qty || Number(qty) <= 0) {
      setFormError('Enter a requested quantity greater than zero.');
      return;
    }
    if (targetPrice === '' || Number(targetPrice) < 0) {
      setFormError('Enter a valid target price.');
      return;
    }
    setSaving(true);
    try {
      await exportApi.createInquiry({
        customerId: customer.id,
        customerName: customer.name,
        customerCountry: customerCountry(customer),
        date: inquiryDate,
        destinationPort: destinationPort || undefined,
        incoterm,
        currency,
        targetDispatchDate: targetDispatchDate || undefined,
        notes: notes || undefined,
        items: [
          {
            productId: product.id || (product as any)._id,
            productName: product.name,
            sku: product.sku,
            quantity: Number(qty),
            uom: product.stockUnit || 'PCS',
            unitPriceForeign: Number(targetPrice),
          },
        ],
      });
      toast.success('Export inquiry created');
      setIsCreateOpen(false);
      resetForm();
      list.reload();
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to create export inquiry'));
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async (inq: ExportInquiry) => {
    setActionId(inq.id);
    try {
      const quote = await exportApi.convertInquiry(inq.id, {
        portOfDischarge: inq.destinationPort || undefined,
        paymentTerms: 'Confirmed Irrevocable LC at Sight',
      });
      toast.success(`Quotation ${quote.quoteNumber} created`);
      setSelectedInquiry(null);
      list.reload();
      router.push(`/export/quotations?quote=${quote.id}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to convert inquiry'));
    } finally {
      setActionId(null);
    }
  };

  const handleStatus = async (inq: ExportInquiry, patch: { status?: string; leadStage?: string }) => {
    setActionId(inq.id);
    try {
      const updated = await exportApi.updateInquiryStatus(inq.id, patch.status || inq.status, {
        ...(patch.leadStage ? { leadStage: patch.leadStage } : {}),
      });
      setSelectedInquiry(updated);
      toast.success('Inquiry updated');
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update inquiry'));
    } finally {
      setActionId(null);
    }
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
          canCreate ? (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Log Export Inquiry
            </button>
          ) : null
        }
      />

      <TradeCard>
        <div className="mb-4">
          <TradeWorkflowStepper steps={EXPORT_WORKFLOW_STEPS} currentStepIndex={0} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search inquiry, buyer, country or port…"
                value={list.search}
                onChange={(e) => list.setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
              />
            </div>
            <select
              value={list.status}
              onChange={(e) => list.setStatus(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white"
            >
              <option value="">All statuses</option>
              {INQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={list.reload}
            disabled={list.loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${list.loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {list.error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {list.error}
            </span>
            <button type="button" onClick={list.reload} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        <TradeTable>
          <TradeTableHeader
            columns={['Inquiry No', 'Date', 'Overseas Buyer', 'Country', 'Destination Port', 'Incoterm', 'Est. Revenue', 'Stage', 'Actions']}
          />
          <TradeTableBody>
            {list.loading && list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={9}>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading inquiries…
                </TradeTableCell>
              </TradeTableRow>
            ) : list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={9}>
                  No export inquiries match the current filters.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              list.items.map((iq) => (
                <TradeTableRow key={iq.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{iq.inquiryNumber}</TradeTableCell>
                  <TradeTableCell className="text-gray-600">{formatDate(iq.date)}</TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-900">{iq.customerName}</TradeTableCell>
                  <TradeTableCell className="text-gray-700">{iq.customerCountry || '—'}</TradeTableCell>
                  <TradeTableCell className="text-xs text-gray-800">{iq.destinationPort || '—'}</TradeTableCell>
                  <TradeTableCell>
                    <span className="px-2 py-0.5 rounded bg-gray-100 font-bold text-[11px] text-gray-700">
                      {iq.incoterm}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {formatMoney(iq.estimatedRevenueForeign, iq.currency)}
                    {iq.currency !== 'USD' ? (
                      <span className="block text-[10px] font-normal text-gray-400">
                        base {formatMoney(iq.estimatedRevenueBase, 'USD')}
                      </span>
                    ) : null}
                  </TradeTableCell>
                  <TradeTableCell>
                    <div className="space-y-1">
                      <TradeStatusBadge status={iq.leadStage} />
                      {iq.status !== 'Open' && iq.status !== 'Draft' ? (
                        <span className="block text-[10px] text-gray-400">{iq.status}</span>
                      ) : null}
                    </div>
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedInquiry(iq)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View inquiry"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </TradeTableCell>
                </TradeTableRow>
              ))
            )}
          </TradeTableBody>
        </TradeTable>

        <TradePagination
          currentPage={list.page}
          totalPages={list.pages}
          totalItems={list.total}
          pageSize={list.pageInfo.limit}
          onPageChange={list.changePage}
        />
      </TradeCard>

      <TradeDetailDrawer
        isOpen={Boolean(selectedInquiry)}
        onClose={() => setSelectedInquiry(null)}
        title={selectedInquiry?.inquiryNumber || 'Export Inquiry Details'}
        subtitle={
          selectedInquiry
            ? `Buyer: ${selectedInquiry.customerName} (${selectedInquiry.customerCountry || '—'})`
            : undefined
        }
        actions={
          selectedInquiry &&
          canEdit &&
          !selectedInquiry.convertedQuotationId ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={actionId === selectedInquiry.id}
                onClick={() => handleConvert(selectedInquiry)}
                className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {actionId === selectedInquiry.id ? 'Converting…' : 'Generate Export Quotation'}
              </button>
            </div>
          ) : null
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
                <span className="font-semibold text-gray-900">{selectedInquiry.destinationPort || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Trade Term</span>
                <span className="font-bold text-gray-900">{selectedInquiry.incoterm}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <div className="flex items-center gap-2">
                  <TradeStatusBadge status={selectedInquiry.status} />
                  <TradeStatusBadge status={selectedInquiry.leadStage} />
                </div>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Est. Export Value</span>
                <span className="font-extrabold text-[#014582] text-sm">
                  {formatMoney(selectedInquiry.estimatedRevenueForeign, selectedInquiry.currency)}
                </span>
                {selectedInquiry.currency !== 'USD' ? (
                  <span className="block text-[10px] text-gray-400">
                    base {formatMoney(selectedInquiry.estimatedRevenueBase, 'USD')} @ {selectedInquiry.exchangeRate}
                  </span>
                ) : null}
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Target Dispatch</span>
                <span className="font-semibold text-gray-900">{formatDate(selectedInquiry.targetDispatchDate)}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Requested Catalog Items</h4>
              <TradeTable>
                <TradeTableHeader
                  columns={['SKU', 'Product Name', 'Requested Qty', `Target Price (${selectedInquiry.currency})`]}
                />
                <TradeTableBody>
                  {selectedInquiry.items.map((it) => (
                    <TradeTableRow key={it.id}>
                      <TradeTableCell className="font-mono">{it.sku || '—'}</TradeTableCell>
                      <TradeTableCell className="font-medium text-gray-900">{it.productName}</TradeTableCell>
                      <TradeTableCell className="font-bold">
                        {it.requestedQty} {it.uom}
                      </TradeTableCell>
                      <TradeTableCell className="font-bold text-gray-900">
                        {formatMoney(it.targetPriceForeign, selectedInquiry.currency)}
                      </TradeTableCell>
                    </TradeTableRow>
                  ))}
                </TradeTableBody>
              </TradeTable>
            </div>

            {selectedInquiry.notes && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                <span className="font-bold block text-xs mb-1">Buyer Requirements & Notes</span>
                <p className="text-xs whitespace-pre-wrap">{selectedInquiry.notes}</p>
              </div>
            )}

            {selectedInquiry.convertedQuotationId && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Converted to quotation
                </span>
                <button
                  type="button"
                  onClick={() => router.push(`/export/quotations?quote=${selectedInquiry.convertedQuotationId}`)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"
                >
                  Open quotation <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {canEdit && !selectedInquiry.convertedQuotationId && (
              <div className="p-4 rounded-xl border border-gray-200 space-y-3">
                <p className="font-bold text-gray-900 text-xs">Update workflow</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Lead stage</FieldLabel>
                    <select
                      value={selectedInquiry.leadStage}
                      disabled={actionId === selectedInquiry.id}
                      onChange={(e) => handleStatus(selectedInquiry, { leadStage: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                    >
                      {[selectedInquiry.leadStage, ...LEAD_STAGES.filter((s) => s !== selectedInquiry.leadStage)].map(
                        (s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Inquiry status</FieldLabel>
                    <select
                      value={selectedInquiry.status}
                      disabled={actionId === selectedInquiry.id}
                      onChange={(e) => handleStatus(selectedInquiry, { status: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                    >
                      {[selectedInquiry.status, ...INQUIRY_STATUSES.filter((s) => s !== selectedInquiry.status)].map(
                        (s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  Only backend-permitted transitions are accepted; invalid moves return a validation error.
                </p>
              </div>
            )}

            {selectedInquiry.convertedQuotationId && (
              <button
                type="button"
                onClick={() => router.push(`/export/quotations?quote=${selectedInquiry.convertedQuotationId}`)}
                className="w-full px-4 py-2 rounded-xl border border-[#014582]/30 text-[#014582] text-xs font-bold"
              >
                View created quotation
              </button>
            )}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log New Overseas Export Inquiry"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateInquiry} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {formError}
            </div>
          )}

          <FormSection title="Buyer & trade terms" subtitle="Company-scoped customers only">
            <div>
              <FieldLabel required>Overseas buyer</FieldLabel>
              <CustomerSelectField
                selected={
                  customer
                    ? {
                        id: customer.id,
                        name: customer.name,
                        country: customerCountry(customer),
                        code: customer.customerNumber,
                      }
                    : null
                }
                onSelect={(c) => {
                  setCustomer(c);
                  const cc = customerCountry(c);
                  if (cc) setDestinationPort('');
                }}
                disabled={saving}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel required>Inquiry date</FieldLabel>
                <input
                  type="date"
                  value={inquiryDate}
                  onChange={(e) => setInquiryDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <FieldLabel>Target dispatch</FieldLabel>
                <input
                  type="date"
                  value={targetDispatchDate}
                  onChange={(e) => setTargetDispatchDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel required>Currency</FieldLabel>
                <CurrencySelect value={currency} onChange={(code) => setCurrency(code)} disabled={saving} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Incoterm</FieldLabel>
                <select
                  value={incoterm}
                  onChange={(e) => setIncoterm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                >
                  {INCOTERMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Destination port</FieldLabel>
                <PortSelect
                  value={destinationPort}
                  onChange={(name) => setDestinationPort(name)}
                  placeholder="Select destination port…"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Requested item" subtitle="Pricing is stored in the selected transaction currency">
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50">
              <div className="min-w-0">
                {product ? (
                  <>
                    <p className="font-bold text-gray-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-500">
                      {product.sku} · {product.stockUnit || 'PCS'} · stock {product.currentStock ?? 0}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400">No product selected</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setProductOpen(true)}
                disabled={saving}
                className="px-3 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50"
              >
                Select Product
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Requested quantity</FieldLabel>
                <input
                  type="number"
                  min="0.0001"
                  step="any"
                  value={qty}
                  onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <FieldLabel required>Target price ({currency})</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  required
                />
              </div>
            </div>
          </FormSection>

          <div>
            <FieldLabel>Notes / compliance requirements</FieldLabel>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. SASO Saber certificate, sea-worthy crating, labelling requirements…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#014582] text-white hover:bg-[#01366a] text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Export Lead'}
            </button>
          </div>
        </form>
      </TradeModal>

      <ProductPickerModal
        isOpen={productOpen}
        onClose={() => setProductOpen(false)}
        onSelect={(products) => {
          if (products[0]) setProduct(products[0]);
          setProductOpen(false);
        }}
      />
    </TradePage>
  );
}
