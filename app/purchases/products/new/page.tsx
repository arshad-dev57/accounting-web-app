'use client';

export const dynamic = 'force-dynamic';

import { LocationProvider } from '@/lib/location-context';
import ProductFormPage from '../../../warehouse/products/ProductFormPage';

export default function PurchasesNewProductPage() {
  return (
    <LocationProvider allowAll allowAllUsers>
      <ProductFormPage listHref="/purchases/products" companyWide />
    </LocationProvider>
  );
}
