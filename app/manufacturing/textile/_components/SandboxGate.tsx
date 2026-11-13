'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, FlaskConical, RefreshCcw, ShieldCheck } from 'lucide-react';
import { MfgCard, MfgPage, MfgPageHeader } from '@/manufacturing/ui';
import { textileMfgService, type TextileSandboxStatus } from '@/lib/textile-mfg-service';
import { useCompanyOptional } from '@/lib/company-context';

export function useTextileSandbox() {
  const companyCtx = useCompanyOptional();
  const [status, setStatus] = useState<TextileSandboxStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await textileMfgService.sandboxStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load sandbox status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, companyCtx?.activeCompanyId]);

  const enterSandbox = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const result = await textileMfgService.ensureSandbox({ activate: true });
      if (result.company?.id && companyCtx?.setActiveCompanyId) {
        await companyCtx.setActiveCompanyId(result.company.id);
      }
      await refresh();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enter textile sandbox');
      throw err;
    } finally {
      setBusy(false);
    }
  }, [companyCtx, refresh]);

  return { status, loading, error, busy, refresh, enterSandbox, inSandbox: Boolean(status?.inSandbox) };
}

export function SandboxGate({
  children,
  title,
  subtitle
}: {
  children: (ctx: ReturnType<typeof useTextileSandbox>) => React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const ctx = useTextileSandbox();

  if (ctx.loading) {
    return (
      <MfgPage>
        <MfgPageHeader title={title} subtitle={subtitle} icon={<FlaskConical className="w-5 h-5 text-white" />} />
        <MfgCard>
          <p className="text-sm text-[#7A8FA6]">Checking textile sandbox…</p>
        </MfgCard>
      </MfgPage>
    );
  }

  if (!ctx.inSandbox) {
    return (
      <MfgPage>
        <MfgPageHeader title={title} subtitle={subtitle} icon={<FlaskConical className="w-5 h-5 text-white" />} />
        <MfgCard title="Isolated TEXTILE-SANDBOX required">
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                Textile P0 posting is locked to the <b>TEXTILE-SANDBOX</b> company so live inventory and
                accounting stay untouched. Enter the sandbox to seed yarn LOT stock and run cone winding.
              </div>
            </div>
            {ctx.error && (
              <p className="text-sm text-red-600">{ctx.error}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={ctx.busy}
                onClick={() => void ctx.enterSandbox()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#014582] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#013666] disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4" />
                {ctx.busy ? 'Preparing sandbox…' : 'Create / Enter TEXTILE-SANDBOX'}
              </button>
              <button
                type="button"
                onClick={() => void ctx.refresh()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#DDE4EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#1A1A2E]"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </button>
            </div>
            {ctx.status?.activeCompany && (
              <p className="text-xs text-[#7A8FA6]">
                Active company now: <b>{ctx.status.activeCompany.name}</b>
                {ctx.status.sandboxCompany ? ` · Sandbox: ${ctx.status.sandboxCompany.name}` : ''}
              </p>
            )}
          </div>
        </MfgCard>
      </MfgPage>
    );
  }

  return <>{children(ctx)}</>;
}
