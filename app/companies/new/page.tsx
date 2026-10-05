'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy create URL — companies hub lives at /companies with create modal. */
export default function CreateCompanyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/companies');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-zinc-500">
      Redirecting to Companies…
    </div>
  );
}
