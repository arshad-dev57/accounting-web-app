'use client';

export const dynamic = 'force-dynamic';

import { LocationProvider } from '@/lib/location-context';
import { ProductsPage } from '../../warehouse/products/page';

export default function SalesProductsPage() {
  return (
    <LocationProvider>
      <ProductsPage />
    </LocationProvider>
  );
}



export { SalesProductsPage };
