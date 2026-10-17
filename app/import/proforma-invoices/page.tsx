'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Search,
  Filter,
  Eye,
  Plus,
  CheckCircle2,
  DollarSign,
  Landmark,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
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
} from '../../../components/trade/TradeUI';
import importApi, {
  ImportProformaInvoice,
  ImportProformaInvoiceItem,
  ImportPurchaseOrder,
  ImportFxPreview,
} from '../../../lib/import-api';
import { useCurrency } from '../../../lib/currency-context';
import { formatImportMoney, parseImportDateOnly } from '../../../lib/import-format';
import type { Supplier } from '@/api/supplier/route';
import {
  SupplierSelectField,
  CurrencySelect,
  FormSection,
  FieldLabel,
} from '@/components/import/ImportSelectors';

type PiLineDraft = {
  key: string;
  importPoItemId?: string;
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  discountPercent: number;
  hsCode?: string;
  netWeightKg?: number;
  grossWeightKg?: number;
};

const STATUS_FILTERS = [
  'All',
  'Draft',
  'Submitted',
  'Approved',
  'Rejected',
  'Expired',
  'Cancelled',
  'Advance Paid',
];

function formatDate(val?: string) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return val;
  }
}

function lineMerchandiseSubtotal(lines: PiLineDraft[]) {
  return lines.reduce((s, l) => {
    const gross = l.quantity * l.unitPrice;
    const disc = (gross * (l.discountPercent || 0)) / 100;
    return s + (gross - disc);
  }, 0);
}

export default function ImportProformaInvoicesPage() {
  const { code: baseCurrencyCode } = useCurrency();

  const [items, setItems] = useState<ImportProformaInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPI, setSelectedPI] = useState<ImportProformaInvoice | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [poOptions, setPoOptions] = useState<ImportPurchaseOrder[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [fxPreview, setFxPreview] = useState<ImportFxPreview | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [advancePaymentId, setAdvancePaymentId] = useState('');
  const [advanceStatusOnly, setAdvanceStatusOnly] = useState(false);

  const [form, setForm] = useState({
    importPoId: '',
    issueDate: new Date().toISOString().slice(0, 10),
    validUntil: '',
    expectedPaymentDate: '',
    currency: 'USD',
    exchangeRateToUsd: '',
    exchangeRateDate: new Date().toISOString().slice(0, 10),
    originCountry: '',
    portOfLoading: '',
    portOfDischarge: '',
    portOfEntry: '',
    incoterm: 'CIF',
    namedPlace: '',
    shipmentMode: 'Ocean',
    paymentTerms: '',
    balancePaymentTerms: '',
    paymentSchedule: '',
    freightEstimate: '',
    insuranceEstimate: '',
    otherChargesEstimate: '',
    customsDutyEstimate: '',
    advanceRequiredPercent: '30',
    lcRequired: false,
    lcNumber: '',
    bankSwift: '',
    notes: '',
  });
  const [lines, setLines] = useState<PiLineDraft[]>([]);

  const setField = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      const res = await importApi.listProformas(params);
      setItems(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load proforma invoices');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    importApi
      .listPurchaseOrders({ limit: 100 })
      .then((res) => setPoOptions(res.items || []))
      .catch(() => setPoOptions([]));
  }, []);

  const linkedPo = useMemo(
    () => poOptions.find((p) => p.id === form.importPoId),
    [poOptions, form.importPoId]
  );

  const chargesTotal =
    (Number(form.freightEstimate) || 0) +
    (Number(form.insuranceEstimate) || 0) +
    (Number(form.otherChargesEstimate) || 0) +
    (Number(form.customsDutyEstimate) || 0);

  const merchandiseSubtotal = lineMerchandiseSubtotal(lines);
  const amountForeign = Math.round((merchandiseSubtotal + chargesTotal) * 100) / 100;

  const refreshFxPreview = useCallback(async () => {
    if (!form.currency || amountForeign <= 0) {
      setFxPreview(null);
      return;
    }
    setFxLoading(true);
    try {
      const preview = await importApi.previewFx({
        currency: form.currency,
        foreignAmount: amountForeign,
        exchangeRateToUsd: form.exchangeRateToUsd.trim() ? Number(form.exchangeRateToUsd) : undefined,
        exchangeRateDate: form.exchangeRateDate || form.issueDate,
      });
      setFxPreview(preview);
      if (!form.exchangeRateToUsd.trim() && preview.exchangeRate) {
        setForm((f) => ({ ...f, exchangeRateToUsd: String(preview.exchangeRate) }));
      }
    } catch {
      setFxPreview(null);
    } finally {
      setFxLoading(false);
    }
  }, [form.currency, form.exchangeRateToUsd, form.exchangeRateDate, form.issueDate, amountForeign]);

  useEffect(() => {
    const t = setTimeout(() => {
      refreshFxPreview();
    }, 400);
    return () => clearTimeout(t);
  }, [refreshFxPreview]);

  const applyPoToForm = (po: ImportPurchaseOrder) => {
    setForm((f) => ({
      ...f,
      importPoId: po.id,
      currency: po.currency || f.currency,
      exchangeRateToUsd: po.exchangeRateToUsd ? String(po.exchangeRateToUsd) : f.exchangeRateToUsd,
      exchangeRateDate: po.exchangeRateDate?.slice(0, 10) || f.exchangeRateDate,
      originCountry: po.originCountry || f.originCountry,
      portOfLoading: po.portOfLoading || f.portOfLoading,
      portOfEntry: po.portOfEntry || f.portOfEntry,
      incoterm: po.incoterm || f.incoterm,
      namedPlace: po.namedPlace || f.namedPlace,
      shipmentMode: po.shippingMethod || f.shipmentMode,
      paymentTerms: po.paymentTerms || f.paymentTerms,
      freightEstimate: po.estimatedFreightUsd != null ? String(po.estimatedFreightUsd) : f.freightEstimate,
      insuranceEstimate: po.estimatedInsuranceUsd != null ? String(po.estimatedInsuranceUsd) : f.insuranceEstimate,
      customsDutyEstimate: po.estimatedDutyUsd != null ? String(po.estimatedDutyUsd) : f.customsDutyEstimate,
      advanceRequiredPercent:
        po.advanceRequiredPercent != null ? String(po.advanceRequiredPercent) : f.advanceRequiredPercent,
      lcRequired: po.lcRequired ?? f.lcRequired,
    }));
    setSelectedSupplier(
      po.supplierId
        ? ({ id: po.supplierId, name: po.supplierName, country: po.supplierCountry } as Supplier)
        : ({ name: po.supplierName, country: po.supplierCountry } as Supplier)
    );
    setLines(
      (po.items || []).map((it) => ({
        key: it.id || `${it.productName}-${Math.random().toString(36).slice(2, 6)}`,
        importPoItemId: it.id,
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        quantity: Number(it.quantity) || 0,
        uom: it.uom || 'PCS',
        unitPrice: Number(it.unitPrice) || 0,
        discountPercent: 0,
      }))
    );
  };

  const buildPayload = (status: string) => {
    const rate = form.exchangeRateToUsd.trim() ? Number(form.exchangeRateToUsd) : undefined;
    return {
      importPoId: form.importPoId || undefined,
      poRef: linkedPo?.poNumber,
      supplierId: selectedSupplier?.id,
      supplierName: selectedSupplier?.name || linkedPo?.supplierName,
      issueDate: form.issueDate,
      validUntil: form.validUntil || undefined,
      expectedPaymentDate: form.expectedPaymentDate || undefined,
      currency: form.currency,
      exchangeRateToUsd: rate,
      exchangeRateDate: form.exchangeRateDate || form.issueDate,
      amountForeign,
      originCountry: form.originCountry || undefined,
      portOfLoading: form.portOfLoading || undefined,
      portOfDischarge: form.portOfDischarge || undefined,
      portOfEntry: form.portOfEntry || undefined,
      incoterm: form.incoterm,
      namedPlace: form.namedPlace || undefined,
      shipmentMode: form.shipmentMode,
      paymentTerms: form.paymentTerms || undefined,
      balancePaymentTerms: form.balancePaymentTerms || undefined,
      paymentSchedule: form.paymentSchedule || undefined,
      freightEstimate: Number(form.freightEstimate) || 0,
      insuranceEstimate: Number(form.insuranceEstimate) || 0,
      otherChargesEstimate: Number(form.otherChargesEstimate) || 0,
      customsDutyEstimate: Number(form.customsDutyEstimate) || 0,
      advanceRequiredPercent: Number(form.advanceRequiredPercent) || 0,
      lcRequired: form.lcRequired,
      lcNumber: form.lcNumber || undefined,
      bankSwift: form.bankSwift || undefined,
      status,
      notes: form.notes || undefined,
      items: lines.map((l) => ({
        importPoItemId: l.importPoItemId,
        productId: l.productId,
        productName: l.productName,
        sku: l.sku,
        quantity: l.quantity,
        uom: l.uom,
        unitPrice: l.unitPrice,
        discountPercent: l.discountPercent,
        hsCode: l.hsCode,
        netWeightKg: l.netWeightKg,
        grossWeightKg: l.grossWeightKg,
      })),
    };
  };

  const openDetail = async (pi: ImportProformaInvoice) => {
    setSelectedPI(pi);
    setDetailLoading(true);
    try {
      const full = await importApi.getProforma(pi.id);
      setSelectedPI(full);
    } catch {
      /* keep list row */
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (piId: string, status: string, extra?: Record<string, unknown>) => {
    try {
      setActionLoading(true);
      const updated = await importApi.updateProformaStatus(piId, status, extra);
      setItems((prev) => prev.map((p) => (p.id === piId ? { ...p, ...updated } : p)));
      if (selectedPI?.id === piId) setSelectedPI((prev) => (prev ? { ...prev, ...updated } : null));
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvancePayment = async (piId: string) => {
    try {
      setActionLoading(true);
      const pi = items.find((p) => p.id === piId) || selectedPI;
      const updated = await importApi.recordAdvancePayment(piId, {
        amount: Number(pi?.advanceAmountUsd || 0) || Number(pi?.amountForeign || 0) * (Number(pi?.advanceRequiredPercent || 0) / 100),
        date: new Date().toISOString().slice(0, 10),
        method: 'Bank Transfer',
        paymentMadeId: advancePaymentId.trim() || undefined,
        allowStatusOnly: advanceStatusOnly,
      });
      setItems((prev) => prev.map((p) => (p.id === piId ? { ...p, ...updated } : p)));
      if (selectedPI?.id === piId) setSelectedPI((prev) => (prev ? { ...prev, ...updated } : null));
      setAdvancePaymentId('');
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to record advance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProforma = async (submit: boolean) => {
    if (!selectedSupplier?.name && !linkedPo?.supplierName) {
      setError('Supplier is required');
      return;
    }
    if (!lines.length) {
      setError('Add at least one line item');
      return;
    }
    const rateDateStr = form.exchangeRateDate || form.issueDate;
    const rd = parseImportDateOnly(rateDateStr);
    const today = parseImportDateOnly(new Date());
    if (rd && today && rd.getTime() > today.getTime()) {
      setError('Rate date must not be in the future');
      return;
    }
    const orderDate = parseImportDateOnly(linkedPo?.orderDate || linkedPo?.createdAt);
    if (rd && orderDate && rd.getTime() < orderDate.getTime()) {
      setError('Rate date must not be before the PO order date');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await importApi.createProforma(buildPayload(submit ? 'Submitted' : 'Draft') as Partial<ImportProformaInvoice>);
      setIsCreateOpen(false);
      setLines([]);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save proforma');
    } finally {
      setSaving(false);
    }
  };

  const resetCreateForm = () => {
    setForm({
      importPoId: '',
      issueDate: new Date().toISOString().slice(0, 10),
      validUntil: '',
      expectedPaymentDate: '',
      currency: 'USD',
      exchangeRateToUsd: '',
      exchangeRateDate: new Date().toISOString().slice(0, 10),
      originCountry: '',
      portOfLoading: '',
      portOfDischarge: '',
      portOfEntry: '',
      incoterm: 'CIF',
      namedPlace: '',
      shipmentMode: 'Ocean',
      paymentTerms: '',
      balancePaymentTerms: '',
      paymentSchedule: '',
      freightEstimate: '',
      insuranceEstimate: '',
      otherChargesEstimate: '',
      customsDutyEstimate: '',
      advanceRequiredPercent: '30',
      lcRequired: false,
      lcNumber: '',
      bankSwift: '',
      notes: '',
    });
    setLines([]);
    setSelectedSupplier(null);
    setFxPreview(null);
  };

  const baseAmount = fxPreview?.baseAmount ?? (form.exchangeRateToUsd ? amountForeign * Number(form.exchangeRateToUsd) : null);

  return (
    <TradePage>
      <TradePageHeader
        title="Import Proforma Invoices"
        subtitle="Supplier commercial quotes, advance payment terms, LC requirements and bank remittance instructions"
        moduleName="Import Operations"
        backHref="/import/dashboard"
        icon={<FileCheck className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Proforma Invoice
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search PI number, supplier, PO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#014582]"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Statuses' : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#014582]" />
            <p className="text-xs">Loading proforma invoices...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-xs">No proforma invoices found.</p>
          </div>
        ) : (
          <TradeTable>
            <TradeTableHeader
              columns={[
                'PI Number',
                'Linked PO',
                'Supplier',
                'Issue Date',
                'Currency',
                'Amount (Foreign)',
                `Amount (${baseCurrencyCode})`,
                'Advance',
                'Status',
                'Actions',
              ]}
            />
            <TradeTableBody>
              {items.map((pi) => (
                <TradeTableRow key={pi.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{pi.piNumber}</TradeTableCell>
                  <TradeTableCell className="font-medium text-gray-700">
                    {pi.poRef ? (
                      <Link href={`/import/purchase-orders?po=${pi.poRef}`} className="hover:underline text-blue-700">
                        {pi.poRef}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-900">{pi.supplierName}</TradeTableCell>
                  <TradeTableCell className="text-gray-600">{formatDate(pi.issueDate)}</TradeTableCell>
                  <TradeTableCell className="font-mono text-xs">{pi.currency}</TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {pi.currency}{' '}
                    {Number(pi.amountForeign || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TradeTableCell>
                  <TradeTableCell className="font-bold text-[#014582]">
                    {formatImportMoney(Number(pi.amountUsd || 0), baseCurrencyCode)}
                  </TradeTableCell>
                  <TradeTableCell>
                    {pi.advanceRequiredPercent > 0 ? (
                      <span className="text-amber-700 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded">
                        {pi.advanceRequiredPercent}% ({formatImportMoney(Number(pi.advanceAmountUsd || 0), baseCurrencyCode)})
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
                    )}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={pi.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => openDetail(pi)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </TradeTableCell>
                </TradeTableRow>
              ))}
            </TradeTableBody>
          </TradeTable>
        )}
      </TradeCard>

      <TradeDetailDrawer
        isOpen={Boolean(selectedPI)}
        onClose={() => setSelectedPI(null)}
        title={selectedPI?.piNumber || 'Proforma Invoice Details'}
        subtitle={`Supplier: ${selectedPI?.supplierName || ''}`}
        actions={
          selectedPI && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedPI.status === 'Draft' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedPI.id, 'Submitted')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-50"
                >
                  Submit
                </button>
              )}
              {selectedPI.status === 'Submitted' && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedPI.id, 'Approved')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      const reason = window.prompt('Rejection reason (optional):') || undefined;
                      handleUpdateStatus(selectedPI.id, 'Rejected', reason ? { rejectedReason: reason } : undefined);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
              {!['Cancelled', 'Expired'].includes(selectedPI.status) && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedPI.id, 'Cancelled')}
                  className="px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              {['Approved', 'Submitted', 'Accepted', 'Issued'].includes(selectedPI.status) &&
                Number(selectedPI.advanceRequiredPercent || 0) > 0 &&
                selectedPI.status !== 'Advance Paid' &&
                !selectedPI.lcRequired && (
                  <div className="flex flex-wrap items-center gap-2 border-l pl-2 ml-1">
                    <Link
                      href="/import/bills"
                      className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold"
                    >
                      Pay via Supplier Bills
                    </Link>
                    <Link
                      href="/import/finance"
                      className="px-3.5 py-2 rounded-xl border text-xs font-bold text-[#014582]"
                    >
                      Record on Finance page
                    </Link>
                    <input
                      type="text"
                      placeholder="paymentMadeId (optional)"
                      value={advancePaymentId}
                      onChange={(e) => setAdvancePaymentId(e.target.value)}
                      className="rounded-lg border px-2 py-1.5 text-xs w-40"
                    />
                    <label className="flex items-center gap-1 text-[10px] text-gray-600">
                      <input
                        type="checkbox"
                        checked={advanceStatusOnly}
                        onChange={(e) => setAdvanceStatusOnly(e.target.checked)}
                      />
                      Status-only
                    </label>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleAdvancePayment(selectedPI.id)}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <DollarSign className="w-4 h-4" /> Record Advance
                    </button>
                  </div>
                )}
              {(selectedPI.lcRequired || Number(selectedPI.advanceRequiredPercent || 0) > 0) && (
                <Link
                  href="/import/finance"
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Landmark className="w-4 h-4" /> Finance & LC
                </Link>
              )}
            </div>
          )
        }
      >
        {selectedPI && (
          <div className="space-y-5 text-xs">
            {detailLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading full detail…
              </div>
            )}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">PI Number</span>
                <span className="font-bold text-gray-900">{selectedPI.piNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">PO Reference</span>
                <span className="font-semibold text-gray-900">{selectedPI.poRef || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selectedPI.status} />
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Issue / Valid</span>
                <span className="font-medium text-gray-800">
                  {formatDate(selectedPI.issueDate)} → {formatDate(selectedPI.validUntil)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Incoterm / Mode</span>
                <span className="font-semibold text-gray-900">
                  {selectedPI.incoterm || '—'} · {selectedPI.shipmentMode || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Ports</span>
                <span className="text-gray-800">
                  {selectedPI.portOfLoading || '—'} → {selectedPI.portOfEntry || selectedPI.portOfDischarge || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total (Foreign)</span>
                <span className="font-bold text-gray-900">
                  {selectedPI.currency}{' '}
                  {Number(selectedPI.amountForeign || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total ({baseCurrencyCode})</span>
                <span className="font-extrabold text-[#014582]">{formatImportMoney(Number(selectedPI.amountUsd || 0), baseCurrencyCode)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">FX Rate</span>
                <span className="font-mono text-gray-800">
                  1 {selectedPI.currency} = {Number(selectedPI.exchangeRateToUsd || 0)} {selectedPI.baseCurrencyCode || baseCurrencyCode}
                </span>
              </div>
            </div>

            {(selectedPI.items?.length ?? 0) > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Line Items</h4>
                <TradeTable>
                  <TradeTableHeader
                    columns={['Product', 'Qty', 'Unit Price', 'Disc %', 'HS', 'Line Total (Foreign)']}
                  />
                  <TradeTableBody>
                    {selectedPI.items!.map((it: ImportProformaInvoiceItem, idx) => (
                      <TradeTableRow key={it.id || idx}>
                        <TradeTableCell className="font-medium">{it.productName}</TradeTableCell>
                        <TradeTableCell>
                          {it.quantity} {it.uom}
                        </TradeTableCell>
                        <TradeTableCell>
                          {selectedPI.currency} {Number(it.unitPrice).toFixed(2)}
                        </TradeTableCell>
                        <TradeTableCell>{it.discountPercent ?? 0}%</TradeTableCell>
                        <TradeTableCell className="font-mono text-[10px]">{it.hsCode || '—'}</TradeTableCell>
                        <TradeTableCell className="font-bold">
                          {selectedPI.currency} {Number(it.lineTotal ?? it.quantity * it.unitPrice).toLocaleString()}
                        </TradeTableCell>
                      </TradeTableRow>
                    ))}
                  </TradeTableBody>
                </TradeTable>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div>
                <span className="text-[10px] uppercase text-amber-800">Freight</span>
                <p className="font-bold">{formatImportMoney(Number(selectedPI.freightEstimate || 0), selectedPI.baseCurrencyCode || baseCurrencyCode)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-amber-800">Insurance</span>
                <p className="font-bold">{formatImportMoney(Number(selectedPI.insuranceEstimate || 0), selectedPI.baseCurrencyCode || baseCurrencyCode)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-amber-800">Other</span>
                <p className="font-bold">{formatImportMoney(Number(selectedPI.otherChargesEstimate || 0), selectedPI.baseCurrencyCode || baseCurrencyCode)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-amber-800">Duty Est.</span>
                <p className="font-bold">{formatImportMoney(Number(selectedPI.customsDutyEstimate || 0), selectedPI.baseCurrencyCode || baseCurrencyCode)}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-1">
              <span className="font-bold text-blue-900 block">Payment Terms</span>
              <p className="text-blue-800">{selectedPI.paymentTerms || '—'}</p>
              {selectedPI.paymentSchedule && (
                <p className="text-blue-700 text-[11px] whitespace-pre-wrap">{selectedPI.paymentSchedule}</p>
              )}
              <p className="text-blue-800 pt-1">
                Advance: {selectedPI.advanceRequiredPercent}% ({formatImportMoney(Number(selectedPI.advanceAmountUsd || 0), selectedPI.baseCurrencyCode || baseCurrencyCode)})
              </p>
              {selectedPI.bankSwift && (
                <p className="font-mono text-[11px] text-blue-900">SWIFT: {selectedPI.bankSwift}</p>
              )}
            </div>
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => !saving && setIsCreateOpen(false)}
        title="Create Proforma Invoice"
        maxWidth="max-w-5xl"
        actions={
          <div className="flex flex-wrap items-center justify-between w-full gap-2">
            <div className="text-[11px] text-gray-600">
              Merchandise ({form.currency}): <strong>{merchandiseSubtotal.toLocaleString()}</strong>
              {' · '}
              Total foreign: <strong>{amountForeign.toLocaleString()}</strong>
              {baseAmount != null && (
                <>
                  {' · '}
                  Base ({baseCurrencyCode}): <strong>{formatImportMoney(baseAmount, baseCurrencyCode)}</strong>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveProforma(false)}
                className="px-4 py-2 rounded-xl border border-[#014582] text-[#014582] text-xs font-bold disabled:opacity-60"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveProforma(true)}
                className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Submit'}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
            Proforma invoices do not post inventory or AP. Use Supplier Bills for commercial billing.
          </p>

          <FormSection title="Link Import Purchase Order">
            <FieldLabel>Import PO</FieldLabel>
            <select
              value={form.importPoId}
              onChange={(e) => {
                const id = e.target.value;
                setField('importPoId', id);
                const po = poOptions.find((p) => p.id === id);
                if (po) applyPoToForm(po);
              }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white"
            >
              <option value="">Select PO to auto-fill…</option>
              {poOptions.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} — {po.supplierName} ({po.currency})
                </option>
              ))}
            </select>
            <div className="mt-3">
              <FieldLabel required>Supplier</FieldLabel>
              <SupplierSelectField
                selected={
                  selectedSupplier
                    ? {
                        id: selectedSupplier.id,
                        name: selectedSupplier.name,
                        country: selectedSupplier.country,
                        code: (selectedSupplier as any).code,
                      }
                    : null
                }
                onSelect={setSelectedSupplier}
              />
            </div>
          </FormSection>

          <FormSection title="Document Information">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel required>Issue date</FieldLabel>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setField('issueDate', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Valid until</FieldLabel>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setField('validUntil', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Expected payment</FieldLabel>
                <input
                  type="date"
                  value={form.expectedPaymentDate}
                  onChange={(e) => setField('expectedPaymentDate', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Trade & Shipment">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel>Origin country</FieldLabel>
                <input
                  value={form.originCountry}
                  onChange={(e) => setField('originCountry', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Port of loading</FieldLabel>
                <input
                  value={form.portOfLoading}
                  onChange={(e) => setField('portOfLoading', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Port of entry</FieldLabel>
                <input
                  value={form.portOfEntry}
                  onChange={(e) => setField('portOfEntry', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Incoterm</FieldLabel>
                <input
                  value={form.incoterm}
                  onChange={(e) => setField('incoterm', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Named place</FieldLabel>
                <input
                  value={form.namedPlace}
                  onChange={(e) => setField('namedPlace', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Shipment mode</FieldLabel>
                <select
                  value={form.shipmentMode}
                  onChange={(e) => setField('shipmentMode', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 bg-white"
                >
                  {['Ocean', 'Air', 'Road', 'Rail', 'Courier'].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Payment terms</FieldLabel>
                <input
                  value={form.paymentTerms}
                  onChange={(e) => setField('paymentTerms', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Advance %</FieldLabel>
                <input
                  type="number"
                  value={form.advanceRequiredPercent}
                  onChange={(e) => setField('advanceRequiredPercent', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <FieldLabel>LC number</FieldLabel>
                <input
                  value={form.lcNumber}
                  onChange={(e) => setField('lcNumber', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Bank SWIFT</FieldLabel>
                <input
                  value={form.bankSwift}
                  onChange={(e) => setField('bankSwift', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 font-mono"
                />
              </div>
              <label className="flex items-center gap-2 col-span-2">
                <input
                  type="checkbox"
                  checked={form.lcRequired}
                  onChange={(e) => setField('lcRequired', e.target.checked)}
                />
                LC required for this proforma
              </label>
            </div>
          </FormSection>

          <FormSection title="Foreign Exchange">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <FieldLabel required>Currency</FieldLabel>
                <CurrencySelect value={form.currency} onChange={(code) => setField('currency', code)} />
              </div>
              <div>
                <FieldLabel>Exchange rate (foreign → base)</FieldLabel>
                <input
                  value={form.exchangeRateToUsd}
                  onChange={(e) => setField('exchangeRateToUsd', e.target.value)}
                  placeholder="Auto from company rates"
                  className="w-full rounded-xl border px-3 py-2 font-mono"
                />
              </div>
              <div>
                <FieldLabel>Rate date</FieldLabel>
                <input
                  type="date"
                  value={form.exchangeRateDate}
                  onChange={(e) => setField('exchangeRateDate', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={refreshFxPreview}
                  disabled={fxLoading}
                  className="w-full px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold hover:bg-gray-200"
                >
                  {fxLoading ? 'Preview…' : 'Preview FX'}
                </button>
              </div>
            </div>
            {fxPreview && (
              <p className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-2">
                1 {fxPreview.currencyCode} = {fxPreview.exchangeRate} {fxPreview.baseCurrencyCode || baseCurrencyCode}{' '}
                · Source: {fxPreview.rateSource || 'company'} · Base total:{' '}
                {formatImportMoney(fxPreview.baseAmount, fxPreview.baseCurrencyCode || baseCurrencyCode)}
              </p>
            )}
          </FormSection>

          <FormSection title="Line Items">
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-[11px]">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                  <tr>
                    <th className="text-left p-2">Product</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Unit price</th>
                    <th className="p-2">Disc %</th>
                    <th className="p-2">HS</th>
                    <th className="p-2">Net kg</th>
                    <th className="p-2">Gross kg</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.key} className="border-t">
                      <td className="p-2 font-medium">{l.productName}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={l.quantity}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x) =>
                                x.key === l.key ? { ...x, quantity: Number(e.target.value) || 0 } : x
                              )
                            )
                          }
                          className="w-16 rounded border px-1 py-0.5"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={l.unitPrice}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x) =>
                                x.key === l.key ? { ...x, unitPrice: Number(e.target.value) || 0 } : x
                              )
                            )
                          }
                          className="w-20 rounded border px-1 py-0.5"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={l.discountPercent}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x) =>
                                x.key === l.key ? { ...x, discountPercent: Number(e.target.value) || 0 } : x
                              )
                            )
                          }
                          className="w-14 rounded border px-1 py-0.5"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          value={l.hsCode || ''}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x) => (x.key === l.key ? { ...x, hsCode: e.target.value } : x))
                            )
                          }
                          className="w-20 rounded border px-1 py-0.5 font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={l.netWeightKg ?? ''}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x) =>
                                x.key === l.key ? { ...x, netWeightKg: Number(e.target.value) || undefined } : x
                              )
                            )
                          }
                          className="w-16 rounded border px-1 py-0.5"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={l.grossWeightKg ?? ''}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x) =>
                                x.key === l.key ? { ...x, grossWeightKg: Number(e.target.value) || undefined } : x
                              )
                            )
                          }
                          className="w-16 rounded border px-1 py-0.5"
                        />
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {linkedPo && (
              <button
                type="button"
                onClick={() => applyPoToForm(linkedPo)}
                className="mt-2 text-xs font-bold text-[#014582] hover:underline"
              >
                Reload lines from PO
              </button>
            )}
          </FormSection>

          <FormSection title="Charges & Payment Schedule">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  ['freightEstimate', 'Freight est.'],
                  ['insuranceEstimate', 'Insurance est.'],
                  ['otherChargesEstimate', 'Other charges'],
                  ['customsDutyEstimate', 'Customs duty est.'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <FieldLabel>{label}</FieldLabel>
                  <input
                    type="number"
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <FieldLabel>Payment schedule note</FieldLabel>
              <textarea
                value={form.paymentSchedule}
                onChange={(e) => setField('paymentSchedule', e.target.value)}
                rows={2}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div className="mt-2">
              <FieldLabel>Internal notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                rows={2}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
          </FormSection>
        </div>
      </TradeModal>
    </TradePage>
  );
}
