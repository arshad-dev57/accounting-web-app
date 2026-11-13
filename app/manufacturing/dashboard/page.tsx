'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isTextileWeavingCompany, useCompanyOptional } from '@/lib/company-context';

export default function ManufacturingDashboardRedirect() {
  const router = useRouter();
  const companyCtx = useCompanyOptional();

  useEffect(() => {
    if (companyCtx?.loading) return;
    if (isTextileWeavingCompany(companyCtx?.activeCompany)) {
      router.replace('/manufacturing/weaving');
    } else {
      router.replace('/manufacturing/manufacturing/dashboard');
    }
  }, [companyCtx?.loading, companyCtx?.activeCompany, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#014582] border-t-transparent" />
    </div>
  );
}
