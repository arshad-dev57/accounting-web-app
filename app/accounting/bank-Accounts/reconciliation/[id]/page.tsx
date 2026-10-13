'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Wand2,
  Link2,
  Unlink,
  EyeOff,
  CheckCircle2,
  Plus,
  Scale,
} from 'lucide-react';
import {
  bankReconciliationService,
  type BankReconciliationRow,
  type BookTxn,
  type StatementTxn,
} from '@/lib/bank-reconciliation-service';
import { chartOfAccountService } from '@/lib/chart-of-accounts-service';
import { useCurrency } from '@/lib/currency-context';
import { usePermissions } from '@/lib/usePermissions';

function fmtMoney(n: number, symbol = 'Rs') {
  return `${symbol} ${new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0)}`;
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BankReconciliationWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { symbol } = useCurrency();
  const { isAdmin } = usePermissions();

  const [recon, setRecon] = useState<BankReconciliationRow | null>(null);
  const [bankTxns, setBankTxns] = useState<StatementTxn[]>([]);
  const [bookTxns, setBookTxns] = useState<BookTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [searchBank, setSearchBank] = useState('');
  const [searchBook, setSearchBook] = useState('');
  const [filterBank, setFilterBank] = useState('unmatched');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [showAdj, setShowAdj] = useState(false);
  const [accounts, setAccounts] = useState<Array<{ id: string; code: string; name: string; type: string }>>([]);
  const [adj, setAdj] = useState({
    type: 'charge',
    amount: '',
    offsetAccountId: '',
    description: '',
  });

  const locked = recon?.status === 'Completed';

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const r = await bankReconciliationService.get(id);
      const reconData = r.data as BankReconciliationRow;
      setRecon(reconData);

      const [stmt, book] = await Promise.all([
        bankReconciliationService.statementTransactions({
          reconciliationId: id,
          bankAccountId: reconData.bankAccountId,
          status: filterBank === 'all' ? 'all' : filterBank,
          search: searchBank || undefined,
          limit: 100,
        }),
        bankReconciliationService.bookTransactions({
          bankAccountId: reconData.bankAccountId,
          startDate: reconData.statementStartDate?.slice(0, 10),
          endDate: reconData.statementEndDate?.slice(0, 10),
          unmatchedOnly: filterBank !== 'matched',
          search: searchBook || undefined,
          limit: 100,
        }),
      ]);
      setBankTxns(stmt.data.items || []);
      setBookTxns(book.data.items || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }, [id, filterBank, searchBank, searchBook]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    chartOfAccountService
      .getAccounts({ limit: 100, sortBy: 'code', sortOrder: 'asc' })
      .then((res) => {
        const list = (res.data || []) as Array<{
          id: string;
          code: string;
          name: string;
          type: string;
        }>;
        setAccounts(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  const summary = useMemo(() => {
    if (!recon) return null;
    const imported = !!recon.statementImported || (recon.statementTransactionCount || 0) > 0;
    return {
      imported,
      bankBalance: recon.statementClosingBalance,
      bookBalance: recon.bookClosingBalance,
      outstandingDeposits: imported ? recon.outstandingDeposits : 0,
      outstandingPayments: imported ? recon.outstandingPayments : 0,
      bankCharges: imported ? recon.bankChargesTotal : 0,
      bankInterest: imported ? recon.bankInterestTotal : 0,
      otherAdjustments: imported ? recon.otherAdjustments : 0,
      adjustedBank: imported
        ? Number(recon.statementClosingBalance) +
          Number(recon.outstandingDeposits) -
          Number(recon.outstandingPayments)
        : Number(recon.statementClosingBalance),
      difference: imported ? recon.difference : Number(recon.statementClosingBalance) - Number(recon.bookClosingBalance),
      matchedCount: imported ? recon.matchedCount : 0,
      unmatchedBankCount: imported ? recon.unmatchedBankCount : 0,
      unmatchedBookCount: imported ? recon.unmatchedBookCount : 0,
    };
  }, [recon]);

  async function runAutoMatch() {
    if (!id || locked) return;
    setBusy(true);
    try {
      const res = await bankReconciliationService.autoMatch(id);
      toast.success((res as { message?: string }).message || 'Auto-match complete');
      const amb = (res.data as { ambiguousCount?: number })?.ambiguousCount;
      if (amb) toast(`${amb} transaction(s) need manual confirmation`, { icon: 'ℹ️' });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Auto-match failed');
    } finally {
      setBusy(false);
    }
  }

  async function matchSelected() {
    if (!id || !selectedBankId || !selectedBookId || locked) return;
    setBusy(true);
    try {
      await bankReconciliationService.match(id, selectedBankId, selectedBookId);
      toast.success('Matched');
      setSelectedBankId(null);
      setSelectedBookId(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Match failed');
    } finally {
      setBusy(false);
    }
  }

  async function unmatchTxn(statementTransactionId: string) {
    if (!id || locked) return;
    setBusy(true);
    try {
      await bankReconciliationService.unmatch(id, { statementTransactionId });
      toast.success('Unmatched');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unmatch failed');
    } finally {
      setBusy(false);
    }
  }

  async function ignoreTxn(statementTransactionId: string) {
    if (!id || locked) return;
    setBusy(true);
    try {
      await bankReconciliationService.ignore(id, statementTransactionId);
      toast.success('Ignored');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ignore failed');
    } finally {
      setBusy(false);
    }
  }

  async function createAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!id || locked) return;
    setBusy(true);
    try {
      await bankReconciliationService.createAdjustment(id, {
        type: adj.type,
        amount: Number(adj.amount),
        offsetAccountId: adj.offsetAccountId,
        description: adj.description,
        statementTransactionId: selectedBankId || undefined,
        autoMatchAfter: true,
      });
      toast.success('Accounting entry posted');
      setShowAdj(false);
      setAdj({ type: 'charge', amount: '', offsetAccountId: '', description: '' });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create entry');
    } finally {
      setBusy(false);
    }
  }

  async function completeRecon(withException = false) {
    if (!id || locked) return;
    setBusy(true);
    try {
      await bankReconciliationService.complete(id, {
        exceptionAllowed: withException,
        exceptionNote: withException ? 'Admin exception on complete' : undefined,
      });
      toast.success('Reconciliation completed');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Cannot complete');
    } finally {
      setBusy(false);
    }
  }

  async function reopenRecon() {
    if (!id) return;
    setBusy(true);
    try {
      await bankReconciliationService.reopen(id);
      toast.success('Reopened');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Cannot reopen');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !recon) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#014582]" />
        Loading workspace…
      </div>
    );
  }

  if (!recon) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        Reconciliation not found.{' '}
        <Link href="/accounting/bank-Accounts/reconciliation" className="underline">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push('/accounting/bank-Accounts/reconciliation')}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {recon.bankAccount?.accountName || 'Reconciliation'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {fmtDate(recon.statementStartDate)} → {fmtDate(recon.statementEndDate)} ·{' '}
            <span className="font-medium text-gray-700">{recon.status}</span>
            {locked && ' · Locked'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href={`/accounting/bank-Accounts/reconciliation/import?bankAccountId=${recon.bankAccountId}&reconciliationId=${recon.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium"
          >
            Import Statement
          </Link>
          {!locked && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={runAutoMatch}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700"
              >
                <Wand2 className="w-4 h-4" /> Auto Match
              </button>
              <button
                type="button"
                disabled={busy || !selectedBankId || !selectedBookId}
                onClick={matchSelected}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50"
              >
                <Link2 className="w-4 h-4" /> Match Selected
              </button>
              <button
                type="button"
                disabled={busy || !selectedBankId}
                onClick={() => {
                  const t = bankTxns.find((x) => x.id === selectedBankId);
                  if (t) {
                    setAdj((a) => ({
                      ...a,
                      amount: String(Math.abs(t.amount) || t.debit || t.credit),
                      description: t.description || 'Bank adjustment',
                      type: t.debit > 0 ? 'charge' : 'interest',
                    }));
                  }
                  setShowAdj(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Create Entry
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => completeRecon(false)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#014582] px-3 py-2 text-sm font-semibold text-white"
              >
                <CheckCircle2 className="w-4 h-4" /> Complete
              </button>
              {isAdmin && Math.abs(recon.difference) >= 0.01 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => completeRecon(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
                >
                  Complete with Exception
                </button>
              )}
            </>
          )}
          {locked && isAdmin && (
            <button
              type="button"
              disabled={busy}
              onClick={reopenRecon}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      {summary && (
        <div className="space-y-3">
          {!summary.imported && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold text-amber-900">Bank statement not imported yet</p>
                <p className="text-sm text-amber-800 mt-0.5">
                  Outstanding deposits/payments and unmatched bank counts stay at zero until you
                  import a CSV/Excel statement. Account opening balance is never treated as a
                  deposit.
                </p>
              </div>
              <Link
                href={`/accounting/bank-Accounts/reconciliation/import?bankAccountId=${recon.bankAccountId}&reconciliationId=${recon.id}`}
                className="inline-flex items-center justify-center rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white shrink-0"
              >
                Import Bank Statement
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            {(
              [
                { label: 'Bank Closing', value: summary.bankBalance, always: true },
                { label: 'Book Closing', value: summary.bookBalance, always: true },
                { label: 'Outstanding Deposits', value: summary.outstandingDeposits },
                { label: 'Outstanding Payments', value: summary.outstandingPayments },
                { label: 'Bank Charges', value: summary.bankCharges },
                { label: 'Bank Interest', value: summary.bankInterest },
                {
                  label: 'Adjusted Bank',
                  value: summary.imported ? summary.adjustedBank : summary.bankBalance,
                },
                {
                  label: 'Difference',
                  value: summary.imported
                    ? summary.difference
                    : Number(summary.bankBalance) - Number(summary.bookBalance),
                },
              ] as const
            ).map((card) => {
              const muted = !summary.imported && !('always' in card && card.always);
              const display = muted && !['Adjusted Bank', 'Difference'].includes(card.label)
                ? 0
                : card.value;
              return (
                <div
                  key={card.label}
                  className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">{card.label}</p>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      muted && card.label !== 'Difference' && card.label !== 'Adjusted Bank'
                        ? 'text-gray-400'
                        : card.label === 'Difference'
                          ? Math.abs(Number(display)) < 0.01
                            ? 'text-emerald-600'
                            : 'text-red-600'
                          : 'text-gray-900'
                    }`}
                  >
                    {fmtMoney(Number(display), symbol)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500">Bank filter:</span>
        {['unmatched', 'matched', 'ignored', 'all'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilterBank(f)}
            className={`rounded-lg px-3 py-1.5 capitalize font-medium ${
              filterBank === f ? 'bg-[#014582] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">
          Matched {summary?.matchedCount ?? 0} · Unmatched bank {summary?.unmatchedBankCount ?? 0} ·
          Unmatched book {summary?.unmatchedBookCount ?? 0}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* LEFT — Bank statement */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">Bank Statement</h2>
            <input
              value={searchBank}
              onChange={(e) => setSearchBank(e.target.value)}
              placeholder="Search…"
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm w-40"
            />
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Dr</th>
                  <th className="px-3 py-2 text-right">Cr</th>
                  <th className="px-3 py-2 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {bankTxns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                      No statement lines. Import a CSV/Excel statement first.
                    </td>
                  </tr>
                )}
                {bankTxns.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => !locked && t.status === 'unmatched' && setSelectedBankId(t.id)}
                    className={`border-t border-gray-50 cursor-pointer ${
                      selectedBankId === t.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    } ${t.status === 'matched' ? 'opacity-80' : ''}`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                      {fmtDate(t.transactionDate)}
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-800 truncate max-w-[220px]">
                        {t.description || '—'}
                      </p>
                      <p className="text-[11px] text-gray-400">{t.reference || t.status}</p>
                    </td>
                    <td className="px-3 py-2 text-right text-red-600">
                      {t.debit ? fmtMoney(t.debit, symbol) : ''}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-600">
                      {t.credit ? fmtMoney(t.credit, symbol) : ''}
                    </td>
                    <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      {!locked && t.status === 'matched' && (
                        <button
                          type="button"
                          onClick={() => unmatchTxn(t.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Unmatch"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      )}
                      {!locked && t.status === 'unmatched' && (
                        <button
                          type="button"
                          onClick={() => ignoreTxn(t.id)}
                          className="p-1 text-gray-400 hover:text-amber-600"
                          title="Ignore"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT — ERP books */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">ERP / Book Transactions</h2>
            <input
              value={searchBook}
              onChange={(e) => setSearchBook(e.target.value)}
              placeholder="Search…"
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm w-40"
            />
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Entry</th>
                  <th className="px-3 py-2 text-right">Dr</th>
                  <th className="px-3 py-2 text-right">Cr</th>
                </tr>
              </thead>
              <tbody>
                {bookTxns.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                      No book lines in this period.
                    </td>
                  </tr>
                )}
                {bookTxns.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => !locked && !t.isReconciled && setSelectedBookId(t.id)}
                    className={`border-t border-gray-50 cursor-pointer ${
                      selectedBookId === t.id ? 'bg-emerald-50' : 'hover:bg-gray-50'
                    } ${t.isReconciled ? 'opacity-60' : ''}`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">{fmtDate(t.date)}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-800 truncate max-w-[220px]">
                        {t.description || t.entryNumber}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {t.entryNumber}
                        {t.reference ? ` · ${t.reference}` : ''}
                        {t.isReconciled ? ' · cleared' : ''}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-600">
                      {t.debit ? fmtMoney(t.debit, symbol) : ''}
                    </td>
                    <td className="px-3 py-2 text-right text-red-600">
                      {t.credit ? fmtMoney(t.credit, symbol) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAdj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={createAdjustment}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#014582]" />
              <h3 className="font-semibold text-gray-900">Create Accounting Entry</h3>
            </div>
            <p className="text-xs text-gray-500">
              Posts through the existing bank journal service (updates COA + bank balance). Select
              the offset account — nothing is hardcoded.
            </p>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                value={adj.type}
                onChange={(e) => setAdj({ ...adj, type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="charge">Bank Charge (Dr Expense / Cr Bank)</option>
                <option value="interest">Bank Interest (Dr Bank / Cr Income)</option>
                <option value="payment">Payment / Other outflow</option>
                <option value="receipt">Receipt / Other inflow</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Amount</label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={adj.amount}
                onChange={(e) => setAdj({ ...adj, amount: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Offset Account (COA)</label>
              <select
                required
                value={adj.offsetAccountId}
                onChange={(e) => setAdj({ ...adj, offsetAccountId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Select account…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <input
                value={adj.description}
                onChange={(e) => setAdj({ ...adj, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdj(false)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Post Entry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
