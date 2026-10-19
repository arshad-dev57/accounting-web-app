'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Shield } from 'lucide-react';
import {
  fetchCompanyBusinessConfig,
  updateCompanyBusinessConfig,
  type CompanyBusinessConfig,
} from '@/lib/company-business-config';
import {
  OPERATIONAL_BUSINESS_TYPE_OPTIONS,
  SALES_MODEL_OPTIONS,
  PURCHASE_MODEL_OPTIONS,
  INSTALLMENT_REVENUE_POLICIES,
} from '@/lib/business-options';

type Props = {
  canEdit?: boolean;
};

export default function BusinessConfigSection({ canEdit = true }: Props) {
  const [config, setConfig] = useState<CompanyBusinessConfig | null>(null);
  const [draft, setDraft] = useState({
    operationalBusinessType: 'Other',
    salesModel: 'standard',
    purchaseModel: 'standard',
    installmentRevenuePolicy: 'full_on_sale',
    allowChildConfigOverride: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchCompanyBusinessConfig();
        if (cancelled) return;
        setConfig(data);
        setDraft({
          operationalBusinessType: data.operationalBusinessType || 'Other',
          salesModel: data.salesModel || 'standard',
          purchaseModel: data.purchaseModel || 'standard',
          installmentRevenuePolicy: data.installmentRevenuePolicy || 'full_on_sale',
          allowChildConfigOverride: data.allowChildConfigOverride !== false,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load business configuration');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const editable = canEdit && config?.canEdit !== false;

  const onSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    setWarnings([]);
    try {
      const result = await updateCompanyBusinessConfig(draft);
      setConfig(result);
      setWarnings(result.warnings || []);
      setMessage(
        'Business configuration saved. Historical invoices and accounting records were not changed.'
      );
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (e as any).response?.data?.message || 'Failed to update'
          : e instanceof Error
            ? e.message
            : 'Failed to update';
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500 py-6">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading business configuration…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {config?.inheritedFromParent && (
        <p className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <Shield className="h-4 w-4 shrink-0 mt-0.5" />
          This company inherited its business model from its parent
          {config.sourceParentCompanyId ? ` (${config.sourceParentCompanyId.slice(0, 8)}…)` : ''}.
          {!editable && ' Parent policy currently locks changes on this child company.'}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-xs font-semibold text-zinc-500">Business Category</span>
          <select
            disabled={!editable}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50"
            value={draft.operationalBusinessType}
            onChange={(e) =>
              setDraft((d) => ({ ...d, operationalBusinessType: e.target.value }))
            }
          >
            {OPERATIONAL_BUSINESS_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold text-zinc-500">Sales Model</span>
          <select
            disabled={!editable}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50"
            value={draft.salesModel}
            onChange={(e) => setDraft((d) => ({ ...d, salesModel: e.target.value }))}
          >
            {SALES_MODEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold text-zinc-500">Purchase Model</span>
          <select
            disabled={!editable}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50"
            value={draft.purchaseModel}
            onChange={(e) => setDraft((d) => ({ ...d, purchaseModel: e.target.value }))}
          >
            {PURCHASE_MODEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold text-zinc-500">
            Installment revenue recognition
          </span>
          <select
            disabled={!editable}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50"
            value={draft.installmentRevenuePolicy}
            onChange={(e) =>
              setDraft((d) => ({ ...d, installmentRevenuePolicy: e.target.value }))
            }
          >
            {INSTALLMENT_REVENUE_POLICIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!config?.parentPolicy && (
        <label className="flex items-start gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            className="mt-1 rounded border-zinc-300"
            disabled={!editable}
            checked={draft.allowChildConfigOverride}
            onChange={(e) =>
              setDraft((d) => ({ ...d, allowChildConfigOverride: e.target.checked }))
            }
          />
          <span>
            Allow child companies to override this business model
            <span className="block text-xs text-zinc-500">
              When unchecked, children keep the inherited configuration and cannot change it.
            </span>
          </span>
        </label>
      )}

      {message && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}
      {warnings.map((w) => (
        <p
          key={w}
          className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
        >
          {w}
        </p>
      ))}
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {editable && (
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#014582] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#01366a] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save business configuration
        </button>
      )}
    </div>
  );
}
