'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileCheck2,
  Search,
  Eye,
  Plus,
  PackageCheck,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Truck,
  Ship,
  FileText,
  BadgeDollarSign,
  Landmark,
  Boxes,
  Receipt,
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
  ErpLinkedBanner,
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
  type ExportOrder,
  type ExportOrderFull,
} from '../../../lib/export-api';
import { useExportList } from '../../../lib/use-export-list';
import { usePermissions } from '../../../lib/usePermissions';
import { useCurrency } from '../../../lib/currency-context';
import { useLocation } from '../../../lib/location-context';

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

const ORDER_STATUSES = [
  'Draft',
  'Confirmed',
  'In Production / Packing',
  'Pre-Shipment Inspection',
  'Customs Cleared',
  'Dispatched',
  'On Board Vessel',
  'Delivered',
  'Completed',
  'Cancelled',
];

const NEXT_STATUS: Record<string, string[]> = {
  Draft: ['Confirmed', 'Cancelled'],
  Confirmed: ['In Production / Packing', 'Cancelled'],
  'In Production / Packing': ['Pre-Shipment Inspection', 'Cancelled'],
  'Pre-Shipment Inspection': ['Customs Cleared', 'Cancelled'],
  'Customs Cleared': ['Dispatched', 'Cancelled'],
  Dispatched: ['On Board Vessel'],
  'On Board Vessel': ['Delivered'],
  Delivered: ['Completed'],
  Completed: [],
  Cancelled: [],
};

const INCOTERMS = ['FOB', 'CIF', 'CFR', 'DDP', 'EXW', 'FCA', 'CPT', 'CIP'];

type OrderLine = {
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

export default function ExportOrdersPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <ExportOrdersPageContent />
    </React.Suspense>
  );
}

function ExportOrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const { code: displayCurrency } = useCurrency();
  const { locations, locationIdForApi } = useLocation();
  const canCreate = can('export.orders.create');
  const canApprove = can('export.orders.approve');
  const canEdit = can('export.orders.edit');

  const list = useExportList<ExportOrder>((query) => exportApi.listOrders(query), { limit: 20 });

  const [selectedOrder, setSelectedOrder] = useState<ExportOrder | null>(null);
  const [detail, setDetail] = useState<ExportOrderFull | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [incoterm, setIncoterm] = useState('FOB');
  const [destinationPort, setDestinationPort] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [freight, setFreight] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number | ''>('');
  const [locationId, setLocationId] = useState('');
  const [confirmOnCreate, setConfirmOnCreate] = useState(true);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [productOpen, setProductOpen] = useState(false);

  const baseCurrency = selectedOrder?.baseCurrencyCode || displayCurrency || 'USD';

  const openOrder = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const full = await exportApi.getOrderFull(id);
      setSelectedOrder(full.order);
      setDetail(full);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to load export order'));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = searchParams?.get('order');
    if (id) void openOrder(id);
  }, [searchParams, openOrder]);

  useEffect(() => {
    if (!locationId && locationIdForApi) setLocationId(locationIdForApi);
  }, [locationId, locationIdForApi]);

  const resetForm = () => {
    setCustomer(null);
    setOrderDate(new Date().toISOString().slice(0, 10));
    setDeliveryDeadline('');
    setCurrency('USD');
    setIncoterm('FOB');
    setDestinationPort('');
    setPaymentTerms('Net 30');
    setFreight('');
    setDiscount('');
    setLocationId(locationIdForApi || '');
    setConfirmOnCreate(true);
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

  const updateLine = (index: number, patch: Partial<OrderLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const subtotal = lines.reduce(
    (sum, l) => sum + Number(l.quantity || 0) * Number(l.unitPriceForeign || 0),
    0
  );
  const total = subtotal + Number(freight || 0) - Number(discount || 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!customer?.id) return setFormError('Select an overseas buyer.');
    if (!lines.length) return setFormError('Add at least one order line.');
    if (lines.some((l) => !l.quantity || l.quantity <= 0)) {
      return setFormError('Every line needs a quantity greater than zero.');
    }
    if (lines.some((l) => l.unitPriceForeign <= 0)) {
      return setFormError('Every line needs a unit price greater than zero.');
    }
    if (total <= 0) return setFormError('Order total must be greater than zero.');
    setSaving(true);
    try {
      const created = await exportApi.createOrder({
        customerId: customer.id,
        customerName: customer.name,
        customerCountry: customerCountry(customer),
        orderDate,
        deliveryDeadline: deliveryDeadline || undefined,
        currency,
        incoterm,
        destinationPort: destinationPort || undefined,
        paymentTerms: paymentTerms || undefined,
        freightForeign: Number(freight || 0),
        discountForeign: Number(discount || 0),
        locationId: locationId || undefined,
        confirm: confirmOnCreate,
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
      toast.success(
        created.status === 'Confirmed'
          ? `Export order ${created.orderNumber} confirmed`
          : `Export order ${created.orderNumber} saved as draft`
      );
      setIsCreateOpen(false);
      resetForm();
      list.reload();
      void openOrder(created.id);
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to create export order'));
    } finally {
      setSaving(false);
    }
  };

  const refreshDetail = async (id: string) => {
    const full = await exportApi.getOrderFull(id);
    setSelectedOrder(full.order);
    setDetail(full);
    list.reload();
  };

  const handleApprove = async (order: ExportOrder) => {
    setActionId(order.id);
    try {
      await exportApi.approveOrder(order.id);
      await refreshDetail(order.id);
      toast.success('Export order confirmed');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to confirm order'));
    } finally {
      setActionId(null);
    }
  };

  const handleStatus = async (order: ExportOrder, status: string) => {
    setActionId(order.id);
    try {
      await exportApi.updateOrderStatus(order.id, status);
      await refreshDetail(order.id);
      toast.success(`Order moved to ${status}`);
    } catch (err) {
      toast.error(errorMessage(err, `Failed to move order to ${status}`));
    } finally {
      setActionId(null);
    }
  };

  const orderLinks = (order: ExportOrder) => [
    { label: 'Proforma', href: `/export/proforma-invoices?orderId=${order.id}`, icon: FileText },
    { label: 'Packing', href: `/export/packing?orderId=${order.id}`, icon: Boxes },
    { label: 'Shipments', href: `/export/shipments?orderId=${order.id}`, icon: Ship },
    { label: 'Customs', href: `/export/customs?orderId=${order.id}`, icon: FileCheck2 },
    { label: 'Dispatch', href: `/export/dispatch?orderId=${order.id}`, icon: Truck },
    { label: 'Documents', href: `/export/documents?orderId=${order.id}`, icon: FileText },
    { label: 'Receipts', href: `/export/receipts?orderId=${order.id}`, icon: BadgeDollarSign },
    { label: 'LCs', href: `/export/finance?orderId=${order.id}`, icon: Landmark },
    { label: 'Expenses', href: `/export/expenses?orderId=${order.id}`, icon: Receipt },
  ];

  return (
    <TradePage>
      <TradePageHeader
        title="Export Sales Orders"
        subtitle="Confirmed overseas buyer sales contracts, delivery terms, packing, dispatch and settlement balances"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<FileCheck2 className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsCreateOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Export Order
              </button>
            )}
            <Link
              href="/sales/orders"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Sales Orders
            </Link>
          </div>
        }
      />

      <ErpLinkedBanner
        moduleLabel="Export Sales Orders"
        erpModuleLabel="Sales Orders"
        erpHref="/sales/orders"
        description="Export contracts are posted to the shared Sales ledger through a commercial invoice on dispatch. AR, revenue and stock movements remain in the existing Accounting and Inventory services."
      />

      <TradeCard>
        <div className="mb-4">
          <TradeWorkflowStepper steps={EXPORT_WORKFLOW_STEPS} currentStepIndex={2} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search export order, customer or destination…"
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
              {ORDER_STATUSES.map((s) => (
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
            columns={['Order No', 'Order Date', 'Customer', 'Destination Port', 'Incoterm', 'Total Contract', 'Advance / Invoiced', 'Balance Due', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {list.loading && list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading export orders…
                </TradeTableCell>
              </TradeTableRow>
            ) : list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  No export orders match the current filters.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              list.items.map((ord) => (
                <TradeTableRow key={ord.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{ord.orderNumber}</TradeTableCell>
                  <TradeTableCell className="text-gray-600">{formatDate(ord.orderDate)}</TradeTableCell>
                  <TradeTableCell>
                    <span className="font-semibold text-gray-900 block">{ord.customerName}</span>
                    <span className="text-[10px] text-gray-400">{ord.customerCountry || '—'}</span>
                  </TradeTableCell>
                  <TradeTableCell className="text-xs text-gray-700">{ord.destinationPort || '—'}</TradeTableCell>
                  <TradeTableCell>
                    <span className="px-2 py-0.5 rounded bg-gray-100 font-bold text-[11px] text-gray-700">
                      {ord.incoterm}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {formatMoney(ord.totalForeign, ord.currency)}
                    {ord.currency !== (ord.baseCurrencyCode || baseCurrency) ? (
                      <span className="block text-[10px] font-normal text-gray-400">
                        base {formatMoney(ord.totalBase, ord.baseCurrencyCode || baseCurrency)}
                      </span>
                    ) : null}
                  </TradeTableCell>
                  <TradeTableCell className="text-[11px]">
                    <span className="block font-semibold text-emerald-700">
                      Adv {formatMoney(ord.advanceReceivedBase, ord.baseCurrencyCode || baseCurrency)}
                    </span>
                    <span className="block text-gray-500">
                      Inv {formatMoney(ord.invoicedBase, ord.baseCurrencyCode || baseCurrency)}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="font-bold text-rose-700">
                    {formatMoney(ord.outstandingBase, ord.baseCurrencyCode || baseCurrency)}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={ord.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => openOrder(ord.id)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View export order"
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
        isOpen={Boolean(selectedOrder)}
        onClose={() => {
          setSelectedOrder(null);
          setDetail(null);
        }}
        title={selectedOrder?.orderNumber || 'Export Sales Order'}
        subtitle={selectedOrder ? `Customer: ${selectedOrder.customerName}` : undefined}
        actions={
          selectedOrder ? (
            <div className="flex flex-wrap items-center gap-2">
              {canApprove && selectedOrder.status === 'Draft' && (
                <button
                  type="button"
                  disabled={actionId === selectedOrder.id}
                  onClick={() => handleApprove(selectedOrder)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Order
                </button>
              )}
              {canEdit &&
                (NEXT_STATUS[selectedOrder.status] || [])
                  .filter((s) => s !== 'Confirmed' && s !== 'Cancelled')
                  .map((next) => (
                    <button
                      key={next}
                      type="button"
                      disabled={actionId === selectedOrder.id}
                      onClick={() => handleStatus(selectedOrder, next)}
                      className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <PackageCheck className="w-3.5 h-3.5" /> {next}
                    </button>
                  ))}
              {canEdit && selectedOrder.status === 'Confirmed' && (
                <button
                  type="button"
                  disabled={actionId === selectedOrder.id}
                  onClick={() => handleStatus(selectedOrder, 'In Production / Packing')}
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <PackageCheck className="w-3.5 h-3.5" /> Move to Packing
                </button>
              )}
              {canEdit &&
                ['Draft', 'Confirmed'].includes(selectedOrder.status) &&
                !(detail?.shipments.length || detail?.receipts.length || detail?.dispatches.length) && (
                  <button
                    type="button"
                    disabled={actionId === selectedOrder.id}
                    onClick={() => handleStatus(selectedOrder, 'Cancelled')}
                    className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
            </div>
          ) : null
        }
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs">
            {detailLoading ? (
              <p className="text-gray-400 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading order documents…
              </p>
            ) : null}

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Order Number</span>
                <span className="font-bold text-gray-900">{selectedOrder.orderNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Destination Port</span>
                <span className="font-semibold text-gray-900">{selectedOrder.destinationPort || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Delivery Deadline</span>
                <span className="font-bold text-gray-900">{formatDate(selectedOrder.deliveryDeadline)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Incoterm</span>
                <span className="font-bold text-gray-900">{selectedOrder.incoterm}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Currency / FX</span>
                <span className="font-bold text-gray-900">
                  {selectedOrder.currency} @ {selectedOrder.exchangeRate}
                </span>
                <span className="block text-[10px] text-gray-400">
                  {selectedOrder.rateSource || 'rate source not recorded'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selectedOrder.status} />
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Order Value</span>
                <span className="font-extrabold text-[#014582] text-sm">
                  {formatMoney(selectedOrder.totalForeign, selectedOrder.currency)}
                </span>
                <span className="block text-[10px] text-gray-400">
                  base {formatMoney(selectedOrder.totalBase, baseCurrency)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Receivables Balance</span>
                <span className="font-extrabold text-rose-700">
                  {formatMoney(selectedOrder.outstandingBase, baseCurrency)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl border border-gray-100 bg-white">
                <p className="text-[10px] uppercase font-bold text-gray-400">Advance received</p>
                <p className="font-bold text-emerald-700">{formatMoney(selectedOrder.advanceReceivedBase, baseCurrency)}</p>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-white">
                <p className="text-[10px] uppercase font-bold text-gray-400">Advance applied</p>
                <p className="font-bold text-gray-800">{formatMoney(selectedOrder.advanceAppliedBase, baseCurrency)}</p>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-white">
                <p className="text-[10px] uppercase font-bold text-gray-400">Invoiced</p>
                <p className="font-bold text-[#014582]">{formatMoney(selectedOrder.invoicedBase, baseCurrency)}</p>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-white">
                <p className="text-[10px] uppercase font-bold text-gray-400">Paid</p>
                <p className="font-bold text-gray-800">{formatMoney(selectedOrder.paidBase, baseCurrency)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Export Order Items</h4>
              <TradeTable>
                <TradeTableHeader
                  columns={['SKU', 'Item Name', 'Quantity', `Unit Price (${selectedOrder.currency})`, 'Shipped', 'Invoiced', 'Line Total']}
                />
                <TradeTableBody>
                  {selectedOrder.items.map((it) => (
                    <TradeTableRow key={it.id}>
                      <TradeTableCell className="font-mono">{it.sku || '—'}</TradeTableCell>
                      <TradeTableCell className="font-medium text-gray-900">{it.productName}</TradeTableCell>
                      <TradeTableCell className="font-bold">
                        {it.quantity} {it.uom}
                      </TradeTableCell>
                      <TradeTableCell>{formatMoney(it.unitPriceForeign, selectedOrder.currency)}</TradeTableCell>
                      <TradeTableCell className="text-gray-700">{it.shippedQty ?? 0}</TradeTableCell>
                      <TradeTableCell className="text-gray-700">{it.invoicedQty ?? 0}</TradeTableCell>
                      <TradeTableCell className="font-bold text-gray-900">
                        {formatMoney(it.lineTotalForeign, selectedOrder.currency)}
                      </TradeTableCell>
                    </TradeTableRow>
                  ))}
                </TradeTableBody>
              </TradeTable>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Order Document Trail</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {orderLinks(selectedOrder).map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-[#014582]/40 hover:bg-blue-50/40 text-xs font-semibold text-gray-700"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#014582]" /> {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {detail && (
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900">Linked records</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {[
                    ['Proformas', detail.proformas.length],
                    ['Packing lists', detail.packings.length],
                    ['Shipments', detail.shipments.length],
                    ['Customs decl.', detail.customs.length],
                    ['Dispatches', detail.dispatches.length],
                    ['Documents', detail.documents.length],
                    ['Receipts', detail.receipts.length],
                    ['LCs', detail.lcs.length],
                    ['Expenses', detail.expenses.length],
                    ['Commercial invoices', detail.invoices.length],
                  ].map(([label, count]) => (
                    <div key={String(label)} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-gray-500">{label}</p>
                      <p className="font-bold text-gray-900 text-sm">{count}</p>
                    </div>
                  ))}
                </div>

                {detail.invoices.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="font-bold text-emerald-900 mb-1.5">Commercial invoice posting</p>
                    {detail.invoices.map((inv: any) => (
                      <p key={inv.id} className="text-[11px] text-emerald-800 flex justify-between">
                        <span>
                          {inv.invoiceNumber} · {formatDate(inv.invoiceDate)}
                        </span>
                        <strong>{formatMoney(inv.grandTotal || inv.totalAmount || 0, inv.currency || baseCurrency)}</strong>
                      </p>
                    ))}
                    <Link
                      href="/sales/invoices"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline"
                    >
                      Open Sales invoices <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {selectedOrder.notes && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                <span className="font-bold block text-xs mb-1">Notes</span>
                <p className="text-xs whitespace-pre-wrap">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Export Sales Order"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {formError}
            </div>
          )}

          <FormSection title="Buyer & contract terms">
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
                <FieldLabel required>Order date</FieldLabel>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <FieldLabel>Delivery deadline</FieldLabel>
                <input
                  type="date"
                  value={deliveryDeadline}
                  onChange={(e) => setDeliveryDeadline(e.target.value)}
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
                <FieldLabel>Destination port</FieldLabel>
                <PortSelect
                  value={destinationPort}
                  onChange={(name) => setDestinationPort(name)}
                  placeholder="Select destination port…"
                />
              </div>
              <div>
                <FieldLabel>Dispatch warehouse / location</FieldLabel>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                >
                  <option value="">Default inventory location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
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

          <FormSection title="Order lines" subtitle="Stock is reserved and deducted when the dispatch is handed to the shipping line">
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
                  <div
                    key={line.productId}
                    className="grid grid-cols-12 gap-2 items-end p-2.5 rounded-xl border border-gray-200 bg-gray-50/60"
                  >
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
                <FieldLabel>Freight charges ({currency})</FieldLabel>
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
                <FieldLabel>Order discount ({currency})</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
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
                <span>Freight − discount</span>
                <strong>{formatMoney(Number(freight || 0) - Number(discount || 0), currency)}</strong>
              </p>
              <p className="flex justify-between text-sm">
                <span>Order total</span>
                <strong className="text-[#014582]">{formatMoney(total, currency)}</strong>
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={confirmOnCreate}
                onChange={(e) => setConfirmOnCreate(e.target.checked)}
              />
              Confirm the order immediately (required before packing, shipments and dispatch)
            </label>
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
              {saving ? 'Saving…' : confirmOnCreate ? 'Create & Confirm Order' : 'Save Draft Order'}
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
