'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Ship,
  FileCheck,
  ExternalLink,
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
  TradePagination,
  TradeWorkflowStepper,
  TradeModal,
  ErpLinkedBanner,
} from '../../../components/trade/TradeUI';
import importApi from '../../../lib/import-api';
import type { ImportPurchaseOrder } from '../../../lib/import-api';
import { useCurrency } from '../../../lib/currency-context';
import { formatImportMoney, parseImportDateOnly } from '../../../lib/import-format';
import { ensureCompanyBaseMatchesAppCurrency } from '../../../lib/multi-currency';
import type { Supplier } from '@/api/supplier/route';
import type { Product } from '@/api/product/route';
import {
  SupplierSelectField,
  ProductSelectButton,
  CurrencySelect,
  FormSection,
  FieldLabel,
} from '@/components/import/ImportSelectors';

const IMPORT_WORKFLOW_STEPS = [
  'Import RFQ',
  'Supplier Quotation',
  'Purchase Order',
  'Proforma Invoice',
  'Shipment',
  'Customs Clearance',
  'Goods Receipt',
  'Landed Cost',
  'Supplier Bill',
  'Payment',
];

export default function ImportPurchaseOrdersPage() {
  const { code: appCurrencyCode, currency: appCurrency } = useCurrency();
  /** Company FX / conversion target — kept in sync with selected app currency. */
  const baseCurrencyCode = appCurrencyCode;

  const [pos, setPos] = React.useState<ImportPurchaseOrder[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fxPreview, setFxPreview] = React.useState<{
    exchangeRate: number;
    baseAmount: number;
    baseCurrencyCode: string;
    currencyCode: string;
  } | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPO, setSelectedPO] = useState<ImportPurchaseOrder | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({
    currency: 'USD',
    exchangeRateToUsd: '',
    exchangeRateDate: new Date().toISOString().slice(0, 10),
    incoterm: 'CIF',
    namedPlace: '',
    paymentTerms: '30% Advance, 70% LC at Sight',
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: '',
    buyerName: '',
    internalRef: '',
    supplierReference: '',
    originCountry: '',
    portOfLoading: '',
    portOfEntry: '',
    shippingMethod: 'Ocean',
    estimatedArrival: '',
    estimatedFreightUsd: '',
    estimatedInsuranceUsd: '',
    estimatedDutyUsd: '',
    advanceRequiredPercent: '',
    lcRequired: false,
    piRef: '',
    notes: '',
  });
  type LineDraft = {
    key: string;
    productId?: string;
    productName: string;
    sku?: string;
    quantity: number;
    uom: string;
    unitPrice: number;
  };
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [fxCorrectOpen, setFxCorrectOpen] = useState(false);
  const [fxCorrectRate, setFxCorrectRate] = useState('');
  const [fxCorrectDate, setFxCorrectDate] = useState(new Date().toISOString().slice(0, 10));
  const [fxCorrectSaving, setFxCorrectSaving] = useState(false);

  const setField = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const lineSubtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  const fetchPos = React.useCallback(() => {
    setLoading(true);
    importApi.listPurchaseOrders({ search, status: statusFilter, page, limit: pageSize })
      .then((data) => { setPos(data.items || []); setTotal(data.pagination?.total || 0); })
      .catch((err) => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter, page]);

  React.useEffect(() => { fetchPos(); }, [fetchPos]);

  // Heal mismatch: company base was defaulting to PKR while app currency is SAR/etc.
  React.useEffect(() => {
    if (!appCurrencyCode) return;
    void ensureCompanyBaseMatchesAppCurrency(appCurrencyCode, {
      name: appCurrency?.name,
      symbol: appCurrency?.symbol,
    });
  }, [appCurrencyCode, appCurrency?.name, appCurrency?.symbol]);

  // Live FX preview in app/base currency while creating a PO
  React.useEffect(() => {
    if (!isCreateOpen || !form.currency || !(lineSubtotal > 0)) {
      setFxPreview(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      importApi
        .previewFx({
          currency: form.currency,
          foreignAmount: lineSubtotal,
          exchangeRateToUsd: form.exchangeRateToUsd.trim()
            ? Number(form.exchangeRateToUsd)
            : undefined,
          exchangeRateDate: form.exchangeRateDate || form.orderDate,
        })
        .then((preview) => {
          if (cancelled || !preview) return;
          setFxPreview({
            exchangeRate: Number(preview.exchangeRate),
            baseAmount: Number(preview.baseAmount),
            baseCurrencyCode: String(preview.baseCurrencyCode || baseCurrencyCode),
            currencyCode: String(preview.currencyCode || form.currency),
          });
        })
        .catch(() => {
          if (!cancelled) setFxPreview(null);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    isCreateOpen,
    form.currency,
    form.exchangeRateToUsd,
    form.exchangeRateDate,
    form.orderDate,
    lineSubtotal,
    baseCurrencyCode,
  ]);

  const totalPages = Math.ceil(total / pageSize) || 1;
  const paginatedPOs = pos;

  const handleCorrectFx = async () => {
    if (!selectedPO) return;
    const rate = Number(fxCorrectRate);
    if (!(rate > 0)) {
      setError('Enter a valid exchange rate');
      return;
    }
    const rd = parseImportDateOnly(fxCorrectDate);
    const today = parseImportDateOnly(new Date());
    if (rd && today && rd.getTime() > today.getTime()) {
      setError('Rate date must not be in the future');
      return;
    }
    const orderDate = parseImportDateOnly(selectedPO.orderDate || selectedPO.createdAt);
    if (rd && orderDate && rd.getTime() < orderDate.getTime()) {
      setError('Rate date must not be before the PO order date');
      return;
    }
    setFxCorrectSaving(true);
    try {
      const updated = await importApi.correctPurchaseOrderFx(selectedPO.id, {
        exchangeRateToUsd: rate,
        exchangeRateDate: fxCorrectDate,
        currency: selectedPO.currency,
      });
      setPos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPO(updated);
      setFxCorrectOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setFxCorrectSaving(false);
    }
  };

  const handleUpdateStatus = async (poId: string, nextStatus: string) => {
    try {
      const updated = await importApi.updatePurchaseOrderStatus(poId, nextStatus);
      setPos((prev) => prev.map((p) => p.id === poId ? updated : p));
      if (selectedPO?.id === poId) setSelectedPO(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message);
    }
  };

  const addProducts = (products: Product[]) => {
    setLines((prev) => {
      const next = [...prev];
      for (const p of products) {
        const id = p.id || (p as any)._id;
        if (id && next.some((l) => l.productId === id)) continue;
        next.push({
          key: `${id || p.sku}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: id,
          productName: p.name,
          sku: p.sku,
          quantity: 1,
          uom: (p as any).stockUnitName || (p as any).stockUnit || (p as any).unit || 'PCS',
          unitPrice: Number((p as any).costPrice ?? (p as any).purchasePrice ?? 0) || 0,
        });
      }
      return next;
    });
  };

  const handleCreatePo = async () => {
    if (!selectedSupplier) {
      setError('Select a supplier');
      return;
    }
    if (!lines.length || lines.some((l) => !l.productName.trim() || l.quantity <= 0)) {
      setError('Add at least one valid product line');
      return;
    }
    if (form.exchangeRateDate) {
      const rd = parseImportDateOnly(form.exchangeRateDate);
      const today = parseImportDateOnly(new Date());
      const orderDate = parseImportDateOnly(form.orderDate);
      if (rd && today && rd.getTime() > today.getTime()) {
        setError('Rate date must not be in the future');
        return;
      }
      if (rd && orderDate && rd.getTime() < orderDate.getTime()) {
        setError('Rate date must not be before the PO order date');
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const rate = form.exchangeRateToUsd.trim()
        ? Number(form.exchangeRateToUsd)
        : undefined;
      await importApi.createPurchaseOrder({
        supplierId: selectedSupplier.id || (selectedSupplier as any)._id,
        supplierName: selectedSupplier.name,
        supplierCountry: (selectedSupplier as any).country || form.originCountry || undefined,
        currency: form.currency,
        exchangeRateToUsd: rate,
        exchangeRateDate: form.exchangeRateDate || undefined,
        incoterm: form.incoterm,
        namedPlace: form.namedPlace || undefined,
        paymentTerms: form.paymentTerms || undefined,
        orderDate: form.orderDate || undefined,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        buyerName: form.buyerName || undefined,
        internalRef: form.internalRef || undefined,
        supplierReference: form.supplierReference || undefined,
        originCountry: form.originCountry || (selectedSupplier as any).country || undefined,
        portOfLoading: form.portOfLoading || undefined,
        portOfEntry: form.portOfEntry || undefined,
        shippingMethod: form.shippingMethod || undefined,
        estimatedArrival: form.estimatedArrival || undefined,
        estimatedFreightUsd: form.estimatedFreightUsd ? Number(form.estimatedFreightUsd) : undefined,
        estimatedInsuranceUsd: form.estimatedInsuranceUsd ? Number(form.estimatedInsuranceUsd) : undefined,
        estimatedDutyUsd: form.estimatedDutyUsd ? Number(form.estimatedDutyUsd) : undefined,
        advanceRequiredPercent: form.advanceRequiredPercent
          ? Number(form.advanceRequiredPercent)
          : undefined,
        lcRequired: form.lcRequired,
        piRef: form.piRef || undefined,
        notes: form.notes || undefined,
        items: lines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          sku: l.sku,
          quantity: l.quantity,
          uom: l.uom,
          unitPrice: l.unitPrice,
          totalAmount: l.quantity * l.unitPrice,
        })),
      } as any);
      setIsCreateOpen(false);
      setSelectedSupplier(null);
      setLines([]);
      fetchPos();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to create Import PO');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Import Purchase Orders"
        subtitle="International procurement contracts, foreign currencies, customs terms and shipment fulfillment"
        moduleName="Import Management"
        backHref="/import/dashboard"
        icon={<ShoppingCart className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/import/rfqs"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-all"
            >
              From RFQ
            </Link>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Import PO
            </button>
          </div>
        }
      />

      <ErpLinkedBanner
        moduleLabel="Import Purchase Orders"
        erpModuleLabel="Purchase Orders (shared ledger)"
        erpHref="/purchases/purchaseorder"
        description="Import POs keep an Import classification and optionally link a shared Purchase Order for AP/GRN continuity — create here so Incoterms, ports, FX snapshot, and RFQ context are preserved."
      />

      <TradeCard>
        <div className="mb-4">
          <TradeWorkflowStepper steps={IMPORT_WORKFLOW_STEPS} currentStepIndex={2} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search PO, supplier, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {['All', 'Approved', 'Ordered', 'In Transit', 'Arrived', 'Completed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-[#014582] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* PO Table */}
        <TradeTable>
          <TradeTableHeader
            columns={['PO Number', 'Date', 'Supplier', 'Incoterm', 'FX Currency', 'Total (Foreign)', `Total (${baseCurrencyCode})`, 'ETA', 'Port of Entry', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {paginatedPOs.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-xs text-gray-500">
                  No Import Purchase Orders found.
                </td>
              </tr>
            ) : (
              paginatedPOs.map((po) => (
                <TradeTableRow key={po.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{po.poNumber}</TradeTableCell>
                  <TradeTableCell className="text-gray-600">{po.orderDate ? new Date(po.orderDate).toLocaleDateString() : '—'}</TradeTableCell>
                  <TradeTableCell>
                    <span className="font-semibold text-gray-900 block">{po.supplierName}</span>
                    <span className="text-[10px] text-gray-400">{po.supplierCountry}</span>
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="px-2 py-0.5 rounded bg-gray-100 font-bold text-[11px] text-gray-700">
                      {po.incoterm}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs">{po.currency}</TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {po.currency}{' '}
                    {Number(po.subtotalForeign || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </TradeTableCell>
                  <TradeTableCell className="font-bold text-[#014582]">
                    {formatImportMoney(po.totalUsd, baseCurrencyCode, { decimals: 0 })}
                    <span className="block text-[10px] font-normal text-gray-400">
                      @ {Number(po.exchangeRateToUsd || 0)}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-600">{po.estimatedArrival}</TradeTableCell>
                  <TradeTableCell className="text-gray-700 text-xs truncate max-w-[140px]">
                    {po.portOfEntry}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={po.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedPO(po)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View Details"
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
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TradeCard>

      {/* Detail Drawer */}
      <TradeDetailDrawer
        isOpen={Boolean(selectedPO)}
        onClose={() => setSelectedPO(null)}
        title={selectedPO?.poNumber || 'Import PO Details'}
        subtitle={`Supplier: ${selectedPO?.supplierName} (${selectedPO?.supplierCountry})`}
        actions={
          selectedPO && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFxCorrectRate(String(selectedPO.exchangeRateToUsd || ''));
                  setFxCorrectDate(
                    selectedPO.exchangeRateDate?.slice(0, 10) || new Date().toISOString().slice(0, 10)
                  );
                  setFxCorrectOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100"
              >
                Correct FX
              </button>
              {selectedPO.status === 'Approved' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedPO.id, 'Ordered')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" /> Confirm Order with Supplier
                </button>
              )}
              {selectedPO.status === 'Ordered' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedPO.id, 'In Transit')}
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] transition-all flex items-center gap-1.5"
                >
                  <Ship className="w-4 h-4" /> Mark Dispatched & In Transit
                </button>
              )}
              {selectedPO.status === 'In Transit' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedPO.id, 'Arrived')}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Port Arrival
                </button>
              )}
            </div>
          )
        }
      >
        {selectedPO && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">PO Number</span>
                <span className="font-bold text-gray-900">{selectedPO.poNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Order Date</span>
                <span className="font-semibold text-gray-900">{selectedPO.orderDate ? new Date(selectedPO.orderDate).toLocaleDateString() : '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Incoterm</span>
                <span className="font-bold text-gray-900">{selectedPO.incoterm}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Currency & Rate</span>
                <span className="font-mono font-bold text-gray-900">
                  1 {selectedPO.currency} = {Number(selectedPO.exchangeRateToUsd || 0)} {baseCurrencyCode}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Subtotal (Foreign)</span>
                <span className="font-bold text-gray-900">
                  {selectedPO.currency}{' '}
                  {Number(selectedPO.subtotalForeign || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Port of Loading</span>
                <span className="font-semibold text-gray-900">{selectedPO.portOfLoading}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Port of Entry</span>
                <span className="font-semibold text-gray-900">{selectedPO.portOfEntry}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total ({baseCurrencyCode})</span>
                <span className="font-extrabold text-[#014582] text-sm">
                  {formatImportMoney(selectedPO.totalUsd, baseCurrencyCode)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Payment Terms</span>
                <span className="font-medium text-gray-800">{selectedPO.paymentTerms}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Fulfillment Status</span>
                <TradeStatusBadge status={selectedPO.status} />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Order Line Items</h4>
              <TradeTable>
                <TradeTableHeader columns={['SKU', 'Item Name', 'Quantity', 'Shipped', 'Unit Price', 'Line Total']} />
                <TradeTableBody>
                  {selectedPO.items.map((it, idx) => (
                    <TradeTableRow key={idx}>
                      <TradeTableCell className="font-mono">{it.sku}</TradeTableCell>
                      <TradeTableCell className="font-medium text-gray-900">{it.productName}</TradeTableCell>
                      <TradeTableCell className="font-bold">{it.quantity} {it.uom}</TradeTableCell>
                      <TradeTableCell className="text-[#014582] font-semibold text-xs">
                        Shipped {Number((it as { shippedQty?: number }).shippedQty || 0)} of {Number(it.quantity)}
                      </TradeTableCell>
                      <TradeTableCell>
                        {selectedPO.currency} {Number(it.unitPrice).toFixed(2)}
                      </TradeTableCell>
                      <TradeTableCell className="font-bold text-gray-900">
                        {selectedPO.currency} {Number(it.totalAmount).toLocaleString()}
                      </TradeTableCell>
                    </TradeTableRow>
                  ))}
                </TradeTableBody>
              </TradeTable>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-900 text-xs">Standard ERP Integration</p>
                <p className="text-[11px] text-emerald-700">
                  This PO is linked to Bisonstechs Purchase Master and inventory receiving ledger.
                </p>
              </div>
              <Link
                href="/purchases"
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                Open in Purchases <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => !saving && setIsCreateOpen(false)}
        title="Create Import Purchase Order"
        maxWidth="max-w-4xl"
        actions={
          <div className="flex items-center justify-between w-full gap-2">
            <p className="text-[11px] text-gray-500">
              Subtotal ({form.currency}): <span className="font-bold text-gray-900">{lineSubtotal.toLocaleString()}</span>
            </p>
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
                onClick={handleCreatePo}
                className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60"
              >
                {saving ? 'Creating…' : 'Create Import PO'}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          <FormSection title="General Information" subtitle="Order identity, dates and internal references">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel>Order date</FieldLabel>
                <input type="date" value={form.orderDate} onChange={(e) => setField('orderDate', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Expected delivery</FieldLabel>
                <input type="date" value={form.expectedDeliveryDate} onChange={(e) => setField('expectedDeliveryDate', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Buyer</FieldLabel>
                <input value={form.buyerName} onChange={(e) => setField('buyerName', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Internal reference</FieldLabel>
                <input value={form.internalRef} onChange={(e) => setField('internalRef', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Supplier reference</FieldLabel>
                <input value={form.supplierReference} onChange={(e) => setField('supplierReference', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Proforma ref</FieldLabel>
                <input value={form.piRef} onChange={(e) => setField('piRef', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
            </div>
          </FormSection>

          <FormSection title="Supplier and Parties" subtitle="Select an authorized company supplier">
            <SupplierSelectField
              selected={
                selectedSupplier
                  ? {
                      id: selectedSupplier.id || (selectedSupplier as any)._id,
                      name: selectedSupplier.name,
                      country: (selectedSupplier as any).country,
                      code: (selectedSupplier as any).code,
                    }
                  : null
              }
              onSelect={(s) => {
                setSelectedSupplier(s);
                if ((s as any).country) setField('originCountry', (s as any).country);
              }}
            />
          </FormSection>

          <FormSection
            title="Currency and Pricing"
            subtitle={`Converts into app currency (${baseCurrencyCode}); rate is snapshotted on confirm`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <FieldLabel required>Transaction currency</FieldLabel>
                <CurrencySelect value={form.currency} onChange={(code) => setField('currency', code)} />
              </div>
              <div>
                <FieldLabel>{`Exchange rate → ${baseCurrencyCode}`}</FieldLabel>
                <input
                  value={form.exchangeRateToUsd}
                  onChange={(e) => setField('exchangeRateToUsd', e.target.value)}
                  placeholder={`1 foreign = ? ${baseCurrencyCode}`}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Rate date</FieldLabel>
                <input type="date" value={form.exchangeRateDate} onChange={(e) => setField('exchangeRateDate', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Incoterm</FieldLabel>
                <select value={form.incoterm} onChange={(e) => setField('incoterm', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2">
                  {['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Named place</FieldLabel>
                <input value={form.namedPlace} onChange={(e) => setField('namedPlace', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Payment terms</FieldLabel>
                <input value={form.paymentTerms} onChange={(e) => setField('paymentTerms', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
            </div>
            {fxPreview ? (
              <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2 text-[11px] text-sky-900">
                1 {fxPreview.currencyCode} = {Number(fxPreview.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 6 })}{' '}
                {fxPreview.baseCurrencyCode || baseCurrencyCode}
                {' · '}
                Converted total:{' '}
                <strong>
                  {formatImportMoney(fxPreview.baseAmount, fxPreview.baseCurrencyCode || baseCurrencyCode)}
                </strong>
              </div>
            ) : lineSubtotal > 0 && form.currency.toUpperCase() !== baseCurrencyCode.toUpperCase() ? (
              <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                No FX preview yet. Add a {form.currency} → {baseCurrencyCode} rate under Currency → Conversion Rates,
                or enter the rate above.
              </p>
            ) : null}
          </FormSection>

          <FormSection title="Products and Quantities" subtitle="Searchable product modal — duplicates blocked">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[11px] text-gray-500">{lines.length} line(s)</p>
              <ProductSelectButton onSelect={addProducts} />
            </div>
            {lines.length === 0 ? (
              <p className="text-center py-6 text-gray-400">No products added yet</p>
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                    <tr>
                      <th className="text-left px-3 py-2">SKU</th>
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-right px-3 py-2">Qty</th>
                      <th className="text-left px-3 py-2">UOM</th>
                      <th className="text-right px-3 py-2">Unit price</th>
                      <th className="text-right px-3 py-2">Line total</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.key} className="border-t border-gray-50">
                        <td className="px-3 py-2 font-mono text-gray-500">{l.sku || '—'}</td>
                        <td className="px-3 py-2 font-semibold">{l.productName}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={l.quantity}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((x) =>
                                  x.key === l.key ? { ...x, quantity: Number(e.target.value) || 0 } : x
                                )
                              )
                            }
                            className="w-20 text-right rounded-lg border border-gray-200 px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={l.uom}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((x) => (x.key === l.key ? { ...x, uom: e.target.value } : x))
                              )
                            }
                            className="w-16 rounded-lg border border-gray-200 px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={l.unitPrice}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((x) =>
                                  x.key === l.key ? { ...x, unitPrice: Number(e.target.value) || 0 } : x
                                )
                              )
                            }
                            className="w-24 text-right rounded-lg border border-gray-200 px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {(l.quantity * l.unitPrice).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FormSection>

          <FormSection title="Trade, Shipping and Logistics">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel>Origin country</FieldLabel>
                <input value={form.originCountry} onChange={(e) => setField('originCountry', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Port of loading</FieldLabel>
                <input value={form.portOfLoading} onChange={(e) => setField('portOfLoading', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Port of entry</FieldLabel>
                <input value={form.portOfEntry} onChange={(e) => setField('portOfEntry', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Shipping method</FieldLabel>
                <select value={form.shippingMethod} onChange={(e) => setField('shippingMethod', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2">
                  {['Ocean', 'Air', 'Road', 'Rail', 'Multimodal'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Estimated arrival</FieldLabel>
                <input type="date" value={form.estimatedArrival} onChange={(e) => setField('estimatedArrival', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
            </div>
          </FormSection>

          <FormSection title="Payment and Finance" subtitle="Estimated import costs (not posted actuals)">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel>Est. freight (USD)</FieldLabel>
                <input value={form.estimatedFreightUsd} onChange={(e) => setField('estimatedFreightUsd', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Est. insurance (USD)</FieldLabel>
                <input value={form.estimatedInsuranceUsd} onChange={(e) => setField('estimatedInsuranceUsd', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Est. duty (USD)</FieldLabel>
                <input value={form.estimatedDutyUsd} onChange={(e) => setField('estimatedDutyUsd', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Advance required %</FieldLabel>
                <input value={form.advanceRequiredPercent} onChange={(e) => setField('advanceRequiredPercent', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.lcRequired}
                    onChange={(e) => setField('lcRequired', e.target.checked)}
                  />
                  LC required
                </label>
              </div>
            </div>
          </FormSection>

          <FormSection title="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              placeholder="Internal notes / packing instructions"
            />
          </FormSection>
        </div>
      </TradeModal>

      <TradeModal
        isOpen={fxCorrectOpen}
        onClose={() => !fxCorrectSaving && setFxCorrectOpen(false)}
        title="Correct Import PO FX Snapshot"
        maxWidth="max-w-md"
        actions={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={fxCorrectSaving}
              onClick={() => setFxCorrectOpen(false)}
              className="px-3 py-2 rounded-xl border text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={fxCorrectSaving}
              onClick={handleCorrectFx}
              className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60"
            >
              {fxCorrectSaving ? 'Saving…' : 'Apply FX Correction'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-gray-600">
            Updates the PO base total from an authorized rate. Inventory quantities are not changed.
          </p>
          {selectedPO && (
            <p className="font-mono text-[11px] bg-gray-50 p-2 rounded-lg">
              PO {selectedPO.poNumber} · {selectedPO.currency} subtotal{' '}
              {Number(selectedPO.subtotalForeign || 0).toLocaleString()}
            </p>
          )}
          <div>
            <FieldLabel required>{`Rate: 1 ${selectedPO?.currency || 'foreign'} → ${baseCurrencyCode}`}</FieldLabel>
            <input
              type="number"
              step="any"
              value={fxCorrectRate}
              onChange={(e) => setFxCorrectRate(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 font-mono"
            />
          </div>
          <div>
            <FieldLabel>Rate date</FieldLabel>
            <input
              type="date"
              value={fxCorrectDate}
              onChange={(e) => setFxCorrectDate(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>
        </div>
      </TradeModal>
    </TradePage>
  );
}
