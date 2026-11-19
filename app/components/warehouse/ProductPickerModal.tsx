'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Search,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export interface PickerProduct {
  id: string;
  name: string;
  sku: string;
  currentStock?: number;
  availableStock?: number;
  costPrice?: number;
  averageCost?: number;
  stockUnitName?: string;
  categoryName?: string;
  barcodeNumber?: string;
}

interface ProductPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: PickerProduct) => void;
  locationId?: string;
  title?: string;
  excludeProductIds?: string[];
}

export default function ProductPickerModal({
  open,
  onClose,
  onSelect,
  locationId,
  title = 'Select product',
  excludeProductIds = [],
}: ProductPickerModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [products, setProducts] = useState<PickerProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  }, [open]);

  const fetchProducts = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (locationId) params.set('locationId', locationId);

      const res = await apiClient.get(`/api/warehouse/products?${params.toString()}`);
      const body = res.data;
      const rows = Array.isArray(body)
        ? body
        : Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body?.data?.data)
            ? body.data.data
            : [];
      const pagination = body?.pagination || body?.data?.pagination;
      setProducts(rows);
      setTotal(pagination?.total ?? rows.length);
      setPages(pagination?.pages || pagination?.totalPages || 1);
    } catch (err) {
      console.error('Product picker fetch failed', err);
      setProducts([]);
      setTotal(0);
      setPages(1);
    } finally {
      setLoading(false);
    }
  }, [open, page, limit, debouncedSearch, locationId]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  if (!open) return null;

  const excluded = new Set(excludeProductIds);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#014582]" />
              {title}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Search and pick a product from the catalog
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-4 md:px-6 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, SKU, or barcode…"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#014582]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-7 h-7 mx-auto animate-spin text-[#014582]" />
              <p className="text-sm text-gray-500 mt-2">Loading products…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No products found</p>
              <p className="text-xs mt-1">Try a different search</p>
            </div>
          ) : (
            <table className="w-full text-xs md:text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 md:px-6 py-2.5 font-semibold text-gray-500 uppercase text-[10px]">
                    Product
                  </th>
                  <th className="text-left px-4 md:px-6 py-2.5 font-semibold text-gray-500 uppercase text-[10px] hidden sm:table-cell">
                    SKU
                  </th>
                  <th className="text-left px-4 md:px-6 py-2.5 font-semibold text-gray-500 uppercase text-[10px] hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-right px-4 md:px-6 py-2.5 font-semibold text-gray-500 uppercase text-[10px]">
                    Stock
                  </th>
                  <th className="text-right px-4 md:px-6 py-2.5 font-semibold text-gray-500 uppercase text-[10px] hidden sm:table-cell">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => {
                  const disabled = excluded.has(prod.id);
                  const stock = Number(prod.availableStock ?? prod.currentStock ?? 0);
                  const cost = Number(prod.averageCost ?? prod.costPrice ?? 0);
                  return (
                    <tr
                      key={prod.id}
                      onClick={() => {
                        if (disabled) return;
                        onSelect(prod);
                        onClose();
                      }}
                      className={`border-b border-gray-50 transition-colors ${
                        disabled
                          ? 'opacity-40 cursor-not-allowed bg-gray-50'
                          : 'cursor-pointer hover:bg-[#014582]/5'
                      }`}
                    >
                      <td className="px-4 md:px-6 py-3">
                        <p className="font-semibold text-gray-800">{prod.name}</p>
                        {prod.barcodeNumber && (
                          <p className="text-[10px] font-mono text-gray-400">
                            {prod.barcodeNumber}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 sm:hidden font-mono">
                          {prod.sku || '—'}
                        </p>
                      </td>
                      <td className="px-4 md:px-6 py-3 font-mono text-gray-500 hidden sm:table-cell">
                        {prod.sku || '—'}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-gray-600 hidden md:table-cell">
                        {prod.categoryName || '—'}
                      </td>
                      <td
                        className={`px-4 md:px-6 py-3 text-right font-semibold ${
                          stock <= 0 ? 'text-red-600' : 'text-gray-800'
                        }`}
                      >
                        {stock} {prod.stockUnitName || 'Pcs'}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-right text-gray-700 hidden sm:table-cell">
                        {cost.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between gap-3 bg-gray-50">
          <p className="text-[10px] md:text-xs text-gray-500">
            Page {page} of {Math.max(pages, 1)} · {total} products
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="p-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
