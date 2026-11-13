'use client';

import { useEffect, useState } from 'react';
import { Factory, Loader2, Save } from 'lucide-react';
import {
  isTextileWeavingCompany,
  useCompanyOptional,
  type ManufacturingWorkflow,
} from '@/lib/company-context';
import { loadUserFromLocal } from '@/lib/permission-service';
import { canViewRegisteredUsers } from '@/lib/platform-owners';
import { updateManufacturingWorkflow } from '@/lib/textile-weaving-service';

type Props = {
  canEdit?: boolean;
};

function isPlatformSuperAdmin(): boolean {
  const user = loadUserFromLocal();
  if (!user) return false;
  if (canViewRegisteredUsers(user.email)) return true;
  const role = String(user.role || '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');
  return role === 'superadmin' || role === 'super_admin' || role === 'platform_admin';
}

export default function ManufacturingWorkflowSection({ canEdit = true }: Props) {
  const companyCtx = useCompanyOptional();
  const company = companyCtx?.activeCompany ?? null;
  const [workflow, setWorkflow] = useState<ManufacturingWorkflow>('STANDARD');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [platformAdmin, setPlatformAdmin] = useState(false);

  useEffect(() => {
    setWorkflow(
      isTextileWeavingCompany(company) ? 'TEXTILE_WEAVING' : 'STANDARD'
    );
  }, [company?.id, company?.manufacturingWorkflow]);

  useEffect(() => {
    setPlatformAdmin(isPlatformSuperAdmin());
  }, []);

  const editable = canEdit && Boolean(company?.id) && platformAdmin;
  const activeLabel =
    (company?.manufacturingWorkflow || 'STANDARD') === 'TEXTILE_WEAVING'
      ? 'Textile Weaving Active'
      : 'Standard';

  const onSave = async () => {
    if (!company?.id || !editable) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateManufacturingWorkflow(company.id, workflow);
      await companyCtx?.refresh?.();
      setMessage(
        workflow === 'TEXTILE_WEAVING'
          ? 'Textile weaving workflow enabled. Open Manufacturing to use the Yadgar register UI.'
          : 'Standard manufacturing workflow restored.'
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update manufacturing workflow');
    } finally {
      setSaving(false);
    }
  };

  if (!company) {
    return (
      <p className="text-sm text-zinc-500">Select a company to configure manufacturing workflow.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#014582]/10">
          <Factory className="h-4 w-4 text-[#014582]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900">Manufacturing workflow</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                activeLabel === 'Textile Weaving Active'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {activeLabel}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            {editable
              ? (
                <>
                  Keep <b>Standard</b> for ERPNext-style BOMs/work orders. Switch to{' '}
                  <b>Textile Weaving</b> for Yadgar Fabrics godown → twisting → warping → loom
                  registers. Existing standard manufacturing data is never replaced.
                </>
              ) : (
                <>
                  This mode is managed by the Bisonstechs platform team. Contact support if you need
                  the Textile Weaving Suite enabled for this company.
                </>
              )}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            {
              value: 'STANDARD' as const,
              title: 'Standard manufacturing',
              desc: 'BOMs, production orders, MRP, shop floor — default for all tenants.',
            },
            {
              value: 'TEXTILE_WEAVING' as const,
              title: 'Textile weaving',
              desc: 'Yarn godown, twisting wastage, beams, looms & daily greige production.',
            },
          ] as const
        ).map((opt) => {
          const active = workflow === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={!editable}
              onClick={() => setWorkflow(opt.value)}
              className={`rounded-xl border px-4 py-3 text-left transition-all disabled:cursor-default disabled:opacity-70 ${
                active
                  ? 'border-[#014582] bg-[#014582]/5 ring-2 ring-[#014582]/20'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <p className="text-sm font-semibold text-zinc-900">{opt.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      {message && (
        <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {editable && (
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving || workflow === (company.manufacturingWorkflow || 'STANDARD')}
          className="inline-flex items-center gap-2 rounded-xl bg-[#014582] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#01366a] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save manufacturing workflow
        </button>
      )}
    </div>
  );
}
