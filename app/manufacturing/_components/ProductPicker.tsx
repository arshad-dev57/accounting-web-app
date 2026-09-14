'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Package, Search, X } from 'lucide-react';
import { productService, getProductId, type Product } from '@/api/product/route';
import { useLocation } from '@/lib/location-context';
import { MfgButton, MfgEmpty, MfgLoading, MfgPagination } from '../ui';

export type PickedProduct = {
  id: string;
  name: string;
  sku?: string;
  currentStock?: number;
  quantity?: number;
};

function toPicked(p: Product): PickedProduct {
  return {
    id: String(getProductId(p) || p.id || ''),
    name: p.name,
    sku: p.sku,
    currentStock: Number(p.currentStock || p.locationStock || 0),
  };
}

function productKey(p: Product, index?: number) {
  return String(getProductId(p) || p.id || p._id || p.sku || `row-${index ?? 0}`);
}

export function ProductPicker({
  selected = [],
  onChange,
  multiple = true,
  placeholder = 'Select product…',
  withQuantity = false,
}: {
  selected?: PickedProduct[];
  onChange: (products: PickedProduct[]) => void;
  multiple?: boolean;
  placeholder?: string;
  withQuantity?: boolean;
}) {
  const { locationIdForApi } = useLocation();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<PickedProduct[]>(selected);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(draftSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [draftSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts({
        page,
        limit: 15,
        search: search || undefined,
        locationId: locationIdForApi || undefined,
      });
      setRows(res.data || []);
      setTotal(res.pagination?.total || res.count || 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, locationIdForApi]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const openModal = () => {
    setDraft(selected);
    setDraftSearch('');
    setSearch('');
    setPage(1);
    setOpen(true);
  };

  const selectedIds = useMemo(() => new Set(draft.map((p) => p.id)), [draft]);

  const toggle = (product: Product) => {
    const picked = toPicked(product);
    if (!picked.id) return;
    setDraft((prev) => {
      if (prev.some((p) => p.id === picked.id)) {
        return prev.filter((p) => p.id !== picked.id);
      }
      if (!multiple) return [{ ...picked, quantity: 1 }];
      return [...prev, { ...picked, quantity: picked.quantity ?? 1 }];
    });
  };

  const confirm = () => {
    onChange(draft);
    setOpen(false);
  };

  const removeChip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((p) => p.id !== id));
  };

  const label = selected.length === 0
    ? placeholder
    : multiple
      ? `${selected.length} product${selected.length === 1 ? '' : 's'} selected`
      : selected[0].name;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openModal}
        className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm text-left border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]/50 transition-all flex items-center justify-between gap-2"
      >
        <span className={selected.length ? 'text-[#1A1A2E] font-medium truncate' : 'text-[#A9B7C9]'}>
          {label}
        </span>
        <Search className="w-4 h-4 text-[#7A8FA6] shrink-0" />
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#014582]/8 text-[11px] font-semibold text-[#014582]">
              {p.name}
              {p.sku ? <span className="text-[#7A8FA6] font-medium">({p.sku})</span> : null}
              <button type="button" onClick={(e) => removeChip(p.id, e)} className="ml-0.5 hover:text-[#E74C3C]">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {withQuantity && selected.length > 0 && (
        <div className="rounded-xl border border-[#DDE4EE] overflow-hidden">
          {selected.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 border-b border-[#DDE4EE] last:border-0">
              <p className="text-xs font-semibold text-[#1A1A2E] truncate">{p.name}</p>
              <input
                type="number"
                min={0.01}
                step="any"
                value={p.quantity ?? 1}
                onChange={(e) => {
                  const qty = Number(e.target.value);
                  onChange(selected.map((item) => item.id === p.id ? { ...item, quantity: qty } : item));
                }}
                className="w-24 bg-white rounded-lg px-2 py-1.5 text-sm border border-[#DDE4EE]"
              />
            </div>
          ))}
        </div>
      )}

      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE4EE]">
              <div>
                <h3 className="text-sm font-extrabold text-[#1A1A2E]">
                  {multiple ? 'Select products' : 'Select a product'}
                </h3>
                <p className="text-[11px] text-[#7A8FA6] mt-0.5">
                  {multiple
                    ? 'Click products to tick them. You can select more than one, then press Add.'
                    : 'Search and pick a product. List is paginated from the backend.'}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-[#DDE4EE]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#7A8FA6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  autoFocus
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  placeholder="Search name, SKU or barcode…"
                  className="w-full bg-[#F4F7FB] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#1A1A2E] placeholder-[#7A8FA6] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                />
              </div>
              {draft.length > 0 && (
                <p className="text-[11px] font-semibold text-[#014582] mt-2">{draft.length} selected</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <MfgLoading label="Loading products…" />
              ) : rows.length === 0 ? (
                <MfgEmpty title="No products" message="Try a different search, or add products in Warehouse first." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="px-4 py-3 w-10 border-b border-[#DDE4EE]" />
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#7A8FA6] border-b border-[#DDE4EE]">Product</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#7A8FA6] border-b border-[#DDE4EE]">SKU</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#7A8FA6] border-b border-[#DDE4EE]">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p, index) => {
                      const id = productKey(p, index);
                      const pickedId = String(getProductId(p) || p.id || p._id || '');
                      const active = selectedIds.has(pickedId);
                      return (
                        <tr
                          key={id || `product-${index}`}
                          onClick={() => toggle(p)}
                          className={`cursor-pointer border-b border-[#DDE4EE]/60 last:border-0 ${active ? 'bg-[#014582]/6' : 'hover:bg-[#F0F4F8]/60'}`}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggle(p)}
                              className="w-4 h-4 rounded border-[#C6D2E3] text-[#014582] focus:ring-[#014582]/30"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-[#014582] shrink-0" />
                              <span className="font-semibold text-[#1A1A2E]">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#7A8FA6]">{p.sku || '—'}</td>
                          <td className="px-4 py-3 font-semibold">{Number(p.currentStock || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <MfgPagination page={page} total={total} limit={15} onPage={setPage} />

            <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-[#DDE4EE]">
              <p className="text-[11px] font-semibold text-[#014582]">
                {draft.length} selected
              </p>
              <div className="flex items-center gap-2">
                <MfgButton variant="secondary" onClick={() => setOpen(false)}>Cancel</MfgButton>
                <MfgButton onClick={confirm} disabled={draft.length === 0}>
                  {multiple
                    ? `Add ${draft.length || ''} product${draft.length === 1 ? '' : 's'}`.trim()
                    : 'Select product'}
                </MfgButton>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
