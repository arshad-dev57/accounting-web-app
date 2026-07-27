'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PurchasesDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/purchases');
  }, [router]);

  return null;
}
