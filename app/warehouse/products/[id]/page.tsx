'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { LocationProvider } from '@/lib/location-context';
import { productService, type Product } from '../../../api/product/route';
import { ProductDetail } from '../page';

function WarehouseProductDetailInner() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || '');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await productService.getProductById(id);
        if (!cancelled) setProduct(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading product…
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
        <p className="font-semibold mb-2">{error || 'Product not found'}</p>
        <button
          type="button"
          onClick={() => router.push('/warehouse/products')}
          className="text-[#014582] font-semibold hover:underline"
        >
          ← Back to products
        </button>
      </div>
    );
  }

  return (
    <ProductDetail
      product={product}
      backHref="/warehouse/products"
      onEdit={() => {
        sessionStorage.setItem('products_edit_id', id);
        router.push('/warehouse/products');
      }}
    />
  );
}

export default function WarehouseProductDetailPage() {
  return (
    <LocationProvider allowAll>
      <WarehouseProductDetailInner />
    </LocationProvider>
  );
}
