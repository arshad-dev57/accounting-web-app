'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  Landmark,
  Plus,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  History,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  bankReconciliationService,
  type BankReconciliationRow,
} from '@/lib/bank-reconciliation-service';
import type { BankAccount } from '@/lib/bank-accounts-service';
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

function statusTone(status: string) {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Reconciled':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'InProgress':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-zinc-50 text-zinc-600 border-zinc-200';
  }
}

export default function BankReconciliationPage() {
  const router = useRouter();
  const { symbol } = useCurrency();
  const { isAdmin, hasSubPageAccess } = usePermissions();
  const canAccess =
    isAdmin ||
    hasSubPageAccess('accounting', 'bank-reconciliation') ||
    hasSubPageAccess('accounting', 'bank-accounts');

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<{
    bankAccounts: Array<BankAccount & { openReconciliation?: BankReconciliationRow | null }>;
    recent: BankReconciliationRow[];
    stats: { activeBanks: number; openReconciliations: number; completedThisMonth: number };
  } | null>(null);
  const [history, setHistory] = useState<BankReconciliationRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    bankAccountId: '',
    statementStartDate: '',
    statementEndDate: '',
    statementOpeningBalance: '',
    statementClosingBalance: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, list] = await Promise.all([
        bankReconciliationService.dashboard(),
        bankReconciliationService.list({ limit: 30 }),
      ]);
      setDashboard(dash.data as typeof dashboard);
      setHistory((list.data as BankReconciliationRow[]) || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load reconciliation');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) load();
  }, [canAccess, load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bankAccountId || !form.statementStartDate || !form.statementEndDate) {
      toast.error('Bank account and statement period are required');
      return;
    }
    setCreating(true);
    try {
      const res = await bankReconciliationService.create({
        bankAccountId: form.bankAccountId,
        statementStartDate: form.statementStartDate,
        statementEndDate: form.statementEndDate,
        statementOpeningBalance: Number(form.statementOpeningBalance) || 0,
        statementClosingBalance: Number(form.statementClosingBalance) || 0,
      });
      toast.success('Reconciliation started');
      setShowCreate(false);
      router.push(`/accounting/bank-Accounts/reconciliation/${(res.data as BankReconciliationRow).id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create reconciliation';
      toast.error(msg);
      // If open exists, try navigate
      const existing = (err as { data?: { existingId?: string } })?.data?.existingId;
      if (existing) router.push(`/accounting/bank-Accounts/reconciliation/${existing}`);
    } finally {
      setCreating(false);
    }
  }

  if (!canAccess) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-800">
        You do not have permission to view Bank Reconciliation.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-7 h-7 text-[#014582]" />
            Bank Reconciliation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Import statements, match to books, and complete period reconciliations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link
            href="/accounting/bank-Accounts/reconciliation/import"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import Statement
          </Link>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#014582] px-3 py-2 text-sm font-semibold text-white hover:bg-[#013a6e]"
          >
            <Plus className="w-4 h-4" />
            New Reconciliation
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#014582]" />
          Loading…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Active Bank Accounts</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {dashboard?.stats.activeBanks ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Open Reconciliations</p>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                {dashboard?.stats.openReconciliations ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Completed This Month</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {dashboard?.stats.completedThisMonth ?? 0}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Bank Accounts</h2>
              <Link
                href="/accounting/bank-Accounts"
                className="text-sm text-[#014582] hover:underline"
              >
                Manage accounts
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3 font-medium">Account</th>
                    <th className="px-5 py-3 font-medium">Balance</th>
                    <th className="px-5 py-3 font-medium">Last Reconciled</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.bankAccounts || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                        No active bank accounts. Create one under Bank Accounts first.
                      </td>
                    </tr>
                  )}
                  {(dashboard?.bankAccounts || []).map((b) => {
                    const open = b.openReconciliation;
                    return (
                      <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/80">
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900">{b.accountName}</p>
                          <p className="text-xs text-gray-500">
                            {b.bankName} · {b.accountNumber}
                          </p>
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-800">
                          {fmtMoney(b.currentBalance, symbol)}
                        </td>
                        <td className="px-5 py-3 text-gray-500">{fmtDate(b.lastReconciled)}</td>
                        <td className="px-5 py-3">
                          {open ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone(open.status)}`}
                            >
                              <Clock className="w-3 h-3" />
                              {open.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />
                              Clear
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {open ? (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/accounting/bank-Accounts/reconciliation/${open.id}`)
                              }
                              className="inline-flex items-center gap-1 text-sm font-semibold text-[#014582] hover:underline"
                            >
                              Continue <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setForm((f) => ({ ...f, bankAccountId: b.id }));
                                setShowCreate(true);
                              }}
                              className="text-sm font-semibold text-[#014582] hover:underline"
                            >
                              Start
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <History className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Reconciliation History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3 font-medium">Bank Account</th>
                    <th className="px-5 py-3 font-medium">Period</th>
                    <th className="px-5 py-3 font-medium">Opening</th>
                    <th className="px-5 py-3 font-medium">Closing</th>
                    <th className="px-5 py-3 font-medium">Book</th>
                    <th className="px-5 py-3 font-medium">Difference</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                        No reconciliations yet.
                      </td>
                    </tr>
                  )}
                  {history.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-50 hover:bg-gray-50/80 cursor-pointer"
                      onClick={() =>
                        router.push(`/accounting/bank-Accounts/reconciliation/${r.id}`)
                      }
                    >
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {r.bankAccount?.accountName || '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {fmtDate(r.statementStartDate)} → {fmtDate(r.statementEndDate)}
                      </td>
                      <td className="px-5 py-3">{fmtMoney(r.statementOpeningBalance, symbol)}</td>
                      <td className="px-5 py-3">{fmtMoney(r.statementClosingBalance, symbol)}</td>
                      <td className="px-5 py-3">{fmtMoney(r.bookClosingBalance, symbol)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={
                            Math.abs(r.difference) < 0.01
                              ? 'text-emerald-600 font-semibold'
                              : 'text-red-600 font-semibold'
                          }
                        >
                          {fmtMoney(r.difference, symbol)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone(r.status)}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {r.completedAt
                          ? `${fmtDate(r.completedAt)}${
                              r.completer
                                ? ` · ${r.completer.firstName || ''} ${r.completer.lastName || ''}`
                                : ''
                            }`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-5 py-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#014582]" />
              <h3 className="font-semibold text-gray-900">New Bank Reconciliation</h3>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Bank Account</label>
                <select
                  required
                  value={form.bankAccountId}
                  onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Select account…</option>
                  {(dashboard?.bankAccounts || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.accountName} ({b.accountNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Statement Start</label>
                  <input
                    type="date"
                    required
                    value={form.statementStartDate}
                    onChange={(e) => setForm({ ...form, statementStartDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Statement End</label>
                  <input
                    type="date"
                    required
                    value={form.statementEndDate}
                    onChange={(e) => setForm({ ...form, statementEndDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Statement Opening Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.statementOpeningBalance}
                    onChange={(e) =>
                      setForm({ ...form, statementOpeningBalance: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Statement Closing Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.statementClosingBalance}
                    onChange={(e) =>
                      setForm({ ...form, statementClosingBalance: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Import the bank statement next (or beforehand). Matching uses existing posted
                journal lines — no duplicate GL posting on match.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Start Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
