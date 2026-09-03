'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { loadCurrencyLocal } from '../../../../lib/currency-service';

type ProductRow = {
  _id?: string;
  id?: string;
  name: string;
  sku?: string;
  currentStock?: number;
  sellingPrice?: number;
  minimumStock?: number;
  categoryName?: string;
  category?: { name?: string };
};

function formatMoney(amount: number) {
  const { code, symbol } = loadCurrencyLocal();
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code || 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${symbol} ${(amount || 0).toLocaleString()}`;
  }
}

export function StockSummaryReportPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductRow[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/warehouse/products?limit=1000');
      if (response.success) {
        setProducts(response.data?.data || []);
      }
    } catch (e) {
      console.error('Stock summary load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    let totalValue = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const p of products) {
      const stock = p.currentStock ?? 0;
      const price = p.sellingPrice ?? 0;
      totalValue += stock * price;
      if (stock === 0) outOfStock += 1;
      else if (stock <= (p.minimumStock ?? 0)) lowStock += 1;
    }
    return { totalValue, lowStock, outOfStock, total: products.length };
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/warehouse/reports" className="inline-flex items-center gap-1 text-sm text-[#014582] font-medium mb-2 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            All Reports
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-[#014582]" />
            Stock Summary Report
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

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: String(stats.total) },
          { label: 'Stock Value', value: formatMoney(stats.totalValue) },
          { label: 'Low Stock', value: String(stats.lowStock) },
          { label: 'Out of Stock', value: String(stats.outOfStock) },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 uppercase">{c.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const stock = p.currentStock ?? 0;
                  const price = p.sellingPrice ?? 0;
                  const cat = p.categoryName || p.category?.name || '—';
                  return (
                    <tr key={p._id || p.id || p.sku} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{cat}</td>
                      <td className="px-4 py-3 text-right font-medium">{stock}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(price)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatMoney(stock * price)}</td>
                    </tr>
                  );
                })}
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
