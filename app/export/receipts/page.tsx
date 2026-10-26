'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BadgeDollarSign,
  Search,
  Eye,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  XCircle,
  Banknote,
  ShieldCheck,
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
  OrderSelect,
  OrderFilterBanner,
  FormSection,
  FieldLabel,
  BankAccountSelect,
} from '../../../components/export/ExportSelectors';
import exportApi, {
  errorMessage,
  formatDate,
  formatMoney,
  type ExportOrder,
  type ExportOrderFull,
  type ExportReceipt,
} from '../../../lib/export-api';
import { useExportList } from '../../../lib/use-export-list';
import { usePermissions } from '../../../lib/usePermissions';
import { useCurrency } from '../../../lib/currency-context';

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

const RECEIPT_STATUSES = ['Funds In Transit', 'Realized & Credited', 'Forex Hedged', 'Cancelled'];
const RECEIPT_TYPES = ['Advance', 'Settlement'];

interface ReceiptForm {
  orderId: string;
  receiptType: string;
  receiptDate: string;
  foreignAmount: string;
  currency: string;
  exchangeRate: string;
  bankChargesForeign: string;
  bankAccountId: string;
  nostroAccountRef: string;
  proformaId: string;
  invoiceId: string;
  notes: string;
}

const emptyForm: ReceiptForm = {
  orderId: '',
  receiptType: 'Advance',
  receiptDate: new Date().toISOString().slice(0, 10),
  foreignAmount: '',
  currency: '',
  exchangeRate: '',
  bankChargesForeign: '0',
  bankAccountId: '',
  nostroAccountRef: '',
  proformaId: '',
  invoiceId: '',
  notes: '',
};

export default function ExportReceiptsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <ExportReceiptsPageContent />
    </React.Suspense>
  );
}

function ExportReceiptsPageContent() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const { code: displayCurrency } = useCurrency();
  const canCreate = can('export.receipts.create');
  const canEdit = can('export.receipts.edit');

  const orderIdFilter = searchParams?.get('orderId') || undefined;
  const [receiptTypeFilter, setReceiptTypeFilter] = useState('');

  const list = useExportList<ExportReceipt>((query) => exportApi.listReceipts(query), {
    limit: 20,
    extraQuery: {
      ...(orderIdFilter ? { orderId: orderIdFilter } : {}),
      ...(receiptTypeFilter ? { receiptType: receiptTypeFilter } : {}),
    },
  });

  const [selectedReceipt, setSelectedReceipt] = useState<ExportReceipt | null>(null);
  const [detailForm, setDetailForm] = useState({
    receiptDate: '',
    bankChargesForeign: '',
    bankAccountId: '',
    nostroAccountRef: '',
    notes: '',
  });
  const [actionId, setActionId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<ReceiptForm>(emptyForm);
  const [order, setOrder] = useState<ExportOrder | null>(null);
  const [orderDetail, setOrderDetail] = useState<ExportOrderFull | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadOrderDetail = useCallback(async (id: string) => {
    if (!id) {
      setOrder(null);
      setOrderDetail(null);
      return;
    }
    setOrderLoading(true);
    try {
      const detail = await exportApi.getOrderFull(id);
      setOrderDetail(detail);
      setOrder(detail.order);
      setForm((prev) =>
        prev.orderId === id && !prev.currency
          ? { ...prev, currency: detail.order?.currency || '' }
          : prev
      );
    } catch {
      setOrderDetail(null);
      setOrder(null);
    } finally {
      setOrderLoading(false);
    }
  }, []);

  const openCreate = useCallback(() => {
    setForm({ ...emptyForm, orderId: orderIdFilter || '' });
    setOrder(null);
    setOrderDetail(null);
    setFormError(null);
    setIsCreateOpen(true);
    if (orderIdFilter) void loadOrderDetail(orderIdFilter);
  }, [orderIdFilter, loadOrderDetail]);

  const handleOrderChange = (id: string, selected?: ExportOrder | null) => {
    setForm((prev) => ({
      ...prev,
      orderId: id,
      currency: selected?.currency || '',
      proformaId: '',
      invoiceId: '',
      exchangeRate: '',
    }));
    void loadOrderDetail(id);
  };

  const openDetail = (receipt: ExportReceipt) => {
    setSelectedReceipt(receipt);
    setDetailForm({
      receiptDate: receipt.receiptDate ? receipt.receiptDate.slice(0, 10) : '',
      bankChargesForeign: '',
      bankAccountId: receipt.bankAccountId || '',
      nostroAccountRef: receipt.nostroAccountRef || '',
      notes: receipt.notes || '',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.orderId) return setFormError('Select the export order receiving the remittance.');
    if (!form.foreignAmount || Number(form.foreignAmount) <= 0) {
      return setFormError('Enter the foreign remittance amount.');
    }
    if (form.receiptType === 'Settlement' && !form.invoiceId) {
      return setFormError('Select the commercial invoice this settlement applies to.');
    }
    setSaving(true);
    try {
      const created = await exportApi.createReceipt({
        orderId: form.orderId,
        receiptType: form.receiptType,
        receiptDate: form.receiptDate || undefined,
        foreignAmount: Number(form.foreignAmount),
        currency: form.currency || undefined,
        exchangeRate: form.exchangeRate ? Number(form.exchangeRate) : undefined,
        bankChargesForeign: Number(form.bankChargesForeign || 0),
        bankAccountId: form.bankAccountId || undefined,
        nostroAccountRef: form.nostroAccountRef || undefined,
        proformaId: form.receiptType === 'Advance' && form.proformaId ? form.proformaId : undefined,
        invoiceId: form.receiptType === 'Settlement' ? form.invoiceId || undefined : undefined,
        notes: form.notes || undefined,
      });
      toast.success(`Receipt ${created.receiptNumber} recorded`);
      setIsCreateOpen(false);
      setForm(emptyForm);
      setOrder(null);
      setOrderDetail(null);
      list.reload();
      openDetail(created);
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to record the export receipt'));
    } finally {
      setSaving(false);
    }
  };

  const applyUpdated = (updated: ExportReceipt) => {
    setSelectedReceipt(updated);
    list.setItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  };

  const handleSaveDetail = async () => {
    if (!selectedReceipt) return;
    setActionId(selectedReceipt.id);
    try {
      const updated = await exportApi.updateReceipt(selectedReceipt.id, {
        receiptDate: detailForm.receiptDate || undefined,
        bankChargesForeign: detailForm.bankChargesForeign
          ? Number(detailForm.bankChargesForeign)
          : undefined,
        bankAccountId: detailForm.bankAccountId || undefined,
        nostroAccountRef: detailForm.nostroAccountRef || undefined,
        notes: detailForm.notes || undefined,
      });
      toast.success('Receipt updated');
      applyUpdated(updated);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update the receipt'));
    } finally {
      setActionId(null);
    }
  };

  const handleRealize = async () => {
    if (!selectedReceipt) return;
    const bankAccountId = detailForm.bankAccountId || selectedReceipt.bankAccountId;
    if (!bankAccountId) {
      toast.error('Select the bank account that received the funds');
      return;
    }
    setActionId(selectedReceipt.id);
    try {
      const updated = await exportApi.updateReceiptStatus(
        selectedReceipt.id,
        'Realized & Credited',
        { bankAccountId }
      );
      toast.success('Receipt realized and posted to the bank & receivables ledger');
      applyUpdated(updated);
      setDetailForm((prev) => ({ ...prev, bankAccountId }));
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to realize the receipt'));
    } finally {
      setActionId(null);
    }
  };

  const handleStatus = async (status: string) => {
    if (!selectedReceipt) return;
    if (status === 'Cancelled') {
      const ok = window.confirm(
        `Cancel receipt ${selectedReceipt.receiptNumber}? This cannot be undone.`
      );
      if (!ok) return;
    }
    setActionId(selectedReceipt.id);
    try {
      const updated = await exportApi.updateReceiptStatus(selectedReceipt.id, status);
      toast.success(`Receipt moved to ${status}`);
      applyUpdated(updated);
    } catch (err) {
      toast.error(errorMessage(err, `Failed to move receipt to ${status}`));
    } finally {
      setActionId(null);
    }
  };

  const baseCurrency = selectedReceipt?.baseCurrencyCode || displayCurrency || 'USD';
  const canRealize = selectedReceipt?.status === 'Funds In Transit';
  const canHedge = selectedReceipt?.status === 'Realized & Credited';

  return (
    <TradePage>
      <TradePageHeader
        title="Export Receipts & Forex Settlement"
        subtitle="Inward overseas remittances, foreign exchange realization, Nostro account credits and Sales settlement"
        moduleName="Export Finance"
        backHref="/export/dashboard"
        icon={<BadgeDollarSign className="w-5 h-5 text-white" />}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Record Receipt
            </button>
          ) : undefined
        }
      />

      <TradeCard>
        <div className="mb-4">
          <TradeWorkflowStepper steps={EXPORT_WORKFLOW_STEPS} currentStepIndex={8} />
        </div>

        {orderIdFilter && <OrderFilterBanner orderId={orderIdFilter} entityLabel="export receipts" />}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search receipt, buyer, nostro reference…"
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
              {RECEIPT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={receiptTypeFilter}
              onChange={(e) => setReceiptTypeFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white"
            >
              <option value="">All types</option>
              {RECEIPT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
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
            columns={['Receipt No', 'Export Order', 'Overseas Customer', 'Date', 'Type', 'Currency / FX', 'Foreign Amount', 'Net Realized', 'Bank / Nostro', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {list.loading && list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={11}>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading export receipts…
                </TradeTableCell>
              </TradeTableRow>
            ) : list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={11}>
                  No export receipts match the current filters.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              list.items.map((r) => (
                <TradeTableRow key={r.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{r.receiptNumber}</TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-800">
                    <Link
                      href={`/export/orders?order=${r.orderId}`}
                      className="hover:underline text-blue-700"
                    >
                      {r.orderNumber || r.orderId.slice(0, 8)}
                    </Link>
                  </TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-900">{r.customerName}</TradeTableCell>
                  <TradeTableCell className="text-gray-600">{formatDate(r.receiptDate)}</TradeTableCell>
                  <TradeTableCell>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                      {r.receiptType}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs">
                    {r.currency} @ {r.exchangeRate}
                  </TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {formatMoney(r.foreignAmount, r.currency)}
                  </TradeTableCell>
                  <TradeTableCell className="font-extrabold text-emerald-700">
                    {formatMoney(r.netBase, r.baseCurrencyCode || displayCurrency)}
                    <span className="block text-[10px] font-normal text-gray-400">
                      charges {formatMoney(r.bankChargesBase, r.baseCurrencyCode || displayCurrency)}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs text-gray-600">
                    {r.nostroAccountRef || '—'}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={r.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => openDetail(r)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View receipt"
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
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title={selectedReceipt?.receiptNumber || 'Export Receipt'}
        subtitle={
          selectedReceipt
            ? `${selectedReceipt.receiptType} • Customer: ${selectedReceipt.customerName}`
            : undefined
        }
        actions={
          selectedReceipt && canEdit ? (
            <div className="flex flex-wrap items-center gap-2">
              {canRealize && (
                <>
                  <button
                    type="button"
                    disabled={actionId === selectedReceipt.id}
                    onClick={handleRealize}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Banknote className="w-3.5 h-3.5" /> Realize &amp; Credit
                  </button>
                  <button
                    type="button"
                    disabled={actionId === selectedReceipt.id}
                    onClick={() => handleStatus('Cancelled')}
                    className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                </>
              )}
              {canHedge && (
                <button
                  type="button"
                  disabled={actionId === selectedReceipt.id}
                  onClick={() => handleStatus('Forex Hedged')}
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Mark Forex Hedged
                </button>
              )}
            </div>
          ) : undefined
        }
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
                <Link
                  href={`/export/orders?order=${selectedReceipt.orderId}`}
                  className="font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  {selectedReceipt.orderNumber || selectedReceipt.orderId.slice(0, 8)}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Receipt Date</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(selectedReceipt.receiptDate)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Receipt Type</span>
                <span className="font-semibold text-gray-900">{selectedReceipt.receiptType}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Gross Foreign Remittance</span>
                <span className="font-bold text-gray-900">
                  {formatMoney(selectedReceipt.foreignAmount, selectedReceipt.currency)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Exchange Rate</span>
                <span className="font-mono font-bold text-gray-900">
                  1 {selectedReceipt.currency} = {selectedReceipt.exchangeRate} {baseCurrency}
                </span>
                <span className="block text-[10px] text-gray-400">
                  {selectedReceipt.rateSource || 'rate source not recorded'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Bank Charges</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(selectedReceipt.bankChargesBase, baseCurrency)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Net Realized into Bank</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {formatMoney(selectedReceipt.netBase, baseCurrency)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">FX Gain / (Loss)</span>
                <span className="font-bold text-gray-900">
                  {formatMoney(selectedReceipt.fxGainLossBase, baseCurrency)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Applied to Invoice</span>
                <span className="font-bold text-gray-900">
                  {formatMoney(selectedReceipt.appliedBase, baseCurrency)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Bank / Nostro Reference</span>
                <span className="font-mono text-gray-800">
                  {selectedReceipt.nostroAccountRef || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selectedReceipt.status} />
              </div>
            </div>

            {selectedReceipt.status === 'Funds In Transit' && canEdit ? (
              <div className="p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-[#014582]" />
                  <span className="font-bold text-gray-900">Settlement details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Receipt date</FieldLabel>
                    <input
                      type="date"
                      value={detailForm.receiptDate}
                      onChange={(e) =>
                        setDetailForm((prev) => ({ ...prev, receiptDate: e.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <FieldLabel>Bank charges ({selectedReceipt.currency})</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={detailForm.bankChargesForeign}
                      onChange={(e) =>
                        setDetailForm((prev) => ({
                          ...prev,
                          bankChargesForeign: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Crediting bank account</FieldLabel>
                  <BankAccountSelect
                    value={detailForm.bankAccountId}
                    onChange={(id) => setDetailForm((prev) => ({ ...prev, bankAccountId: id }))}
                  />
                </div>
                <div>
                  <FieldLabel>Nostro / bank reference</FieldLabel>
                  <input
                    value={detailForm.nostroAccountRef}
                    onChange={(e) =>
                      setDetailForm((prev) => ({ ...prev, nostroAccountRef: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <FieldLabel>Notes</FieldLabel>
                  <textarea
                    rows={2}
                    value={detailForm.notes}
                    onChange={(e) => setDetailForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={actionId === selectedReceipt.id}
                    onClick={handleSaveDetail}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Save changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                <p className="font-bold text-xs">
                  {selectedReceipt.status === 'Cancelled'
                    ? 'Receipt cancelled'
                    : 'Remittance realized and posted'}
                </p>
                <p className="text-[11px] mt-0.5">
                  {selectedReceipt.status === 'Cancelled'
                    ? 'This receipt no longer affects receivables or bank balances.'
                    : 'The bank credit, bank charges and receivable application were posted to the shared accounting ledger.'}
                </p>
              </div>
            )}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Export Remittance"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {formError}
            </div>
          )}

          <FormSection
            title="Remittance"
            subtitle="Advances are applied later; settlements must reference the commercial invoice they pay"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Export order</FieldLabel>
                <OrderSelect
                  value={form.orderId}
                  onChange={handleOrderChange}
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <FieldLabel required>Receipt type</FieldLabel>
                <select
                  value={form.receiptType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      receiptType: e.target.value,
                      invoiceId: '',
                      proformaId: '',
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white"
                >
                  {RECEIPT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {order && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Order total</p>
                  <p className="font-bold text-gray-900">
                    {formatMoney(order.totalForeign, order.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Currency / FX</p>
                  <p className="font-bold text-gray-900">
                    {order.currency} @ {order.exchangeRate}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Outstanding</p>
                  <p className="font-bold text-[#014582]">
                    {formatMoney(order.outstandingBase, order.baseCurrencyCode || displayCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Advance received</p>
                  <p className="font-bold text-emerald-700">
                    {formatMoney(order.advanceReceivedBase, order.baseCurrencyCode || displayCurrency)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel required>Foreign amount</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.foreignAmount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, foreignAmount: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Currency</FieldLabel>
                <input
                  value={form.currency}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))
                  }
                  placeholder="Order currency"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <FieldLabel>Exchange rate (optional)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.exchangeRate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, exchangeRate: e.target.value }))
                  }
                  placeholder="Use company rate"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Receipt date</FieldLabel>
                <input
                  type="date"
                  value={form.receiptDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, receiptDate: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Bank charges (foreign)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.bankChargesForeign}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bankChargesForeign: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Nostro / bank reference</FieldLabel>
                <input
                  value={form.nostroAccountRef}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nostroAccountRef: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Crediting bank account</FieldLabel>
              <BankAccountSelect
                value={form.bankAccountId}
                onChange={(id) => setForm((prev) => ({ ...prev, bankAccountId: id }))}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Required before the receipt can be realized and posted.
              </p>
            </div>
          </FormSection>

          <FormSection
            title={form.receiptType === 'Advance' ? 'Advance linkage' : 'Invoice settlement'}
            subtitle={
              form.receiptType === 'Advance'
                ? 'Optionally link the advance to a proforma invoice for buyer tracking'
                : 'Settlements must reference the commercial invoice raised on dispatch'
            }
          >
            {form.receiptType === 'Advance' ? (
              <div>
                <FieldLabel>Proforma invoice (optional)</FieldLabel>
                <select
                  value={form.proformaId}
                  onChange={(e) => setForm((prev) => ({ ...prev, proformaId: e.target.value }))}
                  disabled={orderLoading || !form.orderId}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white disabled:bg-gray-50"
                >
                  <option value="">
                    {orderLoading ? 'Loading proformas…' : 'No proforma link'}
                  </option>
                  {(orderDetail?.proformas || []).map((pi) => (
                    <option key={pi.id} value={pi.id}>
                      {pi.piNumber} — {pi.currency} {Number(pi.amountForeign).toLocaleString()} ·{' '}
                      {pi.status}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <FieldLabel required>Commercial invoice</FieldLabel>
                <select
                  value={form.invoiceId}
                  onChange={(e) => setForm((prev) => ({ ...prev, invoiceId: e.target.value }))}
                  disabled={orderLoading || !form.orderId}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white disabled:bg-gray-50"
                >
                  <option value="">
                    {orderLoading ? 'Loading invoices…' : 'Select commercial invoice…'}
                  </option>
                  {(orderDetail?.invoices || []).map((inv: any) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber || inv.id.slice(0, 8)} — outstanding{' '}
                      {Number(inv.outstanding ?? 0).toLocaleString()} {inv.currency || ''}
                      {inv.invoiceStatus ? ` · ${inv.invoiceStatus}` : ''}
                    </option>
                  ))}
                </select>
                {!orderLoading && form.orderId && !(orderDetail?.invoices || []).length && (
                  <p className="text-[10px] text-amber-700 mt-1">
                    No commercial invoice exists yet. Hand over a dispatch to raise the invoice, or
                    record this remittance as an advance.
                  </p>
                )}
              </div>
            )}

            <div>
              <FieldLabel>Notes</FieldLabel>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
          </FormSection>

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
              disabled={saving || !form.orderId}
              className="px-4 py-2 rounded-lg bg-[#014582] text-white hover:bg-[#01366a] text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Recording…' : 'Record Receipt'}
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
