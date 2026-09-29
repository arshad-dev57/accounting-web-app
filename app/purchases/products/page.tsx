'use client';

import { LocationProvider } from '@/lib/location-context';
import { ProductsPage } from '../../warehouse/products/page';

export function PurchasesProductsPage() {
  return (
    <LocationProvider>
      <ProductsPage />
    </LocationProvider>
  );
}

/** Next.js route shell — real UI mounts via ModuleViewHost. */
export default function ModuleRoutePlaceholder() {
  return null;
}
