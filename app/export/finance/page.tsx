'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Landmark,
  Search,
  Eye,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Pencil,
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
import { OrderSelect, OrderFilterBanner, FormSection, FieldLabel } from '../../../components/export/ExportSelectors';
import exportApi, {
  errorMessage,
  formatDate,
  formatMoney,
  type ExportFinanceLc,
  type ExportOrder,
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

const LC_STATUSES = ['LC Advised', 'Confirmed', 'Documents Negotiated', 'Settlement Received'];

const NEXT_STATUS: Record<string, string[]> = {
  'LC Advised': ['Confirmed'],
  Confirmed: ['Documents Negotiated'],
  'Documents Negotiated': ['Settlement Received'],
  'Settlement Received': [],
};

const DISCREPANCY_STATUSES = ['Pending Review', 'Clean', 'Discrepant'];

interface LcForm {
  orderId: string;
  issuingBank: string;
  advisingBank: string;
  applicant: string;
  lcValueForeign: string;
  currency: string;
  exchangeRate: string;
  exchangeRateDate: string;
  expiryDate: string;
  latestShipmentDate: string;
  presentationDays: string;
  notes: string;
}

const emptyForm: LcForm = {
  orderId: '',
  issuingBank: '',
  advisingBank: '',
  applicant: '',
  lcValueForeign: '',
  currency: '',
  exchangeRate: '',
  exchangeRateDate: '',
  expiryDate: '',
  latestShipmentDate: '',
  presentationDays: '21',
  notes: '',
};

export default function ExportFinancePage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <ExportFinancePageContent />
    </React.Suspense>
  );
}

function ExportFinancePageContent() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const { code: displayCurrency } = useCurrency();
  const canCreate = can('export.finance.create');
  const canEdit = can('export.finance.edit');

  const orderIdFilter = searchParams?.get('orderId') || undefined;
  const list = useExportList<ExportFinanceLc>((query) => exportApi.listLcs(query), {
    limit: 20,
    extraQuery: orderIdFilter ? { orderId: orderIdFilter } : undefined,
  });

  const [selectedLc, setSelectedLc] = useState<ExportFinanceLc | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLc, setEditingLc] = useState<ExportFinanceLc | null>(null);
  const [form, setForm] = useState<LcForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [discrepancyDraft, setDiscrepancyDraft] = useState('');

  const openCreate = useCallback(() => {
    setEditingLc(null);
    setForm({ ...emptyForm, orderId: orderIdFilter || '' });
    setFormError(null);
    setIsModalOpen(true);
  }, [orderIdFilter]);

  const openEdit = useCallback((lc: ExportFinanceLc) => {
    setEditingLc(lc);
    setForm({
      orderId: lc.orderId,
      issuingBank: lc.issuingBank || '',
      advisingBank: lc.advisingBank || '',
      applicant: lc.applicant || '',
      lcValueForeign: String(lc.lcValueForeign ?? ''),
      currency: lc.currency || '',
      exchangeRate: String(lc.exchangeRate ?? ''),
      exchangeRateDate: lc.exchangeRateDate ? lc.exchangeRateDate.slice(0, 10) : '',
      expiryDate: lc.expiryDate ? lc.expiryDate.slice(0, 10) : '',
      latestShipmentDate: lc.latestShipmentDate ? lc.latestShipmentDate.slice(0, 10) : '',
      presentationDays: String(lc.presentationDays ?? ''),
      notes: lc.notes || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  }, []);

  const handleOrderChange = (id: string, order?: ExportOrder | null) => {
    setForm((prev) => ({
      ...prev,
      orderId: id,
      currency: order?.currency || prev.currency,
      applicant: order?.customerName || prev.applicant,
      lcValueForeign:
        prev.lcValueForeign || (order ? String(order.totalForeign ?? '') : ''),
      exchangeRate: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editingLc && !form.orderId) {
      return setFormError('Select the export order this LC belongs to.');
    }
    if (!form.issuingBank.trim()) {
      return setFormError('Issuing bank is required.');
    }
    const value = Number(form.lcValueForeign);
    if (!Number.isFinite(value) || value <= 0) {
      return setFormError('LC value must be a positive amount.');
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        issuingBank: form.issuingBank.trim(),
        advisingBank: form.advisingBank.trim() || undefined,
        applicant: form.applicant.trim() || undefined,
        lcValueForeign: value,
        currency: form.currency || undefined,
        exchangeRate: form.exchangeRate ? Number(form.exchangeRate) : undefined,
        exchangeRateDate: form.exchangeRateDate || undefined,
        expiryDate: form.expiryDate || undefined,
        latestShipmentDate: form.latestShipmentDate || undefined,
        presentationDays:
          form.presentationDays === '' ? undefined : Number(form.presentationDays),
        notes: form.notes.trim() || undefined,
      };
      if (editingLc) {
        const updated = await exportApi.updateLc(editingLc.id, payload);
        toast.success(`LC ${updated.lcAdviceNumber} updated`);
        setSelectedLc((prev) => (prev && prev.id === updated.id ? updated : prev));
        list.setItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      } else {
        const created = await exportApi.createLc({ ...payload, orderId: form.orderId });
        toast.success(`LC ${created.lcAdviceNumber} advised`);
        list.reload();
        setSelectedLc(created);
      }
      setIsModalOpen(false);
      setEditingLc(null);
      setForm(emptyForm);
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to save the LC advice'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (lc: ExportFinanceLc, status: string) => {
    setActionId(lc.id);
    try {
      const updated = await exportApi.updateLcStatus(lc.id, status);
      toast.success(`LC moved to ${status}`);
      setSelectedLc((prev) => (prev && prev.id === lc.id ? updated : prev));
      list.setItems((prev) => prev.map((row) => (row.id === lc.id ? updated : row)));
      setDiscrepancyDraft(updated.discrepancyStatus || '');
    } catch (err) {
      toast.error(errorMessage(err, `Failed to move LC to ${status}`));
    } finally {
      setActionId(null);
    }
  };

  const handleDiscrepancy = async (lc: ExportFinanceLc) => {
    if (!discrepancyDraft || discrepancyDraft === lc.discrepancyStatus) return;
    setActionId(lc.id);
    try {
      const updated = await exportApi.updateLcStatus(lc.id, lc.status, {
        discrepancyStatus: discrepancyDraft,
      });
      toast.success('Discrepancy status updated');
      setSelectedLc(updated);
      list.setItems((prev) => prev.map((row) => (row.id === lc.id ? updated : row)));
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update discrepancy status'));
    } finally {
      setActionId(null);
    }
  };

  const baseCurrency =
    selectedLc?.baseCurrencyCode || displayCurrency || 'USD';
  const locked = Boolean(
    selectedLc && ['Settlement Received', 'Cancelled'].includes(selectedLc.status)
  );

  return (
    <TradePage>
      <TradePageHeader
        title="Export Trade Finance & LC Advice"
        subtitle="Overseas buyer Letters of Credit, bank confirmations, document negotiations and export discounting"
        moduleName="Export Finance"
        backHref="/export/dashboard"
        icon={<Landmark className="w-5 h-5 text-white" />}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New LC Advice
            </button>
          ) : undefined
        }
      />

      <TradeCard>
        <div className="mb-4">
          <TradeWorkflowStepper steps={EXPORT_WORKFLOW_STEPS} currentStepIndex={8} />
        </div>

        {orderIdFilter && <OrderFilterBanner orderId={orderIdFilter} entityLabel="letters of credit" />}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search LC advice, applicant, bank, order…"
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
              {LC_STATUSES.map((s) => (
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
            columns={['LC Advice No', 'Order Ref', 'Overseas Issuing Bank', 'Buyer Applicant', 'LC Value', 'Currency / FX', 'Presentation Limit', 'Discrepancy', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {list.loading && list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading letters of credit…
                </TradeTableCell>
              </TradeTableRow>
            ) : list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  No LC advices match the current filters.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              list.items.map((lc) => (
                <TradeTableRow key={lc.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{lc.lcAdviceNumber}</TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-800">
                    <Link
                      href={`/export/orders?order=${lc.orderId}`}
                      className="hover:underline text-blue-700"
                    >
                      {lc.orderNumber || lc.orderId.slice(0, 8)}
                    </Link>
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-800 text-xs">{lc.issuingBank}</TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-900">{lc.applicant}</TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {formatMoney(lc.lcValueForeign, lc.currency)}
                    <span className="block text-[10px] font-normal text-gray-400">
                      base {formatMoney(lc.lcValueBase, lc.baseCurrencyCode || displayCurrency)}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs">
                    {lc.currency} @ {lc.exchangeRate}
                  </TradeTableCell>
                  <TradeTableCell className="text-xs text-gray-600">
                    {lc.presentationDays} days from B/L
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded">
                      {lc.discrepancyStatus}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={lc.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLc(lc);
                        setDiscrepancyDraft(lc.discrepancyStatus || '');
                      }}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View LC advice"
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
        isOpen={Boolean(selectedLc)}
        onClose={() => setSelectedLc(null)}
        title={selectedLc?.lcAdviceNumber || 'Export LC Details'}
        subtitle={
          selectedLc
            ? `Applicant: ${selectedLc.applicant} • Issuing Bank: ${selectedLc.issuingBank}`
            : undefined
        }
        actions={
          selectedLc && canEdit ? (
            <div className="flex flex-wrap items-center gap-2">
              {!locked && (
                <button
                  type="button"
                  onClick={() => openEdit(selectedLc)}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-gray-50"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              {(NEXT_STATUS[selectedLc.status] || []).map((next) => (
                <button
                  key={next}
                  type="button"
                  disabled={actionId === selectedLc.id}
                  onClick={() => handleStatus(selectedLc, next)}
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {next}
                </button>
              ))}
            </div>
          ) : undefined
        }
      >
        {selectedLc && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">LC Advice Ref</span>
                <span className="font-bold text-gray-900">{selectedLc.lcAdviceNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Export Order</span>
                <Link
                  href={`/export/orders?order=${selectedLc.orderId}`}
                  className="font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  {selectedLc.orderNumber || selectedLc.orderId.slice(0, 8)}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Buyer Applicant</span>
                <span className="font-semibold text-gray-900">{selectedLc.applicant}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Confirmed Value</span>
                <span className="font-extrabold text-[#014582] text-sm">
                  {formatMoney(selectedLc.lcValueForeign, selectedLc.currency)}
                </span>
                <span className="block text-[10px] text-gray-400">
                  base {formatMoney(selectedLc.lcValueBase, baseCurrency)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Exchange Rate</span>
                <span className="font-mono font-bold text-gray-900">
                  1 {selectedLc.currency} = {selectedLc.exchangeRate} {baseCurrency}
                </span>
                <span className="block text-[10px] text-gray-400">
                  {selectedLc.rateSource || 'rate source not recorded'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Expiry Date</span>
                <span className="font-bold text-gray-900">{formatDate(selectedLc.expiryDate)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Latest Shipment</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(selectedLc.latestShipmentDate)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Advising / Confirming Bank</span>
                <span className="font-medium text-gray-800">{selectedLc.advisingBank || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selectedLc.status} />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#014582]" />
                <span className="font-bold text-gray-900">Document discrepancy review</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={discrepancyDraft || selectedLc.discrepancyStatus || ''}
                  onChange={(e) => setDiscrepancyDraft(e.target.value)}
                  disabled={!canEdit || locked || actionId === selectedLc.id}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white disabled:bg-gray-50"
                >
                  {DISCREPANCY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={
                    !canEdit ||
                    locked ||
                    actionId === selectedLc.id ||
                    !discrepancyDraft ||
                    discrepancyDraft === selectedLc.discrepancyStatus
                  }
                  onClick={() => handleDiscrepancy(selectedLc)}
                  className="px-3 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50"
                >
                  Save
                </button>
              </div>
              {locked && (
                <p className="text-[10px] text-gray-500">
                  This LC is closed and can no longer be edited.
                </p>
              )}
            </div>

            {selectedLc.status !== 'Settlement Received' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <p className="font-bold text-xs">Settlement requires a realized receipt</p>
                <p className="text-[11px] mt-0.5">
                  Record the inward remittance and mark it “Realized &amp; Credited” before moving
                  this LC to Settlement Received.
                </p>
                <Link
                  href={`/export/receipts?orderId=${selectedLc.orderId}`}
                  className="inline-flex items-center gap-1 font-bold text-amber-900 hover:underline mt-1.5"
                >
                  Open export receipts <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {selectedLc.notes && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                <span className="font-bold block text-xs mb-1">Notes</span>
                <p className="text-xs whitespace-pre-wrap">{selectedLc.notes}</p>
              </div>
            )}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLc(null);
        }}
        title={editingLc ? `Edit LC ${editingLc.lcAdviceNumber}` : 'Advise Export Letter of Credit'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {formError}
            </div>
          )}

          <FormSection
            title="Export order & LC value"
            subtitle="The LC inherits the order buyer and currency and stores a base-currency equivalent at the transaction rate"
          >
            <div>
              <FieldLabel required={!editingLc}>Export order</FieldLabel>
              <OrderSelect
                value={form.orderId}
                onChange={handleOrderChange}
                required={!editingLc}
                disabled={saving || Boolean(editingLc)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel required>LC value</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.lcValueForeign}
                  onChange={(e) => setForm((prev) => ({ ...prev, lcValueForeign: e.target.value }))}
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
                  onChange={(e) => setForm((prev) => ({ ...prev, exchangeRate: e.target.value }))}
                  placeholder="Use company rate"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Rate date</FieldLabel>
              <input
                type="date"
                value={form.exchangeRateDate}
                onChange={(e) => setForm((prev) => ({ ...prev, exchangeRateDate: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
          </FormSection>

          <FormSection title="Bank & beneficiary details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Overseas issuing bank</FieldLabel>
                <input
                  value={form.issuingBank}
                  onChange={(e) => setForm((prev) => ({ ...prev, issuingBank: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Advising / confirming bank</FieldLabel>
                <input
                  value={form.advisingBank}
                  onChange={(e) => setForm((prev) => ({ ...prev, advisingBank: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Buyer applicant</FieldLabel>
              <input
                value={form.applicant}
                onChange={(e) => setForm((prev) => ({ ...prev, applicant: e.target.value }))}
                placeholder="Defaults to the order customer"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
          </FormSection>

          <FormSection title="Validity & presentation">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel>Expiry date</FieldLabel>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Latest shipment date</FieldLabel>
                <input
                  type="date"
                  value={form.latestShipmentDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, latestShipmentDate: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Presentation days</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.presentationDays}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, presentationDays: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </FormSection>

          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingLc(null);
              }}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (!editingLc && !form.orderId)}
              className="px-4 py-2 rounded-lg bg-[#014582] text-white hover:bg-[#01366a] text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingLc ? 'Save LC' : 'Advise LC'}
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
