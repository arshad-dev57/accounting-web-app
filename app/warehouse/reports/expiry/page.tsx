'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

type ExpiryProduct = {
  id: string;
  name: string;
  sku?: string;
  currentStock: number;
  expiryDate: string;
  daysLeft: number;
  status: string;
  category?: { name?: string };
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ExpiryReportPage() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'expiring' | 'expired'>('expiring');
  const [expired, setExpired] = useState<ExpiryProduct[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<ExpiryProduct[]>([]);
  const [summary, setSummary] = useState({
    expiredCount: 0,
    expiringSoonCount: 0,
    totalProducts: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/warehouse/reports/expiry');
      if (response.success && response.data?.data) {
        const d = response.data.data;
        setExpired(d.expired || []);
        setExpiringSoon(d.expiringSoon || []);
        setSummary(d.summary || summary);
      }
    } catch (e) {
      console.error('Expiry report failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rows = tab === 'expired' ? expired : expiringSoon;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/warehouse/reports" className="inline-flex items-center gap-1 text-sm text-[#014582] font-medium mb-2 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            All Reports
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarClock className="w-7 h-7 text-red-500" />
            Expiry Report
          </h1>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Products', value: summary.totalProducts },
          { label: 'Expiring Soon (30d)', value: summary.expiringSoonCount },
          { label: 'Expired', value: summary.expiredCount },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 uppercase">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['expiring', 'expired'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-[#014582] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {key === 'expiring' ? 'Expiring Soon' : 'Expired'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No {tab === 'expired' ? 'expired' : 'expiring'} products
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3 text-right">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-right">{p.currentStock}</td>
                    <td className="px-4 py-3">{formatDate(p.expiryDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          p.daysLeft < 0 ? 'text-red-600' : p.daysLeft <= 7 ? 'text-amber-600' : 'text-gray-700'
                        }`}
                      >
                        {p.daysLeft}
                      </span>
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
/** Next.js route shell — real UI mounts via ModuleViewHost. */
export default function ModuleRoutePlaceholder() {
  return null;
}
