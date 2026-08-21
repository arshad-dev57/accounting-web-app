'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** /sales entry → real Sales Dashboard (same as sidebar "Sales Dashboard") */
export default function SalesIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sales/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh] text-sm text-gray-500">
      Loading sales dashboard…
    </div>
  );
}
