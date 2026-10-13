'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Lock,
  PieChart,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import DashboardHeroBanner from '@/components/DashboardHeroBanner';
import { useCurrency } from '../../../../lib/currency-context';
import { useFiscalYear } from '../../../../lib/fiscal-year-context';
import { budgetService, Budget, BudgetDimensions } from '@/lib/budget-service';
import { expenseService, ExpenseAccount } from '@/lib/expense-service';

type MonthAlloc = { periodKey: string; amount: number };

type LineDraft = {
  key: string;
  accountId: string;
  amount: number;
  notes: string;
  expanded: boolean;
  allocations: MonthAlloc[];
};

function toDateInput(value?: string | Date | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function monthsBetween(start: string, end: string): string[] {
  if (!start || !end) return [];
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return [];
  const keys: string[] = [];
  const cur = new Date(s.getFullYear(), s.getMonth(), 1);
  const last = new Date(e.getFullYear(), e.getMonth(), 1);
  while (cur <= last && keys.length < 24) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    keys.push(`${y}-${m}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return keys;
}

function emptyLine(periodKeys: string[]): LineDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    accountId: '',
    amount: 0,
    notes: '',
    expanded: false,
    allocations: periodKeys.map((periodKey) => ({ periodKey, amount: 0 })),
  };
}

export default function BudgetDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const router = useRouter();
  const { symbol } = useCurrency();
  const { fiscalYears } = useFiscalYear();

  const [budget, setBudget] = useState<Budget | null>(null);
  const [accounts, setAccounts] = useState<ExpenseAccount[]>([]);
  const [dimensions, setDimensions] = useState<BudgetDimensions>({
    departments: [],
    costCenters: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([]);

  const canEdit = budget?.status === 'Draft';
  const periodKeys = useMemo(() => monthsBetween(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [b, accs, dims] = await Promise.all([
          budgetService.getBudget(id),
          expenseService.getExpenseAccounts(),
          budgetService.getDimensions(),
        ]);
        if (cancelled) return;
        setBudget(b);
        setAccounts(accs || []);
        setDimensions(dims);
        setName(b.name || '');
        setFiscalYearId(b.fiscalYearId || '');
        setDepartmentId(b.departmentId || '');
        setCostCenterId(b.costCenterId || '');
        setStartDate(toDateInput(b.startDate));
        setEndDate(toDateInput(b.endDate));
        setNotes(b.notes || '');
        const keys = monthsBetween(toDateInput(b.startDate), toDateInput(b.endDate));
        setLines(
          (b.lines || []).map((l) => {
            const map = new Map((l.allocations || []).map((a) => [a.periodKey, Number(a.amount) || 0]));
            return {
              key: l.id || `${l.accountId}-${Math.random()}`,
              accountId: l.accountId,
              amount: Number(l.amount) || 0,
              notes: l.notes || '',
              expanded: false,
              allocations: keys.map((periodKey) => ({
                periodKey,
                amount: map.get(periodKey) || 0,
              })),
            };
          })
        );
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load budget');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!canEdit || periodKeys.length === 0 || lines.length === 0) return;
    setLines((prev) =>
      prev.map((line) => {
        const map = new Map(line.allocations.map((a) => [a.periodKey, a.amount]));
        return {
          ...line,
          allocations: periodKeys.map((periodKey) => ({
            periodKey,
            amount: map.get(periodKey) || 0,
          })),
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodKeys.join('|')]);

  const formatMoney = (n: number) =>
    `${symbol} ${(Number(n) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const updateLine = (key: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const setAlloc = (lineKey: string, periodKey: string, amount: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.key !== lineKey
          ? l
          : {
              ...l,
              allocations: l.allocations.map((a) =>
                a.periodKey === periodKey ? { ...a, amount } : a
              ),
            }
      )
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !id) return;
    setError('');
    if (!name.trim() || !fiscalYearId) {
      setError('Name and fiscal year are required');
      return;
    }
    const validLines = lines.filter((l) => l.accountId);
    if (!validLines.length) {
      setError('At least one budget line is required');
      return;
    }
    for (const line of validLines) {
      const allocSum = line.allocations.reduce((s, a) => s + (Number(a.amount) || 0), 0);
      if (allocSum > Number(line.amount) + 0.0001) {
        setError('Monthly allocations exceed annual amount on one or more lines');
        return;
      }
    }
    setSubmitting(true);
    try {
      const updated = await budgetService.updateBudget(id, {
        name: name.trim(),
        fiscalYearId,
        departmentId: departmentId || null,
        costCenterId: costCenterId || null,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        notes,
        lines: validLines.map((l) => ({
          accountId: l.accountId,
          amount: Number(l.amount) || 0,
          notes: l.notes || '',
          allocations: l.allocations
            .filter((a) => Number(a.amount) > 0)
            .map((a) => ({ periodKey: a.periodKey, amount: Number(a.amount) || 0 })),
        })),
      });
      setBudget(updated);
      alert('Budget updated');
    } catch (err: any) {
      setError(err.message || 'Failed to update budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (status: 'Approved' | 'Closed') => {
    if (!id) return;
    if (!confirm(`${status === 'Approved' ? 'Approve' : 'Close'} this budget?`)) return;
    setSubmitting(true);
    try {
      const updated = await budgetService.setStatus(id, status);
      setBudget(updated);
    } catch (e: any) {
      alert(e.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || budget?.status !== 'Draft') return;
    if (!confirm('Delete this draft budget?')) return;
    setSubmitting(true);
    try {
      await budgetService.deleteBudget(id);
      router.push('/accounting/budgets');
    } catch (e: any) {
      alert(e.message || 'Failed to delete');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
        <p className="mt-2 text-sm text-gray-500">Loading budget...</p>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">{error || 'Budget not found'}</p>
        <Link href="/accounting/budgets" className="text-[#014582] font-semibold text-sm mt-3 inline-block">
          ← Back to budgets
        </Link>
      </div>
    );
  }

  const totalBudget = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <DashboardHeroBanner
        badge={String(budget.status)}
        eyebrow={budget.fiscalYear?.name || 'Budget'}
        title={budget.name}
        subtitle={
          canEdit
            ? 'Draft — edit lines and monthly allocations, then approve when ready.'
            : 'View-only for approved/closed budgets.'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {budget.status === 'Draft' && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleStatus('Approved')}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white text-green-700 rounded-lg text-sm font-semibold"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
            )}
            {(budget.status === 'Draft' || budget.status === 'Approved') && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleStatus('Closed')}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-semibold"
              >
                <Lock className="w-4 h-4" /> Close
              </button>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <Link href="/accounting/budgets" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-[#014582]" />
          {canEdit ? 'Edit budget' : 'Budget detail'}
        </h2>
        <Link
          href={`/accounting/budgets/vs-actual?budgetId=${budget.id}`}
          className="ml-auto text-sm font-semibold text-[#014582] hover:underline"
        >
          View vs Actual →
        </Link>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-4"
      >
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none disabled:opacity-70"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fiscal Year *</label>
            <select
              value={fiscalYearId}
              onChange={(e) => {
                setFiscalYearId(e.target.value);
                const fy = fiscalYears.find((f) => f.id === e.target.value);
                if (fy && canEdit) {
                  setStartDate(toDateInput(fy.startDate));
                  setEndDate(toDateInput(fy.endDate));
                }
              }}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none disabled:opacity-70"
            >
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 disabled:opacity-70"
            >
              <option value="">— None —</option>
              {dimensions.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cost Center</label>
            <select
              value={costCenterId}
              onChange={(e) => setCostCenterId(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 disabled:opacity-70"
            >
              <option value="">— None —</option>
              {dimensions.costCenters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `${c.code} — ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 disabled:opacity-70"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 disabled:opacity-70"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!canEdit}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 resize-none disabled:opacity-70"
          />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">Budget lines</h3>
            <p className="text-sm font-semibold text-[#014582]">Total: {formatMoney(totalBudget)}</p>
          </div>

          <div className="space-y-3">
            {lines.map((line) => {
              const allocSum = line.allocations.reduce((s, a) => s + (Number(a.amount) || 0), 0);
              const over = allocSum > Number(line.amount) + 0.0001 && Number(line.amount) > 0;
              return (
                <div key={line.key} className="border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <div className="md:col-span-5">
                      <select
                        value={line.accountId}
                        onChange={(e) => updateLine(line.key, { accountId: e.target.value })}
                        disabled={!canEdit}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:opacity-70"
                      >
                        <option value="">Select account...</option>
                        {accounts.map((a) => (
                          <option key={a.id || a._id} value={a.id || a._id}>
                            {a.code} — {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.amount}
                        onChange={(e) =>
                          updateLine(line.key, { amount: parseFloat(e.target.value) || 0 })
                        }
                        disabled={!canEdit}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:opacity-70"
                      />
                    </div>
                    <div className="md:col-span-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateLine(line.key, { expanded: !line.expanded })}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-[#014582] flex items-center justify-center gap-1"
                      >
                        {line.expanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        Monthly ({formatMoney(allocSum)})
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                          disabled={lines.length <= 1}
                          className="p-2 border border-red-200 text-red-500 rounded-lg disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {line.expanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {over && (
                        <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Over annual amount
                        </p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {line.allocations.map((a) => (
                          <div key={a.periodKey}>
                            <label className="block text-[10px] text-gray-400 mb-0.5">
                              {a.periodKey}
                            </label>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={a.amount}
                              onChange={(e) =>
                                setAlloc(line.key, a.periodKey, parseFloat(e.target.value) || 0)
                              }
                              disabled={!canEdit}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white disabled:opacity-70"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, emptyLine(periodKeys)])}
              className="mt-3 flex items-center gap-1 text-sm font-semibold text-[#014582]"
            >
              <Plus className="w-4 h-4" /> Add line
            </button>
          )}
        </div>

        {canEdit && (
          <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
            >
              Delete draft
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] shadow-lg shadow-[#014582]/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export { BudgetDetailPage };
