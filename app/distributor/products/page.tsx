'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, Eye, ArrowUpRight } from 'lucide-react';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

export default function Product360HubPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const headers = browserCompanyAuthHeaders();
        const res = await fetch('http://localhost:5000/api/warehouse/products', { headers });
        const json = await res.json();
        if (json.success || Array.isArray(json.data)) {
          setProducts(json.data || json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-[#014582]" />
          Product 360 & Distribution Margins
        </h1>
        <p className="text-xs text-gray-500 mt-1">ERP Product Catalog with Wholesale Prices, Cost, Margin % & Stock Movement</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search product by SKU or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#014582]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-y border-gray-200">
              <tr>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Wholesale Price</th>
                <th className="py-3 px-3 text-right">Margin %</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading catalog...</td></tr>
              ) : (
                filtered.map((p) => {
                  const cost = p.costPrice || 0;
                  const price = p.sellingPrice || 0;
                  const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-blue-50/30">
                      <td className="py-3 px-3 font-mono font-bold text-[#014582]">{p.sku || '-'}</td>
                      <td className="py-3 px-3 font-bold text-gray-900">{p.name}</td>
                      <td className="py-3 px-3 text-right text-gray-700">PKR {cost.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-gray-900 font-bold">PKR {price.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-emerald-600 font-bold">PKR {(p.wholesalePrice || price).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${margin >= 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {margin}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link href="/warehouse/products" className="text-[#014582] font-bold hover:underline">
                          View Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
