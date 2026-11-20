'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Layers,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SETTINGS_SAVE_EVENT } from '../nav';
import { useCompanyOptional } from '@/lib/company-context';
import { useCurrency } from '@/lib/currency-context';
import {
  previewSlabLocal,
  salesAgentSettingsService,
  type CommissionSlab,
  type SalesAgentSettings,
} from '@/lib/sales-agent-settings-service';

type ToggleKey = keyof Pick<
  SalesAgentSettings,
  'enableSalesAgents' | 'trackCommission' | 'agentRequired' | 'customCommissionSlabs'
>;

const TOGGLES: Array<{
  key: ToggleKey;
  title: string;
  description: string;
  dependsOn?: ToggleKey;
}> = [
  {
    key: 'enableSalesAgents',
    title: 'Enable sales agents',
    description:
      'Shows an agent selector on Sale Invoice and POS. Off = the feature is invisible everywhere.',
  },
  {
    key: 'trackCommission',
    title: 'Track commission',
    description:
      'Shows commission fields on each sale (pre-filled from the agent, editable per invoice) and commission columns in the agent report.',
    dependsOn: 'enableSalesAgents',
  },
  {
    key: 'agentRequired',
    title: 'Agent is required',
    description:
      'A sale cannot be saved without choosing an agent (applies to Sale Invoice and POS).',
    dependsOn: 'enableSalesAgents',
  },
  {
    key: 'customCommissionSlabs',
    title: 'Custom commission rules (slabs)',
    description:
      'Pay a higher percentage as an agent sells more in a month — e.g. 1% once they reach Rs 500,000 and 1.25% once they reach Rs 1,000,000.',
    dependsOn: 'enableSalesAgents',
  },
];

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${checked ? 'bg-[#2563eb]' : 'bg-gray-300'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function SalesAgentsSettingsPage() {
  const companyCtx = useCompanyOptional();
  const { symbol } = useCurrency();
  const currencyLabel = symbol || 'Rs';

  const [settings, setSettings] = useState<SalesAgentSettings>({
    enableSalesAgents: true,
    trackCommission: true,
    agentRequired: false,
    customCommissionSlabs: false,
    commissionSlabs: [],
  });
  const [slabs, setSlabs] = useState<CommissionSlab[]>([]);
  const [checkAmount, setCheckAmount] = useState('1109580');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await salesAgentSettingsService.getSettings();
      setSettings(data);
      setSlabs(
        (data.commissionSlabs || []).length
          ? data.commissionSlabs
          : data.customCommissionSlabs
            ? [{ fromAmount: 500000, commissionPercent: 1.25 }]
            : []
      );
      setDirty(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load sales agent settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings, companyCtx?.activeCompanyId]);

  const saveSettings = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        enableSalesAgents: settings.enableSalesAgents,
        trackCommission: settings.trackCommission,
        agentRequired: settings.enableSalesAgents ? settings.agentRequired : false,
        customCommissionSlabs: settings.enableSalesAgents
          ? settings.customCommissionSlabs
          : false,
        commissionSlabs: slabs
          .map((s) => ({
            fromAmount: Math.max(0, Number(s.fromAmount) || 0),
            commissionPercent: Math.max(0, Number(s.commissionPercent) || 0),
          }))
          .sort((a, b) => a.fromAmount - b.fromAmount),
      };
      const data = await salesAgentSettingsService.saveSettings(payload);
      setSettings(data);
      setSlabs(data.commissionSlabs || []);
      setDirty(false);
      toast.success('Sales agent settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [saving, settings, slabs]);

  useEffect(() => {
    const onSave = () => {
      void saveSettings();
    };
    window.addEventListener(SETTINGS_SAVE_EVENT, onSave);
    return () => window.removeEventListener(SETTINGS_SAVE_EVENT, onSave);
  }, [saveSettings]);

  const setToggle = (key: ToggleKey) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === 'enableSalesAgents' && !next.enableSalesAgents) {
        next.agentRequired = false;
        next.trackCommission = false;
        next.customCommissionSlabs = false;
      }
      if (key === 'customCommissionSlabs' && next.customCommissionSlabs && slabs.length === 0) {
        setSlabs([{ fromAmount: 500000, commissionPercent: 1.25 }]);
      }
      return next;
    });
    setDirty(true);
  };

  const updateSlab = (index: number, field: keyof CommissionSlab, value: string) => {
    setSlabs((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value === '' ? 0 : Number(value),
            }
          : row
      )
    );
    setDirty(true);
  };

  const addSlab = () => {
    const last = slabs[slabs.length - 1];
    const nextFrom = last ? Math.round(last.fromAmount * 2) || 500000 : 500000;
    const nextPct = last ? Number((last.commissionPercent + 0.25).toFixed(2)) : 1;
    setSlabs((prev) => [...prev, { fromAmount: nextFrom, commissionPercent: nextPct }]);
    setDirty(true);
  };

  const removeSlab = (index: number) => {
    setSlabs((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const preview = useMemo(
    () => previewSlabLocal(Number(checkAmount) || 0, slabs),
    [checkAmount, slabs]
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#014582]" />
        <p className="text-sm text-gray-500 mt-3">Loading sales agent settings…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#014582]" />
            Sales Agents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Control agent selection on sales, commission tracking, and monthly slab rules for this
            company.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/sales/salespersons"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Manage agents
          </Link>
          <button
            type="button"
            onClick={() => void loadSettings()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload
          </button>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {TOGGLES.map((item) => {
          const disabled = Boolean(item.dependsOn && !settings[item.dependsOn]);
          const checked = Boolean(settings[item.key]) && !disabled;
          return (
            <div
              key={item.key}
              className="flex items-start justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-gray-900">{item.title}</h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {item.description.replace(/Rs/g, currencyLabel)}
                </p>
              </div>
              <Toggle
                checked={checked}
                disabled={disabled}
                onChange={() => setToggle(item.key)}
              />
            </div>
          );
        })}
      </section>

      {settings.enableSalesAgents && settings.customCommissionSlabs && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-[#014582]/10 p-2 text-[#014582]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Commission Rules</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Slabs are measured against everything the agent sells in a{' '}
                <span className="font-semibold text-gray-700">calendar month</span>, not against one
                sale. The highest slab the month reaches sets the rate for the{' '}
                <span className="font-semibold text-gray-700">whole month</span>— with 500,000 → 1%
                and 1,000,000 → 1.25%, an agent sitting at 999,999 earns 1%, and the sale that takes
                them to 1,000,000 lifts every sale that month to 1.25%. A month below the smallest
                slab earns nothing, and the total resets on the 1st. Agents use these rules when
                their commission type is set to{' '}
                <span className="font-semibold text-gray-700">Slab rules</span>.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="grid grid-cols-[1fr_1fr_44px] gap-0 bg-gray-50 border-b border-gray-200 px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Monthly sales from
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Commission %
              </span>
              <span />
            </div>
            <div className="divide-y divide-gray-100">
              {slabs.length === 0 ? (
                <p className="px-3 py-4 text-sm text-gray-500">
                  No slabs yet. Add at least one rule, or agents on slab type earn 0%.
                </p>
              ) : (
                slabs.map((slab, index) => (
                  <div
                    key={`slab-${index}`}
                    className="grid grid-cols-[1fr_1fr_44px] gap-2 items-center px-3 py-2.5"
                  >
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={Number.isFinite(slab.fromAmount) ? slab.fromAmount : ''}
                      onChange={(e) => updateSlab(index, 'fromAmount', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]/25 focus:border-[#014582]/40"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={Number.isFinite(slab.commissionPercent) ? slab.commissionPercent : ''}
                      onChange={(e) => updateSlab(index, 'commissionPercent', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]/25 focus:border-[#014582]/40"
                    />
                    <button
                      type="button"
                      onClick={() => removeSlab(index)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove slab"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={addSlab}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
          >
            <Plus className="w-4 h-4" />
            Add Slab
          </button>

          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/80 p-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Check a month of {currencyLabel}
              <input
                type="number"
                min={0}
                value={checkAmount}
                onChange={(e) => setCheckAmount(e.target.value)}
                className="mt-1.5 w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]/25"
              />
            </label>
            <p className="text-sm text-gray-600">
              {preview.earnsNothing ? (
                <>
                  At{' '}
                  <span className="font-semibold">
                    {currencyLabel} {(preview.monthlySales || 0).toLocaleString()}
                  </span>
                  , the agent is below the first slab and earns{' '}
                  <span className="font-semibold">0%</span>.
                </>
              ) : (
                <>
                  At{' '}
                  <span className="font-semibold">
                    {currencyLabel} {(preview.monthlySales || 0).toLocaleString()}
                  </span>
                  , the whole month earns{' '}
                  <span className="font-semibold text-[#014582]">
                    {preview.commissionPercent}%
                  </span>
                  {preview.matchedSlab
                    ? ` (slab from ${currencyLabel} ${preview.matchedSlab.fromAmount.toLocaleString()})`
                    : slabs.length === 0
                      ? ' (no slabs configured)'
                      : ''}
                  .
                </>
              )}
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={saving || !dirty}
              onClick={() => void saveSettings()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#014582] text-white text-sm font-semibold hover:bg-[#01366a] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#014582]/20"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Rules
            </button>
          </div>
        </section>
      )}

      {dirty && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          You have unsaved changes. Use <strong>Save Settings</strong> in the sidebar or{' '}
          <strong>Save Rules</strong> below.
        </p>
      )}
    </div>
  );
}
