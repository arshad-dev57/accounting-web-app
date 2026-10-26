'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileCheck2,
  Search,
  Eye,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
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
import { OrderSelect, OrderFilterBanner, FormSection, FieldLabel } from '../../../components/export/ExportSelectors';
import exportApi, {
  errorMessage,
  formatDate,
  formatMoney,
  type ExportOrder,
  type ExportProforma,
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

const PROFORMA_STATUSES = [
  'Issued',
  'LC Advised',
  'Advance Remittance Received',
  'Final Settled',
  'Cancelled',
];

const NEXT_STATUS: Record<string, string[]> = {
  Issued: ['LC Advised', 'Advance Remittance Received', 'Cancelled'],
  'LC Advised': ['Advance Remittance Received', 'Cancelled'],
  'Advance Remittance Received': ['Final Settled', 'Cancelled'],
  'Final Settled': [],
  Cancelled: [],
};

export default function ExportProformaInvoicesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <ExportProformaInvoicesPageContent />
    </React.Suspense>
  );
}

function ExportProformaInvoicesPageContent() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const { code: displayCurrency } = useCurrency();
  const canCreate = can('export.proformas.create');
  const canEdit = can('export.proformas.edit');

  const orderIdFilter = searchParams?.get('orderId') || undefined;
  const list = useExportList<ExportProforma>((query) => exportApi.listProformas(query), {
    limit: 20,
    extraQuery: orderIdFilter ? { orderId: orderIdFilter } : undefined,
  });

  const [selectedPI, setSelectedPI] = useState<ExportProforma | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<ExportOrder | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number | ''>('');
  const [bankSwiftCode, setBankSwiftCode] = useState('');
  const [beneficiaryAccount, setBeneficiaryAccount] = useState('');
  const [lcNumber, setLcNumber] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = useCallback((presetOrderId?: string) => {
    setOrderId(presetOrderId || '');
    setOrder(null);
    setDate(new Date().toISOString().slice(0, 10));
    setAmount('');
    setBankSwiftCode('');
    setBeneficiaryAccount('');
    setLcNumber('');
    setNotes('');
    setFormError(null);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!orderId) return setFormError('Select the export order this proforma belongs to.');
    setSaving(true);
    try {
      const created = await exportApi.createProforma({
        orderId,
        amountForeign: amount === '' ? undefined : Number(amount),
        date: date || undefined,
        bankSwiftCode: bankSwiftCode || undefined,
        beneficiaryAccount: beneficiaryAccount || undefined,
        lcNumber: lcNumber || undefined,
        notes: notes || undefined,
      });
      toast.success(`Proforma ${created.piNumber} issued`);
      setIsCreateOpen(false);
      resetForm();
      list.reload();
      setSelectedPI(created);
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to create proforma invoice'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (pi: ExportProforma, status: string) => {
    setActionId(pi.id);
    try {
      const updated = await exportApi.updateProformaStatus(pi.id, status);
      setSelectedPI((prev) => (prev && prev.id === pi.id ? { ...prev, ...updated } : prev));
      list.setItems((prev) => prev.map((row) => (row.id === pi.id ? { ...row, ...updated } : row)));
      toast.success(`Proforma moved to ${status}`);
    } catch (err) {
      toast.error(errorMessage(err, `Failed to move proforma to ${status}`));
    } finally {
      setActionId(null);
    }
  };

  const baseCurrency = selectedPI?.baseCurrencyCode || order?.baseCurrencyCode || displayCurrency || 'USD';

  return (
    <TradePage>
      <TradePageHeader
        title="Export Proforma Invoices"
        subtitle="Commercial export proformas for advance foreign remittance, wire transfers and buyer LC applications"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<FileCheck2 className="w-5 h-5 text-white" />}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={() => {
                resetForm(orderIdFilter);
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Proforma
            </button>
          ) : undefined
        }
      />

      <TradeCard>
        <div className="mb-4">
          <TradeWorkflowStepper steps={EXPORT_WORKFLOW_STEPS} currentStepIndex={3} />
        </div>

        {orderIdFilter && <OrderFilterBanner orderId={orderIdFilter} entityLabel="proforma invoices" />}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search PI number, buyer or country…"
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
              {PROFORMA_STATUSES.map((s) => (
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
            columns={['PI Number', 'Order Ref', 'Overseas Customer', 'Date', 'Currency', 'Amount', 'SWIFT Code', 'LC Reference', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {list.loading && list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading proforma invoices…
                </TradeTableCell>
              </TradeTableRow>
            ) : list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  No proforma invoices match the current filters.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              list.items.map((pi) => (
                <TradeTableRow key={pi.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{pi.piNumber}</TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-800">
                    <Link
                      href={`/export/orders?order=${pi.orderId}`}
                      className="hover:underline text-blue-700"
                    >
                      {pi.orderNumber || pi.orderId.slice(0, 8)}
                    </Link>
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="font-semibold text-gray-900 block">{pi.customerName}</span>
                    <span className="text-[10px] text-gray-400">{pi.customerCountry || '—'}</span>
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-600">{formatDate(pi.date)}</TradeTableCell>
                  <TradeTableCell className="font-mono text-xs">{pi.currency}</TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {formatMoney(pi.amountForeign, pi.currency)}
                    <span className="block text-[10px] font-normal text-gray-400">
                      base {formatMoney(pi.amountBase, pi.baseCurrencyCode || displayCurrency)}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs text-gray-700">
                    {pi.bankSwiftCode || '—'}
                  </TradeTableCell>
                  <TradeTableCell className="text-xs text-gray-600">
                    {pi.lcNumber || 'Wire Transfer'}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={pi.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedPI(pi)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View proforma invoice"
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
        isOpen={Boolean(selectedPI)}
        onClose={() => setSelectedPI(null)}
        title={selectedPI?.piNumber || 'Export Proforma Invoice'}
        subtitle={selectedPI ? `Buyer: ${selectedPI.customerName}` : undefined}
        actions={
          selectedPI && canEdit ? (
            <div className="flex flex-wrap items-center gap-2">
              {(NEXT_STATUS[selectedPI.status] || [])
                .filter((s) => s !== 'Cancelled')
                .map((next) => (
                  <button
                    key={next}
                    type="button"
                    disabled={actionId === selectedPI.id}
                    onClick={() => handleStatus(selectedPI, next)}
                    className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {next}
                  </button>
                ))}
              {(NEXT_STATUS[selectedPI.status] || []).includes('Cancelled') && (
                <button
                  type="button"
                  disabled={actionId === selectedPI.id}
                  onClick={() => handleStatus(selectedPI, 'Cancelled')}
                  className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
          ) : undefined
        }
      >
        {selectedPI && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">PI Number</span>
                <span className="font-bold text-gray-900">{selectedPI.piNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Export Order Ref</span>
                <Link
                  href={`/export/orders?order=${selectedPI.orderId}`}
                  className="font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  {selectedPI.orderNumber || selectedPI.orderId.slice(0, 8)}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Issue Date</span>
                <span className="font-semibold text-gray-900">{formatDate(selectedPI.date)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Invoice Value</span>
                <span className="font-extrabold text-[#014582] text-sm">
                  {formatMoney(selectedPI.amountForeign, selectedPI.currency)}
                </span>
                <span className="block text-[10px] text-gray-400">
                  base {formatMoney(selectedPI.amountBase, selectedPI.baseCurrencyCode || displayCurrency)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Currency / FX</span>
                <span className="font-semibold text-gray-900">
                  {selectedPI.currency} @ {selectedPI.exchangeRate}
                </span>
                <span className="block text-[10px] text-gray-400">
                  {selectedPI.rateSource || 'rate source not recorded'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Beneficiary SWIFT</span>
                <span className="font-mono font-bold text-gray-900">{selectedPI.bankSwiftCode || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Beneficiary Account</span>
                <span className="font-mono text-gray-800">{selectedPI.beneficiaryAccount || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">LC Reference</span>
                <span className="font-semibold text-gray-800">{selectedPI.lcNumber || 'Wire Transfer'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selectedPI.status} />
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Advance recorded</span>
                <span className="font-bold text-emerald-700">
                  {formatMoney(selectedPI.advanceReceivedBase, selectedPI.baseCurrencyCode || displayCurrency)}
                </span>
              </div>
            </div>

            {selectedPI.notes && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                <span className="font-bold block text-xs mb-1">Notes</span>
                <p className="text-xs whitespace-pre-wrap">{selectedPI.notes}</p>
              </div>
            )}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Issue Export Proforma Invoice"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {formError}
            </div>
          )}

          <FormSection
            title="Order & amount"
            subtitle="The proforma inherits the order currency, FX rate and buyer"
          >
            <div>
              <FieldLabel required>Export order</FieldLabel>
              <OrderSelect
                value={orderId}
                onChange={(id, selected) => {
                  setOrderId(id);
                  setOrder(selected || null);
                }}
                required
                disabled={saving}
              />
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
                  <p className="text-[10px] uppercase font-bold text-gray-400">Advance</p>
                  <p className="font-bold text-emerald-700">
                    {formatMoney(order.advanceReceivedBase, order.baseCurrencyCode || displayCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Status</p>
                  <TradeStatusBadge status={order.status} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Issue date</FieldLabel>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Proforma amount {order ? `(${order.currency})` : ''}</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={order ? String(order.totalForeign) : 'Defaults to order total'}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Beneficiary & LC details" subtitle="Optional — used on the buyer's wire transfer / LC application">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Bank SWIFT code</FieldLabel>
                <input
                  value={bankSwiftCode}
                  onChange={(e) => setBankSwiftCode(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  placeholder="e.g. SCBLAEADXXX"
                />
              </div>
              <div>
                <FieldLabel>Beneficiary account</FieldLabel>
                <input
                  value={beneficiaryAccount}
                  onChange={(e) => setBeneficiaryAccount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  placeholder="IBAN / account number"
                />
              </div>
            </div>
            <div>
              <FieldLabel>LC reference (if applicable)</FieldLabel>
              <input
                value={lcNumber}
                onChange={(e) => setLcNumber(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                placeholder="Buyer LC number"
              />
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
              disabled={saving || !orderId}
              className="px-4 py-2 rounded-lg bg-[#014582] text-white hover:bg-[#01366a] text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Issuing…' : 'Issue Proforma'}
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
