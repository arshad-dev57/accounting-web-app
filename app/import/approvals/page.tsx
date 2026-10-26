'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
  RefreshCw,
  ShieldCheck,
  CreditCard,
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
  TradeModal,
} from '@/components/trade/TradeUI';
import importApi, {
  type ImportCustomsClearance,
  type ImportRfq,
} from '@/lib/import-api';
import { usePermissions } from '@/lib/usePermissions';
import { importTodayInputValue } from '@/lib/import-format';

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || 'USD'} ${Number(amount || 0).toFixed(2)}`;
  }
}

function awardedTotal(rfq: ImportRfq): number | null {
  if (rfq.awardedTotal != null) return Number(rfq.awardedTotal);
  const selected = (rfq.quotations || []).find((q) => q.id === rfq.selectedQuotationId);
  if (selected) return Number(selected.totalForeign || 0);
  return null;
}

function awardedSupplier(rfq: ImportRfq): string {
  const selected = (rfq.quotations || []).find((q) => q.id === rfq.selectedQuotationId);
  return selected?.supplierName || rfq.supplierName || '—';
}

export default function ImportApprovalsPage() {
  const { can, isAdmin, ready } = usePermissions();
  const canApproveRfq = isAdmin || can('import.rfqs.approve');
  const canApproveCustoms = isAdmin || can('import.customs.approve');
  const canAssessCustoms = isAdmin || can('import.customs.assess');
  const canRecordDutyPayment =
    isAdmin ||
    can('import.customs.record_payment') ||
    can('purchases.payments.create') ||
    can('purchases.payments.edit') ||
    can('accounting.accounts_payable.create') ||
    can('accounting.accounts_payable.edit') ||
    can('accounting.journal_entries.create') ||
    can('accounting.journal_entries.post');
  const canApprove =
    canApproveRfq || canApproveCustoms || canAssessCustoms || canRecordDutyPayment;

  const [pending, setPending] = useState<ImportRfq[]>([]);
  const [recent, setRecent] = useState<ImportRfq[]>([]);
  const [pendingCustoms, setPendingCustoms] = useState<ImportCustomsClearance[]>([]);
  const [recentCustoms, setRecentCustoms] = useState<ImportCustomsClearance[]>([]);
  const [pendingAssessments, setPendingAssessments] = useState<ImportCustomsClearance[]>([]);
  const [pendingPayments, setPendingPayments] = useState<ImportCustomsClearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentRow, setPaymentRow] = useState<ImportCustomsClearance | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    dutyPaymentAmount: '',
    dutyPaymentDate: '',
    dutyPaymentMethod: 'Bank Transfer',
    dutyPaymentRef: '',
    bankAccountId: '',
    dutyPaymentDifferenceReason: '',
  });
  const [paymentAccounts, setPaymentAccounts] = useState<
    Array<{
      id: string;
      accountName: string;
      bankName: string;
      currentBalance: number;
    }>
  >([]);
  const [paymentAccountsLoading, setPaymentAccountsLoading] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [approveDifference, setApproveDifference] = useState(false);

  const load = useCallback(() => {
    if (!canApprove) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    importApi
      .listImportApprovals({ includeRecent: true, limit: 50 })
      .then((data) => {
        setPending(canApproveRfq ? data.pending || [] : []);
        setRecent(canApproveRfq ? data.recent || [] : []);
        setPendingCustoms(canApproveCustoms ? data.pendingCustoms || [] : []);
        setRecentCustoms(canApproveCustoms ? data.recentCustoms || [] : []);
        setPendingAssessments(canAssessCustoms ? data.pendingAssessments || [] : []);
        setPendingPayments(canRecordDutyPayment ? data.pendingPayments || [] : []);
      })
      .catch((err: { response?: { data?: { message?: string } }; message?: string }) => {
        setError(err?.response?.data?.message || err.message || 'Failed to load approvals');
      })
      .finally(() => setLoading(false));
  }, [
    canApprove,
    canApproveRfq,
    canApproveCustoms,
    canAssessCustoms,
    canRecordDutyPayment,
  ]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  const handleApproveRfq = async (rfqId: string) => {
    setSavingId(rfqId);
    setError(null);
    try {
      await importApi.approveRfq(rfqId);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Approve failed');
    } finally {
      setSavingId(null);
    }
  };

  const handleRejectRfq = async (rfqId: string) => {
    const reason =
      window.prompt('Optional reason for rejecting approval (sent back to Awarded):') || undefined;
    setSavingId(rfqId);
    setError(null);
    try {
      await importApi.rejectRfqApproval(rfqId, reason ? { reason } : {});
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Reject failed');
    } finally {
      setSavingId(null);
    }
  };

  const handleApproveCustoms = async (id: string) => {
    setSavingId(id);
    setError(null);
    try {
      await importApi.approveCustomsClearance(id);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Approve failed');
    } finally {
      setSavingId(null);
    }
  };

  const handleRejectCustoms = async (id: string) => {
    const reason =
      window.prompt('Optional reason for rejecting (sent back to Duty Paid):') || undefined;
    setSavingId(id);
    setError(null);
    try {
      await importApi.rejectCustomsApproval(id, reason ? { reason } : {});
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Reject failed');
    } finally {
      setSavingId(null);
    }
  };

  const handleConfirmAssessment = async (id: string) => {
    setSavingId(id);
    setError(null);
    try {
      await importApi.updateCustomsStatus(id, 'Assessed', {
        assessmentDate: new Date().toISOString().slice(0, 10),
      });
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Confirm assessment failed');
    } finally {
      setSavingId(null);
    }
  };

  const handleRejectAssessment = async (id: string) => {
    const reason =
      window.prompt('Optional reason for sending assessment back to Draft:') || undefined;
    setSavingId(id);
    setError(null);
    try {
      await importApi.updateCustomsStatus(id, 'Draft', reason ? { reason } : {});
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Send back failed');
    } finally {
      setSavingId(null);
    }
  };

  const openPaymentForm = async (row: ImportCustomsClearance) => {
    const bal = Number(
      row.balanceDue != null
        ? row.balanceDue
        : Number(row.totalCustomsPayableUsd || 0) - Number(row.totalPaid || 0)
    );
    setPaymentRow(row);
    setPaymentErrors({});
    setApproveDifference(false);
    setPaymentForm({
      dutyPaymentAmount: String(Math.max(0, bal) || ''),
      dutyPaymentDate: importTodayInputValue(),
      dutyPaymentMethod: 'Bank Transfer',
      dutyPaymentRef: '',
      bankAccountId: '',
      dutyPaymentDifferenceReason: '',
    });
    setPaymentAccountsLoading(true);
    try {
      const accounts = await importApi.listCustomsPaymentAccounts({ method: 'Bank Transfer' });
      setPaymentAccounts(accounts || []);
    } catch {
      setPaymentAccounts([]);
    } finally {
      setPaymentAccountsLoading(false);
    }
  };

  const submitDutyPayment = async () => {
    if (!paymentRow) return;
    const errs: Record<string, string> = {};
    const amt = Number(paymentForm.dutyPaymentAmount);
    const bal = Number(
      paymentRow.balanceDue != null
        ? paymentRow.balanceDue
        : Number(paymentRow.totalCustomsPayableUsd || 0) - Number(paymentRow.totalPaid || 0)
    );
    if (!(amt > 0)) errs.dutyPaymentAmount = 'Enter a valid amount';
    if (!paymentForm.dutyPaymentDate) errs.dutyPaymentDate = 'Payment date is required';
    if (!paymentForm.dutyPaymentMethod) errs.dutyPaymentMethod = 'Method is required';
    if (!paymentForm.bankAccountId) errs.bankAccountId = 'Bank / cash account is required';
    if (!paymentForm.dutyPaymentRef.trim()) errs.dutyPaymentRef = 'Reference is required';
    if (amt > 0 && Math.abs(amt - bal) > 0.009 && !paymentForm.dutyPaymentDifferenceReason.trim()) {
      errs.dutyPaymentDifferenceReason = 'Difference reason is required when amount ≠ balance';
    }
    setPaymentErrors(errs);
    if (Object.keys(errs).length) return;

    setSavingId(paymentRow.id);
    setError(null);
    try {
      await importApi.recordCustomsDutyPayment(paymentRow.id, {
        dutyPaymentAmount: amt,
        dutyPaymentDate: paymentForm.dutyPaymentDate,
        dutyPaymentMethod: paymentForm.dutyPaymentMethod,
        dutyPaymentRef: paymentForm.dutyPaymentRef,
        bankAccountId: paymentForm.bankAccountId,
        dutyPaymentDifferenceReason: paymentForm.dutyPaymentDifferenceReason || undefined,
        approveDifference: approveDifference || undefined,
      });
      setPaymentRow(null);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Payment failed');
    } finally {
      setSavingId(null);
    }
  };

  const handleRejectPayment = async (id: string) => {
    const reason =
      window.prompt('Optional reason for sending payment request back to Assessed:') || undefined;
    setSavingId(id);
    setError(null);
    try {
      await importApi.updateCustomsStatus(id, 'Assessed', reason ? { reason } : {});
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Send back failed');
    } finally {
      setSavingId(null);
    }
  };

  if (ready && !canApprove) {
    return (
      <TradePage>
        <TradePageHeader
          title="Import Approvals"
          subtitle="RFQ, assessment, duty payment, and clearance approvals"
          icon={<Inbox className="w-6 h-6 text-[#014582]" />}
        />
        <TradeCard>
          <div className="py-10 text-center text-sm text-gray-500">
            You do not have permission to approve import requests. Ask an admin to grant the needed
            approve / assess / payment permissions on{' '}
            <Link href="/users/approvals-permissions" className="font-semibold text-[#014582] hover:underline">
              Approval Permissions
            </Link>
            .
          </div>
        </TradeCard>
      </TradePage>
    );
  }

  return (
    <TradePage>
      <TradePageHeader
        title="Import Approvals"
        subtitle="RFQs, assessment, duty payment, and clearance / port formalities waiting for sign-off"
        icon={<Inbox className="w-6 h-6 text-[#014582]" />}
        actions={
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {error ? (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {canApproveRfq ? (
        <TradeCard title={`RFQs pending approval (${pending.length})`}>
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#014582]" />
            </div>
          ) : pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No RFQs waiting for approval.</p>
          ) : (
            <TradeTable>
              <TradeTableHeader
                columns={['RFQ', 'Supplier quote', 'Awarded total', 'Incoterm', 'Status', '']}
              />
              <TradeTableBody>
                {pending.map((rfq) => {
                  const total = awardedTotal(rfq);
                  const busy = savingId === rfq.id;
                  return (
                    <TradeTableRow key={rfq.id}>
                      <TradeTableCell>
                        <div className="font-bold text-gray-900">{rfq.rfqNumber}</div>
                        <div className="text-[11px] text-gray-500">{rfq.supplierName || '—'}</div>
                      </TradeTableCell>
                      <TradeTableCell className="text-sm">{awardedSupplier(rfq)}</TradeTableCell>
                      <TradeTableCell className="text-sm font-semibold">
                        {total != null ? formatMoney(total, rfq.currency || 'USD') : '—'}
                      </TradeTableCell>
                      <TradeTableCell className="text-sm">{rfq.incoterm || '—'}</TradeTableCell>
                      <TradeTableCell>
                        <TradeStatusBadge status={rfq.status} />
                      </TradeTableCell>
                      <TradeTableCell>
                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          <Link
                            href={`/import/rfqs?id=${rfq.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleApproveRfq(rfq.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {busy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRejectRfq(rfq.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 text-[11px] font-bold hover:bg-rose-50 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </TradeTableCell>
                    </TradeTableRow>
                  );
                })}
              </TradeTableBody>
            </TradeTable>
          )}
        </TradeCard>
      ) : null}

      {canAssessCustoms ? (
        <div className={canApproveRfq ? 'mt-6' : ''}>
          <TradeCard title={`Customs assessment pending (${pendingAssessments.length})`}>
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#014582]" />
              </div>
            ) : pendingAssessments.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No clearances waiting for assessment.
              </p>
            ) : (
              <TradeTable>
                <TradeTableHeader
                  columns={['Entry', 'PO / Shipment', 'Port', 'Duty total', 'Status', '']}
                />
                <TradeTableBody>
                  {pendingAssessments.map((row) => {
                    const busy = savingId === row.id;
                    const cur = row.baseCurrencyCode || 'PKR';
                    return (
                      <TradeTableRow key={row.id}>
                        <TradeTableCell>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#014582]" />
                            {row.entryNumber || row.internalRef}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {row.declarationDisplay || row.declarationNumber || 'Not yet declared'}
                          </div>
                        </TradeTableCell>
                        <TradeTableCell className="text-sm">
                          <div>{row.poRef || '—'}</div>
                          <div className="text-[11px] text-gray-500">{row.shipmentRef || '—'}</div>
                        </TradeTableCell>
                        <TradeTableCell className="text-sm">
                          {row.portLabel || row.portOfEntry || '—'}
                        </TradeTableCell>
                        <TradeTableCell className="text-sm font-semibold">
                          {formatMoney(Number(row.totalCustomsPayableUsd || 0), cur)}
                        </TradeTableCell>
                        <TradeTableCell>
                          <TradeStatusBadge status={row.clearanceStatus} />
                        </TradeTableCell>
                        <TradeTableCell>
                          <div className="flex flex-wrap items-center gap-2 justify-end">
                            <Link
                              href={`/import/customs?id=${row.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </Link>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleConfirmAssessment(row.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {busy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              Confirm
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleRejectAssessment(row.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 text-[11px] font-bold hover:bg-rose-50 disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Send back
                            </button>
                          </div>
                        </TradeTableCell>
                      </TradeTableRow>
                    );
                  })}
                </TradeTableBody>
              </TradeTable>
            )}
          </TradeCard>
        </div>
      ) : null}

      {canRecordDutyPayment ? (
        <div className={canApproveRfq || canAssessCustoms ? 'mt-6' : ''}>
          <TradeCard title={`Duty payments pending (${pendingPayments.length})`}>
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#014582]" />
              </div>
            ) : pendingPayments.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No clearances waiting for duty payment.
              </p>
            ) : (
              <TradeTable>
                <TradeTableHeader
                  columns={['Entry', 'PO / Shipment', 'Balance due', 'Status', '']}
                />
                <TradeTableBody>
                  {pendingPayments.map((row) => {
                    const busy = savingId === row.id;
                    const cur = row.baseCurrencyCode || 'PKR';
                    const bal = Number(
                      row.balanceDue != null
                        ? row.balanceDue
                        : Number(row.totalCustomsPayableUsd || 0) - Number(row.totalPaid || 0)
                    );
                    return (
                      <TradeTableRow key={row.id}>
                        <TradeTableCell>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-[#014582]" />
                            {row.entryNumber || row.internalRef}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {row.declarationDisplay || row.declarationNumber || 'Not yet declared'}
                          </div>
                        </TradeTableCell>
                        <TradeTableCell className="text-sm">
                          <div>{row.poRef || '—'}</div>
                          <div className="text-[11px] text-gray-500">{row.shipmentRef || '—'}</div>
                        </TradeTableCell>
                        <TradeTableCell className="text-sm font-semibold text-emerald-800">
                          {formatMoney(bal, cur)}
                        </TradeTableCell>
                        <TradeTableCell>
                          <TradeStatusBadge status={row.clearanceStatus} />
                        </TradeTableCell>
                        <TradeTableCell>
                          <div className="flex flex-wrap items-center gap-2 justify-end">
                            <Link
                              href={`/import/customs?id=${row.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </Link>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void openPaymentForm(row)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Record payment
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleRejectPayment(row.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 text-[11px] font-bold hover:bg-rose-50 disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Send back
                            </button>
                          </div>
                        </TradeTableCell>
                      </TradeTableRow>
                    );
                  })}
                </TradeTableBody>
              </TradeTable>
            )}
          </TradeCard>
        </div>
      ) : null}

      {canApproveCustoms ? (
        <div
          className={
            canApproveRfq || canAssessCustoms || canRecordDutyPayment ? 'mt-6' : ''
          }
        >
          <TradeCard
            title={`Customs / port formalities pending (${pendingCustoms.length})`}
          >
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#014582]" />
              </div>
            ) : pendingCustoms.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No customs clearances waiting for approval.
              </p>
            ) : (
              <TradeTable>
                <TradeTableHeader
                  columns={['Entry', 'PO / Shipment', 'Port', 'Duty total', 'Status', '']}
                />
                <TradeTableBody>
                  {pendingCustoms.map((row) => {
                    const busy = savingId === row.id;
                    const cur = row.baseCurrencyCode || 'PKR';
                    return (
                      <TradeTableRow key={row.id}>
                        <TradeTableCell>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#014582]" />
                            {row.entryNumber || row.internalRef}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {row.declarationDisplay || row.declarationNumber || 'Not yet declared'}
                          </div>
                        </TradeTableCell>
                        <TradeTableCell className="text-sm">
                          <div>{row.poRef || '—'}</div>
                          <div className="text-[11px] text-gray-500">{row.shipmentRef || '—'}</div>
                        </TradeTableCell>
                        <TradeTableCell className="text-sm">
                          {row.portLabel || row.portOfEntry || '—'}
                        </TradeTableCell>
                        <TradeTableCell className="text-sm font-semibold">
                          {formatMoney(Number(row.totalCustomsPayableUsd || 0), cur)}
                        </TradeTableCell>
                        <TradeTableCell>
                          <TradeStatusBadge status={row.clearanceStatus} />
                        </TradeTableCell>
                        <TradeTableCell>
                          <div className="flex flex-wrap items-center gap-2 justify-end">
                            <Link
                              href={`/import/customs?id=${row.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </Link>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleApproveCustoms(row.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {busy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleRejectCustoms(row.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 text-[11px] font-bold hover:bg-rose-50 disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </TradeTableCell>
                      </TradeTableRow>
                    );
                  })}
                </TradeTableBody>
              </TradeTable>
            )}
          </TradeCard>
        </div>
      ) : null}

      {canApproveRfq && recent.length > 0 ? (
        <div className="mt-6">
          <TradeCard title="Recently approved RFQs">
            <TradeTable>
              <TradeTableHeader columns={['RFQ', 'Supplier quote', 'Awarded total', 'Status', '']} />
              <TradeTableBody>
                {recent.map((rfq) => {
                  const total = awardedTotal(rfq);
                  return (
                    <TradeTableRow key={rfq.id}>
                      <TradeTableCell className="font-bold text-gray-900">{rfq.rfqNumber}</TradeTableCell>
                      <TradeTableCell className="text-sm">{awardedSupplier(rfq)}</TradeTableCell>
                      <TradeTableCell className="text-sm">
                        {total != null ? formatMoney(total, rfq.currency || 'USD') : '—'}
                      </TradeTableCell>
                      <TradeTableCell>
                        <TradeStatusBadge status={rfq.status} />
                      </TradeTableCell>
                      <TradeTableCell>
                        <Link
                          href={`/import/rfqs?id=${rfq.id}`}
                          className="text-[11px] font-bold text-[#014582] hover:underline"
                        >
                          Open
                        </Link>
                      </TradeTableCell>
                    </TradeTableRow>
                  );
                })}
              </TradeTableBody>
            </TradeTable>
          </TradeCard>
        </div>
      ) : null}

      {canApproveCustoms && recentCustoms.length > 0 ? (
        <div className="mt-6">
          <TradeCard title="Recently approved customs">
            <TradeTable>
              <TradeTableHeader columns={['Entry', 'PO / Shipment', 'Status', '']} />
              <TradeTableBody>
                {recentCustoms.map((row) => (
                  <TradeTableRow key={row.id}>
                    <TradeTableCell className="font-bold text-gray-900">
                      {row.entryNumber || row.internalRef}
                    </TradeTableCell>
                    <TradeTableCell className="text-sm">
                      {row.poRef || '—'} / {row.shipmentRef || '—'}
                    </TradeTableCell>
                    <TradeTableCell>
                      <TradeStatusBadge status={row.clearanceStatus} />
                    </TradeTableCell>
                    <TradeTableCell>
                      <Link
                        href={`/import/customs?id=${row.id}`}
                        className="text-[11px] font-bold text-[#014582] hover:underline"
                      >
                        Open
                      </Link>
                    </TradeTableCell>
                  </TradeTableRow>
                ))}
              </TradeTableBody>
            </TradeTable>
          </TradeCard>
        </div>
      ) : null}

      <TradeModal
        isOpen={Boolean(paymentRow)}
        onClose={() => {
          if (savingId !== paymentRow?.id) setPaymentRow(null);
        }}
        title={
          paymentRow
            ? `Record duty payment · ${paymentRow.entryNumber || paymentRow.internalRef}`
            : 'Record duty payment'
        }
        maxWidth="max-w-lg"
        actions={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={savingId === paymentRow?.id}
              onClick={() => setPaymentRow(null)}
              className="px-3.5 py-2 rounded-xl border text-xs font-bold text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingId === paymentRow?.id}
              onClick={() => void submitDutyPayment()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50"
            >
              {savingId === paymentRow?.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              Submit payment
            </button>
          </div>
        }
      >
        {paymentRow ? (
          <div className="space-y-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border space-y-1">
              <div className="flex justify-between">
                <span>Payable</span>
                <span className="font-bold">
                  {formatMoney(
                    Number(paymentRow.payableAmount ?? paymentRow.totalCustomsPayableUsd ?? 0),
                    paymentRow.baseCurrencyCode || 'PKR'
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Already paid</span>
                <span>{formatMoney(Number(paymentRow.totalPaid || 0), paymentRow.baseCurrencyCode || 'PKR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining</span>
                <span className="font-bold text-emerald-800">
                  {formatMoney(
                    Number(
                      paymentRow.balanceDue != null
                        ? paymentRow.balanceDue
                        : Number(paymentRow.totalCustomsPayableUsd || 0) -
                            Number(paymentRow.totalPaid || 0)
                    ),
                    paymentRow.baseCurrencyCode || 'PKR'
                  )}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Amount *</label>
              <input
                type="number"
                value={paymentForm.dutyPaymentAmount}
                onChange={(e) =>
                  setPaymentForm((f) => ({ ...f, dutyPaymentAmount: e.target.value }))
                }
                className="w-full rounded-xl border px-3 py-2"
              />
              {paymentErrors.dutyPaymentAmount ? (
                <p className="text-[10px] text-red-600 mt-1">{paymentErrors.dutyPaymentAmount}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Payment date *
              </label>
              <input
                type="date"
                value={paymentForm.dutyPaymentDate}
                onChange={(e) =>
                  setPaymentForm((f) => ({ ...f, dutyPaymentDate: e.target.value }))
                }
                className="w-full rounded-xl border px-3 py-2"
              />
              {paymentErrors.dutyPaymentDate ? (
                <p className="text-[10px] text-red-600 mt-1">{paymentErrors.dutyPaymentDate}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Method *</label>
              <select
                value={paymentForm.dutyPaymentMethod}
                onChange={(e) => {
                  const method = e.target.value;
                  setPaymentForm((f) => ({ ...f, dutyPaymentMethod: method, bankAccountId: '' }));
                  setPaymentAccountsLoading(true);
                  void importApi
                    .listCustomsPaymentAccounts({ method })
                    .then((accounts) => setPaymentAccounts(accounts || []))
                    .catch(() => setPaymentAccounts([]))
                    .finally(() => setPaymentAccountsLoading(false));
                }}
                className="w-full rounded-xl border px-3 py-2"
              >
                {['Bank Transfer', 'Pay Order', 'Cash', 'Online Portal', 'Other'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Bank / cash account *
              </label>
              <select
                value={paymentForm.bankAccountId}
                onChange={(e) =>
                  setPaymentForm((f) => ({ ...f, bankAccountId: e.target.value }))
                }
                className="w-full rounded-xl border px-3 py-2"
                disabled={paymentAccountsLoading}
              >
                <option value="">
                  {paymentAccountsLoading ? 'Loading accounts…' : 'Select account…'}
                </option>
                {paymentAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} ({a.bankName}) · bal{' '}
                    {Number(a.currentBalance || 0).toLocaleString()}
                  </option>
                ))}
              </select>
              {paymentErrors.bankAccountId ? (
                <p className="text-[10px] text-red-600 mt-1">{paymentErrors.bankAccountId}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Reference *
              </label>
              <input
                value={paymentForm.dutyPaymentRef}
                onChange={(e) =>
                  setPaymentForm((f) => ({ ...f, dutyPaymentRef: e.target.value }))
                }
                className="w-full rounded-xl border px-3 py-2"
              />
              {paymentErrors.dutyPaymentRef ? (
                <p className="text-[10px] text-red-600 mt-1">{paymentErrors.dutyPaymentRef}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Difference reason (if amount ≠ balance)
              </label>
              <input
                value={paymentForm.dutyPaymentDifferenceReason}
                onChange={(e) =>
                  setPaymentForm((f) => ({
                    ...f,
                    dutyPaymentDifferenceReason: e.target.value,
                  }))
                }
                className="w-full rounded-xl border px-3 py-2"
              />
              {paymentErrors.dutyPaymentDifferenceReason ? (
                <p className="text-[10px] text-red-600 mt-1">
                  {paymentErrors.dutyPaymentDifferenceReason}
                </p>
              ) : null}
              <label className="mt-2 flex items-center gap-2 text-[11px] text-gray-600">
                <input
                  type="checkbox"
                  checked={approveDifference}
                  onChange={(e) => setApproveDifference(e.target.checked)}
                />
                Approve difference above threshold
              </label>
            </div>
          </div>
        ) : null}
      </TradeModal>
    </TradePage>
  );
}
