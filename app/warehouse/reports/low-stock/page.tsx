'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

type LowStockProduct = {
  id: string;
  name: string;
  sku?: string;
  currentStock: number;
  minimumStock: number;
  needed: number;
  status: string;
  sellingPrice?: number;
  category?: { name?: string };
  supplier?: { name?: string };
};

export default function LowStockReportPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [summary, setSummary] = useState({ lowStockCount: 0, criticalCount: 0, totalProducts: 0 });

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/warehouse/reports/low-stock');
      if (response.success && response.data?.data) {
        setProducts(response.data.data.lowStockProducts || []);
        setSummary(response.data.data.summary || summary);
      }
    } catch (e) {
      console.error('Low stock report failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/warehouse/reports" className="inline-flex items-center gap-1 text-sm text-[#014582] font-medium mb-2 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            All Reports
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
            Low Stock Report
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
          { label: 'Low Stock Items', value: summary.lowStockCount },
          { label: 'Out of Stock', value: summary.criticalCount },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 uppercase">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No low stock items — inventory looks healthy</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Current</th>
                  <th className="px-4 py-3 text-right">Minimum</th>
                  <th className="px-4 py-3 text-right">Needed</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-right">{p.currentStock}</td>
                    <td className="px-4 py-3 text-right">{p.minimumStock}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-600">{p.needed}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          p.status === 'out_of_stock'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {p.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
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
