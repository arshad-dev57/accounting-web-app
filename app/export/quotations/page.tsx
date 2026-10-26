'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileSpreadsheet,
  Search,
  Eye,
  Plus,
  CheckCircle2,
  FileCheck2,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Send,
  XCircle,
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
  type ExportQuotation,
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

const QUOTE_STATUSES = ['Draft', 'Sent to Buyer', 'Under Negotiation', 'Accepted', 'Declined', 'Converted to Order'];
const INCOTERMS = ['FOB', 'CIF', 'CFR', 'DDP', 'EXW', 'FCA', 'CPT', 'CIP'];

type QuoteLine = {
  productId: string;
  productName: string;
  sku: string;
  uom: string;
  quantity: number;
  unitPriceForeign: number;
};

function customerCountry(c?: Customer | null) {
  return c?.address?.country || c?.shippingAddress?.country || '';
}

export default function ExportQuotationsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <ExportQuotationsPageContent />
    </React.Suspense>
  );
}

function ExportQuotationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const canCreate = can('export.quotations.create');
  const canEdit = can('export.quotations.edit');
  const canApprove = can('export.quotations.approve');
  const canCreateOrder = can('export.orders.create');

  const list = useExportList<ExportQuotation>((query) => exportApi.listQuotations(query), {
    limit: 20,
  });

  const [selectedQuote, setSelectedQuote] = useState<ExportQuotation | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [incoterm, setIncoterm] = useState('CIF');
  const [portOfLoading, setPortOfLoading] = useState('');
  const [portOfDischarge, setPortOfDischarge] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Confirmed Irrevocable LC at Sight');
  const [freight, setFreight] = useState<number | ''>('');
  const [insurance, setInsurance] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [productOpen, setProductOpen] = useState(false);

  useEffect(() => {
    const id = searchParams?.get('quote');
    if (!id) return;
    let cancelled = false;
    exportApi
      .getQuotation(id)
      .then((quote) => {
        if (!cancelled) setSelectedQuote(quote);
      })
      .catch((err) => {
        if (!cancelled) toast.error(errorMessage(err, 'Quotation not found'));
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const resetForm = () => {
    setCustomer(null);
    setQuoteDate(new Date().toISOString().slice(0, 10));
    setValidUntil('');
    setCurrency('USD');
    setIncoterm('CIF');
    setPortOfLoading('');
    setPortOfDischarge('');
    setPaymentTerms('Confirmed Irrevocable LC at Sight');
    setFreight('');
    setInsurance('');
    setNotes('');
    setLines([]);
    setFormError(null);
  };

  const addProducts = (products: Product[]) => {
    setLines((prev) => {
      const next = [...prev];
      products.forEach((p) => {
        const id = String(p.id || (p as any)._id || '');
        if (!id || next.some((l) => l.productId === id)) return;
        next.push({
          productId: id,
          productName: p.name,
          sku: p.sku || '',
          uom: p.stockUnit || 'PCS',
          quantity: 1,
          unitPriceForeign: Number(p.sellingPrice || 0),
        });
      });
      return next;
    });
  };

  const updateLine = (index: number, patch: Partial<QuoteLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const subtotal = lines.reduce(
    (sum, l) => sum + Number(l.quantity || 0) * Number(l.unitPriceForeign || 0),
    0
  );
  const total = subtotal + Number(freight || 0) + Number(insurance || 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!customer?.id) return setFormError('Select an overseas buyer.');
    if (!lines.length) return setFormError('Add at least one quotation line.');
    if (lines.some((l) => !l.quantity || l.quantity <= 0)) {
      return setFormError('Every line needs a quantity greater than zero.');
    }
    if (lines.some((l) => l.unitPriceForeign <= 0)) {
      return setFormError('Every line needs a unit price greater than zero.');
    }
    setSaving(true);
    try {
      const created = await exportApi.createQuotation({
        customerId: customer.id,
        customerName: customer.name,
        customerCountry: customerCountry(customer),
        quoteDate,
        validUntil: validUntil || undefined,
        currency,
        incoterm,
        portOfLoading: portOfLoading || undefined,
        portOfDischarge: portOfDischarge || undefined,
        paymentTerms: paymentTerms || undefined,
        freightForeign: Number(freight || 0),
        insuranceForeign: Number(insurance || 0),
        notes: notes || undefined,
        items: lines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          sku: l.sku,
          quantity: Number(l.quantity),
          uom: l.uom,
          unitPriceForeign: Number(l.unitPriceForeign),
        })),
      });
      toast.success(`Quotation ${created.quoteNumber} created`);
      setIsCreateOpen(false);
      resetForm();
      list.reload();
      setSelectedQuote(created);
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to create quotation'));
    } finally {
      setSaving(false);
    }
  };

  const refreshSelected = async (id: string) => {
    const fresh = await exportApi.getQuotation(id);
    setSelectedQuote(fresh);
    list.reload();
    return fresh;
  };

  const handleStatus = async (quote: ExportQuotation, status: string) => {
    setActionId(quote.id);
    try {
      await exportApi.updateQuotationStatus(quote.id, status);
      await refreshSelected(quote.id);
      toast.success(`Quotation marked ${status}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update quotation'));
    } finally {
      setActionId(null);
    }
  };

  const handleApprove = async (quote: ExportQuotation) => {
    setActionId(quote.id);
    try {
      await exportApi.approveQuotation(quote.id);
      await refreshSelected(quote.id);
      toast.success('Quotation approved');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to approve quotation'));
    } finally {
      setActionId(null);
    }
  };

  const handleConvert = async (quote: ExportQuotation) => {
    setActionId(quote.id);
    try {
      const order = await exportApi.convertQuotation(quote.id, {});
      toast.success(`Export order ${order.orderNumber} created`);
      setSelectedQuote(null);
      list.reload();
      router.push(`/export/orders?order=${order.id}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to convert quotation'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Export Quotations"
        subtitle="Formal international sales quotes, ocean freight & insurance estimates and payment conditions"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<FileSpreadsheet className="w-5 h-5 text-white" />}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Quotation
            </button>
          ) : null
        }
      />

      <TradeCard>
        <div className="mb-4">
          <TradeWorkflowStepper steps={EXPORT_WORKFLOW_STEPS} currentStepIndex={1} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search quotation no, buyer or country…"
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
              {QUOTE_STATUSES.map((s) => (
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
            columns={['Quote Number', 'Date', 'Overseas Customer', 'Incoterm', 'Discharge Port', 'Total Quote', 'Valid Until', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {list.loading && list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={9}>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading quotations…
                </TradeTableCell>
              </TradeTableRow>
            ) : list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={9}>
                  No export quotations match the current filters.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              list.items.map((quote) => (
                <TradeTableRow key={quote.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{quote.quoteNumber}</TradeTableCell>
                  <TradeTableCell className="text-gray-600">{formatDate(quote.quoteDate)}</TradeTableCell>
                  <TradeTableCell>
                    <span className="font-semibold text-gray-900 block">{quote.customerName}</span>
                    <span className="text-[10px] text-gray-400">{quote.customerCountry || '—'}</span>
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="px-2 py-0.5 rounded bg-gray-100 font-bold text-[11px] text-gray-700">
                      {quote.incoterm}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="text-xs text-gray-700">{quote.portOfDischarge || '—'}</TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {formatMoney(quote.totalForeign, quote.currency)}
                    {quote.currency !== 'USD' ? (
                      <span className="block text-[10px] font-normal text-gray-400">
                        base {formatMoney(quote.totalBase, 'USD')}
                      </span>
                    ) : null}
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-600">{formatDate(quote.validUntil)}</TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={quote.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedQuote(quote)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View quotation"
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
        isOpen={Boolean(selectedQuote)}
        onClose={() => setSelectedQuote(null)}
        title={selectedQuote?.quoteNumber || 'Export Quotation'}
        subtitle={selectedQuote ? `Customer: ${selectedQuote.customerName}` : undefined}
        actions={
          selectedQuote ? (
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && selectedQuote.status === 'Draft' && (
                <button
                  type="button"
                  disabled={actionId === selectedQuote.id}
                  onClick={() => handleStatus(selectedQuote, 'Sent to Buyer')}
                  className="px-3.5 py-2 rounded-xl border border-[#014582]/30 text-[#014582] text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send to Buyer
                </button>
              )}
              {canEdit &&
                ['Sent to Buyer', 'Under Negotiation'].includes(selectedQuote.status) && (
                  <button
                    type="button"
                    disabled={actionId === selectedQuote.id}
                    onClick={() => handleStatus(selectedQuote, 'Under Negotiation')}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold disabled:opacity-50"
                  >
                    Mark Negotiation
                  </button>
                )}
              {canApprove &&
                ['Draft', 'Sent to Buyer', 'Under Negotiation'].includes(selectedQuote.status) && (
                  <button
                    type="button"
                    disabled={actionId === selectedQuote.id}
                    onClick={() => handleApprove(selectedQuote)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
              {canEdit &&
                ['Draft', 'Sent to Buyer', 'Under Negotiation'].includes(selectedQuote.status) && (
                  <button
                    type="button"
                    disabled={actionId === selectedQuote.id}
                    onClick={() => handleStatus(selectedQuote, 'Declined')}
                    className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Decline
                  </button>
                )}
              {canCreateOrder && selectedQuote.status === 'Accepted' && (
                <button
                  type="button"
                  disabled={actionId === selectedQuote.id}
                  onClick={() => handleConvert(selectedQuote)}
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FileCheck2 className="w-4 h-4" />
                  {actionId === selectedQuote.id ? 'Converting…' : 'Convert to Export Order'}
                </button>
              )}
            </div>
          ) : null
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
                <span className="font-semibold text-gray-900">{selectedQuote.portOfDischarge || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">FOB Subtotal</span>
                <span className="font-bold text-gray-900">
                  {formatMoney(selectedQuote.subtotalForeign, selectedQuote.currency)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Freight & Insurance</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(
                    selectedQuote.freightForeign + selectedQuote.insuranceForeign,
                    selectedQuote.currency
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Contract Value</span>
                <span className="font-extrabold text-[#014582] text-sm">
                  {formatMoney(selectedQuote.totalForeign, selectedQuote.currency)}
                </span>
                {selectedQuote.currency !== 'USD' ? (
                  <span className="block text-[10px] text-gray-400">
                    base {formatMoney(selectedQuote.totalBase, 'USD')} @ {selectedQuote.exchangeRate}
                  </span>
                ) : null}
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Payment Terms</span>
                <span className="font-medium text-gray-800">{selectedQuote.paymentTerms || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selectedQuote.status} />
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Valid Until</span>
                <span className="font-semibold text-gray-900">{formatDate(selectedQuote.validUntil)}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Quotation Items</h4>
              <TradeTable>
                <TradeTableHeader
                  columns={['SKU', 'Item Name', 'Quantity', `Unit Price (${selectedQuote.currency})`, 'Line Total']}
                />
                <TradeTableBody>
                  {selectedQuote.items.map((it) => (
                    <TradeTableRow key={it.id}>
                      <TradeTableCell className="font-mono">{it.sku || '—'}</TradeTableCell>
                      <TradeTableCell className="font-medium text-gray-900">{it.productName}</TradeTableCell>
                      <TradeTableCell className="font-bold">
                        {it.quantity} {it.uom}
                      </TradeTableCell>
                      <TradeTableCell>{formatMoney(it.unitPriceForeign, selectedQuote.currency)}</TradeTableCell>
                      <TradeTableCell className="font-bold text-gray-900">
                        {formatMoney(it.lineTotalForeign, selectedQuote.currency)}
                      </TradeTableCell>
                    </TradeTableRow>
                  ))}
                </TradeTableBody>
              </TradeTable>
            </div>

            {selectedQuote.notes && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                <span className="font-bold block text-xs mb-1">Notes</span>
                <p className="text-xs whitespace-pre-wrap">{selectedQuote.notes}</p>
              </div>
            )}

            {selectedQuote.convertedOrderId && (
              <button
                type="button"
                onClick={() => router.push(`/export/orders?order=${selectedQuote.convertedOrderId}`)}
                className="w-full px-4 py-2 rounded-xl border border-[#014582]/30 text-[#014582] text-xs font-bold"
              >
                Open converted export order
              </button>
            )}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Export Quotation"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {formError}
            </div>
          )}

          <FormSection title="Buyer & quotation terms">
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
              onSelect={(c) => setCustomer(c)}
              disabled={saving}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <FieldLabel required>Quote date</FieldLabel>
                <input
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <FieldLabel>Valid until</FieldLabel>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel required>Currency</FieldLabel>
                <CurrencySelect value={currency} onChange={(code) => setCurrency(code)} disabled={saving} />
              </div>
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Port of loading</FieldLabel>
                <PortSelect
                  value={portOfLoading}
                  onChange={(name) => setPortOfLoading(name)}
                  placeholder="Select loading port…"
                />
              </div>
              <div>
                <FieldLabel>Port of discharge</FieldLabel>
                <PortSelect
                  value={portOfDischarge}
                  onChange={(name) => setPortOfDischarge(name)}
                  placeholder="Select discharge port…"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Payment terms</FieldLabel>
              <input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
          </FormSection>

          <FormSection title="Quotation lines" subtitle="Prices are in the selected transaction currency">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setProductOpen(true)}
                disabled={saving}
                className="px-3 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50"
              >
                Add Products
              </button>
            </div>
            {lines.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No lines yet. Add products above.</p>
            ) : (
              <div className="space-y-2">
                {lines.map((line, index) => (
                  <div key={line.productId} className="grid grid-cols-12 gap-2 items-end p-2.5 rounded-xl border border-gray-200 bg-gray-50/60">
                    <div className="col-span-4 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{line.productName}</p>
                      <p className="text-[10px] text-gray-400">
                        {line.sku} · {line.uom}
                      </p>
                    </div>
                    <div className="col-span-3">
                      <FieldLabel required>Quantity</FieldLabel>
                      <input
                        type="number"
                        min="0.0001"
                        step="any"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <FieldLabel required>Unit price ({currency})</FieldLabel>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={line.unitPriceForeign}
                        onChange={(e) => updateLine(index, { unitPriceForeign: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-gray-700 whitespace-nowrap">
                        {formatMoney(Number(line.quantity) * Number(line.unitPriceForeign), currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        title="Remove line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Freight ({currency})</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={freight}
                  onChange={(e) => setFreight(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Insurance ({currency})</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#014582]/5 border border-[#014582]/15 text-xs text-slate-700 space-y-1">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal, currency)}</strong>
              </p>
              <p className="flex justify-between">
                <span>Freight + insurance</span>
                <strong>{formatMoney(Number(freight || 0) + Number(insurance || 0), currency)}</strong>
              </p>
              <p className="flex justify-between text-sm">
                <span>Total quotation</span>
                <strong className="text-[#014582]">{formatMoney(total, currency)}</strong>
              </p>
            </div>
          </FormSection>

          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              {saving ? 'Saving…' : 'Create Quotation'}
            </button>
          </div>
        </form>
      </TradeModal>

      <ProductPickerModal
        isOpen={productOpen}
        onClose={() => setProductOpen(false)}
        multi
        onSelect={(products) => {
          addProducts(products);
          setProductOpen(false);
        }}
      />
    </TradePage>
  );
}
