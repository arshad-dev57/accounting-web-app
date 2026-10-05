'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  ArrowLeft,
  Building2,
  Calendar,
  Plus,
  X,
  AlertTriangle,
  Save
} from 'lucide-react';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  costPrice: number;
  averageCost?: number;
  stockUnitName?: string;
}

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

export default function NewStockWriteOffPage() {
  const router = useRouter();

  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locationId, setLocationId] = useState('');
  const [reason, setReason] = useState('Damaged');
  const [notes, setNotes] = useState('');
  const [writeOffDate, setWriteOffDate] = useState(new Date().toISOString().slice(0, 10));

  const [items, setItems] = useState<WriteOffLine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const headers = browserCompanyAuthHeaders();

        // Fetch Locations
        const locRes = await fetch('/api/warehouse/locations', { headers });
        if (locRes.ok) {
          const locJson = await locRes.json();
          const list = Array.isArray(locJson) ? locJson : locJson.data || [];
          setLocations(list);
          if (list.length > 0) setLocationId(list[0].id);
        }

        // Fetch Products
        const prodRes = await fetch('/api/warehouse/products', { headers });
        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          setProducts(Array.isArray(prodJson) ? prodJson : prodJson.data || []);
        }
      } catch (err) {
        console.error('Error fetching master data:', err);
      }
    };

    fetchMasterData();
  }, []);

  const addItemRow = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    const cost = defaultProd.averageCost || defaultProd.costPrice || 0;

    setItems([
      ...items,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        sku: defaultProd.sku,
        availableStock: defaultProd.currentStock || 0,
        quantity: 1,
        unitCost: cost,
        totalCost: cost * 1,
        reason: reason,
        batchNumber: ''
      }
    ]);
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const cost = prod.averageCost || prod.costPrice || 0;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      availableStock: prod.currentStock || 0,
      unitCost: cost,
      totalCost: cost * updated[index].quantity
    };
    setItems(updated);
  };

  const handleItemUpdate = (index: number, field: keyof WriteOffLine, value: any) => {
    const updated = [...items];
    const line = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitCost') {
      const q = parseFloat(line.quantity as any) || 0;
      const c = parseFloat(line.unitCost as any) || 0;
      line.totalCost = q * c;
    }

    updated[index] = line;
    setItems(updated);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotalCost = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) {
      alert('Please select a warehouse.');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one product line.');
      return;
    }

    // Validate quantities against stock
    for (const item of items) {
      if (item.quantity <= 0) {
        alert(`Quantity for ${item.productName} must be > 0.`);
        return;
      }
      if (item.quantity > item.availableStock) {
        alert(`Write-off quantity (${item.quantity}) for ${item.productName} exceeds available stock (${item.availableStock}).`);
        return;
      }
    }

    try {
      setSaving(true);
      const headers = browserCompanyAuthHeaders();
      const res = await fetch('/api/inventory/write-offs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          locationId,
          writeOffDate,
          reason,
          notes,
          items
        })
      });

      if (res.ok) {
        const json = await res.json();
        router.push(`/warehouse/write-offs/${json.data.id}`);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create write-off draft.');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating write-off.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <Link
          href="/warehouse/write-offs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Write-Off Register
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Trash2 className="w-7 h-7 text-rose-600" />
          Create Stock Write-Off Entry
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Officially record damaged, broken, or expired inventory items for accounting expense posting.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Warehouse / Branch *
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Write-Off Date
            </label>
            <input
              type="date"
              value={writeOffDate}
              onChange={(e) => setWriteOffDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Primary Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            >
              <option value="Expired">Expired Stock</option>
              <option value="Damaged">Damaged Stock</option>
              <option value="Broken">Broken / Shattered</option>
              <option value="Spoiled">Spoiled / Perished</option>
              <option value="Missing">Missing / Stock Shortage</option>
              <option value="Obsolete">Obsolete / Outdated</option>
              <option value="Quality Issue">Quality Control Rejection</option>
              <option value="Other">Other Loss</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Inspection & Internal Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Water leakage damage in aisle B4 during rain."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Write-Off Line Items</h2>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-medium hover:bg-rose-100"
            >
              <Plus className="w-4 h-4" /> Add Item Line
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-center">Avail. Stock</th>
                  <th className="py-2.5 px-3 text-center">Write-Off Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Cost (PKR)</th>
                  <th className="py-2.5 px-3 text-right">Total Loss (PKR)</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No items added yet. Click &quot;Add Item Line&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-3 min-w-[200px]">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.availableStock}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          max={item.availableStock}
                          value={item.quantity}
                          onChange={(e) => handleItemUpdate(idx, 'quantity', e.target.value)}
                          className="w-20 text-center text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => handleItemUpdate(idx, 'unitCost', e.target.value)}
                          className="w-24 text-right text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600">
                        PKR {(item.totalCost || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-slate-400 hover:text-rose-600"
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

          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Total Loss Valuation:
            </span>
            <span className="text-xl font-bold text-rose-600">
              PKR {grandTotalCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <Link
            href="/warehouse/write-offs"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Draft...' : 'Save Write-Off Draft'}
          </button>
        </div>
      </form>
    </div>
  );
}
