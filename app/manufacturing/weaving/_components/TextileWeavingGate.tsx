'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Factory } from 'lucide-react';
import { MfgCard, MfgLoading, MfgPage, MfgPageHeader } from '@/manufacturing/ui';
import { isTextileWeavingCompany, useCompanyOptional } from '@/lib/company-context';

export function TextileWeavingGate({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode | ((ctx: { companyId: string }) => React.ReactNode);
}) {
  const companyCtx = useCompanyOptional();
  const router = useRouter();
  const loading = companyCtx?.loading ?? true;
  const company = companyCtx?.activeCompany ?? null;
  const allowed = isTextileWeavingCompany(company);

  useEffect(() => {
    if (loading) return;
    if (!allowed) {
      router.replace('/manufacturing/manufacturing');
    }
  }, [loading, allowed, router]);

  if (loading) {
    return (
      <MfgPage>
        <MfgPageHeader title={title} subtitle={subtitle} icon={<Factory className="w-5 h-5 text-white" />} />
        <MfgCard>
          <MfgLoading label="Checking textile weaving workflow…" />
        </MfgCard>
      </MfgPage>
    );
  }

  if (!allowed || !company?.id) {
    return (
      <MfgPage>
        <MfgPageHeader title={title} subtitle={subtitle} icon={<Factory className="w-5 h-5 text-white" />} />
        <MfgCard title="Textile weaving not enabled">
          <p className="text-sm text-[#7A8FA6]">
            This company uses the standard manufacturing workflow. Redirecting…
          </p>
        </MfgCard>
      </MfgPage>
    );
  }

  return <>{typeof children === 'function' ? children({ companyId: company.id }) : children}</>;
}
