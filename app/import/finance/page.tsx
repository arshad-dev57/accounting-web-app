'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Search,
  Eye,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  DollarSign,
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
  ImportEligibleFinancePo,
  ImportFinanceLc,
  ImportProformaInvoice,
} from '../../../lib/import-api';
import { useCurrency } from '../../../lib/currency-context';
import { formatImportDate, formatImportMoney } from '../../../lib/import-format';
import { CurrencySelect, FormSection, FieldLabel } from '@/components/import/ImportSelectors';

function formatTradeDate(val?: string | null) {
  return formatImportDate(val);
}

function formatTradeMoney(amount: number | string | null | undefined, currency = 'USD') {
  return formatImportMoney(amount, currency, { emptyAsDash: false });
}

function lcBeneficiary(lc: ImportFinanceLc) {
  return lc.beneficiary || lc.beneficiaryName || '—';
}
function lcCurrencyCode(lc: ImportFinanceLc) {
  return lc.currency || lc.lcCurrency || 'USD';
}
function lcStatusLabel(lc: ImportFinanceLc) {
  return lc.status || lc.lcStatus || 'Draft';
}

const EMPTY_LC_FORM = {
  lcNumber: '',
  importPoId: '',
  proformaId: '',
  applicant: '',
  issuingBank: '',
  advisingBank: '',
  beneficiary: '',
  lcAmount: '',
  currency: 'USD',
  amountTolerancePercent: '0',
  marginPercent: '',
  issuanceDate: new Date().toISOString().slice(0, 10),
  expiryDate: '',
  latestShipmentDate: '',
  presentationPeriodDays: '21',
  paymentTenor: 'At Sight',
  usanceDays: '',
  confirmed: true,
  partialShipmentAllowed: false,
  transshipmentAllowed: false,
  portOfLoading: '',
  portOfDischarge: '',
  incoterm: '',
};

type FieldErrors = Partial<Record<keyof typeof EMPTY_LC_FORM | 'form', string>>;

function validateLcForm(form: typeof EMPTY_LC_FORM): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.issuingBank.trim()) errors.issuingBank = 'Issuing bank is required';
  if (!form.beneficiary.trim()) errors.beneficiary = 'Beneficiary is required';
  const amount = Number(form.lcAmount);
  if (!(amount > 0)) errors.lcAmount = 'LC amount must be greater than zero';
  const margin = Number(form.marginPercent || 0);
  if (Number.isNaN(margin) || margin < 0 || margin > 100) {
    errors.marginPercent = 'Margin % must be between 0 and 100';
  }
  const issuance = form.issuanceDate ? new Date(form.issuanceDate) : null;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (issuance && issuance.getTime() > today.getTime()) {
    errors.issuanceDate = 'Issuance date must not be in the future';
  }
  if (!form.expiryDate) {
    errors.expiryDate = 'Expiry date is required';
  } else if (issuance && new Date(form.expiryDate) <= issuance) {
    errors.expiryDate = 'Expiry date must be after the issuance date';
  }
  if (form.latestShipmentDate) {
    const ship = new Date(form.latestShipmentDate);
    if (issuance && ship <= issuance) {
      errors.latestShipmentDate = 'Latest shipment date must be after the issuance date';
    }
    if (form.expiryDate && ship > new Date(form.expiryDate)) {
      errors.latestShipmentDate = 'Latest shipment date must be on or before the expiry date';
    }
  }
  if (form.paymentTenor === 'Usance' || form.paymentTenor === 'Deferred') {
    if (!(Number(form.usanceDays) > 0)) {
      errors.usanceDays = 'Usance days are required and must be greater than zero';
    }
  }
  const tol = Number(form.amountTolerancePercent || 0);
  if (Number.isNaN(tol) || tol < 0 || tol > 100) {
    errors.amountTolerancePercent = 'Amount tolerance must be between 0 and 100';
  }
  return errors;
}

export default function ImportFinancePage() {
  const { code: baseCurrencyCode } = useCurrency();

  const [items, setItems] = useState<ImportFinanceLc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedLC, setSelectedLC] = useState<ImportFinanceLc | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAmendOpen, setIsAmendOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [eligiblePos, setEligiblePos] = useState<ImportEligibleFinancePo[]>([]);
  const [advancePis, setAdvancePis] = useState<ImportProformaInvoice[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [lcForm, setLcForm] = useState({ ...EMPTY_LC_FORM });
  const [amendForm, setAmendForm] = useState({
    expiryDate: '',
    latestShipmentDate: '',
    lcAmount: '',
    reason: '',
  });
  const [advanceForm, setAdvanceForm] = useState({
    proformaId: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    method: 'Bank Transfer',
    reference: '',
    bank: '',
    paymentMadeId: '',
    allowStatusOnly: true,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Load LCs first — do not let secondary endpoints wipe the table on failure
      const list = await importApi.listFinanceLcs({ search });
      setItems(list.filter((row): row is ImportFinanceLc => Boolean(row && row.id)));

      const [posResult, pisResult] = await Promise.allSettled([
        importApi.listEligibleFinancePos({ limit: 100 }),
        importApi.listProformas({ limit: 100 }),
      ]);
      if (posResult.status === 'fulfilled') {
        setEligiblePos(Array.isArray(posResult.value) ? posResult.value : []);
      } else {
        console.warn('eligible-pos failed', posResult.reason);
      }
      if (pisResult.status === 'fulfilled') {
        const pis = pisResult.value;
        const piList = Array.isArray(pis)
          ? pis
          : Array.isArray((pis as { items?: ImportProformaInvoice[] })?.items)
            ? (pis as { items: ImportProformaInvoice[] }).items
            : [];
        setAdvancePis(
          piList.filter(
            (pi) =>
              Number(pi.advanceRequiredPercent || 0) > 0 &&
              !pi.lcRequired &&
              !['Cancelled', 'Rejected', 'Expired', 'Advance Paid'].includes(pi.status)
          )
        );
      }
    } catch (err: any) {
      console.error('Error fetching finance LCs:', err);
      setError(err?.response?.data?.error || err?.response?.data?.message || err.message || 'Failed to load trade finance records');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedPo = useMemo(
    () => eligiblePos.find((p) => p.id === lcForm.importPoId) || null,
    [eligiblePos, lcForm.importPoId]
  );

  const poOptions = useMemo(() => {
    if (!lcForm.beneficiary.trim()) return eligiblePos;
    const b = lcForm.beneficiary.trim().toLowerCase();
    return eligiblePos.filter((p) => (p.supplierName || '').toLowerCase() === b);
  }, [eligiblePos, lcForm.beneficiary]);

  const applyPoAutofill = (po: ImportEligibleFinancePo | null, keepBeneficiary = false) => {
    if (!po) return;
    const primaryPi = po.proformas?.[0];
    setLcForm((f) => ({
      ...f,
      importPoId: po.id,
      proformaId: primaryPi?.id || '',
      beneficiary: keepBeneficiary && f.beneficiary ? f.beneficiary : po.supplierName || f.beneficiary,
      currency: po.currency || f.currency,
      lcAmount: String(po.outstandingForLc || po.subtotalForeign || ''),
      portOfLoading: po.portOfLoading || f.portOfLoading,
      portOfDischarge: po.portOfEntry || f.portOfDischarge,
      incoterm: po.incoterm || f.incoterm,
    }));
  };

  const openCreate = () => {
    setFieldErrors({});
    setError(null);
    setLcForm({ ...EMPTY_LC_FORM, applicant: '' });
    setIsCreateOpen(true);
  };

  const handleCreateLc = async () => {
    const errors = validateLcForm(lcForm);
    if (selectedPo && lcForm.currency !== selectedPo.currency) {
      errors.currency = `Currency must match PO currency (${selectedPo.currency})`;
    }
    if (selectedPo) {
      const tol = Number(lcForm.amountTolerancePercent || 0);
      const max = selectedPo.outstandingForLc * (1 + tol / 100);
      if (Number(lcForm.lcAmount) > max + 0.0001) {
        errors.lcAmount = `LC amount exceeds outstanding PO value ${formatTradeMoney(selectedPo.outstandingForLc, selectedPo.currency)} beyond tolerance`;
      }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError(null);
    try {
      const created = await importApi.createFinanceLc({
        lcNumber: lcForm.lcNumber.trim() || undefined,
        importPoId: lcForm.importPoId || undefined,
        proformaId: lcForm.proformaId || undefined,
        applicant: lcForm.applicant.trim() || undefined,
        issuingBank: lcForm.issuingBank.trim(),
        advisingBank: lcForm.advisingBank || undefined,
        beneficiary: lcForm.beneficiary.trim(),
        lcAmount: Number(lcForm.lcAmount),
        currency: lcForm.currency,
        amountTolerancePercent: Number(lcForm.amountTolerancePercent) || 0,
        marginPercent: Number(lcForm.marginPercent) || 0,
        issuanceDate: lcForm.issuanceDate,
        expiryDate: lcForm.expiryDate,
        latestShipmentDate: lcForm.latestShipmentDate || undefined,
        presentationPeriodDays: Number(lcForm.presentationPeriodDays) || 21,
        paymentTenor: lcForm.paymentTenor,
        usanceDays: lcForm.paymentTenor === 'At Sight' ? 0 : Number(lcForm.usanceDays) || 0,
        confirmed: lcForm.confirmed,
        partialShipmentAllowed: lcForm.partialShipmentAllowed,
        transshipmentAllowed: lcForm.transshipmentAllowed,
        portOfLoading: lcForm.portOfLoading || undefined,
        portOfDischarge: lcForm.portOfDischarge || undefined,
        incoterm: lcForm.incoterm || undefined,
      });
      const createdLc =
        created && typeof created === 'object' && 'id' in created
          ? created
          : (created as { data?: ImportFinanceLc })?.data;
      if (!createdLc?.id) {
        throw new Error('LC was created but the server response had no id');
      }
      setIsCreateOpen(false);
      setFieldErrors({});
      setItems((prev) => [createdLc, ...prev.filter((row) => row?.id && row.id !== createdLc.id)]);
      try {
        await fetchData();
      } catch {
        /* keep optimistic row */
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to create LC';
      setError(msg);
      setFieldErrors({ form: msg });
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (lc: ImportFinanceLc) => {
    setSelectedLC(lc);
    setDetailLoading(true);
    try {
      const full = await importApi.getFinanceLc(lc.id);
      setSelectedLC(full);
    } catch {
      /* keep list row */
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatus = async (status: string, extra: Record<string, unknown> = {}) => {
    if (!selectedLC) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await importApi.updateFinanceLcStatus(selectedLC.id, status, extra);
      setSelectedLC(updated);
      setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAmend = async () => {
    if (!selectedLC) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await importApi.amendFinanceLc(selectedLC.id, {
        expiryDate: amendForm.expiryDate || undefined,
        latestShipmentDate: amendForm.latestShipmentDate || undefined,
        lcAmount: amendForm.lcAmount ? Number(amendForm.lcAmount) : undefined,
        reason: amendForm.reason || undefined,
      });
      setSelectedLC(updated);
      setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setIsAmendOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Amendment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvance = async () => {
    if (!advanceForm.proformaId) {
      setError('Select a proforma invoice for the advance payment');
      return;
    }
    if (!(Number(advanceForm.amount) > 0)) {
      setError('Advance amount must be greater than zero');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await importApi.recordAdvancePayment(advanceForm.proformaId, {
        amount: Number(advanceForm.amount),
        date: advanceForm.date,
        method: advanceForm.method,
        reference: advanceForm.reference || undefined,
        bank: advanceForm.bank || undefined,
        paymentMadeId: advanceForm.paymentMadeId.trim() || undefined,
        allowStatusOnly: advanceForm.allowStatusOnly,
      });
      setAdvanceForm((f) => ({
        ...f,
        proformaId: '',
        amount: '',
        reference: '',
        bank: '',
        paymentMadeId: '',
      }));
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to record advance');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = items.filter((l) => {
    if (!l) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (l.lcNumber || '').toLowerCase().includes(q) ||
      lcBeneficiary(l).toLowerCase().includes(q) ||
      (l.issuingBank || '').toLowerCase().includes(q) ||
      (l.poRef || '').toLowerCase().includes(q) ||
      (l.piRef || '').toLowerCase().includes(q)
    );
  });

  const usanceEnabled = lcForm.paymentTenor === 'Usance' || lcForm.paymentTenor === 'Deferred';

  return (
    <TradePage>
      <TradePageHeader
        title="Import Trade Finance & LC Tracking"
        subtitle="Letters of Credit management, margin deposits, usance terms and advance payments against proforma invoices"
        moduleName="Import Finance"
        backHref="/import/dashboard"
        icon={<Landmark className="w-5 h-5 text-white" />}
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
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create LC
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
          <button type="button" onClick={() => setError(null)} className="font-bold underline hover:no-underline ml-4">
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
              placeholder="Search LC number, beneficiary, bank, PO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#014582]" />
            <p className="text-xs">Loading letters of credit...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-xs">No Letter of Credit records found.</p>
          </div>
        ) : (
          <TradeTable>
            <TradeTableHeader
              columns={[
                'LC Number',
                'Linked PO / PI',
                'Issuing Bank',
                'Beneficiary',
                'Amount',
                'Drawn / Balance',
                'Margin deposit',
                'Expiry',
                'Status',
                'Actions',
              ]}
            />
            <TradeTableBody>
              {filtered.map((lc) => {
                const cur = lcCurrencyCode(lc);
                const days = lc.daysToExpiry;
                const expiryWarn = lc.expiringSoon;
                return (
                  <TradeTableRow key={lc.id} className={expiryWarn ? 'bg-amber-50/60' : undefined}>
                    <TradeTableCell className="font-bold text-[#014582]">{lc.lcNumber}</TradeTableCell>
                    <TradeTableCell className="font-semibold text-gray-800 text-xs">
                      <div>{lc.poRef || '—'}</div>
                      {lc.piRef ? <div className="text-gray-500">{lc.piRef}</div> : null}
                    </TradeTableCell>
                    <TradeTableCell className="text-gray-800 text-xs">{lc.issuingBank}</TradeTableCell>
                    <TradeTableCell className="font-semibold text-gray-900">{lcBeneficiary(lc)}</TradeTableCell>
                    <TradeTableCell className="font-bold text-gray-900">
                      {formatTradeMoney(lc.lcAmount, cur)}
                    </TradeTableCell>
                    <TradeTableCell className="text-xs text-gray-700">
                      <div>{formatTradeMoney(lc.amountDrawn || 0, cur)}</div>
                      <div className="font-semibold text-[#014582]">
                        Bal {formatTradeMoney(lc.balance ?? Number(lc.lcAmount) - Number(lc.amountDrawn || 0), cur)}
                      </div>
                    </TradeTableCell>
                    <TradeTableCell className="text-xs font-medium text-amber-800">
                      {formatTradeMoney(
                        lc.marginDeposit ?? (Number(lc.lcAmount) * Number(lc.marginPercent || 0)) / 100,
                        cur
                      )}
                    </TradeTableCell>
                    <TradeTableCell className={`text-xs ${expiryWarn ? 'font-bold text-amber-700' : 'text-gray-600'}`}>
                      <div>{formatTradeDate(lc.expiryDate)}</div>
                      {days != null ? (
                        <div className="text-[10px]">{days < 0 ? `Expired ${Math.abs(days)}d` : `${days}d left`}</div>
                      ) : null}
                    </TradeTableCell>
                    <TradeTableCell>
                      <TradeStatusBadge status={lcStatusLabel(lc)} />
                    </TradeTableCell>
                    <TradeTableCell>
                      <button
                        type="button"
                        onClick={() => openDetail(lc)}
                        className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </TradeTableCell>
                  </TradeTableRow>
                );
              })}
            </TradeTableBody>
          </TradeTable>
        )}
      </TradeCard>

      {advancePis.length > 0 && (
        <TradeCard>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Advance payment (non-LC)</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Record advance against a proforma with advance % and no LC. For GL posting, use{' '}
                <Link href="/import/bills" className="text-[#014582] font-semibold underline">
                  Supplier Bills & Payments
                </Link>{' '}
                or{' '}
                <Link href="/accounting/payments-made" className="text-[#014582] font-semibold underline">
                  Accounting → Payments Made
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <FieldLabel required>Proforma invoice</FieldLabel>
              <select
                value={advanceForm.proformaId}
                onChange={(e) => {
                  const id = e.target.value;
                  const pi = advancePis.find((p) => p.id === id);
                  setAdvanceForm((f) => ({
                    ...f,
                    proformaId: id,
                    amount: pi ? String(Number(pi.advanceAmountUsd || pi.amountForeign * (Number(pi.advanceRequiredPercent) / 100))) : f.amount,
                  }));
                }}
                className="w-full rounded-xl border px-3 py-2 bg-white"
              >
                <option value="">Select PI…</option>
                {advancePis.map((pi) => (
                  <option key={pi.id} value={pi.id}>
                    {pi.piNumber} — {pi.supplierName} ({pi.poRef || 'no PO'}) · {pi.advanceRequiredPercent}%
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel required>Amount</FieldLabel>
              <input
                type="number"
                value={advanceForm.amount}
                onChange={(e) => setAdvanceForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <FieldLabel required>Date</FieldLabel>
              <input
                type="date"
                value={advanceForm.date}
                onChange={(e) => setAdvanceForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <FieldLabel required>Method</FieldLabel>
              <input
                value={advanceForm.method}
                onChange={(e) => setAdvanceForm((f) => ({ ...f, method: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <FieldLabel>Reference</FieldLabel>
              <input
                value={advanceForm.reference}
                onChange={(e) => setAdvanceForm((f) => ({ ...f, reference: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <FieldLabel>Bank</FieldLabel>
              <input
                value={advanceForm.bank}
                onChange={(e) => setAdvanceForm((f) => ({ ...f, bank: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>paymentMadeId (from Payments Made)</FieldLabel>
              <input
                value={advanceForm.paymentMadeId}
                onChange={(e) => setAdvanceForm((f) => ({ ...f, paymentMadeId: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Optional if status-only marker"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-gray-600 mb-2">
                <input
                  type="checkbox"
                  checked={advanceForm.allowStatusOnly}
                  onChange={(e) => setAdvanceForm((f) => ({ ...f, allowStatusOnly: e.target.checked }))}
                />
                Status-only (no GL)
              </label>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleAdvance}
                className="ml-auto px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <DollarSign className="w-3.5 h-3.5" /> Record advance
              </button>
            </div>
          </div>
        </TradeCard>
      )}

      <TradeDetailDrawer
        isOpen={Boolean(selectedLC)}
        onClose={() => setSelectedLC(null)}
        title={selectedLC?.lcNumber || 'Letter of Credit Details'}
        subtitle={`Beneficiary: ${selectedLC ? lcBeneficiary(selectedLC) : ''} • Bank: ${selectedLC?.issuingBank || ''}`}
        actions={
          selectedLC ? (
            <div className="flex flex-wrap gap-2">
              {lcStatusLabel(selectedLC) === 'Draft' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatus('Issued')}
                  className="px-3 py-1.5 rounded-lg bg-[#014582] text-white text-xs font-bold disabled:opacity-50"
                >
                  Issue / Approve
                </button>
              )}
              {['Issued', 'Amended', 'Documents Presented'].includes(lcStatusLabel(selectedLC)) && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setAmendForm({
                      expiryDate: selectedLC.expiryDate ? String(selectedLC.expiryDate).slice(0, 10) : '',
                      latestShipmentDate: selectedLC.latestShipmentDate
                        ? String(selectedLC.latestShipmentDate).slice(0, 10)
                        : '',
                      lcAmount: String(selectedLC.lcAmount || ''),
                      reason: '',
                    });
                    setIsAmendOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#014582] text-[#014582] text-xs font-bold"
                >
                  Amend
                </button>
              )}
              {lcStatusLabel(selectedLC) === 'Issued' || lcStatusLabel(selectedLC) === 'Amended' ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatus('Documents Presented')}
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold"
                >
                  Documents Presented
                </button>
              ) : null}
              {lcStatusLabel(selectedLC) === 'Documents Presented' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatus('Accepted')}
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold"
                >
                  Accept
                </button>
              )}
              {!['Paid/Settled', 'Cancelled', 'Expired'].includes(lcStatusLabel(selectedLC)) && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatus('Cancelled')}
                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-bold"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : null
        }
      >
        {selectedLC && (
          <div className="space-y-6 text-xs">
            {detailLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading detail…
              </div>
            )}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">LC Number</span>
                <span className="font-bold text-gray-900">{selectedLC.lcNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={lcStatusLabel(selectedLC)} />
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Applicant</span>
                <span className="font-semibold text-gray-900">{selectedLC.applicant || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Beneficiary</span>
                <span className="font-semibold text-gray-900">{lcBeneficiary(selectedLC)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Issuing / Advising bank</span>
                <span className="font-semibold text-gray-900">
                  {selectedLC.issuingBank}
                  {selectedLC.advisingBank ? ` / ${selectedLC.advisingBank}` : ''}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Confirmed</span>
                <span className="font-semibold text-gray-900">
                  {selectedLC.confirmed === false ? 'Unconfirmed' : 'Confirmed'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">LC amount</span>
                <span className="font-extrabold text-gray-900 text-sm">
                  {formatTradeMoney(selectedLC.lcAmount, lcCurrencyCode(selectedLC))}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Drawn / Balance</span>
                <span className="font-semibold text-gray-900">
                  {formatTradeMoney(selectedLC.amountDrawn || 0, lcCurrencyCode(selectedLC))}
                  {' / '}
                  {formatTradeMoney(
                    selectedLC.balance ?? Number(selectedLC.lcAmount) - Number(selectedLC.amountDrawn || 0),
                    lcCurrencyCode(selectedLC)
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Margin deposit</span>
                <span className="font-bold text-amber-700">
                  {formatTradeMoney(
                    selectedLC.marginDeposit ??
                      (Number(selectedLC.lcAmount) * Number(selectedLC.marginPercent || 0)) / 100,
                    lcCurrencyCode(selectedLC)
                  )}{' '}
                  ({Number(selectedLC.marginPercent || 0)}%)
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Base amount ({baseCurrencyCode})</span>
                <span className="font-bold text-[#014582]">
                  {formatTradeMoney(selectedLC.lcAmountBase ?? selectedLC.lcAmountUsd ?? 0, baseCurrencyCode)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Issuance → Expiry</span>
                <span className="font-medium text-gray-800">
                  {formatTradeDate(selectedLC.issuanceDate || selectedLC.openDate)} →{' '}
                  {formatTradeDate(selectedLC.expiryDate)}
                  {selectedLC.daysToExpiry != null ? ` (${selectedLC.daysToExpiry}d)` : ''}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Latest shipment</span>
                <span className="font-medium text-gray-800">{formatTradeDate(selectedLC.latestShipmentDate)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Ports</span>
                <span className="font-medium text-gray-800">
                  {selectedLC.portOfLoading || '—'} → {selectedLC.portOfDischarge || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Partial / Transshipment</span>
                <span className="font-medium text-gray-800">
                  {selectedLC.partialShipmentAllowed ? 'Partial yes' : 'Partial no'} ·{' '}
                  {selectedLC.transshipmentAllowed ? 'Transship yes' : 'Transship no'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Linked PO</span>
                <span className="font-medium text-gray-800">{selectedLC.poRef || selectedLC.importPoId || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Linked PI / Shipment</span>
                <span className="font-medium text-gray-800">
                  {selectedLC.piRef || selectedLC.proforma?.piNumber || '—'}
                  {selectedLC.shipment?.shipmentNumber ? ` · ${selectedLC.shipment.shipmentNumber}` : ''}
                </span>
              </div>
            </div>

            {(selectedLC.amendments || []).length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Amendment history</h4>
                <div className="space-y-2">
                  {(selectedLC.amendments || []).map((a, idx) => (
                    <div key={a.id || idx} className="p-3 rounded-xl border border-gray-200 bg-white">
                      <div className="text-[10px] text-gray-500 uppercase">{formatTradeDate(a.at)} · {a.reason || 'Amendment'}</div>
                      <pre className="mt-1 text-[11px] text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(a.changes || {}, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(selectedLC.auditTrail || []).length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Status audit trail</h4>
                <div className="space-y-2">
                  {selectedLC.auditTrail!.map((row) => {
                    const from = row.details?.from || row.details?.previousStatus || '—';
                    const to = row.details?.to || row.details?.nextStatus || row.action;
                    const who = row.user
                      ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() || row.user.email
                      : row.userId || '—';
                    return (
                      <div key={row.id} className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {from} → {to}
                          </div>
                          <div className="text-[10px] text-gray-500">{who}</div>
                        </div>
                        <div className="text-[10px] text-gray-500">{formatTradeDate(row.createdAt)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => !saving && setIsCreateOpen(false)}
        title="Create Letter of Credit"
        maxWidth="max-w-2xl"
        actions={
          <div className="flex justify-end gap-2">
            <button type="button" disabled={saving} onClick={() => setIsCreateOpen(false)} className="px-3 py-2 rounded-xl border text-xs font-semibold">
              Cancel
            </button>
            <button type="button" disabled={saving} onClick={handleCreateLc} className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60">
              {saving ? 'Creating…' : 'Create LC'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {fieldErrors.form && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">{fieldErrors.form}</div>
          )}

          <FormSection title="Linked documents">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <FieldLabel>Linked Import PO</FieldLabel>
                <select
                  value={lcForm.importPoId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const po = eligiblePos.find((p) => p.id === id) || null;
                    if (!po) {
                      setLcForm((f) => ({ ...f, importPoId: '', proformaId: '' }));
                      return;
                    }
                    applyPoAutofill(po);
                  }}
                  className="w-full rounded-xl border px-3 py-2 bg-white"
                >
                  <option value="">Select ordered/approved PO with LC cover remaining…</option>
                  {poOptions.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — {po.supplierName} · outstanding {formatTradeMoney(po.outstandingForLc, po.currency)}
                    </option>
                  ))}
                </select>
                {lcForm.beneficiary && poOptions.length === 0 && (
                  <p className="text-[10px] text-amber-700 mt-1">No eligible POs for this beneficiary.</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Linked Proforma Invoice</FieldLabel>
                <select
                  value={lcForm.proformaId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const pi = selectedPo?.proformas?.find((p) => p.id === id);
                    setLcForm((f) => ({
                      ...f,
                      proformaId: id,
                      ...(pi
                        ? {
                            currency: pi.currency || f.currency,
                            lcAmount: String(pi.amountForeign || f.lcAmount),
                            portOfLoading: pi.portOfLoading || f.portOfLoading,
                            portOfDischarge: pi.portOfDischarge || pi.portOfEntry || f.portOfDischarge,
                            incoterm: pi.incoterm || f.incoterm,
                          }
                        : {}),
                    }));
                  }}
                  className="w-full rounded-xl border px-3 py-2 bg-white"
                  disabled={!selectedPo}
                >
                  <option value="">Optional PI link…</option>
                  {(selectedPo?.proformas || []).map((pi) => (
                    <option key={pi.id} value={pi.id}>
                      {pi.piNumber} — {formatTradeMoney(pi.amountForeign, pi.currency)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection title="Parties & LC identity">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>LC number</FieldLabel>
                <input
                  value={lcForm.lcNumber}
                  onChange={(e) => setLcForm((f) => ({ ...f, lcNumber: e.target.value }))}
                  placeholder="Auto if blank"
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Applicant (our company)</FieldLabel>
                <input
                  value={lcForm.applicant}
                  onChange={(e) => setLcForm((f) => ({ ...f, applicant: e.target.value }))}
                  placeholder="Defaults to company name"
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel required>Issuing bank</FieldLabel>
                <input
                  value={lcForm.issuingBank}
                  onChange={(e) => setLcForm((f) => ({ ...f, issuingBank: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2"
                />
                {fieldErrors.issuingBank && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.issuingBank}</p>}
              </div>
              <div>
                <FieldLabel>Advising bank</FieldLabel>
                <input
                  value={lcForm.advisingBank}
                  onChange={(e) => setLcForm((f) => ({ ...f, advisingBank: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel required>Beneficiary</FieldLabel>
                <input
                  value={lcForm.beneficiary}
                  onChange={(e) => {
                    const beneficiary = e.target.value;
                    setLcForm((f) => {
                      const next = { ...f, beneficiary };
                      if (f.importPoId) {
                        const po = eligiblePos.find((p) => p.id === f.importPoId);
                        if (po && po.supplierName.toLowerCase() !== beneficiary.trim().toLowerCase()) {
                          next.importPoId = '';
                          next.proformaId = '';
                        }
                      }
                      return next;
                    });
                  }}
                  className="w-full rounded-xl border px-3 py-2"
                />
                {fieldErrors.beneficiary && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.beneficiary}</p>}
              </div>
            </div>
          </FormSection>

          <FormSection title="Amount & terms">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>LC amount</FieldLabel>
                <input
                  type="number"
                  value={lcForm.lcAmount}
                  onChange={(e) => setLcForm((f) => ({ ...f, lcAmount: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2"
                />
                {fieldErrors.lcAmount && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.lcAmount}</p>}
              </div>
              <div>
                <FieldLabel>Currency</FieldLabel>
                <CurrencySelect
                  value={lcForm.currency}
                  onChange={(c) => setLcForm((f) => ({ ...f, currency: c }))}
                  disabled={Boolean(selectedPo)}
                />
                {fieldErrors.currency && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.currency}</p>}
              </div>
              <div>
                <FieldLabel>Amount tolerance ±%</FieldLabel>
                <input
                  type="number"
                  value={lcForm.amountTolerancePercent}
                  onChange={(e) => setLcForm((f) => ({ ...f, amountTolerancePercent: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2"
                />
                {fieldErrors.amountTolerancePercent && (
                  <p className="text-[10px] text-red-600 mt-1">{fieldErrors.amountTolerancePercent}</p>
                )}
              </div>
              <div>
                <FieldLabel>Margin %</FieldLabel>
                <input
                  type="number"
                  value={lcForm.marginPercent}
                  onChange={(e) => setLcForm((f) => ({ ...f, marginPercent: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2"
                />
                {fieldErrors.marginPercent && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.marginPercent}</p>}
              </div>
              <div>
                <FieldLabel>Payment tenor</FieldLabel>
                <select
                  value={lcForm.paymentTenor}
                  onChange={(e) =>
                    setLcForm((f) => ({
                      ...f,
                      paymentTenor: e.target.value,
                      usanceDays: e.target.value === 'At Sight' ? '' : f.usanceDays,
                    }))
                  }
                  className="w-full rounded-xl border px-3 py-2 bg-white"
                >
                  {['At Sight', 'Usance', 'Deferred'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              {usanceEnabled ? (
                <div>
                  <FieldLabel required>Usance days</FieldLabel>
                  <input
                    type="number"
                    value={lcForm.usanceDays}
                    onChange={(e) => setLcForm((f) => ({ ...f, usanceDays: e.target.value }))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                  {fieldErrors.usanceDays && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.usanceDays}</p>}
                </div>
              ) : (
                <div>
                  <FieldLabel>Usance days</FieldLabel>
                  <input type="number" value="" disabled className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-400" />
                  <p className="text-[10px] text-gray-400 mt-1">Cleared for At Sight</p>
                </div>
              )}
              <div>
                <FieldLabel required>Issuance date</FieldLabel>
                <input
                  type="date"
                  value={lcForm.issuanceDate}
                  onChange={(e) => setLcForm((f) => ({ ...f, issuanceDate: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2"
                />
                {fieldErrors.issuanceDate && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.issuanceDate}</p>}
              </div>
              <div>
                <FieldLabel required>Expiry date</FieldLabel>
                <input
                  type="date"
                  value={lcForm.expiryDate}
                  onChange={(e) => setLcForm((f) => ({ ...f, expiryDate: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2"
                />
                {fieldErrors.expiryDate && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.expiryDate}</p>}
              </div>
              <div>
                <FieldLabel>Latest shipment date</FieldLabel>
                <input
                  type="date"
                  value={lcForm.latestShipmentDate}
                  onChange={(e) => setLcForm((f) => ({ ...f, latestShipmentDate: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2"
                />
                {fieldErrors.latestShipmentDate && (
                  <p className="text-[10px] text-red-600 mt-1">{fieldErrors.latestShipmentDate}</p>
                )}
              </div>
              <div>
                <FieldLabel>Presentation period (days)</FieldLabel>
                <input
                  type="number"
                  value={lcForm.presentationPeriodDays}
                  onChange={(e) => setLcForm((f) => ({ ...f, presentationPeriodDays: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Shipment conditions">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Confirmed / Unconfirmed</FieldLabel>
                <select
                  value={lcForm.confirmed ? 'confirmed' : 'unconfirmed'}
                  onChange={(e) => setLcForm((f) => ({ ...f, confirmed: e.target.value === 'confirmed' }))}
                  className="w-full rounded-xl border px-3 py-2 bg-white"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="unconfirmed">Unconfirmed</option>
                </select>
              </div>
              <div>
                <FieldLabel>Incoterm</FieldLabel>
                <input
                  value={lcForm.incoterm}
                  onChange={(e) => setLcForm((f) => ({ ...f, incoterm: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Partial shipment allowed</FieldLabel>
                <select
                  value={lcForm.partialShipmentAllowed ? 'yes' : 'no'}
                  onChange={(e) => setLcForm((f) => ({ ...f, partialShipmentAllowed: e.target.value === 'yes' }))}
                  className="w-full rounded-xl border px-3 py-2 bg-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <FieldLabel>Transshipment allowed</FieldLabel>
                <select
                  value={lcForm.transshipmentAllowed ? 'yes' : 'no'}
                  onChange={(e) => setLcForm((f) => ({ ...f, transshipmentAllowed: e.target.value === 'yes' }))}
                  className="w-full rounded-xl border px-3 py-2 bg-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <FieldLabel>Port of loading</FieldLabel>
                <input
                  value={lcForm.portOfLoading}
                  onChange={(e) => setLcForm((f) => ({ ...f, portOfLoading: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Port of discharge</FieldLabel>
                <input
                  value={lcForm.portOfDischarge}
                  onChange={(e) => setLcForm((f) => ({ ...f, portOfDischarge: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
            </div>
          </FormSection>
        </div>
      </TradeModal>

      <TradeModal
        isOpen={isAmendOpen}
        onClose={() => !actionLoading && setIsAmendOpen(false)}
        title="Amend Letter of Credit"
        maxWidth="max-w-md"
        actions={
          <div className="flex justify-end gap-2">
            <button type="button" disabled={actionLoading} onClick={() => setIsAmendOpen(false)} className="px-3 py-2 rounded-xl border text-xs font-semibold">
              Cancel
            </button>
            <button type="button" disabled={actionLoading} onClick={handleAmend} className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60">
              {actionLoading ? 'Saving…' : 'Save amendment'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <FieldLabel>LC amount</FieldLabel>
            <input
              type="number"
              value={amendForm.lcAmount}
              onChange={(e) => setAmendForm((f) => ({ ...f, lcAmount: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>
          <div>
            <FieldLabel>Expiry date</FieldLabel>
            <input
              type="date"
              value={amendForm.expiryDate}
              onChange={(e) => setAmendForm((f) => ({ ...f, expiryDate: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>
          <div>
            <FieldLabel>Latest shipment date</FieldLabel>
            <input
              type="date"
              value={amendForm.latestShipmentDate}
              onChange={(e) => setAmendForm((f) => ({ ...f, latestShipmentDate: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>
          <div>
            <FieldLabel>Reason</FieldLabel>
            <input
              value={amendForm.reason}
              onChange={(e) => setAmendForm((f) => ({ ...f, reason: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>
        </div>
      </TradeModal>
    </TradePage>
  );
}
