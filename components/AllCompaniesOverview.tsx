'use client';

import { useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../app/lib/constants';
import { getStoredCompanyId, useCompanyOptional } from '../lib/company-context';

type Totals = {
  revenue: number;
  expenses: number;
  profit: number;
  receivables: number;
  payables: number;
  sales: number;
  purchases: number;
  cashBank: number;
};

type CompanyRow = Totals & {
  companyId: string;
  companyName: string;
  businessType?: string | null;
  isActive?: boolean;
};

function money(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function AllCompaniesOverview() {
  const ctx = useCompanyOptional();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totals, setTotals] = useState<Totals | null>(null);
  const [rows, setRows] = useState<CompanyRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('auth_token') || '';
        const companyId = getStoredCompanyId() || '__all__';
        const res = await fetch(`${API_BASE_URL}/api/companies/consolidated-dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Company-Id': companyId,
          },
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to load');
        if (cancelled) return;
        setTotals(json.data.totals);
        setRows(json.data.companies || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ctx?.activeCompanyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading All Companies overview…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const cards = [
    { label: 'Revenue', value: totals?.revenue || 0 },
    { label: 'Expenses', value: totals?.expenses || 0 },
    { label: 'Net Profit', value: totals?.profit || 0 },
    { label: 'Receivables', value: totals?.receivables || 0 },
    { label: 'Payables', value: totals?.payables || 0 },
    { label: 'Sales', value: totals?.sales || 0 },
    { label: 'Purchases', value: totals?.purchases || 0 },
    { label: 'Cash / Bank', value: totals?.cashBank || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#014582]/20 bg-[#014582]/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#014582]">Viewing</p>
        <h2 className="mt-1 text-2xl font-bold text-zinc-900">All Companies</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Consolidated statistics across {rows.length} company
          {rows.length === 1 ? '' : 'ies'}. Switch to a specific company for transactional screens
          (journals, invoices, chart of accounts).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{c.label}</p>
            <p className="mt-2 text-xl font-bold text-zinc-900">{money(c.value)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-zinc-100 px-5 py-3">
          <h3 className="font-semibold text-zinc-900">Company breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Expenses</th>
                <th className="px-4 py-3">Profit</th>
                <th className="px-4 py-3">Sales</th>
                <th className="px-4 py-3">Purchases</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.companyId} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-zinc-400" />
                      <div>
                        <p className="font-medium text-zinc-900">{r.companyName}</p>
                        {r.businessType && (
                          <p className="text-xs text-zinc-400">{r.businessType}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{money(r.revenue)}</td>
                  <td className="px-4 py-3">{money(r.expenses)}</td>
                  <td className="px-4 py-3 font-semibold">{money(r.profit)}</td>
                  <td className="px-4 py-3">{money(r.sales)}</td>
                  <td className="px-4 py-3">{money(r.purchases)}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-400">
                    No companies available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
