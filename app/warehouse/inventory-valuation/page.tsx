'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, RefreshCw, Search, Wallet } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useLocation } from '@/lib/location-context';
import { loadCurrencyLocal } from '../../../lib/currency-service';

type ValuationItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  qty: number;
  unitCost: number;
  sellingPrice: number;
  totalCostValue: number;
  sellingValue: number;
  potentialProfit: number;
  profitMargin: string | number;
  status: string;
};

type ValuationSummary = {
  totalItems: number;
  totalQty: number;
  totalCostValue: number;
  totalSellingValue: number;
  totalPotentialProfit: number;
  lowStockCount: number;
  overStockCount: number;
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

function statusBadge(status: string) {
  if (status === 'LOW') return 'bg-amber-100 text-amber-700';
  if (status === 'OVER') return 'bg-violet-100 text-violet-700';
  return 'bg-emerald-100 text-emerald-700';
}

export function InventoryValuationPage() {
  const { selectedLocationId, selectedLocation } = useLocation();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [items, setItems] = useState<ValuationItem[]>([]);
  const [summary, setSummary] = useState<ValuationSummary | null>(null);

  const loadData = useCallback(async () => {
    if (!selectedLocationId) {
      setItems([]);
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());
      params.set('locationId', selectedLocationId);
      const qs = params.toString();
      const response = await apiClient.get(
        `/api/warehouse/inventory/valuation?${qs}`
      );
      if (response.success && response.data?.data) {
        setItems(response.data.data.items || []);
        setSummary(response.data.data.summary || null);
      } else {
        setItems([]);
        setSummary(null);
      }
    } catch (e) {
      console.error('Inventory valuation load failed:', e);
      setItems([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [category, search, selectedLocationId]);

  useEffect(() => {
    const t = setTimeout(() => loadData(), search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadData, search]);

  useEffect(() => {
    setCategory('all');
  }, [selectedLocationId]);

  const categories = useMemo(() => {
    const names = new Set(items.map((i) => i.category).filter(Boolean));
    return ['all', ...Array.from(names).sort()];
  }, [items]);

  const cards = [
    { label: 'Total Cost Value', value: formatMoney(summary?.totalCostValue || 0) },
    { label: 'Selling Value', value: formatMoney(summary?.totalSellingValue || 0) },
    { label: 'Potential Profit', value: formatMoney(summary?.totalPotentialProfit || 0) },
    { label: 'Total Qty', value: String(summary?.totalQty || 0) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-7 h-7 text-[#014582]" />
            Inventory Valuation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Stock cost, selling value, and profit by product
            {selectedLocation ? ` · ${selectedLocation.name}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {selectedLocation && (
        <div className="flex items-center gap-2 text-sm text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          Showing valuation for <strong>{selectedLocation.name}</strong>
          <span className="text-sky-600 font-mono text-xs">({selectedLocation.code})</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{c.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]/30"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white min-w-[180px]"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All Categories' : c}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#014582] mb-2" />
            Loading valuation...
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No products at this warehouse
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Cost Value</th>
                  <th className="px-4 py-3 text-right">Selling Value</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 text-right font-medium">{item.qty}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(item.totalCostValue)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(item.sellingValue)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      {formatMoney(item.potentialProfit)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadge(item.status)}`}>
                        {item.status}
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
