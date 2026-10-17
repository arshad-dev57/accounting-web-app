'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Save,
  CheckCircle2,
  Building2,
  Ship,
  ShieldCheck,
  FileText,
  RotateCcw,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
  TRADE_COLORS,
} from '../../../components/trade/TradeUI';
import importApi from '../../../lib/import-api';
import { chartOfAccountService } from '../../../lib/chart-of-accounts-service';

export default function ImportSettingsPage() {
  const [defaultIncoterm, setDefaultIncoterm] = useState('CIF');
  const [defaultPort, setDefaultPort] = useState('Jebel Ali Port (AEJEA)');
  const [customsBroker, setCustomsBroker] = useState('Al-Futtaim Logistics Customs Brokerage');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [autoCreatePurchaseOrder, setAutoCreatePurchaseOrder] = useState(true);
  const [requireSeparateRfqApprover, setRequireSeparateRfqApprover] = useState(true);
  const [requireSeparateLcApprover, setRequireSeparateLcApprover] = useState(true);
  const [customsDutyDefaultPct, setCustomsDutyDefaultPct] = useState(10);
  const [defaultImportVatRatePct, setDefaultImportVatRatePct] = useState(5);
  const [requireSeparateCustomsAssessor, setRequireSeparateCustomsAssessor] = useState(true);
  const [requireSeparateCustomsPayer, setRequireSeparateCustomsPayer] = useState(true);
  const [blockInsufficientBalance, setBlockInsufficientBalance] = useState(true);
  const [dutyPaymentDifferenceThresholdPct, setDutyPaymentDifferenceThresholdPct] = useState(5);
  const [customsDutyAccountId, setCustomsDutyAccountId] = useState('');
  const [importVatAccountId, setImportVatAccountId] = useState('');
  const [advanceIncomeTaxAccountId, setAdvanceIncomeTaxAccountId] = useState('');
  const [handlingAccountId, setHandlingAccountId] = useState('');
  const [clearingBrokerAccountId, setClearingBrokerAccountId] = useState('');
  const [glAccounts, setGlAccounts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [defaultAllocationMethod, setDefaultAllocationMethod] = useState<'By Item Value' | 'By Weight / Volume'>('By Item Value');
  const [requireOriginalBL, setRequireOriginalBL] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);
        const data: any = await importApi.getSettings();
        if (data) {
          if (data.defaultIncoterm) setDefaultIncoterm(data.defaultIncoterm);
          if (data.defaultPortOfEntry) setDefaultPort(data.defaultPortOfEntry);
          if (data.defaultCustomsBroker) setCustomsBroker(data.defaultCustomsBroker);
          if (data.defaultCurrency) setDefaultCurrency(data.defaultCurrency);
          if (data.autoCreatePurchaseOrder !== undefined) setAutoCreatePurchaseOrder(Boolean(data.autoCreatePurchaseOrder));
          if (data.requireSeparateRfqApprover !== undefined) {
            setRequireSeparateRfqApprover(Boolean(data.requireSeparateRfqApprover));
          }
          if (data.requireSeparateLcApprover !== undefined) {
            setRequireSeparateLcApprover(Boolean(data.requireSeparateLcApprover));
          }
          if (data.requirePhysicalOriginalBl !== undefined) {
            setRequireOriginalBL(Boolean(data.requirePhysicalOriginalBl));
          }
          if (data.requireSeparateCustomsAssessor !== undefined) {
            setRequireSeparateCustomsAssessor(Boolean(data.requireSeparateCustomsAssessor));
          }
          if (data.requireSeparateCustomsPayer !== undefined) {
            setRequireSeparateCustomsPayer(Boolean(data.requireSeparateCustomsPayer));
          }
          if (data.blockInsufficientBalance !== undefined) {
            setBlockInsufficientBalance(Boolean(data.blockInsufficientBalance));
          }
          if (data.dutyPaymentDifferenceThresholdPct != null) {
            setDutyPaymentDifferenceThresholdPct(Number(data.dutyPaymentDifferenceThresholdPct));
          }
          if (data.customsDutyAccountId) setCustomsDutyAccountId(data.customsDutyAccountId);
          if (data.importVatAccountId) setImportVatAccountId(data.importVatAccountId);
          if (data.advanceIncomeTaxAccountId) setAdvanceIncomeTaxAccountId(data.advanceIncomeTaxAccountId);
          if (data.handlingAccountId) setHandlingAccountId(data.handlingAccountId);
          if (data.clearingBrokerAccountId) setClearingBrokerAccountId(data.clearingBrokerAccountId);
          if (data.defaultCustomsDutyRatePct != null) {
            setCustomsDutyDefaultPct(Number(data.defaultCustomsDutyRatePct));
          }
          if (data.defaultImportVatRatePct != null) {
            setDefaultImportVatRatePct(Number(data.defaultImportVatRatePct));
          }
        }
      } catch (err: any) {
        console.error('Failed to load settings:', err);
        setError(err?.response?.data?.error || err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
    chartOfAccountService
      .getAccounts({ page: 1, limit: 100 })
      .then((res) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        setGlAccounts(
          rows.map((a: any) => ({
            id: a.id,
            code: a.code,
            name: a.name,
          }))
        );
      })
      .catch(() => setGlAccounts([]));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await importApi.updateSettings({
        defaultIncoterm,
        defaultPortOfEntry: defaultPort,
        defaultCustomsBroker: customsBroker,
        defaultCurrency,
        autoCreatePurchaseOrder,
        requireSeparateRfqApprover,
        requireSeparateLcApprover,
        requireSeparateCustomsAssessor,
        requireSeparateCustomsPayer,
        blockInsufficientBalance,
        dutyPaymentDifferenceThresholdPct,
        customsDutyAccountId: customsDutyAccountId || null,
        importVatAccountId: importVatAccountId || null,
        advanceIncomeTaxAccountId: advanceIncomeTaxAccountId || null,
        handlingAccountId: handlingAccountId || null,
        clearingBrokerAccountId: clearingBrokerAccountId || null,
        requirePhysicalOriginalBl: requireOriginalBL,
        defaultCustomsDutyRatePct: customsDutyDefaultPct,
        defaultImportVatRatePct: defaultImportVatRatePct,
      } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Import Management Settings"
        subtitle="Configure default trade incoterms, port clearances, customs tariff rules and landed cost policies"
        moduleName="Import Settings"
        backHref="/import/dashboard"
        icon={<Settings className="w-5 h-5 text-white" />}
      />

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Import configuration and trade policies saved successfully to database!
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#014582]" />
          <p className="text-xs">Loading import settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <TradeCard
            title="Default International Trade Terms"
            subtitle="Pre-populated parameters for newly drafted import RFQs and purchase orders"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Default Incoterm</label>
                <select
                  value={defaultIncoterm}
                  onChange={(e) => setDefaultIncoterm(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="CIF">CIF — Cost, Insurance & Freight (Recommended)</option>
                  <option value="FOB">FOB — Free On Board</option>
                  <option value="CFR">CFR — Cost & Freight</option>
                  <option value="EXW">EXW — Ex Works</option>
                  <option value="DDP">DDP — Delivered Duty Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Default Currency</label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="CNY">CNY — Chinese Yuan (¥)</option>
                  <option value="AED">AED — UAE Dirham</option>
                  <option value="GBP">GBP — British Pound (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Default Port of Entry / Discharge</label>
                <select
                  value={defaultPort}
                  onChange={(e) => setDefaultPort(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="Jebel Ali Port (AEJEA)">Jebel Ali Port (AEJEA) — Deep Sea Terminal</option>
                  <option value="Dubai International Cargo Terminal (DXB)">Dubai International Cargo Terminal (DXB) — Air Freight</option>
                  <option value="Port Khalid Sharjah (AEPKH)">Port Khalid Sharjah (AEPKH)</option>
                  <option value="Khalifa Port Abu Dhabi (AEKHL)">Khalifa Port Abu Dhabi (AEKHL)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Authorized Customs Clearing Agent</label>
                <input
                  type="text"
                  value={customsBroker}
                  onChange={(e) => setCustomsBroker(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Default customs duty rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={customsDutyDefaultPct}
                  onChange={(e) => setCustomsDutyDefaultPct(Number(e.target.value))}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </TradeCard>

          <TradeCard
            title="Landed Cost Accounting Automation"
            subtitle="Rules governing freight, duties and warehouse handling capitalization"
          >
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <div>
                  <p className="font-bold text-gray-900">Auto-Create Core Purchase Order on Import PO Confirmation</p>
                  <p className="text-gray-500 text-[11px]">
                    Bridge import purchase orders directly to inventory commitments and supplier ledger.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoCreatePurchaseOrder}
                  onChange={(e) => setAutoCreatePurchaseOrder(e.target.checked)}
                  className="w-4 h-4 text-[#014582] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <div>
                  <p className="font-bold text-gray-900">Award and approval must be done by different users</p>
                  <p className="text-gray-500 text-[11px]">
                    When enabled (default), the user who awards a quotation cannot approve the same RFQ.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireSeparateRfqApprover}
                  onChange={(e) => setRequireSeparateRfqApprover(e.target.checked)}
                  className="w-4 h-4 text-[#014582] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <div>
                  <p className="font-bold text-gray-900">Creator and approver must be different users (LC)</p>
                  <p className="text-gray-500 text-[11px]">
                    When enabled (default), the user who creates an LC cannot issue/approve the same LC.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireSeparateLcApprover}
                  onChange={(e) => setRequireSeparateLcApprover(e.target.checked)}
                  className="w-4 h-4 text-[#014582] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <div>
                  <p className="font-bold text-gray-900">Require Physical Original B/L for Final Duty Release</p>
                  <p className="text-gray-500 text-[11px]">
                    Mandate physical stamped Bill of Lading verification before warehouse put-away.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireOriginalBL}
                  onChange={(e) => setRequireOriginalBL(e.target.checked)}
                  className="w-4 h-4 text-[#014582] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <div>
                  <p className="font-bold text-gray-900">Creator and customs assessor must be different users</p>
                  <p className="text-gray-500 text-[11px]">
                    When enabled, the user who creates a customs entry cannot confirm the assessment.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireSeparateCustomsAssessor}
                  onChange={(e) => setRequireSeparateCustomsAssessor(e.target.checked)}
                  className="w-4 h-4 text-[#014582] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <div>
                  <p className="font-bold text-gray-900">Payment must be recorded by a user different from the creator and the assessor</p>
                  <p className="text-gray-500 text-[11px]">
                    When enabled (default), the creator or assessor cannot record the customs duty payment.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireSeparateCustomsPayer}
                  onChange={(e) => setRequireSeparateCustomsPayer(e.target.checked)}
                  className="w-4 h-4 text-[#014582] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <div>
                  <p className="font-bold text-gray-900">Block payment when amount exceeds account balance</p>
                  <p className="text-gray-500 text-[11px]">
                    When off, payments above balance are allowed with a warning (still posted).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={blockInsufficientBalance}
                  onChange={(e) => setBlockInsufficientBalance(e.target.checked)}
                  className="w-4 h-4 text-[#014582] rounded"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Duty payment difference threshold %</label>
                <input
                  type="number"
                  value={dutyPaymentDifferenceThresholdPct}
                  onChange={(e) => setDutyPaymentDifferenceThresholdPct(Number(e.target.value))}
                  className="w-full sm:w-80 p-2.5 border border-gray-200 rounded-lg text-xs"
                />
                <p className="text-gray-500 text-[11px] mt-1">
                  Differences above this % of payable require the approval checkbox on the payment form.
                </p>
              </div>

              <div className="space-y-3 p-3 rounded-xl border border-gray-200 bg-blue-50/30">
                <p className="font-bold text-gray-900">Customs duty GL account mapping</p>
                <p className="text-gray-500 text-[11px]">
                  Debit accounts used when recording a duty payment. Configure roles under Users → Roles for
                  import.customs.* permissions (record_payment defaults to Accountant / Finance Manager / Admin).
                </p>
                {[
                  ['Customs duty', customsDutyAccountId, setCustomsDutyAccountId],
                  ['Import VAT (recoverable)', importVatAccountId, setImportVatAccountId],
                  ['Advance income tax', advanceIncomeTaxAccountId, setAdvanceIncomeTaxAccountId],
                  ['Port handling', handlingAccountId, setHandlingAccountId],
                  ['Clearing agency fee', clearingBrokerAccountId, setClearingBrokerAccountId],
                ].map(([label, value, setter]) => (
                  <div key={String(label)}>
                    <label className="block text-gray-700 font-semibold mb-1 text-[11px]">{label as string}</label>
                    <select
                      value={value as string}
                      onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                      className="w-full sm:w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-white"
                    >
                      <option value="">Not configured</option>
                      {glAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Default import VAT / sales tax %</label>
                <input
                  type="number"
                  value={defaultImportVatRatePct}
                  onChange={(e) => setDefaultImportVatRatePct(Number(e.target.value))}
                  className="w-full sm:w-80 p-2.5 border border-gray-200 rounded-lg text-xs"
                />
                <p className="text-gray-500 text-[11px] mt-1">
                  Pre-fills the customs form VAT field (still required — never applied as a hidden default).
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Default Expense Allocation Metric</label>
                <select
                  value={defaultAllocationMethod}
                  onChange={(e) => setDefaultAllocationMethod(e.target.value as typeof defaultAllocationMethod)}
                  className="w-full sm:w-80 p-2.5 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="By Item Value">By Item Value (Pro-rata invoice amount)</option>
                  <option value="By Weight / Volume">By Weight / Volume (Gross metric tons / CBM)</option>
                </select>
              </div>
            </div>
          </TradeCard>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </form>
      )}
    </TradePage>
  );
}
