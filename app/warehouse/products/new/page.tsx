'use client';

export const dynamic = 'force-dynamic';

import { LocationProvider } from '@/lib/location-context';
import ProductFormPage from '../ProductFormPage';

export default function WarehouseNewProductPage() {
  return (
    <LocationProvider allowAll>
      <ProductFormPage listHref="/warehouse/products" />
    </LocationProvider>
  );
}
