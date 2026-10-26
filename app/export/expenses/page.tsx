'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Receipt,
  Search,
  Eye,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Pencil,
  Undo2,
  Send,
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
} from '../../../components/trade/TradeUI';
import {
  OrderSelect,
  OrderFilterBanner,
  FormSection,
  FieldLabel,
  AccountSelect,
  BankAccountSelect,
} from '../../../components/export/ExportSelectors';
import exportApi, {
  errorMessage,
  formatDate,
  formatMoney,
  type ExportExpense,
  type ExportOrder,
  type ExportOrderFull,
} from '../../../lib/export-api';
import { useExportList } from '../../../lib/use-export-list';
import { usePermissions } from '../../../lib/usePermissions';
import { useCurrency } from '../../../lib/currency-context';
import { chartOfAccountService } from '../../../lib/chart-of-accounts-service';

const EXPENSE_STATUSES = ['Draft', 'Posted', 'Reversed'];

const EXPENSE_TYPES = [
  'Ocean Freight',
  'Air Freight',
  'Customs Duty',
  'Terminal Handling',
  'Inspection & Certification',
  'Documentation & Legalization',
  'Bank Charges',
  'Marine Insurance',
  'Inland Haulage',
  'Other',
];

interface ExpenseForm {
  orderId: string;
  shipmentId: string;
  expenseType: string;
  date: string;
  description: string;
  currency: string;
  amountForeign: string;
  exchangeRate: string;
  accountId: string;
  bankAccountId: string;
  notes: string;
}

const emptyForm: ExpenseForm = {
  orderId: '',
  shipmentId: '',
  expenseType: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  currency: '',
  amountForeign: '',
  exchangeRate: '',
  accountId: '',
  bankAccountId: '',
  notes: '',
};

export default function ExportExpensesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <ExportExpensesPageContent />
    </React.Suspense>
  );
}

function ExportExpensesPageContent() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const { code: displayCurrency } = useCurrency();
  const canCreate = can('export.expenses.create');
  const canEdit = can('export.expenses.edit');
  const canPost = can('export.expenses.post');
  const canReverse = can('export.expenses.reverse');

  const orderIdFilter = searchParams?.get('orderId') || undefined;
  const [typeFilter, setTypeFilter] = useState('');

  const list = useExportList<ExportExpense>((query) => exportApi.listExpenses(query), {
    limit: 20,
    extraQuery: {
      ...(orderIdFilter ? { orderId: orderIdFilter } : {}),
      ...(typeFilter ? { expenseType: typeFilter } : {}),
    },
  });

  const [selectedExpense, setSelectedExpense] = useState<ExportExpense | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExportExpense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [order, setOrder] = useState<ExportOrder | null>(null);
  const [orderDetail, setOrderDetail] = useState<ExportOrderFull | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [accountNames, setAccountNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    chartOfAccountService
      .getAccounts({ limit: 300 })
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        (res.data || []).forEach((acc) => {
          map[acc.id] = `${acc.code || ''} ${acc.name || ''}`.trim();
        });
        setAccountNames(map);
      })
      .catch(() => {
        if (!cancelled) setAccountNames({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    setEditingExpense(null);
    setForm({
      ...emptyForm,
      orderId: orderIdFilter || '',
      currency: orderIdFilter ? '' : displayCurrency || '',
    });
    setOrder(null);
    setOrderDetail(null);
    setFormError(null);
    setIsModalOpen(true);
    if (orderIdFilter) void loadOrderDetail(orderIdFilter);
  }, [displayCurrency, orderIdFilter, loadOrderDetail]);

  const openEdit = (expense: ExportExpense) => {
    setEditingExpense(expense);
    setForm({
      orderId: expense.orderId || '',
      shipmentId: expense.shipmentId || '',
      expenseType: expense.expenseType || '',
      date: expense.date ? expense.date.slice(0, 10) : '',
      description: expense.description || '',
      currency: expense.currency || '',
      amountForeign: String(expense.amountForeign ?? ''),
      exchangeRate: String(expense.exchangeRate ?? ''),
      accountId: expense.accountId || '',
      bankAccountId: expense.bankAccountId || '',
      notes: expense.notes || '',
    });
    setOrder(null);
    setOrderDetail(null);
    setFormError(null);
    setIsModalOpen(true);
    if (expense.orderId) void loadOrderDetail(expense.orderId);
  };

  const handleOrderChange = (id: string, selected?: ExportOrder | null) => {
    setForm((prev) => ({
      ...prev,
      orderId: id,
      shipmentId: '',
      currency: selected?.currency || prev.currency,
      exchangeRate: '',
    }));
    void loadOrderDetail(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.expenseType.trim()) return setFormError('Enter the expense type.');
    const amount = Number(form.amountForeign);
    if (!Number.isFinite(amount) || amount <= 0) {
      return setFormError('Expense amount must be a positive number.');
    }
    if (!form.currency && !form.orderId) {
      return setFormError('Enter the expense currency or link the expense to an export order.');
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        expenseType: form.expenseType.trim(),
        date: form.date || undefined,
        description: form.description.trim() || undefined,
        currency: form.currency || undefined,
        amountForeign: amount,
        exchangeRate: form.exchangeRate ? Number(form.exchangeRate) : undefined,
        accountId: form.accountId || undefined,
        bankAccountId: form.bankAccountId || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (form.orderId) payload.orderId = form.orderId;
      if (form.orderId && form.shipmentId) payload.shipmentId = form.shipmentId;

      if (editingExpense) {
        const updated = await exportApi.updateExpense(editingExpense.id, payload);
        toast.success(`Expense ${updated.expenseNumber} updated`);
        setSelectedExpense((prev) => (prev && prev.id === updated.id ? updated : prev));
        list.setItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      } else {
        const created = await exportApi.createExpense(payload);
        toast.success(`Expense ${created.expenseNumber} created as draft`);
        list.reload();
        setSelectedExpense(created);
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      setForm(emptyForm);
      setOrder(null);
      setOrderDetail(null);
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to save the export expense'));
    } finally {
      setSaving(false);
    }
  };

  const applyUpdated = (updated: ExportExpense) => {
    setSelectedExpense(updated);
    list.setItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  };

  const handlePost = async (expense: ExportExpense) => {
    const ok = window.confirm(
      `Post expense ${expense.expenseNumber}? This creates a journal entry in the accounting ledger.`
    );
    if (!ok) return;
    setActionId(expense.id);
    try {
      const updated = await exportApi.postExpense(expense.id);
      toast.success('Expense posted to the general ledger');
      applyUpdated(updated);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to post the expense'));
    } finally {
      setActionId(null);
    }
  };

  const handleReverse = async (expense: ExportExpense) => {
    const ok = window.confirm(
      `Reverse the posted expense ${expense.expenseNumber}? A reversing journal entry will be created.`
    );
    if (!ok) return;
    setActionId(expense.id);
    try {
      const updated = await exportApi.reverseExpense(expense.id);
      toast.success('Expense reversed with a reversing journal entry');
      applyUpdated(updated);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to reverse the expense'));
    } finally {
      setActionId(null);
    }
  };

  const accountLabel = (expense: ExportExpense) =>
    expense.accountId
      ? accountNames[expense.accountId] || `GL ${expense.accountId.slice(0, 8)}`
      : 'Auto-resolved on posting';

  return (
    <TradePage>
      <TradePageHeader
        title="Export Expenses, Duties & Fees"
        subtitle="Ocean freight, customs duty, terminal handling, inspection and documentation costs posted to the shared accounting ledger"
        moduleName="Export Finance"
        backHref="/export/dashboard"
        icon={<Receipt className="w-5 h-5 text-white" />}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Expense
            </button>
          ) : undefined
        }
      />

      <TradeCard>
        {orderIdFilter && <OrderFilterBanner orderId={orderIdFilter} entityLabel="export expenses" />}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search expense number, type or description…"
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
              {EXPENSE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white"
            >
              <option value="">All expense types</option>
              {EXPENSE_TYPES.map((t) => (
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
            columns={['Expense No', 'Export Order', 'Shipment', 'Expense Type', 'Date', 'Currency / FX', 'Amount', 'GL Account', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {list.loading && list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading export expenses…
                </TradeTableCell>
              </TradeTableRow>
            ) : list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  No export expenses match the current filters.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              list.items.map((expense) => (
                <TradeTableRow key={expense.id}>
                  <TradeTableCell className="font-bold text-[#014582]">
                    {expense.expenseNumber}
                  </TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-800">
                    {expense.orderId ? (
                      <Link
                        href={`/export/orders?order=${expense.orderId}`}
                        className="hover:underline text-blue-700"
                      >
                        {expense.orderNumber || expense.orderId.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Unallocated</span>
                    )}
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs text-gray-600">
                    {expense.shipmentId ? expense.shipmentId.slice(0, 8) : '—'}
                  </TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-900">
                    {expense.expenseType}
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-600">{formatDate(expense.date)}</TradeTableCell>
                  <TradeTableCell className="font-mono text-xs">
                    {expense.currency} @ {expense.exchangeRate}
                  </TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {formatMoney(expense.amountForeign, expense.currency)}
                    <span className="block text-[10px] font-normal text-gray-400">
                      base{' '}
                      {formatMoney(
                        expense.amountBase,
                        expense.baseCurrencyCode || displayCurrency
                      )}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="text-xs text-gray-600 max-w-[180px] truncate">
                    {accountLabel(expense)}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={expense.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedExpense(expense)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View expense"
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
        isOpen={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
        title={selectedExpense?.expenseNumber || 'Export Expense'}
        subtitle={
          selectedExpense
            ? `${selectedExpense.expenseType} • ${formatDate(selectedExpense.date)}`
            : undefined
        }
        actions={
          selectedExpense ? (
            <div className="flex flex-wrap items-center gap-2">
              {selectedExpense.status === 'Draft' && canEdit && (
                <button
                  type="button"
                  onClick={() => openEdit(selectedExpense)}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-gray-50"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              {selectedExpense.status === 'Draft' && canPost && (
                <button
                  type="button"
                  disabled={actionId === selectedExpense.id}
                  onClick={() => handlePost(selectedExpense)}
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Post to GL
                </button>
              )}
              {selectedExpense.status === 'Posted' && canReverse && (
                <button
                  type="button"
                  disabled={actionId === selectedExpense.id}
                  onClick={() => handleReverse(selectedExpense)}
                  className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Reverse
                </button>
              )}
            </div>
          ) : undefined
        }
      >
        {selectedExpense && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Expense Number</span>
                <span className="font-bold text-gray-900">{selectedExpense.expenseNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Export Order</span>
                {selectedExpense.orderId ? (
                  <Link
                    href={`/export/orders?order=${selectedExpense.orderId}`}
                    className="font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    {selectedExpense.orderNumber || selectedExpense.orderId.slice(0, 8)}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="font-semibold text-gray-500">Unallocated</span>
                )}
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Expense Type</span>
                <span className="font-semibold text-gray-900">{selectedExpense.expenseType}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Expense Date</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(selectedExpense.date)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Amount</span>
                <span className="font-extrabold text-[#014582] text-sm">
                  {formatMoney(selectedExpense.amountForeign, selectedExpense.currency)}
                </span>
                <span className="block text-[10px] text-gray-400">
                  base{' '}
                  {formatMoney(
                    selectedExpense.amountBase,
                    selectedExpense.baseCurrencyCode || displayCurrency
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Exchange Rate</span>
                <span className="font-mono font-bold text-gray-900">
                  1 {selectedExpense.currency} = {selectedExpense.exchangeRate}{' '}
                  {selectedExpense.baseCurrencyCode || displayCurrency}
                </span>
                <span className="block text-[10px] text-gray-400">
                  {selectedExpense.rateSource || 'rate source not recorded'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">GL Account</span>
                <span className="font-semibold text-gray-900">{accountLabel(selectedExpense)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selectedExpense.status} />
              </div>
              {selectedExpense.journalEntryId && (
                <div className="col-span-2">
                  <span className="text-gray-400 block text-[10px] uppercase">Journal Entry</span>
                  <Link
                    href="/accounting/journal-entries"
                    className="font-mono font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    {selectedExpense.journalEntryId}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
              {selectedExpense.description && (
                <div className="col-span-2">
                  <span className="text-gray-400 block text-[10px] uppercase">Description</span>
                  <span className="text-gray-800 whitespace-pre-wrap">
                    {selectedExpense.description}
                  </span>
                </div>
              )}
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                selectedExpense.status === 'Reversed'
                  ? 'bg-gray-50 border-gray-200 text-gray-700'
                  : selectedExpense.status === 'Posted'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <p className="font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedExpense.status === 'Draft'
                  ? 'Draft — not yet in the ledger'
                  : selectedExpense.status === 'Posted'
                    ? 'Posted to the general ledger'
                    : 'Reversed'}
              </p>
              <p className="text-[11px] mt-0.5">
                {selectedExpense.status === 'Draft'
                  ? 'Posting resolves the expense account (or uses the configured default) and creates a balanced journal entry.'
                  : selectedExpense.status === 'Posted'
                    ? 'The expense and bank/cash credit are visible in the general ledger, trial balance and profit & loss.'
                    : 'A reversing journal entry restored the ledger balances. This record is kept for traceability.'}
              </p>
            </div>
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? `Edit ${editingExpense.expenseNumber}` : 'Record Export Expense'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {formError}
            </div>
          )}

          <FormSection
            title="Expense details"
            subtitle="Expenses are created as drafts and posted to the accounting ledger separately"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Export order (optional)</FieldLabel>
                <OrderSelect
                  value={form.orderId}
                  onChange={handleOrderChange}
                  disabled={saving}
                />
              </div>
              <div>
                <FieldLabel>Shipment (optional)</FieldLabel>
                <select
                  value={form.shipmentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, shipmentId: e.target.value }))}
                  disabled={saving || orderLoading || !orderDetail?.shipments.length}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white disabled:bg-gray-50"
                >
                  <option value="">
                    {orderLoading
                      ? 'Loading shipments…'
                      : orderDetail?.shipments.length
                        ? 'No shipment allocation'
                        : 'No shipments for this order'}
                  </option>
                  {(orderDetail?.shipments || []).map((shipment) => (
                    <option key={shipment.id} value={shipment.id}>
                      {shipment.shipmentNumber} · {shipment.shipmentStatus}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel required>Expense type</FieldLabel>
                <input
                  list="export-expense-types"
                  value={form.expenseType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, expenseType: e.target.value }))
                  }
                  placeholder="e.g. Ocean Freight"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
                <datalist id="export-expense-types">
                  {EXPENSE_TYPES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div>
                <FieldLabel>Date</FieldLabel>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel required>Amount</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.amountForeign}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amountForeign: e.target.value }))
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
                  placeholder="Order or base currency"
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
            </div>

            <div>
              <FieldLabel>Description</FieldLabel>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                placeholder="Vendor, invoice or reference"
              />
            </div>
          </FormSection>

          <FormSection
            title="Posting accounts"
            subtitle="Leave the GL account blank to resolve it from settings or the standard account map"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Expense GL account</FieldLabel>
                <AccountSelect
                  value={form.accountId}
                  onChange={(id) => setForm((prev) => ({ ...prev, accountId: id }))}
                  disabled={saving}
                  placeholder="Auto-resolve expense account"
                />
              </div>
              <div>
                <FieldLabel>Paid-from bank account</FieldLabel>
                <BankAccountSelect
                  value={form.bankAccountId}
                  onChange={(id) => setForm((prev) => ({ ...prev, bankAccountId: id }))}
                  disabled={saving}
                />
              </div>
            </div>

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
              onClick={() => {
                setIsModalOpen(false);
                setEditingExpense(null);
              }}
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
              {saving ? 'Saving…' : editingExpense ? 'Save Expense' : 'Create Draft Expense'}
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
