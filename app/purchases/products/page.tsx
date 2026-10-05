'use client';

export const dynamic = 'force-dynamic';

import { LocationProvider } from '@/lib/location-context';
import { ProductsPage } from '../../warehouse/products/page';

export default function PurchasesProductsPage() {
  return (
    <LocationProvider>
      <ProductsPage />
    </LocationProvider>
  );
}



export { PurchasesProductsPage };
