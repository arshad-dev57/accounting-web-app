'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { productService, type Product } from '../../api/product/route';
import { categoryService, type Category } from '../../api/category/route';
import { supplierService, type Supplier } from '../../api/supplier/route';
import { settingService } from '../../api/settings/route';
import { unitsService } from '@/lib/units-service';
import { useLocation } from '@/lib/location-context';
import { ProductForm } from './page';

type ProductFormPageProps = {
  /** When set, form loads this product for edit */
  productId?: string;
  /** Where to go after save / cancel */
  listHref: string;
  /** Purchases catalog: company-wide, ignore warehouse filter */
  companyWide?: boolean;
};

export default function ProductFormPage({
  productId,
  listHref,
  companyWide = false,
}: ProductFormPageProps) {
  const router = useRouter();
  const { selectedLocationId, locationIdForApi } = useLocation();
  const effectiveLocationIdForApi = companyWide ? '' : locationIdForApi;

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(Boolean(productId));
  const [loadError, setLoadError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [settingsData, setSettingsData] = useState<Record<string, any[]>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [ready, setReady] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const cats = [
        'productType',
        'rackLocation',
        'zone',
        'weightUnit',
        'dimensionUnit',
        'size',
        'shippingClass',
        'stockUnit',
        'taxType',
        'storageCondition',
        'brand',
      ];
      const [settingsResults, unitsResult] = await Promise.all([
        Promise.allSettled(cats.map((cat) => settingService.getSettings(cat))),
        unitsService.list().catch(() => ({ uoms: [], conversions: [] })),
      ]);
      const map: Record<string, any[]> = {};
      cats.forEach((cat, idx) => {
        const result = settingsResults[idx];
        map[cat] = result.status === 'fulfilled' ? result.value || [] : [];
      });

      const fromUoms = (unitsResult.uoms || [])
        .map((u) => ({
          id: u.id,
          _id: u.id,
          name: String(u.symbol || u.name || u.code).trim(),
          code: u.code,
          category: 'stockUnit',
          isDefault: u.code === 'PCS',
        }))
        .filter((u) => u.name);

      if (fromUoms.length > 0) {
        const seen = new Set<string>();
        const merged: any[] = [];
        for (const row of [...fromUoms, ...(map.stockUnit || [])]) {
          const key = String(row.name || '').toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          merged.push(row);
        }
        map.stockUnit = merged;
      }

      setSettingsData(map);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, supps] = await Promise.all([
          categoryService.getCategories({
            tree: false,
            locationId: companyWide ? undefined : selectedLocationId || undefined,
          }),
          supplierService.getSuppliers({ limit: 100 }),
        ]);
        if (cancelled) return;
        const flat = (Array.isArray(cats) ? cats : [])
          .map((c) => ({
            ...c,
            id: c.id || (c as any)._id || '',
            parentId: c.parentId ?? null,
          }))
          .filter((c) => !!c.id);
        setCategories(flat);
        setSuppliers(supps?.data || []);
      } catch (err) {
        console.error('Failed to fetch dropdowns:', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    void fetchSettings();
    return () => {
      cancelled = true;
    };
  }, [companyWide, selectedLocationId, fetchSettings]);

  useEffect(() => {
    if (!productId) {
      setEditingProduct(null);
      setLoadingProduct(false);
      setLoadError('');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingProduct(true);
      setLoadError('');
      try {
        const product = await productService.getProductById(productId);
        if (!cancelled) setEditingProduct(product);
      } catch (err: any) {
        if (!cancelled) setLoadError(err?.message || 'Failed to load product');
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const goList = () => router.push(listHref);

  if (loadingProduct || !ready) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {productId ? 'Loading product…' : 'Loading form…'}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
        <p className="font-semibold mb-2">{loadError}</p>
        <button
          type="button"
          onClick={goList}
          className="text-[#014582] font-semibold hover:underline"
        >
          ← Back to products
        </button>
      </div>
    );
  }

  return (
    <ProductForm
      editingProduct={editingProduct}
      onCancel={goList}
      onSuccess={goList}
      categories={categories}
      suppliers={suppliers}
      settingsData={settingsData}
      loadingSettings={loadingSettings}
      locationId={effectiveLocationIdForApi || undefined}
      onCategoryCreated={(cat) => {
        setCategories((prev) => {
          if (prev.some((c) => String(c.id) === String(cat.id))) return prev;
          return [...prev, cat];
        });
      }}
      onSupplierCreated={(sup) => {
        setSuppliers((prev) => {
          const id = String((sup as any).id || (sup as any)._id || '');
          if (prev.some((s) => String((s as any).id || (s as any)._id) === id)) {
            return prev;
          }
          return [...prev, sup];
        });
      }}
      onSettingCreated={(cat, item) => {
        setSettingsData((prev) => {
          const list = prev[cat] || [];
          const name = String(item?.name || '').trim().toLowerCase();
          if (name && list.some((x) => String(x?.name || '').trim().toLowerCase() === name)) {
            return prev;
          }
          return { ...prev, [cat]: [...list, item] };
        });
        void fetchSettings();
      }}
    />
  );
}
