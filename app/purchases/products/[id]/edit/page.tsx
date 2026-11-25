'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import { LocationProvider } from '@/lib/location-context';
import ProductFormPage from '../../../../warehouse/products/ProductFormPage';

function PurchasesEditProductInner() {
  const params = useParams();
  const id = String(params?.id || '');
  return (
    <ProductFormPage productId={id} listHref="/purchases/products" companyWide />
  );
}

export default function PurchasesEditProductPage() {
  return (
    <LocationProvider allowAll allowAllUsers>
      <PurchasesEditProductInner />
    </LocationProvider>
  );
}
