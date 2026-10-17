'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  DollarSign,
  ExternalLink,
  CreditCard,
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
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
  TradePagination,
  TradeModal,
} from '../../../components/trade/TradeUI';
import importApi, {
  ImportSupplierBill,
  ImportPurchaseOrder,
  ImportGrn,
  ImportGrnItem,
} from '../../../lib/import-api';
import { useCurrency } from '../../../lib/currency-context';
import { formatImportMoney } from '../../../lib/import-format';
import { CurrencySelect, FormSection, FieldLabel } from '@/components/import/ImportSelectors';

function billCurrency(b: ImportSupplierBill) {
  return b.currency || b.invoiceCurrency || 'USD';
}
function billForeign(b: ImportSupplierBill) {
  return Number(b.totalAmountForeign ?? b.invoiceAmountForeign ?? 0);
}
function billBase(b: ImportSupplierBill) {
  return Number(b.totalAmountUsd ?? b.invoiceAmountUsd ?? 0);
}
function billPaid(b: ImportSupplierBill) {
  return Number(b.paidAmountUsd ?? b.paidUsd ?? 0);
}
function billBalance(b: ImportSupplierBill) {
  return Number(b.balanceUsd ?? billBase(b) - billPaid(b));
}

type BillLineDraft = {
  key: string;
  importPoItemId?: string;
  productId?: string;
  productName: string;
  sku?: string;
  invoicedQty: number;
  unitPrice: number;
};

export default function ImportBillsPage() {
  const { code: baseCurrencyCode } = useCurrency();

  const [items, setItems] = useState<ImportSupplierBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBill, setSelectedBill] = useState<ImportSupplierBill | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [poOptions, setPoOptions] = useState<ImportPurchaseOrder[]>([]);
  const [grnOptions, setGrnOptions] = useState<ImportGrn[]>([]);
  const [createPoId, setCreatePoId] = useState('');
  const [createGrnId, setCreateGrnId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [billCurrencyCode, setBillCurrencyCode] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('');
  const [allowVariance, setAllowVariance] = useState(false);
  const [billLines, setBillLines] = useState<BillLineDraft[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      const res = await importApi.listBills(params);
      if (res && res.items) {
        setItems(res.items);
        setTotalPages(res.pagination?.pages || 1);
      } else if (Array.isArray(res)) {
        setItems(res);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.error('Error fetching bills:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load supplier bills');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    importApi.listPurchaseOrders({ limit: 100 }).then((r) => setPoOptions(r.items || [])).catch(() => []);
    importApi.listGrns({ limit: 100 }).then((r) => setGrnOptions(r.items || [])).catch(() => []);
  }, []);

  const selectedCreatePo = poOptions.find((p) => p.id === createPoId);

  const loadBillLinesFromSources = (po?: ImportPurchaseOrder, grn?: ImportGrn) => {
    if (grn?.items?.length) {
      setBillLines(
        grn.items.map((it: ImportGrnItem) => {
          const poLine = po?.items?.find(
            (p) => p.id === (it as any).importPoItemId || p.productId === it.productId
          );
          return {
            key: it.id,
            importPoItemId: (it as any).importPoItemId,
            productId: it.productId,
            productName: it.productName,
            sku: it.sku,
            invoicedQty: Number(it.receivedQty) || 0,
            unitPrice: Number(poLine?.unitPrice) || Number(it.unitCostUsd) || 0,
          };
        })
      );
      return;
    }
    if (po?.items?.length) {
      setBillLines(
        po.items.map((it) => ({
          key: it.id,
          importPoItemId: it.id,
          productId: it.productId,
          productName: it.productName,
          sku: it.sku,
          invoicedQty: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
        }))
      );
    }
  };

  const handleCreateBill = async () => {
    if (!createPoId && !createGrnId) {
      setError('Select an Import PO or GRN');
      return;
    }
    if (!supplierInvoiceNumber.trim()) {
      setError('Supplier invoice number is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await importApi.createBill({
        importPoId: createPoId || undefined,
        importGrnId: createGrnId || undefined,
        grnId: createGrnId || undefined,
        supplierInvoiceNumber: supplierInvoiceNumber.trim(),
        billDate,
        dueDate: dueDate || undefined,
        currency: billCurrencyCode,
        exchangeRateToUsd: exchangeRate.trim() ? Number(exchangeRate) : undefined,
        allowVariance,
        items: billLines.map((l) => ({
          importPoItemId: l.importPoItemId,
          productId: l.productId,
          productName: l.productName,
          sku: l.sku,
          invoicedQty: l.invoicedQty,
          unitPrice: l.unitPrice,
        })),
      });
      setIsCreateOpen(false);
      setCreatePoId('');
      setCreateGrnId('');
      setSupplierInvoiceNumber('');
      setBillLines([]);
      fetchData();
      setSelectedBill(created);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to create bill');
    } finally {
      setSaving(false);
    }
  };

  const openBillDetail = async (bill: ImportSupplierBill) => {
    setSelectedBill(bill);
    try {
      const full = await importApi.getBill(bill.id);
      setSelectedBill(full);
    } catch {
      /* list row */
    }
  };

  const handlePostBill = async (billId: string) => {
    try {
      setActionLoading(true);
      const updated = await importApi.postBill(billId);
      setItems((prev) => prev.map((b) => (b.id === billId ? { ...b, ...updated } : b)));
      if (selectedBill?.id === billId) setSelectedBill((prev) => (prev ? { ...prev, ...updated } : null));
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to post bill');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayBill = async (billId: string, amount: number) => {
    try {
      setActionLoading(true);
      const updated = await importApi.recordBillPayment(billId, {
        amountUsd: amount,
        paymentMethod: 'WIRE_TRANSFER',
      });
      setItems((prev) => prev.map((b) => (b.id === billId ? updated : b)));
      if (selectedBill && selectedBill.id === billId) {
        setSelectedBill(updated);
      }
      alert('Payment successfully recorded against supplier bill and posted to AP!');
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'Failed to record bill payment');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (val?: string) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return val;
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Supplier Bills & Payments"
        subtitle="Overseas vendor invoices, advance remittances, balance payments and seamless link to Accounts Payable"
        moduleName="Import Finance"
        backHref="/import/dashboard"
        icon={<Receipt className="w-5 h-5 text-white" />}
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
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Bill
            </button>
            <Link
              href="/purchases/invoices"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 text-[#014582] text-xs font-bold hover:bg-white transition-all shadow-sm"
            >
              <ExternalLink className="w-4 h-4" /> Purchase Bills
            </Link>
          </div>
        }
      />

      <ErpLinkedBanner
        moduleLabel="Import Supplier Bills"
        erpModuleLabel="Purchase Invoices"
        erpHref="/purchases/invoices"
        erpHrefLabel="Open Purchase Invoices"
        description="Import finance view of supplier bills. Post invoices in Purchase Invoices and settle via Accounting Bills (/accounting/bills) so AP postings are not duplicated."
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="font-bold underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bill number, supplier, PO..."
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
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#014582]" />
            <p className="text-xs">Loading supplier bills...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-xs">No supplier bills found.</p>
          </div>
        ) : (
          <>
            <TradeTable>
              <TradeTableHeader
                columns={['Bill Number', 'Linked PO', 'Supplier', 'Bill Date', 'Currency', 'Total (Foreign)', `Total (${baseCurrencyCode})`, 'Match', 'Status', 'Actions']}
              />
              <TradeTableBody>
                {items.map((bill) => (
                  <TradeTableRow key={bill.id}>
                    <TradeTableCell className="font-bold text-[#014582]">{bill.billNumber}</TradeTableCell>
                    <TradeTableCell className="font-semibold text-gray-800">
                      {bill.poRef || bill.importPoId ? (
                        <Link
                          href={`/import/purchase-orders?po=${bill.poRef || bill.importPoId}`}
                          className="hover:underline text-blue-700"
                        >
                          {bill.poRef || bill.importPoId}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TradeTableCell>
                    <TradeTableCell className="font-semibold text-gray-900">{bill.supplierName}</TradeTableCell>
                    <TradeTableCell className="text-gray-600">{formatDate(bill.billDate)}</TradeTableCell>
                    <TradeTableCell className="font-mono text-xs">{billCurrency(bill)}</TradeTableCell>
                    <TradeTableCell className="font-bold text-gray-900">
                      {billCurrency(bill)} {billForeign(bill).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TradeTableCell>
                    <TradeTableCell className="font-bold text-[#014582]">{formatImportMoney(billBase(bill), baseCurrencyCode)}</TradeTableCell>
                    <TradeTableCell className="text-[10px] font-semibold text-gray-600">{bill.matchStatus || '—'}</TradeTableCell>
                    <TradeTableCell>
                      <TradeStatusBadge status={bill.status} />
                    </TradeTableCell>
                    <TradeTableCell>
                      <button
                        type="button"
                        onClick={() => openBillDetail(bill)}
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

            {totalPages > 1 && (
              <TradePagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={items.length}
                pageSize={15}
                onPageChange={(p) => setPage(p)}
              />
            )}
          </>
        )}
      </TradeCard>

      <TradeDetailDrawer
        isOpen={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        title={selectedBill?.billNumber || 'Supplier Bill Details'}
        subtitle={`Supplier: ${selectedBill?.supplierName || ''}`}
        actions={
          selectedBill && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedBill.status === 'Draft' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handlePostBill(selectedBill.id)}
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50"
                >
                  Post Bill
                </button>
              )}
              {billBalance(selectedBill) > 0 && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handlePayBill(selectedBill.id, billBalance(selectedBill))}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" /> Record Payment ({formatImportMoney(billBalance(selectedBill), baseCurrencyCode)})
                </button>
              )}
              <Link
                href="/purchases/invoices"
                className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] transition-all flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" /> View in Purchase Ledger
              </Link>
            </div>
          )
        }
      >
        {selectedBill && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Bill Number</span>
                <span className="font-bold text-gray-900">{selectedBill.billNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">PO Reference</span>
                <span className="font-semibold text-gray-900">{selectedBill.poRef || selectedBill.importPoId || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Bill Date</span>
                <span className="font-semibold text-gray-900">{formatDate(selectedBill.billDate)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Payment Due Date</span>
                <span className="font-bold text-rose-700">{formatDate(selectedBill.dueDate)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Foreign Currency</span>
                <span className="font-mono font-bold text-gray-900">
                  {billCurrency(selectedBill)} {billForeign(selectedBill).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Exchange rate</span>
                <span className="font-mono text-gray-800">
                  1 {billCurrency(selectedBill)} ={' '}
                  {Number(selectedBill.exchangeRateToUsd ?? selectedBill.exchangeRate ?? 0)} {baseCurrencyCode}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">{`Total (${baseCurrencyCode})`}</span>
                <span className="font-extrabold text-[#014582] text-sm">{formatImportMoney(billBase(selectedBill), baseCurrencyCode)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Paid Amount</span>
                <span className="font-bold text-emerald-700">{formatImportMoney(billPaid(selectedBill), baseCurrencyCode)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Outstanding Balance</span>
                <span className="font-extrabold text-rose-700">{formatImportMoney(billBalance(selectedBill), baseCurrencyCode)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Match status</span>
                <span className="font-semibold text-gray-800">{selectedBill.matchStatus || '—'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-950 text-xs">Integrated with ERP Accounts Payable</p>
                <p className="text-[11px] text-emerald-700">
                  Bill and payment vouchers sync automatically with General Ledger and Bank Accounts.
                </p>
              </div>
              <Link
                href="/accounting/bills"
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                Open General Ledger AP <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => !saving && setIsCreateOpen(false)}
        title="Create Import Supplier Bill"
        maxWidth="max-w-4xl"
        actions={
          <div className="flex justify-end gap-2">
            <button type="button" disabled={saving} onClick={() => setIsCreateOpen(false)} className="px-3 py-2 rounded-xl border text-xs font-semibold">
              Cancel
            </button>
            <button type="button" disabled={saving} onClick={handleCreateBill} className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60">
              {saving ? 'Creating…' : 'Create Draft Bill'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          <FormSection title="Source documents">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Import PO</FieldLabel>
                <select
                  value={createPoId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setCreatePoId(id);
                    const po = poOptions.find((p) => p.id === id);
                    if (po) {
                      setBillCurrencyCode(po.currency || 'USD');
                      setExchangeRate(po.exchangeRateToUsd ? String(po.exchangeRateToUsd) : '');
                      loadBillLinesFromSources(po, grnOptions.find((g) => g.id === createGrnId));
                    }
                  }}
                  className="w-full rounded-xl border px-3 py-2 bg-white"
                >
                  <option value="">Select PO…</option>
                  {poOptions.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — {po.supplierName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>GRN (optional)</FieldLabel>
                <select
                  value={createGrnId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setCreateGrnId(id);
                    const grn = grnOptions.find((g) => g.id === id);
                    const po = selectedCreatePo || poOptions.find((p) => p.id === grn?.importPoId);
                    if (grn && !createPoId && grn.importPoId) setCreatePoId(grn.importPoId);
                    loadBillLinesFromSources(po, grn);
                  }}
                  className="w-full rounded-xl border px-3 py-2 bg-white"
                >
                  <option value="">No GRN</option>
                  {grnOptions
                    .filter((g) => !createPoId || g.importPoId === createPoId)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.grnNumber} — {g.status}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </FormSection>
          <FormSection title="Invoice header">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel required>Supplier invoice #</FieldLabel>
                <input value={supplierInvoiceNumber} onChange={(e) => setSupplierInvoiceNumber(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Bill date</FieldLabel>
                <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Due date</FieldLabel>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Currency</FieldLabel>
                <CurrencySelect value={billCurrencyCode} onChange={(c) => setBillCurrencyCode(c)} />
              </div>
              <div>
                <FieldLabel>Exchange rate</FieldLabel>
                <input value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} placeholder="Optional — company rate" className="w-full rounded-xl border px-3 py-2 font-mono" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input type="checkbox" checked={allowVariance} onChange={(e) => setAllowVariance(e.target.checked)} />
                  Allow qty/value variance
                </label>
              </div>
            </div>
          </FormSection>
          <FormSection title="Invoice lines">
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-[11px]">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500">
                  <tr>
                    <th className="text-left p-2">Product</th>
                    <th className="p-2">Invoiced qty</th>
                    <th className="p-2">Unit price</th>
                    <th className="p-2">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {billLines.map((l) => (
                    <tr key={l.key} className="border-t">
                      <td className="p-2 font-medium">{l.productName}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={l.invoicedQty}
                          onChange={(e) =>
                            setBillLines((prev) =>
                              prev.map((x) =>
                                x.key === l.key ? { ...x, invoicedQty: Number(e.target.value) || 0 } : x
                              )
                            )
                          }
                          className="w-20 rounded border px-1 py-0.5"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={l.unitPrice}
                          onChange={(e) =>
                            setBillLines((prev) =>
                              prev.map((x) =>
                                x.key === l.key ? { ...x, unitPrice: Number(e.target.value) || 0 } : x
                              )
                            )
                          }
                          className="w-24 rounded border px-1 py-0.5"
                        />
                      </td>
                      <td className="p-2 font-bold">
                        {billCurrencyCode} {(l.invoicedQty * l.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FormSection>
        </div>
      </TradeModal>
    </TradePage>
  );
}
