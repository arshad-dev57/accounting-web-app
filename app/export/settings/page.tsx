'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Settings,
  Save,
  AlertTriangle,
  RefreshCw,
  Building2,
  ShieldCheck,
  Landmark,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
} from '../../../components/trade/TradeUI';
import {
  AccountSelect,
  FieldLabel,
  PortSelect,
} from '../../../components/export/ExportSelectors';
import exportApi, {
  errorMessage,
  type ExportSettings,
} from '../../../lib/export-api';
import { usePermissions } from '../../../lib/usePermissions';
import { useCompanyOptional } from '../../../lib/company-context';
import { locationService, type Location } from '../../../lib/location-service';

interface SettingsForm {
  defaultIncoterm: string;
  defaultPortOfLoading: string;
  defaultPortOfDischarge: string;
  defaultPaymentTerms: string;
  defaultCurrency: string;
  defaultLocationId: string;
  autoPostInvoice: boolean;
  requireCustomsBeforeDispatch: boolean;
  requireInspectionBeforeDispatch: boolean;
  allowNegativeStock: boolean;
  defaultFreightAccountId: string;
  defaultDutyAccountId: string;
  defaultBankChargesAccountId: string;
  defaultFxGainAccountId: string;
  defaultFxLossAccountId: string;
  defaultAdvanceAccountId: string;
}

const emptyForm: SettingsForm = {
  defaultIncoterm: 'FOB',
  defaultPortOfLoading: '',
  defaultPortOfDischarge: '',
  defaultPaymentTerms: '',
  defaultCurrency: '',
  defaultLocationId: '',
  autoPostInvoice: true,
  requireCustomsBeforeDispatch: false,
  requireInspectionBeforeDispatch: false,
  allowNegativeStock: false,
  defaultFreightAccountId: '',
  defaultDutyAccountId: '',
  defaultBankChargesAccountId: '',
  defaultFxGainAccountId: '',
  defaultFxLossAccountId: '',
  defaultAdvanceAccountId: '',
};

const INCOTERMS = ['FOB', 'CIF', 'CFR', 'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];

function toForm(settings: ExportSettings): SettingsForm {
  return {
    defaultIncoterm: settings.defaultIncoterm || 'FOB',
    defaultPortOfLoading: settings.defaultPortOfLoading || '',
    defaultPortOfDischarge: settings.defaultPortOfDischarge || '',
    defaultPaymentTerms: settings.defaultPaymentTerms || '',
    defaultCurrency: settings.defaultCurrency || '',
    defaultLocationId: settings.defaultLocationId || '',
    autoPostInvoice: settings.autoPostInvoice ?? true,
    requireCustomsBeforeDispatch: settings.requireCustomsBeforeDispatch ?? false,
    requireInspectionBeforeDispatch: settings.requireInspectionBeforeDispatch ?? false,
    allowNegativeStock: settings.allowNegativeStock ?? false,
    defaultFreightAccountId: settings.defaultFreightAccountId || '',
    defaultDutyAccountId: settings.defaultDutyAccountId || '',
    defaultBankChargesAccountId: settings.defaultBankChargesAccountId || '',
    defaultFxGainAccountId: settings.defaultFxGainAccountId || '',
    defaultFxLossAccountId: settings.defaultFxLossAccountId || '',
    defaultAdvanceAccountId: settings.defaultAdvanceAccountId || '',
  };
}

export default function ExportSettingsPage() {
  const { can } = usePermissions();
  const company = useCompanyOptional();
  const canEdit = can('export.settings.edit');
  const allCompanies = Boolean(company?.isAllCompanies);
  const activeCompanyId = company?.activeCompanyId || '';

  const [form, setForm] = useState<SettingsForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (allCompanies) {
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const settings = await exportApi.getSettings();
      setForm(toForm(settings));
    } catch (err) {
      setLoadError(errorMessage(err, 'Failed to load export settings'));
    } finally {
      setLoading(false);
    }
  }, [allCompanies]);

  useEffect(() => {
    void load();
  }, [load, activeCompanyId]);

  useEffect(() => {
    let cancelled = false;
    locationService
      .list()
      .then((list) => {
        if (!cancelled) setLocations(list.filter((l) => l.isActive !== false));
      })
      .catch((err: any) => {
        if (!cancelled) setLocationsError(err?.message || 'Failed to load locations');
      });
    return () => {
      cancelled = true;
    };
  }, [activeCompanyId]);

  const update = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await exportApi.updateSettings({
        defaultIncoterm: form.defaultIncoterm || undefined,
        defaultPortOfLoading: form.defaultPortOfLoading || undefined,
        defaultPortOfDischarge: form.defaultPortOfDischarge || undefined,
        defaultPaymentTerms: form.defaultPaymentTerms || undefined,
        defaultCurrency: form.defaultCurrency || undefined,
        defaultLocationId: form.defaultLocationId || undefined,
        autoPostInvoice: form.autoPostInvoice,
        requireCustomsBeforeDispatch: form.requireCustomsBeforeDispatch,
        requireInspectionBeforeDispatch: form.requireInspectionBeforeDispatch,
        allowNegativeStock: form.allowNegativeStock,
        defaultFreightAccountId: form.defaultFreightAccountId || null,
        defaultDutyAccountId: form.defaultDutyAccountId || null,
        defaultBankChargesAccountId: form.defaultBankChargesAccountId || null,
        defaultFxGainAccountId: form.defaultFxGainAccountId || null,
        defaultFxLossAccountId: form.defaultFxLossAccountId || null,
        defaultAdvanceAccountId: form.defaultAdvanceAccountId || null,
      });
      setForm(toForm(saved));
      toast.success('Export settings saved');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to save export settings'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Export Management Settings"
        subtitle="Configure default trade terms, ports, inspection and customs controls, and the GL accounts used when export transactions are posted"
        moduleName="Export Settings"
        backHref="/export/dashboard"
        icon={<Settings className="w-5 h-5 text-white" />}
      />

      {allCompanies ? (
        <TradeCard>
          <div className="p-8 text-center text-xs text-gray-600">
            <Building2 className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="font-bold text-gray-800 text-sm">Select a single company</p>
            <p className="mt-1">
              Export settings are stored per company. Choose an active company in the top bar to
              view or edit its configuration.
            </p>
          </div>
        </TradeCard>
      ) : loading ? (
        <TradeCard>
          <div className="py-12 text-center text-xs text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading export settings…
          </div>
        </TradeCard>
      ) : loadError ? (
        <TradeCard>
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {loadError}
            </span>
            <button type="button" onClick={load} className="font-bold underline">
              Retry
            </button>
          </div>
        </TradeCard>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {!canEdit && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> You have view-only access to export settings.
            </div>
          )}

          <TradeCard
            title="Trade & Logistics Defaults"
            subtitle="Applied to new export quotations, orders and shipping declarations"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <FieldLabel>Default Incoterm</FieldLabel>
                <select
                  value={form.defaultIncoterm}
                  onChange={(e) => update('defaultIncoterm', e.target.value)}
                  disabled={!canEdit || saving}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-white disabled:bg-gray-50"
                >
                  {INCOTERMS.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Default Currency</FieldLabel>
                <input
                  value={form.defaultCurrency}
                  onChange={(e) => update('defaultCurrency', e.target.value.toUpperCase())}
                  disabled={!canEdit || saving}
                  placeholder="Leave blank to use the order currency"
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-mono disabled:bg-gray-50"
                />
              </div>

              <div>
                <FieldLabel>Primary Port of Loading</FieldLabel>
                <PortSelect
                  value={form.defaultPortOfLoading}
                  onChange={(name) => update('defaultPortOfLoading', name)}
                  disabled={!canEdit || saving}
                />
              </div>

              <div>
                <FieldLabel>Default Port of Discharge</FieldLabel>
                <PortSelect
                  value={form.defaultPortOfDischarge}
                  onChange={(name) => update('defaultPortOfDischarge', name)}
                  disabled={!canEdit || saving}
                  placeholder="Select destination port…"
                />
              </div>

              <div>
                <FieldLabel>Standard Export Payment Terms</FieldLabel>
                <input
                  value={form.defaultPaymentTerms}
                  onChange={(e) => update('defaultPaymentTerms', e.target.value)}
                  disabled={!canEdit || saving}
                  placeholder="e.g. Confirmed Irrevocable LC at Sight"
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs disabled:bg-gray-50"
                />
              </div>

              <div>
                <FieldLabel>Default Warehouse / Location</FieldLabel>
                <select
                  value={form.defaultLocationId}
                  onChange={(e) => update('defaultLocationId', e.target.value)}
                  disabled={!canEdit || saving}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-white disabled:bg-gray-50"
                >
                  <option value="">No default location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
                {locationsError && (
                  <p className="text-[10px] text-red-600 mt-1">{locationsError}</p>
                )}
              </div>
            </div>
          </TradeCard>

          <TradeCard
            title="Dispatch & Posting Controls"
            subtitle="Server-enforced guards for stock, inspection, customs and invoice posting"
          >
            <div className="space-y-3 text-xs">
              {[
                {
                  key: 'autoPostInvoice' as const,
                  title: 'Post the commercial invoice on dispatch handover',
                  description:
                    'Raise the Sales invoice, post revenue, receivables, COGS and stock movement when the container is handed to the shipping line.',
                },
                {
                  key: 'requireCustomsBeforeDispatch' as const,
                  title: 'Require customs clearance before dispatch handover',
                  description:
                    'Block the handover until the shipping bill has a Let Export Order (LEO).',
                },
                {
                  key: 'requireInspectionBeforeDispatch' as const,
                  title: 'Require pre-shipment inspection before dispatch handover',
                  description:
                    'Block the handover until the packing list has a passed inspection certificate.',
                },
                {
                  key: 'allowNegativeStock' as const,
                  title: 'Allow negative stock on export shipment',
                  description:
                    'Leave off. When off, the backend rejects shipments that exceed available stock.',
                },
              ].map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50"
                >
                  <div>
                    <p className="font-bold text-gray-900">{row.title}</p>
                    <p className="text-gray-500 text-[11px]">{row.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form[row.key]}
                    onChange={(e) => update(row.key, e.target.checked)}
                    disabled={!canEdit || saving}
                    className="w-4 h-4 text-[#014582] rounded disabled:opacity-50"
                  />
                </div>
              ))}
            </div>
          </TradeCard>

          <TradeCard
            title="Default GL Accounts"
            subtitle="Used when an export transaction has no explicit account. Leave blank to let the accounting service resolve its standard account."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <FieldLabel>Freight expense account</FieldLabel>
                <AccountSelect
                  value={form.defaultFreightAccountId}
                  onChange={(id) => update('defaultFreightAccountId', id)}
                  disabled={!canEdit || saving}
                  placeholder="Auto-resolve freight account"
                />
              </div>
              <div>
                <FieldLabel>Customs duty / drawback account</FieldLabel>
                <AccountSelect
                  value={form.defaultDutyAccountId}
                  onChange={(id) => update('defaultDutyAccountId', id)}
                  disabled={!canEdit || saving}
                  placeholder="Auto-resolve duty account"
                />
              </div>
              <div>
                <FieldLabel>Bank charges account</FieldLabel>
                <AccountSelect
                  value={form.defaultBankChargesAccountId}
                  onChange={(id) => update('defaultBankChargesAccountId', id)}
                  disabled={!canEdit || saving}
                  placeholder="Auto-resolve bank charges"
                />
              </div>
              <div>
                <FieldLabel>FX gain account</FieldLabel>
                <AccountSelect
                  value={form.defaultFxGainAccountId}
                  onChange={(id) => update('defaultFxGainAccountId', id)}
                  disabled={!canEdit || saving}
                  placeholder="Auto-resolve FX gain"
                />
              </div>
              <div>
                <FieldLabel>FX loss account</FieldLabel>
                <AccountSelect
                  value={form.defaultFxLossAccountId}
                  onChange={(id) => update('defaultFxLossAccountId', id)}
                  disabled={!canEdit || saving}
                  placeholder="Auto-resolve FX loss"
                />
              </div>
              <div>
                <FieldLabel>Customer advances / deposits account</FieldLabel>
                <AccountSelect
                  value={form.defaultAdvanceAccountId}
                  onChange={(id) => update('defaultAdvanceAccountId', id)}
                  disabled={!canEdit || saving}
                  placeholder="Auto-resolve advance account"
                />
              </div>
            </div>
            <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
              <Landmark className="w-4 h-4 mt-0.5" />
              <span>
                These accounts must belong to the active company. The backend rejects any account
                that is inactive or owned by another company.
              </span>
            </div>
          </TradeCard>

          {canEdit && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={load}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Export Settings
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      )}
    </TradePage>
  );
}
