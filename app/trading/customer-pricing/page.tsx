'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus as FiPlus, Search as FiSearch } from 'lucide-react';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
  TradeTable,
  TradeTableHeader,
  TradeTableBody,
  TradeTableRow,
  TradeTableCell,
  TradeStatusBadge,
  TradeModal,
  TradePagination,
  ErpLinkedBanner,
  formatUsd,
} from '@/components/trade/TradeUI';
import {
  tradingService,
  type TradingCustomerPrice,
  type TradingPriceList,
} from '@/lib/trading-service';

type CustomerOption = { id: string; name: string; customerNumber?: string };
type ProductOption = {
  id: string;
  name: string;
  sku: string;
  costPrice?: number;
  sellingPrice?: number;
  wholesalePrice?: number;
  stockUnitName?: string;
  currencyCode?: string;
};

const STATUSES = ['Active', 'Draft', 'Under Review', 'Expired'];
const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];

async function fetchCustomers(q: string): Promise<CustomerOption[]> {
  const token = localStorage.getItem('auth_token');
  const params = new URLSearchParams({ page: '1', limit: '20' });
  if (q.trim()) params.set('search', q.trim());
  const res = await fetch(`/api/warehouse/customers?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  const rows = json?.data?.customers || json?.data || json?.customers || [];
  return (Array.isArray(rows) ? rows : []).map((c: any) => ({
    id: c.id,
    name: c.name,
    customerNumber: c.customerNumber || c.code,
  }));
}

async function fetchProducts(q: string): Promise<ProductOption[]> {
  const token = localStorage.getItem('auth_token');
  const params = new URLSearchParams({ page: '1', limit: '20' });
  if (q.trim()) params.set('search', q.trim());
  const res = await fetch(`/api/warehouse/products?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  const rows = json?.data?.products || json?.data || json?.products || [];
  return (Array.isArray(rows) ? rows : []).map((p: any) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    costPrice: Number(p.costPrice) || 0,
    sellingPrice: Number(p.sellingPrice) || 0,
    wholesalePrice: Number(p.wholesalePrice) || 0,
    stockUnitName: p.stockUnitName || 'Pcs',
    currencyCode: p.currencyCode || 'PKR',
  }));
}

export default function TradingCustomerPricingPage() {
  const [agreements, setAgreements] = useState<TradingCustomerPrice[]>([]);
  const [priceLists, setPriceLists] = useState<TradingPriceList[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [customerLabel, setCustomerLabel] = useState('');
  const [productId, setProductId] = useState('');
  const [productLabel, setProductLabel] = useState('');
  const [priceListId, setPriceListId] = useState('');
  const [currencyCode, setCurrencyCode] = useState('PKR');
  const [unitName, setUnitName] = useState('Pcs');
  const [listPrice, setListPrice] = useState(0);
  const [negotiatedPrice, setNegotiatedPrice] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [targetMarginPct, setTargetMarginPct] = useState(20);
  const [minOrderQty, setMinOrderQty] = useState(1);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [effectiveUntil, setEffectiveUntil] = useState('');
  const [status, setStatus] = useState('Active');
  const [notes, setNotes] = useState('');
  const [costPreview, setCostPreview] = useState(0);

  const [customerQuery, setCustomerQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [showProductDrop, setShowProductDrop] = useState(false);

  const pageSize = 10;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [prices, lists] = await Promise.all([
        tradingService.listCustomerPrices(),
        tradingService.listPriceLists(),
      ]);
      setAgreements(prices);
      setPriceLists(lists.filter((p) => p.isActive));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load customer pricing');
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!showCustomerDrop) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const rows = await fetchCustomers(customerQuery);
        if (!cancelled) setCustomerOptions(rows);
      } catch {
        if (!cancelled) setCustomerOptions([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [customerQuery, showCustomerDrop]);

  useEffect(() => {
    if (!showProductDrop) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const rows = await fetchProducts(productQuery);
        if (!cancelled) setProductOptions(rows);
      } catch {
        if (!cancelled) setProductOptions([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [productQuery, showProductDrop]);

  useEffect(() => {
    if (listPrice > 0 && negotiatedPrice >= 0) {
      setDiscountPercentage(
        Number((((listPrice - negotiatedPrice) / listPrice) * 100).toFixed(2))
      );
    }
  }, [listPrice, negotiatedPrice]);

  const filtered = agreements.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      (item.customer?.name || '').toLowerCase().includes(q) ||
      (item.product?.name || '').toLowerCase().includes(q) ||
      (item.product?.sku || '').toLowerCase().includes(q) ||
      (item.currencyCode || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const marginPreview =
    negotiatedPrice > 0 ? ((negotiatedPrice - costPreview) / negotiatedPrice) * 100 : 0;

  const resetForm = () => {
    setCustomerId('');
    setCustomerLabel('');
    setProductId('');
    setProductLabel('');
    setPriceListId('');
    setCurrencyCode('PKR');
    setUnitName('Pcs');
    setListPrice(0);
    setNegotiatedPrice(0);
    setDiscountPercentage(0);
    setTargetMarginPct(20);
    setMinOrderQty(1);
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setEffectiveUntil('');
    setStatus('Active');
    setNotes('');
    setCostPreview(0);
    setCustomerQuery('');
    setProductQuery('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !productId) {
      setError('Select a customer and product');
      return;
    }
    if (!(Number(minOrderQty) > 0) || Number.isNaN(Number(minOrderQty))) {
      setError('Min order qty must be greater than 0');
      return;
    }
    if (!(Number(listPrice) >= 0) || Number.isNaN(Number(listPrice))) {
      setError('List price must be a number ≥ 0');
      return;
    }
    if (!(Number(negotiatedPrice) >= 0) || Number.isNaN(Number(negotiatedPrice))) {
      setError('Negotiated price must be a number ≥ 0');
      return;
    }
    if (Number(discountPercentage) < 0 || Number(targetMarginPct) < 0) {
      setError('Discount and target margin cannot be negative');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await tradingService.upsertCustomerPrice({
        customerId,
        productId,
        priceListId: priceListId || null,
        currencyCode,
        unitName,
        listPrice,
        negotiatedPrice,
        discountPercentage,
        targetMarginPct,
        minOrderQty,
        effectiveFrom: effectiveFrom || null,
        effectiveUntil: effectiveUntil || null,
        status,
        notes: notes.trim() || null,
      });
      setIsNewModalOpen(false);
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save agreement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Customer Pricing Agreements"
        description="Contract / negotiated prices per customer–SKU with currency, UOM, validity, discount, and target margin."
        badge="Customer Pricing"
        actions={
          <button
            onClick={() => {
              resetForm();
              setIsNewModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
          >
            <FiPlus className="w-4 h-4" /> New Agreement
          </button>
        }
      />

      <ErpLinkedBanner
        moduleLabel="Customer Pricing"
        erpModuleLabel="Customers / Products"
        erpHref="/warehouse/customers"
        description="International pattern: customer + product + optional price list, list vs negotiated, validity window, min order qty, target margin."
      />

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          {error}
        </div>
      )}

      <TradeCard>
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative max-w-sm flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, product, SKU, currency…"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {['ALL', ...STATUSES].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
                  statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={[
              'Customer',
              'SKU',
              'Product',
              'List',
              'CCY',
              'Negotiated',
              'Disc %',
              'Target M%',
              'Margin Est.',
              'Valid To',
              'Status',
            ]}
          />
          <TradeTableBody>
            {loading ? (
              <TradeTableRow>
                <TradeTableCell className="py-10 text-center text-slate-500">
                  Loading…
                </TradeTableCell>
              </TradeTableRow>
            ) : paginated.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="py-10 text-center text-slate-500">
                  No customer pricing agreements yet.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              paginated.map((item) => {
                const cost = Number(item.product?.costPrice || 0);
                const sell = Number(item.negotiatedPrice || 0);
                const marginPct = sell > 0 ? ((sell - cost) / sell) * 100 : 0;
                return (
                  <TradeTableRow key={item.id}>
                    <TradeTableCell className="font-semibold">
                      {item.customer?.name || item.customerId.slice(0, 8)}
                    </TradeTableCell>
                    <TradeTableCell>{item.product?.sku || '—'}</TradeTableCell>
                    <TradeTableCell>{item.product?.name || '—'}</TradeTableCell>
                    <TradeTableCell>{formatUsd(Number(item.listPrice))}</TradeTableCell>
                    <TradeTableCell>{item.currencyCode || 'PKR'}</TradeTableCell>
                    <TradeTableCell className="font-bold">{formatUsd(sell)}</TradeTableCell>
                    <TradeTableCell>
                      {Number(item.discountPercentage || 0).toFixed(1)}%
                    </TradeTableCell>
                    <TradeTableCell>
                      {Number(item.targetMarginPct || 20).toFixed(1)}%
                    </TradeTableCell>
                    <TradeTableCell className="text-emerald-700">
                      {marginPct.toFixed(1)}%
                    </TradeTableCell>
                    <TradeTableCell>
                      {item.effectiveUntil
                        ? new Date(item.effectiveUntil).toLocaleDateString()
                        : 'Open'}
                    </TradeTableCell>
                    <TradeTableCell>
                      <TradeStatusBadge status={item.status} />
                    </TradeTableCell>
                  </TradeTableRow>
                );
              })
            )}
          </TradeTableBody>
        </TradeTable>

        <div className="p-4 border-t border-slate-100">
          <TradePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </TradeCard>

      <TradeModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          resetForm();
        }}
        title="New Customer Price Agreement"
      >
        <form onSubmit={handleCreate} className="space-y-3 p-1 max-h-[75vh] overflow-y-auto">
          <div className="relative">
            <label className="text-[11px] text-slate-500">Customer *</label>
            <input
              required
              value={showCustomerDrop ? customerQuery : customerLabel}
              onFocus={() => {
                setShowCustomerDrop(true);
                setCustomerQuery(customerLabel);
              }}
              onChange={(e) => {
                setShowCustomerDrop(true);
                setCustomerQuery(e.target.value);
                setCustomerLabel(e.target.value);
                setCustomerId('');
              }}
              placeholder="Search customer…"
              className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
            />
            {showCustomerDrop && customerOptions.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-40 overflow-auto bg-white border rounded-lg shadow-lg">
                {customerOptions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-2 py-1.5 text-[11px] hover:bg-emerald-50"
                    onClick={() => {
                      setCustomerId(c.id);
                      setCustomerLabel(
                        c.customerNumber ? `${c.customerNumber} — ${c.name}` : c.name
                      );
                      setShowCustomerDrop(false);
                    }}
                  >
                    {c.customerNumber ? `${c.customerNumber} — ` : ''}
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="text-[11px] text-slate-500">Product *</label>
            <input
              required
              value={showProductDrop ? productQuery : productLabel}
              onFocus={() => {
                setShowProductDrop(true);
                setProductQuery(productLabel);
              }}
              onChange={(e) => {
                setShowProductDrop(true);
                setProductQuery(e.target.value);
                setProductLabel(e.target.value);
                setProductId('');
              }}
              placeholder="Search SKU or product…"
              className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
            />
            {showProductDrop && productOptions.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-40 overflow-auto bg-white border rounded-lg shadow-lg">
                {productOptions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-2 py-1.5 text-[11px] hover:bg-emerald-50"
                    onClick={() => {
                      setProductId(p.id);
                      setProductLabel(`${p.sku} — ${p.name}`);
                      setUnitName(p.stockUnitName || 'Pcs');
                      setCurrencyCode(p.currencyCode || 'PKR');
                      setListPrice(Number(p.sellingPrice) || Number(p.wholesalePrice) || 0);
                      setNegotiatedPrice(Number(p.wholesalePrice) || Number(p.sellingPrice) || 0);
                      setCostPreview(Number(p.costPrice) || 0);
                      setShowProductDrop(false);
                    }}
                  >
                    <span className="font-semibold">{p.sku}</span> — {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-500">Linked price list</label>
              <select
                value={priceListId}
                onChange={(e) => setPriceListId(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              >
                <option value="">— None —</option>
                {priceLists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.code} — {pl.name} ({pl.tier})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Currency</label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">UOM</label>
              <input
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Min order qty</label>
              <input
                type="number"
                min={0}
                step="any"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">List / MSRP *</label>
              <input
                type="number"
                min={0}
                step="any"
                required
                value={listPrice}
                onChange={(e) => setListPrice(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Negotiated price *</label>
              <input
                type="number"
                min={0}
                step="any"
                required
                value={negotiatedPrice}
                onChange={(e) => setNegotiatedPrice(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Discount %</label>
              <input
                type="number"
                min={0}
                step="any"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Target margin %</label>
              <input
                type="number"
                min={0}
                step="any"
                value={targetMarginPct}
                onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Effective from</label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Effective until</label>
              <input
                type="date"
                value={effectiveUntil}
                onChange={(e) => setEffectiveUntil(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="text-[10px] text-slate-500">Est. gross margin (vs cost)</div>
              <div
                className={`text-sm font-bold ${
                  marginPreview >= targetMarginPct ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {marginPreview.toFixed(1)}%
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              placeholder="Contract #, approval, special terms…"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Agreement'}
          </button>
        </form>
      </TradeModal>
    </TradePage>
  );
}
