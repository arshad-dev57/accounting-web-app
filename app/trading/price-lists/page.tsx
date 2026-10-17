'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus as FiPlus, Search as FiSearch, Pencil, Trash2 } from 'lucide-react';
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
} from '@/components/trade/TradeUI';
import {
  tradingService,
  type TradingPriceList,
  type PriceListInput,
} from '@/lib/trading-service';
import {
  ProductPicker,
  type PickedProduct,
} from '@/manufacturing/_components/ProductPicker';

type LineDraft = {
  key: string;
  productId: string;
  productLabel: string;
  unitName: string;
  listPrice: number;
  unitPrice: number;
  minQty: number;
  maxQty: string;
  discountPercentage: number;
  markupPercentage: number;
};

const TIERS = ['Distributor', 'Wholesale', 'Retail', 'Key Account', 'Contract', 'Spot'];
const METHODS = [
  { value: 'Fixed', label: 'Fixed unit price' },
  { value: 'MarkupOnCost', label: 'Markup on cost' },
  { value: 'DiscountOnList', label: 'Discount on list / MSRP' },
];
const COST_BASES = [
  { value: 'CostPrice', label: 'Cost price' },
  { value: 'AverageCost', label: 'Average cost' },
  { value: 'LastPurchase', label: 'Last purchase' },
  { value: 'StandardCost', label: 'Standard cost' },
];
const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];

function lineFromPicked(
  p: PickedProduct,
  pricingMethod: string,
  headerDiscount: number,
  headerMarkup: number
): LineDraft {
  const list = Number(p.sellingPrice) || Number(p.wholesalePrice) || 0;
  const cost = Number(p.costPrice) || 0;
  let unit = list;
  if (pricingMethod === 'MarkupOnCost' && cost > 0) {
    unit = cost * (1 + headerMarkup / 100);
  } else if (pricingMethod === 'DiscountOnList' && list > 0) {
    unit = list * (1 - headerDiscount / 100);
  } else if (p.wholesalePrice) {
    unit = Number(p.wholesalePrice);
  } else if (list > 0) {
    unit = list;
  }
  return {
    key: `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: p.id,
    productLabel: p.sku ? `${p.sku} — ${p.name}` : p.name,
    unitName: p.stockUnit || 'Pcs',
    listPrice: list,
    unitPrice: Number(unit.toFixed(2)),
    minQty: 1,
    maxQty: '',
    discountPercentage: 0,
    markupPercentage: 0,
  };
}

export default function TradingPriceListsPage() {
  const [priceLists, setPriceLists] = useState<TradingPriceList[]>([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [tier, setTier] = useState('Wholesale');
  const [currencyCode, setCurrencyCode] = useState('PKR');
  const [pricingMethod, setPricingMethod] = useState('Fixed');
  const [costBasis, setCostBasis] = useState('CostPrice');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [markupPercentage, setMarkupPercentage] = useState(0);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [effectiveTo, setEffectiveTo] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [pickerLineKey, setPickerLineKey] = useState<string | null>(null);

  const pageSize = 10;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPriceLists(await tradingService.listPriceLists());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load price lists');
      setPriceLists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = priceLists.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.tier.toLowerCase().includes(q) ||
      (item.currencyCode || '').toLowerCase().includes(q);
    const matchTier = tierFilter === 'ALL' || item.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetForm = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setTier('Wholesale');
    setCurrencyCode('PKR');
    setPricingMethod('Fixed');
    setCostBasis('CostPrice');
    setDiscountPercentage(0);
    setMarkupPercentage(0);
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setEffectiveTo('');
    setNotes('');
    setIsActive(true);
    setLines([]);
    setPickerLineKey(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = async (row: TradingPriceList) => {
    try {
      setError(null);
      const full = await tradingService.getPriceList(row.id);
      setEditingId(full.id);
      setCode(full.code);
      setName(full.name);
      setTier(full.tier || 'Wholesale');
      setCurrencyCode(full.currencyCode || 'PKR');
      setPricingMethod(full.pricingMethod || 'Fixed');
      setCostBasis(full.costBasis || 'CostPrice');
      setDiscountPercentage(Number(full.discountPercentage) || 0);
      setMarkupPercentage(Number(full.markupPercentage) || 0);
      setEffectiveFrom(
        full.effectiveFrom
          ? new Date(full.effectiveFrom).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setEffectiveTo(
        full.effectiveTo ? new Date(full.effectiveTo).toISOString().slice(0, 10) : ''
      );
      setNotes(full.notes || '');
      setIsActive(full.isActive !== false);
      setLines(
        (full.items || []).length
          ? (full.items || []).map((i) => ({
              key: i.id || `${i.productId}-${i.minQty}`,
              productId: i.productId,
              productLabel: i.product
                ? `${i.product.sku} — ${i.product.name}`
                : i.productId,
              unitName: i.unitName || i.product?.stockUnitName || 'Pcs',
              listPrice: Number(i.listPrice ?? i.product?.sellingPrice ?? 0),
              unitPrice: Number(i.unitPrice) || 0,
              minQty: Number(i.minQty) || 1,
              maxQty: i.maxQty != null ? String(i.maxQty) : '',
              discountPercentage: Number(i.discountPercentage) || 0,
              markupPercentage: Number(i.markupPercentage) || 0,
            }))
          : []
      );
      setModalOpen(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to open price list');
    }
  };

  const buildPayload = (): PriceListInput => ({
    code:
      code.trim() ||
      `PL-${tier.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    tier,
    currencyCode,
    pricingMethod,
    costBasis,
    discountPercentage,
    markupPercentage,
    effectiveFrom,
    effectiveTo: effectiveTo || null,
    isActive,
    notes: notes.trim() || undefined,
    items: lines
      .filter((l) => l.productId && Number(l.unitPrice) > 0)
      .map((l) => ({
        productId: l.productId,
        unitName: l.unitName || 'Pcs',
        unitPrice: Number(l.unitPrice),
        listPrice: Number(l.listPrice) || null,
        minQty: Number(l.minQty) || 1,
        maxQty: l.maxQty !== '' ? Number(l.maxQty) : null,
        discountPercentage: Number(l.discountPercentage) || 0,
        markupPercentage: Number(l.markupPercentage) || 0,
      })),
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Price list name is required');
      return;
    }
    if (Number(discountPercentage) < 0 || Number(markupPercentage) < 0) {
      setError('Header discount and markup cannot be negative');
      return;
    }
    if (!lines.some((l) => l.productId)) {
      setError('Add at least one product from the catalog modal');
      return;
    }
    for (const l of lines.filter((x) => x.productId)) {
      if (!(Number(l.unitPrice) >= 0) || Number.isNaN(Number(l.unitPrice))) {
        setError(`Net price must be a valid number ≥ 0 for ${l.productLabel || 'product'}`);
        return;
      }
      if (!(Number(l.minQty) > 0) || Number.isNaN(Number(l.minQty))) {
        setError(`Min qty must be greater than 0 for ${l.productLabel || 'product'}`);
        return;
      }
      if (l.maxQty !== '' && Number(l.maxQty) < Number(l.minQty)) {
        setError(`Max qty must be ≥ min qty for ${l.productLabel || 'product'}`);
        return;
      }
      if (Number(l.discountPercentage) < 0 || Number(l.markupPercentage) < 0) {
        setError(`Discount / markup cannot be negative for ${l.productLabel || 'product'}`);
        return;
      }
    }
    try {
      setSaving(true);
      setError(null);
      const payload = buildPayload();
      if (editingId) await tradingService.updatePriceList(editingId, payload);
      else await tradingService.createPriceList(payload);
      setModalOpen(false);
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save price list');
    } finally {
      setSaving(false);
    }
  };

  /** Multi-select from company catalog → append new price lines */
  const handleBulkPickProducts = (picked: PickedProduct[]) => {
    setLines((prev) => {
      const existing = new Set(prev.map((l) => l.productId).filter(Boolean));
      const additions = picked
        .filter((p) => p.id && !existing.has(p.id))
        .map((p) =>
          lineFromPicked(p, pricingMethod, discountPercentage, markupPercentage)
        );
      const kept = prev.filter((l) => l.productId);
      return [...kept, ...additions];
    });
    setPickerLineKey(null);
  };

  /** Single-select to set/replace product on one line */
  const handleLinePickProduct = (lineKey: string, picked: PickedProduct[]) => {
    const p = picked[0];
    if (!p?.id) return;
    const next = lineFromPicked(p, pricingMethod, discountPercentage, markupPercentage);
    setLines((prev) =>
      prev.map((l) =>
        l.key === lineKey
          ? {
              ...next,
              key: l.key,
              minQty: l.minQty,
              maxQty: l.maxQty,
              discountPercentage: l.discountPercentage,
              markupPercentage: l.markupPercentage,
            }
          : l
      )
    );
    setPickerLineKey(null);
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Product Price Lists"
        description="Standard wholesale price matrices: currency, validity, pricing method, cost basis, and quantity-break lines."
        badge="Pricing Master"
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            Create Price List
          </button>
        }
      />

      <ErpLinkedBanner
        moduleLabel="Trading Price Lists"
        erpModuleLabel="Products"
        erpHref="/warehouse/products"
        description="Maintain tiered lists with UOM, min/max qty, list vs net price, and validity. Assign lists on customer pricing agreements."
      />

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <TradeCard className="p-4 border-l-4 border-l-emerald-500">
          <div className="text-xs text-slate-500 font-medium">Active Lists</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {priceLists.filter((p) => p.isActive).length}
          </div>
        </TradeCard>
        <TradeCard className="p-4 border-l-4 border-l-blue-500">
          <div className="text-xs text-slate-500 font-medium">Total Lists</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{priceLists.length}</div>
        </TradeCard>
        <TradeCard className="p-4 border-l-4 border-l-violet-500">
          <div className="text-xs text-slate-500 font-medium">Priced SKUs</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {priceLists.reduce((n, p) => n + (p.items?.length || 0), 0)}
          </div>
        </TradeCard>
        <TradeCard className="p-4 border-l-4 border-l-amber-500">
          <div className="text-xs text-slate-500 font-medium">Currencies</div>
          <div className="text-sm font-bold text-slate-900 mt-1">
            {[...new Set(priceLists.map((p) => p.currencyCode).filter(Boolean))].join(', ') ||
              '—'}
          </div>
        </TradeCard>
      </div>

      <TradeCard>
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search code, name, tier, currency…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {['ALL', ...TIERS].map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
                  tierFilter === t ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={[
              'Code',
              'Name',
              'Tier',
              'Method',
              'Currency',
              'Items',
              'Valid From',
              'Valid To',
              'Status',
              '',
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
                  No price lists yet. Create one with product lines.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              paginated.map((item) => (
                <TradeTableRow key={item.id}>
                  <TradeTableCell className="font-semibold">{item.code}</TradeTableCell>
                  <TradeTableCell>{item.name}</TradeTableCell>
                  <TradeTableCell>{item.tier}</TradeTableCell>
                  <TradeTableCell>{item.pricingMethod || 'Fixed'}</TradeTableCell>
                  <TradeTableCell>{item.currencyCode}</TradeTableCell>
                  <TradeTableCell>{item.items?.length || 0}</TradeTableCell>
                  <TradeTableCell>
                    {item.effectiveFrom
                      ? new Date(item.effectiveFrom).toLocaleDateString()
                      : '—'}
                  </TradeTableCell>
                  <TradeTableCell>
                    {item.effectiveTo
                      ? new Date(item.effectiveTo).toLocaleDateString()
                      : 'Open'}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={item.isActive ? 'Active' : 'Inactive'} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </TradeTableCell>
                </TradeTableRow>
              ))
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
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingId ? 'Edit Price List' : 'Create Price List'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-4 p-1 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500">Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
                placeholder="Auto if blank"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Customer / channel tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
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
              <label className="text-[11px] text-slate-500">Pricing method</label>
              <select
                value={pricingMethod}
                onChange={(e) => setPricingMethod(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Cost basis</label>
              <select
                value={costBasis}
                onChange={(e) => setCostBasis(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              >
                {COST_BASES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Header discount %</label>
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
              <label className="text-[11px] text-slate-500">Header markup %</label>
              <input
                type="number"
                min={0}
                step="any"
                value={markupPercentage}
                onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Effective from *</label>
              <input
                type="date"
                required
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Effective to</label>
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full mt-1 px-2 py-1.5 text-xs border rounded-lg"
              placeholder="Contract reference, region, approval notes…"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active price list
          </label>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Price list lines</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Browse company products, then set list / net price and quantity breaks.
                  </p>
                </div>
                {lines.length > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                    {lines.length} item{lines.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <ProductPicker
                multiple
                allLocations
                selected={[]}
                onChange={handleBulkPickProducts}
                placeholder="Browse & select products from catalog…"
              />
            </div>

            <div className="p-3 sm:p-4 space-y-3 bg-white">
              {lines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-slate-600">No products yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Open the catalog modal above to add company products.
                  </p>
                </div>
              ) : (
                lines.map((line, index) => {
                  const skuPart = line.productLabel.includes(' — ')
                    ? line.productLabel.split(' — ')[0]
                    : '';
                  const namePart = line.productLabel.includes(' — ')
                    ? line.productLabel.split(' — ').slice(1).join(' — ')
                    : line.productLabel;

                  return (
                    <div
                      key={line.key}
                      className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                    >
                      {/* Product header */}
                      <div className="flex items-start gap-3 px-3 sm:px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-bold text-emerald-800">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          {pickerLineKey === line.key ? (
                            <ProductPicker
                              multiple={false}
                              allLocations
                              selected={
                                line.productId
                                  ? [
                                      {
                                        id: line.productId,
                                        name: namePart || line.productLabel,
                                        sku: skuPart || undefined,
                                        stockUnit: line.unitName,
                                      },
                                    ]
                                  : []
                              }
                              onChange={(picked) => handleLinePickProduct(line.key, picked)}
                              placeholder="Select product…"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPickerLineKey(line.key)}
                              className="w-full text-left group"
                            >
                              <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 truncate">
                                {namePart || 'Choose product…'}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                {skuPart ? (
                                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                    {skuPart}
                                  </span>
                                ) : null}
                                <span className="text-emerald-700 font-medium">Change product</span>
                              </div>
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setLines((prev) => prev.filter((l) => l.key !== line.key))
                          }
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                          title="Remove line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Pricing fields */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3 sm:p-4">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            UOM
                          </label>
                          <input
                            value={line.unitName}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((l) =>
                                  l.key === line.key ? { ...l, unitName: e.target.value } : l
                                )
                              )
                            }
                            className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            List price
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={line.listPrice}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((l) =>
                                  l.key === line.key
                                    ? { ...l, listPrice: Number(e.target.value) }
                                    : l
                                )
                              )
                            }
                            className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Net price <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            required={!!line.productId}
                            value={line.unitPrice}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((l) =>
                                  l.key === line.key
                                    ? { ...l, unitPrice: Number(e.target.value) }
                                    : l
                                )
                              )
                            }
                            className="w-full px-2.5 py-2 text-sm font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Min qty
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={line.minQty}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((l) =>
                                  l.key === line.key
                                    ? { ...l, minQty: Number(e.target.value) }
                                    : l
                                )
                              )
                            }
                            className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Max qty
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={line.maxQty}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((l) =>
                                  l.key === line.key ? { ...l, maxQty: e.target.value } : l
                                )
                              )
                            }
                            className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            placeholder="Open"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Discount %
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={line.discountPercentage}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((l) =>
                                  l.key === line.key
                                    ? { ...l, discountPercentage: Number(e.target.value) }
                                    : l
                                )
                              )
                            }
                            className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : editingId ? 'Update Price List' : 'Save Price List'}
          </button>
        </form>
      </TradeModal>
    </TradePage>
  );
}
