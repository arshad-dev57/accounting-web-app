'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  Eye,
  CheckCircle2,
  CreditCard,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  PauseCircle,
  XCircle,
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
  ImportCustomsClearance,
  ImportCustomsPreview,
  ImportShipment,
} from '../../../lib/import-api';
import { useCurrency } from '../../../lib/currency-context';
import { usePermissions } from '../../../lib/usePermissions';
import {
  formatImportCharge,
  formatImportDate,
  formatImportFxRate,
  formatImportMoney,
  importTodayInputValue,
  parseImportDateOnly,
  toImportDateInputValue,
} from '../../../lib/import-format';
import { FormSection, FieldLabel } from '@/components/import/ImportSelectors';

export default function ImportCustomsPage() {
  const { code: baseCurrencyCode } = useCurrency();
  const { can } = usePermissions();

  /** Accountant / Finance: dedicated customs payment OR AP / purchases / JE payment perms */
  const canRecordDutyPayment =
    can('import.customs.record_payment') ||
    can('purchases.payments.create') ||
    can('purchases.payments.edit') ||
    can('accounting.accounts_payable.create') ||
    can('accounting.accounts_payable.edit') ||
    can('accounting.journal_entries.create') ||
    can('accounting.journal_entries.post');

  const [customs, setCustoms] = useState<ImportCustomsClearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCustoms, setSelectedCustoms] = useState<ImportCustomsClearance | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shipments, setShipments] = useState<ImportShipment[]>([]);
  const [preview, setPreview] = useState<ImportCustomsPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [recalcModal, setRecalcModal] = useState(false);
  const [recalcReason, setRecalcReason] = useState('');
  const [recalcResult, setRecalcResult] = useState<{
    oldTotals: Record<string, number>;
    newTotals: Record<string, number>;
  } | null>(null);
  const [refreshTariffLoading, setRefreshTariffLoading] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<
    Array<{
      id: string;
      accountName: string;
      accountNumber: string;
      bankName: string;
      currentBalance: number;
      isCash?: boolean;
    }>
  >([]);
  const [paymentAccountsLoading, setPaymentAccountsLoading] = useState(false);
  const [refreshReasonModal, setRefreshReasonModal] = useState(false);
  const [refreshReason, setRefreshReason] = useState('');
  const [approveDifference, setApproveDifference] = useState(false);


  const [createShipmentId, setCreateShipmentId] = useState('');
  const [foreignGoodsValue, setForeignGoodsValue] = useState('');
  const [freightForeign, setFreightForeign] = useState('');
  const [insuranceForeign, setInsuranceForeign] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [exchangeRateDate, setExchangeRateDate] = useState('');
  const [cifValue, setCifValue] = useState('');
  const [dutyMode, setDutyMode] = useState<'rate' | 'fixed'>('rate');
  const [dutyRatePct, setDutyRatePct] = useState('');
  const [dutyAmount, setDutyAmount] = useState('');
  const [vatRatePct, setVatRatePct] = useState('');
  const [portHandling, setPortHandling] = useState('');
  const [clearingFee, setClearingFee] = useState('');
  const [additionalDutyRate, setAdditionalDutyRate] = useState('');
  const [regulatoryDutyRate, setRegulatoryDutyRate] = useState('');
  const [aitRate, setAitRate] = useState('');
  const [portOfEntry, setPortOfEntry] = useState('');
  const [customsOffice, setCustomsOffice] = useState('');
  const [billOfEntryNo, setBillOfEntryNo] = useState('');
  const [declarationDate, setDeclarationDate] = useState('');
  const [clearingBroker, setClearingBroker] = useState('');
  const [defaultVatFromSettings, setDefaultVatFromSettings] = useState('5');

  const [statusModal, setStatusModal] = useState<{
    status: string;
    dutyPaymentAmount?: string;
    dutyPaymentDate?: string;
    dutyPaymentMethod?: string;
    dutyPaymentRef?: string;
    dutyPaymentBank?: string;
    bankAccountId?: string;
    dutyPaymentDifferenceReason?: string;
    assessmentDate?: string;
    releaseDate?: string;
    billOfEntryNo?: string;
    holdReason?: string;
    note?: string;
  } | null>(null);
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({});
  const [statusFormError, setStatusFormError] = useState<string | null>(null);

  const money = useCallback(
    (amount?: number | null, currency?: string) =>
      formatImportMoney(amount, currency || baseCurrencyCode || 'PKR'),
    [baseCurrencyCode]
  );

  const charge = useCallback(
    (amount?: number | null, currency?: string) =>
      formatImportCharge(amount, currency || baseCurrencyCode || 'PKR'),
    [baseCurrencyCode]
  );

  const fetchCustoms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await importApi.listCustoms({ search });
      setCustoms(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load customs clearances');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustoms();
  }, [fetchCustoms]);

  useEffect(() => {
    importApi
      .listShipments({})
      .then((list) =>
        setShipments(
          list.filter((s) =>
            ['Arrived', 'At Port', 'Customs Hold', 'Customs Clearance', 'Arrived at Port', 'In Transit'].includes(
              s.shipmentStatus
            )
          )
        )
      )
      .catch(() => setShipments([]));
    importApi
      .getSettings()
      .then((s) => {
        if (s?.defaultImportVatRatePct != null) setDefaultVatFromSettings(String(s.defaultImportVatRatePct));
      })
      .catch(() => {});
  }, []);

  const previewPayload = useMemo(() => {
    if (!createShipmentId) return null;
    return {
      shipmentId: createShipmentId,
      foreignGoodsValue: foreignGoodsValue ? Number(foreignGoodsValue) : undefined,
      freightForeign: freightForeign ? Number(freightForeign) : undefined,
      insuranceForeign: insuranceForeign ? Number(insuranceForeign) : undefined,
      exchangeRateToUsd: exchangeRate ? Number(exchangeRate) : undefined,
      exchangeRateDate: exchangeRateDate || undefined,
      cifValueUsd: cifValue ? Number(cifValue) : undefined,
      customsDutyRatePct: dutyMode === 'rate' && dutyRatePct ? Number(dutyRatePct) : undefined,
      customsDutyUsd: dutyMode === 'fixed' && dutyAmount ? Number(dutyAmount) : undefined,
      importVatRatePct: vatRatePct !== '' ? Number(vatRatePct) : undefined,
      portHandlingChargesUsd: portHandling !== '' ? Number(portHandling) : undefined,
      clearingBrokerFeeUsd: clearingFee !== '' ? Number(clearingFee) : undefined,
      additionalDutyRatePct: additionalDutyRate !== '' ? Number(additionalDutyRate) : undefined,
      regulatoryDutyRatePct: regulatoryDutyRate !== '' ? Number(regulatoryDutyRate) : undefined,
      advanceIncomeTaxRatePct: aitRate !== '' ? Number(aitRate) : undefined,
      portOfEntry: portOfEntry || undefined,
      customsOffice: customsOffice || undefined,
      customsBroker: clearingBroker || undefined,
    };
  }, [
    createShipmentId,
    foreignGoodsValue,
    freightForeign,
    insuranceForeign,
    exchangeRate,
    exchangeRateDate,
    cifValue,
    dutyMode,
    dutyRatePct,
    dutyAmount,
    vatRatePct,
    portHandling,
    clearingFee,
    additionalDutyRate,
    regulatoryDutyRate,
    aitRate,
    portOfEntry,
    customsOffice,
    clearingBroker,
  ]);

  useEffect(() => {
    if (!previewPayload?.shipmentId || !isCreateOpen) return;
    const t = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const p = await importApi.previewCustoms({
          ...previewPayload,
          // For live preview only — still require VAT on save
          importVatRatePct:
            previewPayload.importVatRatePct !== undefined
              ? previewPayload.importVatRatePct
              : Number(defaultVatFromSettings),
        });
        setPreview(p);
        setFormError(null);
        if (!foreignGoodsValue) setForeignGoodsValue(String(p.foreignGoodsValue ?? ''));
        if (!freightForeign) setFreightForeign(String(p.freightForeign ?? ''));
        if (!insuranceForeign) setInsuranceForeign(String(p.insuranceForeign ?? ''));
        if (!exchangeRate) setExchangeRate(String(p.exchangeRate ?? ''));
        if (!exchangeRateDate && p.exchangeRateDate) {
          setExchangeRateDate(String(p.exchangeRateDate).slice(0, 10));
        }
        if (!cifValue) setCifValue(String(p.cifValueUsd ?? ''));
        if (!portOfEntry && p.portOfEntry) setPortOfEntry(p.portOfEntry);
        if (!customsOffice && p.customsOffice) setCustomsOffice(p.customsOffice || '');
        if (!clearingBroker && p.customsBroker) setClearingBroker(p.customsBroker || '');
        if (!vatRatePct && p.defaultVatRatePct != null) setVatRatePct(String(p.defaultVatRatePct));
        if (!dutyRatePct && p.customsDutyRatePct != null) setDutyRatePct(String(p.customsDutyRatePct));
      } catch (err: any) {
        setPreview(null);
        setFormError(err?.response?.data?.message || err.message || 'Preview failed');
      } finally {
        setPreviewLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewPayload, isCreateOpen, defaultVatFromSettings]);

  const resetCreateForm = () => {
    setCreateShipmentId('');
    setForeignGoodsValue('');
    setFreightForeign('');
    setInsuranceForeign('');
    setExchangeRate('');
    setExchangeRateDate('');
    setCifValue('');
    setDutyMode('rate');
    setDutyRatePct('');
    setDutyAmount('');
    setVatRatePct('');
    setPortHandling('');
    setClearingFee('');
    setAdditionalDutyRate('');
    setRegulatoryDutyRate('');
    setAitRate('');
    setPortOfEntry('');
    setCustomsOffice('');
    setBillOfEntryNo('');
    setDeclarationDate('');
    setClearingBroker('');
    setPreview(null);
    setFieldErrors({});
    setFormError(null);
  };

  const handleCreateCustoms = async () => {
    const errs: Record<string, string> = {};
    if (!createShipmentId) errs.shipmentId = 'Select an arrived shipment';
    if (!cifValue.trim() || Number(cifValue) <= 0) errs.cifValueUsd = 'CIF value is required and must be greater than 0';
    if (!exchangeRate.trim() || Number(exchangeRate) <= 0) errs.exchangeRateToUsd = 'Customs exchange rate is required';
    if (!exchangeRateDate) errs.exchangeRateDate = 'Rate date is required';
    else {
      const rd = parseImportDateOnly(exchangeRateDate);
      const today = parseImportDateOnly(new Date());
      if (rd && today && rd.getTime() > today.getTime()) {
        errs.exchangeRateDate = 'Rate date must not be in the future';
      }
    }
    if (vatRatePct === '' || vatRatePct == null) errs.importVatRatePct = 'VAT rate is required';
    if (dutyMode === 'rate' && !dutyRatePct.trim() && !(preview?.lines?.length)) {
      errs.customsDutyRatePct = 'Duty rate % or fixed duty amount is required';
    }
    if (dutyMode === 'fixed' && !dutyAmount.trim()) {
      errs.customsDutyUsd = 'Duty rate % or fixed duty amount is required';
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setFormError(Object.values(errs)[0]);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const created = await importApi.createCustoms({
        shipmentId: createShipmentId,
        foreignGoodsValue: Number(foreignGoodsValue),
        freightForeign: Number(freightForeign || 0),
        insuranceForeign: Number(insuranceForeign || 0),
        exchangeRateToUsd: Number(exchangeRate),
        exchangeRateDate,
        cifValueUsd: Number(cifValue),
        customsDutyRatePct: dutyMode === 'rate' && dutyRatePct ? Number(dutyRatePct) : undefined,
        customsDutyUsd: dutyMode === 'fixed' && dutyAmount ? Number(dutyAmount) : undefined,
        importVatRatePct: Number(vatRatePct),
        portHandlingChargesUsd: portHandling !== '' ? Number(portHandling) : undefined,
        clearingBrokerFeeUsd: clearingFee !== '' ? Number(clearingFee) : undefined,
        additionalDutyRatePct: additionalDutyRate !== '' ? Number(additionalDutyRate) : undefined,
        regulatoryDutyRatePct: regulatoryDutyRate !== '' ? Number(regulatoryDutyRate) : undefined,
        advanceIncomeTaxRatePct: aitRate !== '' ? Number(aitRate) : undefined,
        portOfEntry: portOfEntry || undefined,
        customsOffice: customsOffice || undefined,
        billOfEntryNo: billOfEntryNo || undefined,
        declarationDate: declarationDate || undefined,
        customsBroker: clearingBroker || undefined,
      });
      setIsCreateOpen(false);
      resetCreateForm();
      setCustoms((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
      await fetchCustoms();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to create customs entry';
      const field = err?.response?.data?.field;
      setFormError(msg);
      if (field) setFieldErrors((e) => ({ ...e, [field]: msg }));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (row: ImportCustomsClearance) => {
    setSelectedCustoms(row);
    setDetailLoading(true);
    setRecalcResult(null);
    try {
      const full = await importApi.getCustoms(row.id);
      setSelectedCustoms(full);
    } catch {
      /* keep list row */
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRecalculateRate = async () => {
    if (!selectedCustoms) return;
    if (!recalcReason.trim()) {
      setError('Reason is required to recalculate with the current PO rate');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const updated = await importApi.recalculateCustomsRate(selectedCustoms.id, {
        reason: recalcReason.trim(),
      });
      setSelectedCustoms(updated);
      setCustoms((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (updated.recalculation) {
        setRecalcResult({
          oldTotals: updated.recalculation.oldTotals,
          newTotals: updated.recalculation.newTotals,
        });
      }
      setRecalcModal(false);
      setRecalcReason('');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to recalculate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshTariff = async () => {
    if (!selectedCustoms) return;
    if (!refreshReason.trim()) {
      setError('Reason is required to refresh tariff data');
      return;
    }
    setRefreshTariffLoading(true);
    setError(null);
    try {
      const updated = await importApi.refreshCustomsTariff(selectedCustoms.id, {
        reason: refreshReason.trim(),
      });
      setSelectedCustoms(updated);
      setCustoms((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (updated.tariffRefresh) {
        setRecalcResult({
          oldTotals: {
            customsDutyUsd: Number(updated.tariffRefresh.oldTotals.customsDutyUsd || 0),
            importVatUsd: Number(updated.tariffRefresh.oldTotals.importVatUsd || 0),
            totalCustomsPayableUsd: Number(
              updated.tariffRefresh.oldTotals.totalCustomsPayableUsd || 0
            ),
          },
          newTotals: {
            customsDutyUsd: Number(updated.tariffRefresh.newTotals.customsDutyUsd || 0),
            importVatUsd: Number(updated.tariffRefresh.newTotals.importVatUsd || 0),
            totalCustomsPayableUsd: Number(
              updated.tariffRefresh.newTotals.totalCustomsPayableUsd || 0
            ),
          },
        });
      }
      setRefreshReasonModal(false);
      setRefreshReason('');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to refresh tariff data');
    } finally {
      setRefreshTariffLoading(false);
    }
  };

  const loadPaymentAccounts = async (method?: string) => {
    setPaymentAccountsLoading(true);
    try {
      const list = await importApi.listCustomsPaymentAccounts({ method: method || undefined });
      setPaymentAccounts(Array.isArray(list) ? list : []);
      if (!Array.isArray(list) || list.length === 0) {
        setStatusErrors((e) => ({
          ...e,
          bankAccountId:
            'No matching bank/cash accounts found for this company and payment method. Add them under Accounting → Bank Accounts.',
        }));
      } else {
        setStatusErrors((e) => {
          const next = { ...e };
          if (next.bankAccountId?.includes('No matching')) delete next.bankAccountId;
          return next;
        });
      }
    } catch (err: any) {
      setPaymentAccounts([]);
      setStatusErrors((e) => ({
        ...e,
        bankAccountId:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load bank/cash accounts',
      }));
    } finally {
      setPaymentAccountsLoading(false);
    }
  };

  const submitStatus = async () => {
    if (!selectedCustoms || !statusModal) return;
    const errs: Record<string, string> = {};
    const payable = Number(selectedCustoms.payableAmount ?? selectedCustoms.totalCustomsPayableUsd ?? 0);
    const paid = Number(selectedCustoms.totalPaid ?? 0);
    const balance = Number(
      selectedCustoms.balanceDue != null ? selectedCustoms.balanceDue : Math.max(0, payable - paid)
    );

    if (statusModal.status === 'Assessed') {
      if (!statusModal.assessmentDate) errs.assessmentDate = 'Assessment date is required';
      else {
        const ad = parseImportDateOnly(statusModal.assessmentDate);
        const today = parseImportDateOnly(new Date());
        const created = parseImportDateOnly(selectedCustoms.createdAt);
        if (ad && today && ad.getTime() > today.getTime()) {
          errs.assessmentDate = 'Assessment date must not be in the future';
        }
        if (ad && created && ad.getTime() < created.getTime()) {
          errs.assessmentDate = 'Assessment date must not be before the entry creation date';
        }
      }
    }

    if (statusModal.status === 'Duty Paid' || statusModal.status === 'Partially Paid') {
      const amt = Number(statusModal.dutyPaymentAmount);
      if (!statusModal.dutyPaymentAmount || !(amt > 0)) {
        errs.dutyPaymentAmount = 'Payment amount is required';
      }
      if (!statusModal.dutyPaymentMethod) errs.dutyPaymentMethod = 'Payment method is required';
      if (!statusModal.dutyPaymentRef?.trim()) errs.dutyPaymentRef = 'Payment reference is required';
      if (!statusModal.bankAccountId) errs.bankAccountId = 'Bank / cash account is required';
      if (!statusModal.dutyPaymentDate) errs.dutyPaymentDate = 'Payment date is required';
      else {
        const pd = parseImportDateOnly(statusModal.dutyPaymentDate);
        const today = parseImportDateOnly(new Date());
        const assessmentDate = parseImportDateOnly(selectedCustoms.assessmentDate);
        if (pd && today && pd.getTime() > today.getTime()) {
          errs.dutyPaymentDate = 'Duty payment date must not be in the future';
        }
        if (pd && assessmentDate && pd.getTime() < assessmentDate.getTime()) {
          errs.dutyPaymentDate = 'Duty payment date must not be before the assessment date';
        }
      }
      if (amt > 0 && Math.abs(amt - balance) > 0.009 && !statusModal.dutyPaymentDifferenceReason?.trim()) {
        errs.dutyPaymentDifferenceReason =
          'Difference reason is required when the amount differs from the remaining payable balance';
      }
    }
    if (statusModal.status === 'On Hold/Examination' && !statusModal.holdReason?.trim()) {
      errs.holdReason = 'Hold reason is required';
    }
    if (statusModal.status === 'Released/Cleared') {
      if (!statusModal.billOfEntryNo?.trim() && !selectedCustoms.declarationNumber) {
        errs.billOfEntryNo = 'Official declaration number (BOE/GD) must be entered before Released/Cleared';
      }
      if (!statusModal.assessmentDate && !selectedCustoms.assessmentDate) {
        errs.assessmentDate = 'Assessment date is required before release';
      }
    }
    setStatusErrors(errs);
    if (Object.keys(errs).length) {
      setStatusFormError(Object.values(errs)[0]);
      return;
    }

    setActionLoading(true);
    setStatusFormError(null);
    try {
      let updated: ImportCustomsClearance;
      if (statusModal.status === 'Duty Paid' || statusModal.status === 'Partially Paid') {
        updated = await importApi.recordCustomsDutyPayment(selectedCustoms.id, {
          dutyPaymentAmount: Number(statusModal.dutyPaymentAmount),
          dutyPaymentDate: statusModal.dutyPaymentDate,
          dutyPaymentMethod: statusModal.dutyPaymentMethod,
          dutyPaymentRef: statusModal.dutyPaymentRef,
          bankAccountId: statusModal.bankAccountId,
          dutyPaymentDifferenceReason: statusModal.dutyPaymentDifferenceReason || undefined,
          approveDifference: approveDifference || undefined,
        });
      } else {
        updated = await importApi.updateCustomsStatus(selectedCustoms.id, statusModal.status, {
          assessmentDate: statusModal.assessmentDate || undefined,
          releaseDate: statusModal.releaseDate || undefined,
          billOfEntryNo: statusModal.billOfEntryNo || undefined,
          holdReason: statusModal.holdReason || undefined,
          reason: statusModal.note || statusModal.holdReason || undefined,
        });
      }
      setSelectedCustoms(updated);
      setCustoms((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setStatusModal(null);
      setApproveDifference(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to update status';
      const field = err?.response?.data?.field;
      setStatusFormError(msg);
      if (field) setStatusErrors((e) => ({ ...e, [field]: msg }));
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = customs.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (c.declarationDisplay || c.declarationNumber || c.entryNumber || '').toLowerCase().includes(q) ||
      (c.poRef || '').toLowerCase().includes(q) ||
      (c.shipmentRef || '').toLowerCase().includes(q) ||
      (c.portOfEntry || '').toLowerCase().includes(q)
    );
  });

  const status = selectedCustoms?.clearanceStatus || '';
  const cur = selectedCustoms?.baseCurrencyCode || baseCurrencyCode || 'PKR';

  return (
    <TradePage>
      <TradePageHeader
        title="Customs Clearance & Port Formalities"
        subtitle="Bill of Entry / GD assessment, HS tariffs, VAT, duty payment and release"
        moduleName="Import Operations"
        backHref="/import/dashboard"
        icon={<ShieldCheck className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchCustoms}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            {can('import.customs.create') && (
            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Create Customs Clearance
            </button>
            )}
          </div>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <TradeCard>
        <div className="relative w-full sm:w-80 mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search declaration, PO, shipment, port…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#014582]" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">No customs clearance records found.</div>
        ) : (
          <TradeTable>
            <TradeTableHeader
              columns={[
                'Internal / Declaration',
                'PO / Shipment',
                'Port of Entry',
                'Date',
                `Duty (${baseCurrencyCode})`,
                `VAT (${baseCurrencyCode})`,
                `Total (${baseCurrencyCode})`,
                'Status',
                '',
              ]}
            />
            <TradeTableBody>
              {filtered.map((c) => (
                <TradeTableRow key={c.id}>
                  <TradeTableCell>
                    <span className="font-bold text-[#014582] block">{c.entryNumber || c.internalRef}</span>
                    <span className="text-[10px] text-gray-500">
                      {c.declarationDisplay || c.declarationNumber || 'Not yet declared'}
                    </span>
                    {c.fxReviewFlag ? (
                      <span className="block text-[10px] text-amber-700">FX review needed</span>
                    ) : null}
                  </TradeTableCell>
                  <TradeTableCell className="text-xs">
                    <div className="font-semibold">{c.poRef || '—'}</div>
                    <div className="text-gray-500">{c.shipmentRef || '—'}</div>
                  </TradeTableCell>
                  <TradeTableCell className="text-xs truncate max-w-[160px]">
                    {c.portLabel || c.portOfEntry || '—'}
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-600">{formatImportDate(c.declarationDate)}</TradeTableCell>
                  <TradeTableCell className="font-medium">
                    {money(c.customsDutyUsd, c.baseCurrencyCode)}
                  </TradeTableCell>
                  <TradeTableCell>{money(c.importVatUsd ?? c.vatUsd, c.baseCurrencyCode)}</TradeTableCell>
                  <TradeTableCell className="font-bold">
                    {money(c.totalCustomsPayableUsd, c.baseCurrencyCode)}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={c.clearanceStatus} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button type="button" onClick={() => openDetail(c)} className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50">
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
        isOpen={Boolean(selectedCustoms)}
        onClose={() => setSelectedCustoms(null)}
        title={selectedCustoms?.entryNumber || 'Customs Clearance'}
        subtitle={`Declaration: ${selectedCustoms?.declarationDisplay || 'Not yet declared'} · ${
          selectedCustoms?.portLabel || selectedCustoms?.portOfEntry || '—'
        }`}
        actions={
          selectedCustoms && (
            <div className="flex flex-wrap items-center gap-2">
              {status === 'Draft' &&
                (can('import.customs.create') ||
                  can('import.customs.edit') ||
                  can('import.customs.assess')) && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setStatusModal({ status: 'Under Assessment' })}
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold"
                >
                  Send for Assessment
                </button>
              )}
              {status === 'Under Assessment' && can('import.customs.assess') && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      setStatusModal({
                        status: 'Assessed',
                        assessmentDate: importTodayInputValue(),
                        billOfEntryNo:
                          selectedCustoms.declarationNumber ||
                          (selectedCustoms.billOfEntryNo !== selectedCustoms.entryNumber
                            ? selectedCustoms.billOfEntryNo || ''
                            : ''),
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm Assessment
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      setStatusModal({
                        status: 'Draft',
                        note: '',
                      })
                    }
                    className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" /> Send Back
                  </button>
                </>
              )}
              {status === 'Under Assessment' && !can('import.customs.assess') && (
                <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  Waiting for an assessor (Customs Assessment → Approve permission).
                </span>
              )}
              {status === 'Assessed' &&
                (can('import.customs.create') ||
                  can('import.customs.edit') ||
                  can('import.customs.assess') ||
                  canRecordDutyPayment) && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={async () => {
                    setActionLoading(true);
                    setError(null);
                    try {
                      const updated = await importApi.updateCustomsStatus(
                        selectedCustoms.id,
                        'Pending Payment'
                      );
                      setSelectedCustoms(updated);
                      setCustoms((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                    } catch (err: any) {
                      setError(
                        err?.response?.data?.message ||
                          err.message ||
                          'Failed to send for duty payment'
                      );
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1"
                >
                  <CreditCard className="w-4 h-4" /> Send for Duty Payment
                </button>
              )}
              {(status === 'Pending Payment' || status === 'Partially Paid') &&
                canRecordDutyPayment && (
                <Link
                  href="/import/approvals"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1"
                >
                  <CreditCard className="w-4 h-4" /> Record on Approvals
                </Link>
              )}
              {(status === 'Pending Payment' || status === 'Partially Paid') &&
                !canRecordDutyPayment && (
                <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  Waiting for a payer with Customs Duty Payment permission (Import Approvals).
                </span>
              )}
              {status === 'Duty Paid' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={async () => {
                    setActionLoading(true);
                    setError(null);
                    try {
                      const updated = await importApi.submitCustomsForApproval(selectedCustoms.id);
                      setSelectedCustoms(updated);
                      setCustoms((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                    } catch (err: any) {
                      setError(err?.response?.data?.message || err.message || 'Failed to submit for approval');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1"
                >
                  <ShieldCheck className="w-4 h-4" /> Send for Approval
                </button>
              )}
              {status === 'Pending Approval' && can('import.customs.approve') && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={async () => {
                      setActionLoading(true);
                      setError(null);
                      try {
                        const updated = await importApi.approveCustomsClearance(selectedCustoms.id);
                        setSelectedCustoms(updated);
                        setCustoms((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                      } catch (err: any) {
                        setError(err?.response?.data?.message || err.message || 'Approve failed');
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={async () => {
                      const reason =
                        window.prompt('Optional reason for rejecting (sent back to Duty Paid):') ||
                        undefined;
                      setActionLoading(true);
                      setError(null);
                      try {
                        const updated = await importApi.rejectCustomsApproval(
                          selectedCustoms.id,
                          reason ? { reason } : {}
                        );
                        setSelectedCustoms(updated);
                        setCustoms((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                      } catch (err: any) {
                        setError(err?.response?.data?.message || err.message || 'Reject failed');
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </>
              )}
              {status === 'Pending Approval' && !can('import.customs.approve') && (
                <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  Waiting for an approver (Customs Clearance → Approve permission).
                </span>
              )}
              {status === 'Approved' && can('import.customs.release') && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() =>
                    setStatusModal({
                      status: 'Released/Cleared',
                      releaseDate: importTodayInputValue(),
                      assessmentDate: selectedCustoms.assessmentDate
                        ? toImportDateInputValue(selectedCustoms.assessmentDate)
                        : importTodayInputValue(),
                      billOfEntryNo: selectedCustoms.declarationNumber || selectedCustoms.billOfEntryNo || '',
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" /> Release / Clear
                </button>
              )}
              {!['Cancelled', 'Released/Cleared'].includes(status) && (
                <>
                  {can('import.customs.hold') && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setStatusModal({ status: 'On Hold/Examination', holdReason: '' })}
                    className="px-3.5 py-2 rounded-xl border text-amber-700 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <PauseCircle className="w-4 h-4" /> Put on Hold
                  </button>
                  )}
                  {can('import.customs.cancel') && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setStatusModal({ status: 'Cancelled', note: '' })}
                    className="px-3.5 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                  )}
                </>
              )}
            </div>
          )
        }
      >
        {selectedCustoms && (
          <div className="space-y-5 text-xs">
            {detailLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading detail…
              </div>
            )}
            {selectedCustoms.portCountryWarning && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                {selectedCustoms.portCountryWarning}
              </div>
            )}
            {selectedCustoms.fxReviewFlag && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                {selectedCustoms.fxReviewNote || 'FX rate or currency differs from the linked PO — review recommended.'}
              </div>
            )}

            <div className="p-4 rounded-xl bg-gray-50 border grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Internal ref</span>
                <span className="font-mono font-bold">{selectedCustoms.entryNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Declaration (BOE / GD)</span>
                <span className="font-mono font-bold">
                  {selectedCustoms.declarationDisplay || 'Not yet declared'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Linked PO</span>
                {selectedCustoms.importPoId ? (
                  <Link href={`/import/purchase-orders?po=${selectedCustoms.importPoId}`} className="font-semibold text-blue-700 hover:underline">
                    {selectedCustoms.poRef || selectedCustoms.importPoId}
                  </Link>
                ) : (
                  '—'
                )}
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Linked shipment</span>
                {selectedCustoms.shipmentId ? (
                  <Link href={`/import/shipments`} className="font-semibold text-blue-700 hover:underline">
                    {selectedCustoms.shipmentRef}
                  </Link>
                ) : (
                  '—'
                )}
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 block text-[10px] uppercase mb-1">Linked PI / LC</span>
                <div className="flex flex-wrap gap-2">
                  {(selectedCustoms.linkedProformas || []).map((pi) => (
                    <Link key={pi.id} href="/import/proforma-invoices" className="px-2 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 font-semibold">
                      {pi.piNumber} · {pi.status}
                    </Link>
                  ))}
                  {(selectedCustoms.linkedLcs || []).map((lc) => (
                    <Link key={lc.id} href="/import/finance" className="px-2 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-100 font-semibold">
                      {lc.lcNumber} · {lc.status}
                    </Link>
                  ))}
                  {!selectedCustoms.linkedProformas?.length && !selectedCustoms.linkedLcs?.length ? '—' : null}
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 block text-[10px] uppercase">CIF ({cur})</span>
                <span className="font-bold">{money(selectedCustoms.cifValueUsd, cur)}</span>
                <span className="block text-[11px] text-gray-600 mt-0.5">
                  {formatImportFxRate({
                    label: 'Customs rate',
                    foreignCurrency: selectedCustoms.declarationCurrency || 'USD',
                    baseCurrency: cur,
                    rate: selectedCustoms.exchangeRateToUsd,
                    rateDate: selectedCustoms.exchangeRateDate,
                    source: selectedCustoms.rateSourceLabel || selectedCustoms.rateSource,
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Assessment date</span>
                <span className="font-bold">{formatImportDate(selectedCustoms.assessmentDate)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Payment date(s)</span>
                <span className="font-bold">
                  {(selectedCustoms.payments || []).length
                    ? (selectedCustoms.payments || [])
                        .map((p) => formatImportDate(p.paymentDate))
                        .join(', ')
                    : selectedCustoms.dutyPaymentDate
                      ? formatImportDate(selectedCustoms.dutyPaymentDate)
                      : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Release date</span>
                <span className="font-bold">{formatImportDate(selectedCustoms.releaseDate)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">HS Codes Tariff</span>
                <span className="font-mono font-bold">
                  {selectedCustoms.hsTariffDisplay || selectedCustoms.tariffSummary || '—'}
                </span>
                {selectedCustoms.canRefreshTariff ? (
                  <button
                    type="button"
                    disabled={refreshTariffLoading}
                    onClick={() => {
                      setRefreshReason('');
                      setRefreshReasonModal(true);
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-[10px] font-bold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh tariff data
                  </button>
                ) : null}
              </div>
              {selectedCustoms.lastJournalEntryNumber ? (
                <div className="col-span-2">
                  <span className="text-gray-400 block text-[10px] uppercase">Posted journal entry</span>
                  <Link
                    href={`/accounting/journal-entries?search=${encodeURIComponent(selectedCustoms.lastJournalEntryNumber)}`}
                    className="font-bold text-blue-700 hover:underline"
                  >
                    {selectedCustoms.lastJournalEntryNumber}
                  </Link>
                  {selectedCustoms.balanceDue != null && selectedCustoms.balanceDue > 0.009 ? (
                    <span className="ml-2 text-amber-700">
                      Partially paid · balance {money(selectedCustoms.balanceDue, cur)}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            {selectedCustoms.rateStale ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    Customs rate ({Number(selectedCustoms.exchangeRateToUsd)}) differs from the current PO
                    rate ({Number(selectedCustoms.currentPoExchangeRate)}).
                    {!selectedCustoms.canRecalculateRate ? (
                      <span className="block text-[10px] mt-1 text-amber-800">
                        Recalculate is only available while status is Under Assessment.
                      </span>
                    ) : null}
                  </div>
                </div>
                {selectedCustoms.canRecalculateRate ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      setRecalcModal(true);
                      setRecalcReason('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-800 text-white text-[11px] font-bold"
                  >
                    Recalculate with current rate
                  </button>
                ) : null}
              </div>
            ) : null}

            {recalcResult ? (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1">
                <div className="font-bold text-blue-900">Recalculation result</div>
                <div className="flex justify-between gap-4">
                  <span>Duty</span>
                  <span>
                    {money(recalcResult.oldTotals.customsDutyUsd, cur)} →{' '}
                    {money(recalcResult.newTotals.customsDutyUsd, cur)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>VAT</span>
                  <span>
                    {money(recalcResult.oldTotals.importVatUsd, cur)} →{' '}
                    {money(recalcResult.newTotals.importVatUsd, cur)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 font-semibold">
                  <span>Total</span>
                  <span>
                    {money(recalcResult.oldTotals.totalCustomsPayableUsd, cur)} →{' '}
                    {money(recalcResult.newTotals.totalCustomsPayableUsd, cur)}
                  </span>
                </div>
              </div>
            ) : null}

            {(selectedCustoms.lines || []).length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Duty by HS line</h4>
                <table className="w-full text-xs border rounded-xl overflow-hidden">
                  <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                    <tr>
                      <th className="text-left px-2 py-2">Product</th>
                      <th className="text-left px-2 py-2">HS</th>
                      <th className="text-right px-2 py-2">Assessable</th>
                      <th className="text-right px-2 py-2">Duty %</th>
                      <th className="text-left px-2 py-2">Source</th>
                      <th className="text-right px-2 py-2">Duty</th>
                      <th className="text-right px-2 py-2">VAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustoms.lines!.map((ln, idx) => (
                      <tr key={ln.id || idx} className="border-t">
                        <td className="px-2 py-2 font-semibold">{ln.productName}</td>
                        <td className="px-2 py-2 font-mono">{ln.hsCode}</td>
                        <td className="px-2 py-2 text-right">{money(ln.assessableValueBase, cur)}</td>
                        <td className="px-2 py-2 text-right">{ln.dutyRatePct}%</td>
                        <td className="px-2 py-2 text-[10px] text-gray-600">
                          {ln.dutySource ||
                            (ln.rateOverride
                              ? `Manual override${ln.overrideReason ? ` (${ln.overrideReason})` : ''}`
                              : 'Tariff table')}
                        </td>
                        <td className="px-2 py-2 text-right">{money(ln.dutyAmountBase, cur)}</td>
                        <td className="px-2 py-2 text-right">{money(ln.vatAmountBase, cur)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1.5">
              <div className="flex justify-between"><span>Customs duty</span><span className="font-bold">{money(selectedCustoms.customsDutyUsd, cur)}</span></div>
              <div className="flex justify-between"><span>Additional duty</span><span>{charge(selectedCustoms.additionalDutyUsd, cur)}</span></div>
              <div className="flex justify-between"><span>Regulatory duty</span><span>{charge(selectedCustoms.regulatoryDutyUsd, cur)}</span></div>
              <div className="flex justify-between"><span>Import VAT ({selectedCustoms.importVatRatePct}%)</span><span className="font-bold">{money(selectedCustoms.importVatUsd ?? selectedCustoms.vatUsd, cur)}</span></div>
              <div className="flex justify-between"><span>Advance income tax</span><span>{charge(selectedCustoms.advanceIncomeTaxUsd, cur)}</span></div>
              <div className="flex justify-between"><span>Port handling</span><span>{charge(selectedCustoms.portHandlingChargesUsd ?? selectedCustoms.portHandlingUsd, cur)}</span></div>
              <div className="flex justify-between"><span>Clearing agency fee</span><span>{charge(selectedCustoms.clearingBrokerFeeUsd ?? selectedCustoms.clearingAgencyFeeUsd, cur)}</span></div>
              <div className="flex justify-between"><span>Demurrage</span><span>{charge(selectedCustoms.demurrageChargesUsd, cur)}</span></div>
              <div className="flex justify-between pt-2 border-t border-emerald-200 text-sm">
                <span className="font-bold text-emerald-900">Total customs charges</span>
                <span className="font-extrabold text-emerald-900">{money(selectedCustoms.totalCustomsPayableUsd, cur)}</span>
              </div>
            </div>

            {(selectedCustoms.auditTrail || []).length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Audit trail</h4>
                <div className="space-y-2">
                  {selectedCustoms.auditTrail!.map((row) => (
                    <div key={row.id} className="p-2.5 rounded-lg border bg-gray-50 flex justify-between gap-2">
                      <div>
                        <div className="font-semibold">{row.label}</div>
                        {row.reason ? <div className="text-[10px] text-gray-600">Note: {row.reason}</div> : null}
                        <div className="text-[10px] text-gray-500">{row.userLabel || 'System'}</div>
                      </div>
                      <div className="text-[10px] text-gray-500">{formatImportDate(row.createdAt)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => !saving && setIsCreateOpen(false)}
        title="Create Customs Clearance"
        maxWidth="max-w-3xl"
        actions={
          <div className="flex justify-end gap-2">
            <button type="button" disabled={saving} onClick={() => setIsCreateOpen(false)} className="px-3 py-2 rounded-xl border text-xs font-semibold">
              Cancel
            </button>
            <button type="button" disabled={saving || previewLoading} onClick={handleCreateCustoms} className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60">
              {saving ? 'Creating…' : 'Create Draft Entry'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
            </div>
          )}
          {preview?.portCountryWarning && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">{preview.portCountryWarning}</div>
          )}

          <FormSection title="Shipment">
            <FieldLabel required>Shipment</FieldLabel>
            <select
              value={createShipmentId}
              onChange={(e) => {
                setCreateShipmentId(e.target.value);
                setForeignGoodsValue('');
                setFreightForeign('');
                setInsuranceForeign('');
                setExchangeRate('');
                setExchangeRateDate('');
                setCifValue('');
                setPreview(null);
              }}
              className="w-full rounded-xl border px-3 py-2 bg-white"
            >
              <option value="">Select shipment…</option>
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shipmentNumber} — {s.shipmentStatus} {s.poRef ? `· ${s.poRef}` : ''}
                </option>
              ))}
            </select>
            {fieldErrors.shipmentId && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.shipmentId}</p>}
          </FormSection>

          <FormSection title="CIF & exchange rate" subtitle={preview?.calculationNote || preview?.rateSource || ''}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Goods value ({preview?.currency || 'FCY'})</FieldLabel>
                <input type="number" value={foreignGoodsValue} onChange={(e) => setForeignGoodsValue(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Freight ({preview?.currency || 'FCY'})</FieldLabel>
                <input type="number" value={freightForeign} onChange={(e) => setFreightForeign(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Insurance ({preview?.currency || 'FCY'})</FieldLabel>
                <input type="number" value={insuranceForeign} onChange={(e) => setInsuranceForeign(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div>
                <FieldLabel required>Customs exchange rate</FieldLabel>
                <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
                {fieldErrors.exchangeRateToUsd && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.exchangeRateToUsd}</p>}
                {preview?.rateSource && <p className="text-[10px] text-gray-500 mt-1">Source: {preview.rateSource}</p>}
              </div>
              <div>
                <FieldLabel required>Rate date</FieldLabel>
                <input type="date" value={exchangeRateDate} onChange={(e) => setExchangeRateDate(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
                {fieldErrors.exchangeRateDate && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.exchangeRateDate}</p>}
              </div>
              <div>
                <FieldLabel required>CIF value ({preview?.baseCurrencyCode || baseCurrencyCode})</FieldLabel>
                <input type="number" value={cifValue} onChange={(e) => setCifValue(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
                {fieldErrors.cifValueUsd && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.cifValueUsd}</p>}
              </div>
            </div>
          </FormSection>

          <FormSection title="Duty & VAT">
            <div className="flex gap-3 mb-2">
              <label className="inline-flex items-center gap-1.5">
                <input type="radio" checked={dutyMode === 'rate'} onChange={() => setDutyMode('rate')} /> Duty rate %
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input type="radio" checked={dutyMode === 'fixed'} onChange={() => setDutyMode('fixed')} /> Fixed duty amount
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {dutyMode === 'rate' ? (
                <div>
                  <FieldLabel>Duty rate % (header / fallback)</FieldLabel>
                  <input type="number" value={dutyRatePct} onChange={(e) => setDutyRatePct(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
                  {fieldErrors.customsDutyRatePct && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.customsDutyRatePct}</p>}
                  <p className="text-[10px] text-gray-500 mt-1">Per-line HS tariff rates apply when available.</p>
                </div>
              ) : (
                <div>
                  <FieldLabel>Fixed duty amount ({baseCurrencyCode})</FieldLabel>
                  <input type="number" value={dutyAmount} onChange={(e) => setDutyAmount(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
                  {fieldErrors.customsDutyUsd && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.customsDutyUsd}</p>}
                </div>
              )}
              <div>
                <FieldLabel required>Import VAT rate %</FieldLabel>
                <input type="number" value={vatRatePct} onChange={(e) => setVatRatePct(e.target.value)} className="w-full rounded-xl border px-3 py-2" placeholder={`Settings default ${defaultVatFromSettings}`} />
                {fieldErrors.importVatRatePct && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.importVatRatePct}</p>}
              </div>
              <div>
                <FieldLabel>Additional duty %</FieldLabel>
                <input type="number" value={additionalDutyRate} onChange={(e) => setAdditionalDutyRate(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Regulatory duty %</FieldLabel>
                <input type="number" value={regulatoryDutyRate} onChange={(e) => setRegulatoryDutyRate(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Advance income tax %</FieldLabel>
                <input type="number" value={aitRate} onChange={(e) => setAitRate(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Port handling ({baseCurrencyCode})</FieldLabel>
                <input type="number" value={portHandling} onChange={(e) => setPortHandling(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Clearing broker fee ({baseCurrencyCode})</FieldLabel>
                <input type="number" value={clearingFee} onChange={(e) => setClearingFee(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
            </div>
          </FormSection>

          <FormSection title="Declaration">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Official declaration no. (optional at draft)</FieldLabel>
                <input value={billOfEntryNo} onChange={(e) => setBillOfEntryNo(e.target.value)} className="w-full rounded-xl border px-3 py-2" placeholder="Customs-issued BOE / GD" />
              </div>
              <div>
                <FieldLabel>Declaration date</FieldLabel>
                <input type="date" value={declarationDate} onChange={(e) => setDeclarationDate(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Customs office</FieldLabel>
                <input value={customsOffice} onChange={(e) => setCustomsOffice(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Port of entry</FieldLabel>
                <input value={portOfEntry} onChange={(e) => setPortOfEntry(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
              <div className="col-span-2">
                <FieldLabel>Clearing broker</FieldLabel>
                <input value={clearingBroker} onChange={(e) => setClearingBroker(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </div>
            </div>
          </FormSection>

          <div className="p-3 rounded-xl bg-slate-50 border space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>Live assessment preview</span>
              {previewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            </div>
            {preview ? (
              <>
                <div className="flex justify-between"><span>CIF</span><span>{money(preview.cifValueUsd, preview.baseCurrencyCode)}</span></div>
                <div className="flex justify-between"><span>Duty</span><span>{money(preview.customsDutyUsd, preview.baseCurrencyCode)}</span></div>
                <div className="flex justify-between"><span>VAT</span><span>{money(preview.importVatUsd, preview.baseCurrencyCode)}</span></div>
                <div className="flex justify-between"><span>Additional / RD / AIT</span><span>{money((preview.additionalDutyUsd || 0) + (preview.regulatoryDutyUsd || 0) + (preview.advanceIncomeTaxUsd || 0), preview.baseCurrencyCode)}</span></div>
                <div className="flex justify-between pt-1 border-t font-bold">
                  <span>Total</span>
                  <span>{money(preview.totalCustomsPayableUsd, preview.baseCurrencyCode)}</span>
                </div>
                {(preview.lines || []).length > 0 && (
                  <p className="text-[10px] text-gray-500 pt-1">
                    HS: {preview.lines.map((l) => l.hsCode).join(', ')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-500">Select a shipment to calculate CIF, duty and VAT.</p>
            )}
          </div>
        </div>
      </TradeModal>

      <TradeModal
        isOpen={Boolean(statusModal)}
        onClose={() => !actionLoading && setStatusModal(null)}
        title={statusModal ? `Update → ${statusModal.status}` : 'Update'}
        maxWidth="max-w-md"
        actions={
          <div className="flex justify-end gap-2">
            <button type="button" disabled={actionLoading} onClick={() => setStatusModal(null)} className="px-3 py-2 rounded-xl border text-xs font-semibold">
              Cancel
            </button>
            <button type="button" disabled={actionLoading} onClick={submitStatus} className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60">
              {actionLoading ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        }
      >
        {statusModal && (
          <div className="space-y-3 text-xs">
            {statusFormError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {statusFormError}
              </div>
            )}
            {statusModal.status === 'Assessed' && (
              <>
                <div>
                  <FieldLabel>Official declaration number (BOE/GD)</FieldLabel>
                  <input
                    value={statusModal.billOfEntryNo || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, billOfEntryNo: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                    placeholder="Enter before release"
                  />
                </div>
                <div>
                  <FieldLabel required>Assessment date</FieldLabel>
                  <input
                    type="date"
                    value={statusModal.assessmentDate || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, assessmentDate: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                  {statusErrors.assessmentDate && (
                    <p className="text-[10px] text-red-600 mt-1">{statusErrors.assessmentDate}</p>
                  )}
                </div>
              </>
            )}
            {(statusModal.status === 'Duty Paid' || statusModal.status === 'Partially Paid') && selectedCustoms && (
              <>
                <div className="p-2.5 rounded-lg bg-slate-50 border text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>Payable (total customs charges)</span>
                    <span className="font-bold">
                      {money(selectedCustoms.payableAmount ?? selectedCustoms.totalCustomsPayableUsd, cur)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Already paid</span>
                    <span>{money(selectedCustoms.totalPaid ?? 0, cur)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining balance</span>
                    <span className="font-bold text-emerald-800">
                      {money(
                        selectedCustoms.balanceDue != null
                          ? selectedCustoms.balanceDue
                          : Math.max(
                              0,
                              Number(selectedCustoms.totalCustomsPayableUsd || 0) -
                                Number(selectedCustoms.totalPaid || 0)
                            ),
                        cur
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <FieldLabel required>Amount ({cur})</FieldLabel>
                  <input
                    type="number"
                    value={statusModal.dutyPaymentAmount || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, dutyPaymentAmount: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                  {statusErrors.dutyPaymentAmount && <p className="text-[10px] text-red-600 mt-1">{statusErrors.dutyPaymentAmount}</p>}
                </div>
                <div>
                  <FieldLabel required>Payment date</FieldLabel>
                  <input
                    type="date"
                    value={statusModal.dutyPaymentDate || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, dutyPaymentDate: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                  {statusErrors.dutyPaymentDate && <p className="text-[10px] text-red-600 mt-1">{statusErrors.dutyPaymentDate}</p>}
                </div>
                <div>
                  <FieldLabel required>Method</FieldLabel>
                  <select
                    value={statusModal.dutyPaymentMethod || ''}
                    onChange={(e) => {
                      const method = e.target.value;
                      setStatusModal((s) => (s ? { ...s, dutyPaymentMethod: method, bankAccountId: '' } : s));
                      loadPaymentAccounts(method);
                    }}
                    className="w-full rounded-xl border px-3 py-2"
                  >
                    <option value="">Select…</option>
                    {['Bank Transfer', 'Pay Order', 'Cash', 'Online Portal', 'Other'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  {statusErrors.dutyPaymentMethod && <p className="text-[10px] text-red-600 mt-1">{statusErrors.dutyPaymentMethod}</p>}
                </div>
                <div>
                  <FieldLabel required>Bank / cash account</FieldLabel>
                  <select
                    value={statusModal.bankAccountId || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, bankAccountId: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                    disabled={paymentAccountsLoading}
                  >
                    <option value="">{paymentAccountsLoading ? 'Loading accounts…' : 'Select account…'}</option>
                    {paymentAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} ({a.bankName}) · bal {Number(a.currentBalance || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {statusErrors.bankAccountId && <p className="text-[10px] text-red-600 mt-1">{statusErrors.bankAccountId}</p>}
                </div>
                <div>
                  <FieldLabel required>Reference</FieldLabel>
                  <input
                    value={statusModal.dutyPaymentRef || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, dutyPaymentRef: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                  {statusErrors.dutyPaymentRef && <p className="text-[10px] text-red-600 mt-1">{statusErrors.dutyPaymentRef}</p>}
                </div>
                <div>
                  <FieldLabel>Difference reason (if amount ≠ remaining balance)</FieldLabel>
                  <input
                    value={statusModal.dutyPaymentDifferenceReason || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, dutyPaymentDifferenceReason: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                  {statusErrors.dutyPaymentDifferenceReason && (
                    <p className="text-[10px] text-red-600 mt-1">{statusErrors.dutyPaymentDifferenceReason}</p>
                  )}
                  <label className="mt-2 flex items-center gap-2 text-[11px] text-gray-600">
                    <input
                      type="checkbox"
                      checked={approveDifference}
                      onChange={(e) => setApproveDifference(e.target.checked)}
                    />
                    Approve difference above threshold
                  </label>
                </div>
              </>
            )}
            {statusModal.status === 'Released/Cleared' && (
              <>
                <div>
                  <FieldLabel required>Official declaration number</FieldLabel>
                  <input
                    value={statusModal.billOfEntryNo || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, billOfEntryNo: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                  {statusErrors.billOfEntryNo && <p className="text-[10px] text-red-600 mt-1">{statusErrors.billOfEntryNo}</p>}
                </div>
                <div>
                  <FieldLabel required>Assessment date</FieldLabel>
                  <input
                    type="date"
                    value={statusModal.assessmentDate || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, assessmentDate: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                  {statusErrors.assessmentDate && <p className="text-[10px] text-red-600 mt-1">{statusErrors.assessmentDate}</p>}
                </div>
                <div>
                  <FieldLabel required>Release date</FieldLabel>
                  <input
                    type="date"
                    value={statusModal.releaseDate || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, releaseDate: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>
              </>
            )}
            {(statusModal.status === 'On Hold/Examination' ||
              statusModal.status === 'Cancelled' ||
              statusModal.status === 'Draft') && (
              <div>
                <FieldLabel required={statusModal.status === 'On Hold/Examination'}>
                  {statusModal.status === 'Draft' ? 'Reason for sending back (optional)' : 'Reason'}
                </FieldLabel>
                <textarea
                  value={statusModal.holdReason || statusModal.note || ''}
                  onChange={(e) =>
                    setStatusModal((s) =>
                      s
                        ? statusModal.status === 'On Hold/Examination'
                          ? { ...s, holdReason: e.target.value }
                          : { ...s, note: e.target.value }
                        : s
                    )
                  }
                  rows={2}
                  className="w-full rounded-xl border px-3 py-2"
                />
                {statusErrors.holdReason && <p className="text-[10px] text-red-600 mt-1">{statusErrors.holdReason}</p>}
              </div>
            )}
          </div>
        )}
      </TradeModal>

      <TradeModal
        isOpen={refreshReasonModal}
        onClose={() => {
          if (!refreshTariffLoading) {
            setRefreshReasonModal(false);
            setRefreshReason('');
          }
        }}
        title="Refresh tariff data"
        maxWidth="max-w-md"
        actions={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={refreshTariffLoading}
              onClick={() => {
                setRefreshReasonModal(false);
                setRefreshReason('');
              }}
              className="px-3 py-2 rounded-xl border text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={refreshTariffLoading || !refreshReason.trim()}
              onClick={handleRefreshTariff}
              className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50"
            >
              {refreshTariffLoading ? 'Refreshing…' : 'Confirm refresh'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-gray-600">
            Fills HS codes from shipment/PO lines and recomputes duty from the tariff table. Requires a
            reason. Before/after duty totals are shown after refresh.
          </p>
          <div>
            <FieldLabel required>Reason</FieldLabel>
            <textarea
              value={refreshReason}
              onChange={(e) => setRefreshReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>
        </div>
      </TradeModal>

      <TradeModal
        isOpen={recalcModal}
        onClose={() => {
          if (!actionLoading) {
            setRecalcModal(false);
            setRecalcReason('');
          }
        }}
        title="Recalculate with current PO rate"
        maxWidth="max-w-md"
        actions={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => {
                setRecalcModal(false);
                setRecalcReason('');
              }}
              className="px-3 py-2 rounded-xl border text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading || !recalcReason.trim()}
              onClick={handleRecalculateRate}
              className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50"
            >
              {actionLoading ? 'Recalculating…' : 'Confirm recalculate'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-gray-600">
            Updates CIF, duty and VAT using the PO FX snapshot. Requires a reason.
          </p>
          {selectedCustoms ? (
            <p className="text-gray-600">
              Customs rate {Number(selectedCustoms.exchangeRateToUsd)} → current PO rate{' '}
              {Number(selectedCustoms.currentPoExchangeRate)}.
            </p>
          ) : null}
          <div>
            <FieldLabel required>Reason</FieldLabel>
            <textarea
              value={recalcReason}
              onChange={(e) => setRecalcReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Why recalculate this entry?"
            />
          </div>
        </div>
      </TradeModal>
    </TradePage>
  );
}
