'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  Lock,
  PieChart,
} from 'lucide-react';
import DashboardHeroBanner from '@/components/DashboardHeroBanner';
import { useCurrency } from '../../../lib/currency-context';
import { useFiscalYear } from '../../../lib/fiscal-year-context';
import { budgetService, Budget } from '@/lib/budget-service';

export default function BudgetsPage() {
  const { symbol } = useCurrency();
  const { fiscalYears, selectedFiscalYearId } = useFiscalYear();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [status, setStatus] = useState('All');

  useEffect(() => {
    if (selectedFiscalYearId && !fiscalYearId) {
      setFiscalYearId(selectedFiscalYearId);
    }
  }, [selectedFiscalYearId, fiscalYearId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await budgetService.listBudgets({
        fiscalYearId: fiscalYearId || undefined,
        status: status !== 'All' ? status : undefined,
      });
      setBudgets(data);
    } catch (e: any) {
      alert(e.message || 'Failed to load budgets');
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [fiscalYearId, status]);

  useEffect(() => {
    load();
  }, [load]);

  const formatMoney = (n: number) =>
    `${symbol} ${(Number(n) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const statusClass = (s: string) => {
    switch (s) {
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Closed':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const handleStatus = async (id: string, next: 'Approved' | 'Closed') => {
    const label = next === 'Approved' ? 'approve' : 'close';
    if (!confirm(`${label[0].toUpperCase() + label.slice(1)} this budget?`)) return;
    setSubmitting(true);
    try {
      await budgetService.setStatus(id, next);
      await load();
    } catch (e: any) {
      alert(e.message || `Failed to ${label} budget`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft budget?')) return;
    setSubmitting(true);
    try {
      await budgetService.deleteBudget(id);
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed to delete budget');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <DashboardHeroBanner
        badge="Accounting"
        eyebrow="Expense planning"
        title="Budgets"
        subtitle="Plan annual and monthly spend by account, department, and cost center."
        actions={
          <Link
            href="/accounting/budgets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#014582] rounded-lg text-sm font-semibold hover:bg-white/90 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create Budget
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/accounting/expenses" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#014582]" />
            Budget list
            <span className="text-sm font-normal text-gray-400">({budgets.length})</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 self-start sm:self-auto"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[160px]">
            <select
              value={fiscalYearId}
              onChange={(e) => setFiscalYearId(e.target.value)}
              className="appearance-none w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none"
            >
              <option value="">All fiscal years</option>
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative min-w-[120px]">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none"
            >
              {['All', 'Draft', 'Approved', 'Closed'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <Link
            href="/accounting/budgets/vs-actual"
            className="text-sm font-semibold text-[#014582] hover:underline ml-auto"
          >
            Budget vs Actual →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
            <p className="mt-2 text-sm text-gray-500">Loading budgets...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <PieChart className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-medium text-gray-500">No budgets found</p>
            <Link
              href="/accounting/budgets/new"
              className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-[#014582]"
            >
              <Plus className="w-4 h-4" /> Create your first budget
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Fiscal Year</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Cost Center</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-semibold text-gray-800">{b.name}</td>
                    <td className="px-4 py-3 text-gray-600">{b.fiscalYear?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass(
                          String(b.status)
                        )}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#014582]">
                      {formatMoney(b.totalAmount || 0)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.department?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.costCenter
                        ? `${b.costCenter.code ? `${b.costCenter.code} — ` : ''}${b.costCenter.name}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/accounting/budgets/${b.id}`}
                          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-[#014582] hover:border-[#014582]/40"
                          title="Open"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {b.status === 'Draft' && (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleStatus(b.id, 'Approved')}
                            className="p-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {(b.status === 'Draft' || b.status === 'Approved') && (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleStatus(b.id, 'Closed')}
                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            title="Close"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                        {b.status === 'Draft' && (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleDelete(b.id)}
                            className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export { BudgetsPage };
