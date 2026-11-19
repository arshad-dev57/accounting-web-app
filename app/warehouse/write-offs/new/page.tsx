'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  ArrowLeft,
  Plus,
  X,
  Save,
  Loader2,
  Package,
  Search,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import ProductPickerModal, {
  type PickerProduct,
} from '@/components/warehouse/ProductPickerModal';

interface WriteOffLine {
  productId: string;
  productName: string;
  sku: string;
  availableStock: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reason: string;
  batchNumber?: string;
}

const REASONS = [
  { value: 'Expired', label: 'Expired stock' },
  { value: 'Damaged', label: 'Damaged stock' },
  { value: 'Broken', label: 'Broken / shattered' },
  { value: 'Spoiled', label: 'Spoiled / perished' },
  { value: 'Missing', label: 'Missing / shortage' },
  { value: 'Obsolete', label: 'Obsolete / outdated' },
  { value: 'Quality Issue', label: 'Quality control rejection' },
  { value: 'Other', label: 'Other loss' },
] as const;

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function NewStockWriteOffPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [locationId, setLocationId] = useState('');
  const [reason, setReason] = useState('Damaged');
  const [notes, setNotes] = useState('');
  const [writeOffDate, setWriteOffDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<WriteOffLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingMaster(true);
      try {
        const locRes = await apiClient.get('/api/warehouse/locations');
        const locList = Array.isArray(locRes.data) ? locRes.data : locRes.data?.data || [];
        setLocations(locList);
        if (locList.length > 0) setLocationId(locList[0].id);
      } catch (err) {
        console.error('Error fetching locations:', err);
        toast.error('Failed to load warehouses');
      } finally {
        setLoadingMaster(false);
      }
    };
    void fetchLocations();
  }, []);

  const fetchStockForProduct = async (productId: string, locId: string, fallback = 0) => {
    if (!productId) return fallback;
    try {
      if (locId) {
        const res = await apiClient.get(
          `/api/warehouse/transfers/product-stock?productId=${productId}&locationId=${locId}`
        );
        if (res.success || res.data?.success) {
          const data = res.data?.data || res.data;
          const avail = data?.availableStock ?? data?.currentStock;
          if (avail != null) return Number(avail) || 0;
        }
      }
    } catch {
      /* fall through */
    }
    return fallback;
  };

  useEffect(() => {
    if (!locationId || items.length === 0) return;
    let cancelled = false;
    (async () => {
      const updated = await Promise.all(
        items.map(async (item) => {
          if (!item.productId) return item;
          const avail = await fetchStockForProduct(item.productId, locationId, item.availableStock);
          return { ...item, availableStock: avail };
        })
      );
      if (!cancelled) setItems(updated);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const openPickerForAdd = () => {
    if (!locationId) {
      toast.error('Select a warehouse first');
      return;
    }
    setPickerTargetIndex(null);
    setPickerOpen(true);
  };

  const openPickerForRow = (index: number) => {
    setPickerTargetIndex(index);
    setPickerOpen(true);
  };

  const applyProduct = async (prod: PickerProduct) => {
    const cost = Number(prod.averageCost || prod.costPrice || 0);
    const fallbackStock = Number(prod.availableStock ?? prod.currentStock ?? 0);
    const avail = await fetchStockForProduct(prod.id, locationId, fallbackStock);

    if (pickerTargetIndex == null) {
      if (items.some((line) => line.productId === prod.id)) {
        toast.error('Product already added');
        return;
      }
      setItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          availableStock: avail,
          quantity: 1,
          unitCost: cost,
          totalCost: cost,
          reason,
          batchNumber: '',
        },
      ]);
      return;
    }

    setItems((prev) =>
      prev.map((line, i) =>
        i === pickerTargetIndex
          ? {
              ...line,
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              availableStock: avail,
              unitCost: cost,
              totalCost: cost * Number(line.quantity || 0),
            }
          : line
      )
    );
  };

  const handleItemUpdate = (index: number, field: keyof WriteOffLine, value: any) => {
    setItems((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const next = { ...line, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          const q = Number(next.quantity) || 0;
          const c = Number(next.unitCost) || 0;
          next.totalCost = q * c;
        }
        return next;
      })
    );
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const grandTotalCost = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) {
      toast.error('Please select a warehouse');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one product line');
      return;
    }
    for (const item of items) {
      if (Number(item.quantity) <= 0) {
        toast.error(`Quantity for ${item.productName} must be > 0`);
        return;
      }
      if (Number(item.quantity) > Number(item.availableStock)) {
        toast.error(
          `Write-off qty for ${item.productName} exceeds available stock (${item.availableStock})`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const res = await apiClient.post('/api/inventory/write-offs', {
        locationId,
        writeOffDate,
        reason,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          reason: item.reason || reason,
          batchNumber: item.batchNumber || undefined,
        })),
      });
      const created = res.data?.data || res.data;
      if ((res.success || res.data?.success) && created?.id) {
        toast.success('Write-off draft saved');
        router.push(`/warehouse/write-offs/${created.id}`);
      } else {
        toast.error(res.message || res.data?.message || 'Failed to create write-off');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating write-off');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <Link
          href="/warehouse/write-offs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#014582] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to write-offs
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Trash2 className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
          New stock write-off
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
          Save as draft first, then submit / approve / post from the detail page.
        </p>
      </div>

      {loadingMaster ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
          <p className="text-sm text-gray-500 mt-2">Loading warehouses…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <label className="text-xs font-medium text-gray-600">
              Warehouse *
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-gray-600">
              Write-off date
              <input
                type="date"
                value={writeOffDate}
                onChange={(e) => setWriteOffDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50"
              />
            </label>
            <label className="text-xs font-medium text-gray-600">
              Primary reason *
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-gray-600 md:col-span-3">
              Notes
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Water damage in aisle B4"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none"
              />
            </label>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm md:text-base font-bold text-gray-800">Line items</h2>
              <button
                type="button"
                onClick={openPickerForAdd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#014582] text-white text-xs font-semibold hover:bg-[#01366a]"
              >
                <Plus className="w-3.5 h-3.5" /> Add item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                      Product
                    </th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                      Avail
                    </th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                      Qty
                    </th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                      Unit cost
                    </th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                      Loss
                    </th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                      —
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-400">
                        <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">No items yet</p>
                        <p className="text-xs mt-1 mb-3">Open the product list to add items</p>
                        <button
                          type="button"
                          onClick={openPickerForAdd}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#014582]/10 text-[#014582] text-xs font-semibold hover:bg-[#014582]/20"
                        >
                          <Search className="w-3.5 h-3.5" /> Browse products
                        </button>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={`${item.productId}-${idx}`} className="border-b border-gray-50">
                        <td className="px-3 py-2 min-w-[220px]">
                          <button
                            type="button"
                            onClick={() => openPickerForRow(idx)}
                            className="w-full text-left rounded-lg border border-gray-200 bg-gray-50 hover:border-[#014582] hover:bg-[#014582]/5 px-2.5 py-2 transition-colors"
                          >
                            <p className="font-semibold text-gray-800 truncate">{item.productName}</p>
                            <p className="text-[10px] font-mono text-gray-400">{item.sku || '—'}</p>
                            <p className="text-[10px] text-[#014582] font-medium mt-0.5">Change product</p>
                          </button>
                        </td>
                        <td className="px-3 py-2 text-center font-semibold text-gray-700">
                          {item.availableStock}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min={1}
                            max={item.availableStock}
                            value={item.quantity}
                            onChange={(e) => handleItemUpdate(idx, 'quantity', e.target.value)}
                            className="w-20 text-center px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#014582]"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => handleItemUpdate(idx, 'unitCost', e.target.value)}
                            className="w-24 text-right px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#014582]"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-red-600">
                          {formatMoney(item.totalCost || 0)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Total loss</span>
              <span className="text-lg md:text-xl font-bold text-red-600">
                {formatMoney(grandTotalCost)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Link
              href="/warehouse/write-offs"
              className="px-4 md:px-5 py-2 rounded-lg border border-gray-200 text-xs md:text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 md:px-5 py-2 rounded-lg bg-[#014582] hover:bg-[#01366a] text-white text-xs md:text-sm font-semibold disabled:opacity-50 shadow-lg shadow-[#014582]/25"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save draft'}
            </button>
          </div>
        </form>
      )}

      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(prod) => void applyProduct(prod)}
        locationId={locationId || undefined}
        title={pickerTargetIndex == null ? 'Add product' : 'Change product'}
        excludeProductIds={
          pickerTargetIndex == null
            ? items.map((i) => i.productId)
            : items
                .filter((_, i) => i !== pickerTargetIndex)
                .map((i) => i.productId)
        }
      />
    </div>
  );
}
