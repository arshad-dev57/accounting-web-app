'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import { LocationProvider } from '@/lib/location-context';
import ProductFormPage from '../../ProductFormPage';

function WarehouseEditProductInner() {
  const params = useParams();
  const id = String(params?.id || '');
  return <ProductFormPage productId={id} listHref="/warehouse/products" />;
}

export default function WarehouseEditProductPage() {
  return (
    <LocationProvider allowAll>
      <WarehouseEditProductInner />
    </LocationProvider>
  );
}
