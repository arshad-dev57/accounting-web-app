'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PurchasesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/purchases/dashboard');
  }, [router]);

  return null;
}
