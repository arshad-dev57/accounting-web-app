'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Save,
  Trash2,
  PieChart,
} from 'lucide-react';
import DashboardHeroBanner from '@/components/DashboardHeroBanner';
import { useCurrency } from '../../../../lib/currency-context';
import { useFiscalYear } from '../../../../lib/fiscal-year-context';
import { budgetService, BudgetDimensions } from '@/lib/budget-service';
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

export default function NewBudgetPage() {
  const router = useRouter();
  const { symbol } = useCurrency();
  const { fiscalYears, selectedFiscalYear } = useFiscalYear();
  const [accounts, setAccounts] = useState<ExpenseAccount[]>([]);
  const [dimensions, setDimensions] = useState<BudgetDimensions>({
    departments: [],
    costCenters: [],
  });
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

  const periodKeys = useMemo(() => monthsBetween(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    Promise.all([expenseService.getExpenseAccounts(), budgetService.getDimensions()]).then(
      ([accs, dims]) => {
        setAccounts(accs || []);
        setDimensions(dims);
      }
    );
  }, []);

  useEffect(() => {
    if (!fiscalYearId && selectedFiscalYear?.id) {
      setFiscalYearId(selectedFiscalYear.id);
      setStartDate(toDateInput(selectedFiscalYear.startDate));
      setEndDate(toDateInput(selectedFiscalYear.endDate));
    }
  }, [selectedFiscalYear, fiscalYearId]);

  useEffect(() => {
    if (periodKeys.length === 0) return;
    setLines((prev) => {
      if (prev.length === 0) return [emptyLine(periodKeys)];
      return prev.map((line) => {
        const map = new Map(line.allocations.map((a) => [a.periodKey, a.amount]));
        return {
          ...line,
          allocations: periodKeys.map((periodKey) => ({
            periodKey,
            amount: map.get(periodKey) || 0,
          })),
        };
      });
    });
  }, [periodKeys.join('|')]);

  const onFiscalYearChange = (id: string) => {
    setFiscalYearId(id);
    const fy = fiscalYears.find((f) => f.id === id);
    if (fy) {
      setStartDate(toDateInput(fy.startDate));
      setEndDate(toDateInput(fy.endDate));
    }
  };

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

  const spreadEvenly = (line: LineDraft) => {
    if (!line.allocations.length) return;
    const n = line.allocations.length;
    const base = Math.floor((line.amount / n) * 100) / 100;
    let remaining = Math.round((line.amount - base * n) * 100) / 100;
    updateLine(line.key, {
      allocations: line.allocations.map((a, i) => {
        let amt = base;
        if (remaining > 0) {
          amt = Math.round((amt + 0.01) * 100) / 100;
          remaining = Math.round((remaining - 0.01) * 100) / 100;
        }
        return { ...a, amount: i === n - 1 && remaining !== 0 ? Math.round((amt + remaining) * 100) / 100 : amt };
      }),
    });
  };

  const totalBudget = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Budget name is required');
      return;
    }
    if (!fiscalYearId) {
      setError('Fiscal year is required');
      return;
    }
    const validLines = lines.filter((l) => l.accountId && Number(l.amount) >= 0);
    if (!validLines.length) {
      setError('Add at least one budget line with an expense account');
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
      const created = await budgetService.createBudget({
        name: name.trim(),
        fiscalYearId,
        departmentId: departmentId || null,
        costCenterId: costCenterId || null,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        notes,
        status: 'Draft',
        lines: validLines.map((l) => ({
          accountId: l.accountId,
          amount: Number(l.amount) || 0,
          notes: l.notes || '',
          allocations: l.allocations
            .filter((a) => Number(a.amount) > 0)
            .map((a) => ({ periodKey: a.periodKey, amount: Number(a.amount) || 0 })),
        })),
      });
      router.push(`/accounting/budgets/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create budget');
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (n: number) =>
    `${symbol} ${(Number(n) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="space-y-4 md:space-y-6">
      <DashboardHeroBanner
        badge="Budgets"
        eyebrow="New plan"
        title="Create Budget"
        subtitle="Define annual amounts by expense account with optional monthly allocations."
      />

      <div className="flex items-center gap-3">
        <Link href="/accounting/budgets" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-[#014582]" />
          New budget
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-4"
      >
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none"
              placeholder="e.g. FY2026 Operating Budget"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fiscal Year *</label>
            <div className="relative">
              <select
                value={fiscalYearId}
                onChange={(e) => onFiscalYearChange(e.target.value)}
                className="appearance-none w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none"
                required
              >
                <option value="">Select fiscal year...</option>
                {fiscalYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Department (optional)
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none"
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
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Cost Center (optional)
            </label>
            <select
              value={costCenterId}
              onChange={(e) => setCostCenterId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none"
            >
              <option value="">— None —</option>
              {dimensions.costCenters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `${c.code} — ${c.name}` : c.name}
                </option>
              ))}
            </select>
            {dimensions.costCenters.length === 0 && (
              <p className="mt-1 text-[11px] text-gray-400">
                None yet —{' '}
                <a href="/accounting/cost-centers" className="text-[#014582] underline font-medium">
                  create cost centers
                </a>
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none resize-none"
            placeholder="Optional notes"
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
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                    <div className="md:col-span-5">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                        Expense account *
                      </label>
                      <select
                        value={line.accountId}
                        onChange={(e) => updateLine(line.key, { accountId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#014582] outline-none"
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
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                        Annual amount *
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.amount}
                        onChange={(e) =>
                          updateLine(line.key, { amount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#014582] outline-none"
                      />
                    </div>
                    <div className="md:col-span-4 flex items-end gap-2">
                      <button
                        type="button"
                        onClick={() => updateLine(line.key, { expanded: !line.expanded })}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-[#014582] hover:bg-[#014582]/5 flex items-center justify-center gap-1"
                      >
                        {line.expanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                        disabled={lines.length <= 1}
                        className="p-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {line.expanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">
                          Allocated {formatMoney(allocSum)} / {formatMoney(line.amount)}
                        </p>
                        <button
                          type="button"
                          onClick={() => spreadEvenly(line)}
                          className="text-xs font-semibold text-[#014582] hover:underline"
                        >
                          Spread evenly
                        </button>
                      </div>
                      {over && (
                        <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Monthly total exceeds annual amount
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
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#014582] outline-none"
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

          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, emptyLine(periodKeys)])}
            className="mt-3 flex items-center gap-1 text-sm font-semibold text-[#014582] hover:text-[#01366a]"
          >
            <Plus className="w-4 h-4" />
            Add line
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-gray-100">
          <Link
            href="/accounting/budgets"
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] shadow-lg shadow-[#014582]/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}

export { NewBudgetPage };
