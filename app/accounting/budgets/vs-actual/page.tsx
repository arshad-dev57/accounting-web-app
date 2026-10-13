'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  RefreshCw,
  Scale,
} from 'lucide-react';
import DashboardHeroBanner from '@/components/DashboardHeroBanner';
import { useCurrency } from '../../../../lib/currency-context';
import { useFiscalYear } from '../../../../lib/fiscal-year-context';
import {
  budgetService,
  Budget,
  BudgetDimensions,
  BudgetVsActualResult,
} from '@/lib/budget-service';

export default function BudgetVsActualPage() {
  const searchParams = useSearchParams();
  const { symbol } = useCurrency();
  const { fiscalYears, selectedFiscalYearId } = useFiscalYear();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dimensions, setDimensions] = useState<BudgetDimensions>({
    departments: [],
    costCenters: [],
  });
  const [result, setResult] = useState<BudgetVsActualResult | null>(null);
  const [loading, setLoading] = useState(true);

  const [budgetId, setBudgetId] = useState('');
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');

  useEffect(() => {
    const fromQuery = searchParams?.get('budgetId') || '';
    if (fromQuery) setBudgetId(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    if (selectedFiscalYearId && !fiscalYearId) {
      setFiscalYearId(selectedFiscalYearId);
    }
  }, [selectedFiscalYearId, fiscalYearId]);

  useEffect(() => {
    Promise.all([
      budgetService.listBudgets({ fiscalYearId: fiscalYearId || undefined }),
      budgetService.getDimensions(),
    ]).then(([list, dims]) => {
      setBudgets(list);
      setDimensions(dims);
    });
  }, [fiscalYearId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await budgetService.budgetVsActual({
        budgetId: budgetId || undefined,
        fiscalYearId: fiscalYearId || undefined,
        departmentId: departmentId || undefined,
        costCenterId: costCenterId || undefined,
      });
      setResult(data);
    } catch (e: any) {
      alert(e.message || 'Failed to load budget vs actual');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [budgetId, fiscalYearId, departmentId, costCenterId]);

  useEffect(() => {
    load();
  }, [load]);

  const formatMoney = (n: number) =>
    `${symbol} ${(Number(n) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const varianceClass = (v: number) =>
    v >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';

  const rows = result?.rows || [];
  const totals = result?.totals || { budget: 0, actual: 0, allocated: 0, variance: 0 };

  return (
    <div className="space-y-4 md:space-y-6">
      <DashboardHeroBanner
        badge="Budgets"
        eyebrow="Variance analysis"
        title="Budget vs Actual"
        subtitle="Compare planned spend against posted actuals by account."
        actions={
          <Link
            href="/accounting/budgets"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/20"
          >
            All budgets
          </Link>
        }
      />

      <div className="flex items-center gap-3">
        <Link href="/accounting/budgets" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#014582]" />
          Variance report
        </h2>
        <button
          type="button"
          onClick={() => load()}
          className="ml-auto p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Budget</label>
            <select
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
              className="appearance-none w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none"
            >
              <option value="">All budgets</option>
              {budgets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Fiscal Year</label>
            <select
              value={fiscalYearId}
              onChange={(e) => setFiscalYearId(e.target.value)}
              className="appearance-none w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none"
            >
              <option value="">All</option>
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="appearance-none w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none"
            >
              <option value="">All</option>
              {dimensions.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Cost Center</label>
            <select
              value={costCenterId}
              onChange={(e) => setCostCenterId(e.target.value)}
              className="appearance-none w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#014582] outline-none"
            >
              <option value="">All</option>
              {dimensions.costCenters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `${c.code} — ${c.name}` : c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 font-medium">Budget</p>
          <p className="text-lg font-bold text-[#014582] mt-1">{formatMoney(totals.budget)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 font-medium">Allocated</p>
          <p className="text-lg font-bold text-blue-600 mt-1">{formatMoney(totals.allocated)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 font-medium">Actual</p>
          <p className="text-lg font-bold text-orange-600 mt-1">{formatMoney(totals.actual)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 font-medium">Variance</p>
          <p className={`text-lg font-bold mt-1 ${varianceClass(totals.variance)}`}>
            {formatMoney(totals.variance)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
            <p className="mt-2 text-sm text-gray-500">Loading report...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Scale className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-medium text-gray-500">No rows for these filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-semibold">Account</th>
                  <th className="px-4 py-3 font-semibold text-right">Budget</th>
                  <th className="px-4 py-3 font-semibold text-right">Allocated</th>
                  <th className="px-4 py-3 font-semibold text-right">Actual</th>
                  <th className="px-4 py-3 font-semibold text-right">Variance</th>
                  <th className="px-4 py-3 font-semibold text-right">Utilization %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r, i) => (
                  <tr key={`${r.budgetId}-${r.accountId}-${i}`} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">
                        {r.accountCode ? `${r.accountCode} — ` : ''}
                        {r.accountName || r.accountId}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {r.budgetName}
                        {r.departmentName ? ` · ${r.departmentName}` : ''}
                        {r.costCenterName ? ` · ${r.costCenterName}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatMoney(r.budget)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatMoney(r.allocated)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatMoney(r.actual)}</td>
                    <td className={`px-4 py-3 text-right ${varianceClass(r.variance)}`}>
                      {formatMoney(r.variance)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.utilization > 100
                            ? 'bg-red-100 text-red-700'
                            : r.utilization >= 80
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {Number(r.utilization || 0).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-100 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-gray-700">Totals</td>
                  <td className="px-4 py-3 text-right">{formatMoney(totals.budget)}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(totals.allocated)}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(totals.actual)}</td>
                  <td className={`px-4 py-3 text-right ${varianceClass(totals.variance)}`}>
                    {formatMoney(totals.variance)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {totals.utilization != null ? `${Number(totals.utilization).toFixed(1)}%` : '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export { BudgetVsActualPage };
