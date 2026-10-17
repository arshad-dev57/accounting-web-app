'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Save,
  CheckCircle2,
  Building2,
  Send,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
  TRADE_COLORS,
} from '../../../components/trade/TradeUI';

export default function ExportSettingsPage() {
  const [defaultPortOfLoading, setDefaultPortOfLoading] = useState('Jebel Ali Port (AEJEA)');
  const [defaultInspectionAgency, setDefaultInspectionAgency] = useState('SGS International');
  const [chamberAttestationRequired, setChamberAttestationRequired] = useState(true);
  const [drawbackAccount, setDrawbackAccount] = useState('Emirates NBD - Corporate Trade USD Account');
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('Confirmed Irrevocable LC at Sight');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Export Management Settings"
        subtitle="Configure default ports of loading, authorized inspection agencies, chamber attestations and duty drawback parameters"
        moduleName="Export Settings"
        backHref="/export/dashboard"
        icon={<Settings className="w-5 h-5 text-white" />}
      />

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Export configuration and compliance settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <TradeCard
          title="Outbound Shipping & Inspection Configuration"
          subtitle="Default logistics terms applied to overseas quotations and shipping declarations"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Primary Port of Loading</label>
              <select
                value={defaultPortOfLoading}
                onChange={(e) => setDefaultPortOfLoading(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
              >
                <option value="Jebel Ali Port (AEJEA)">Jebel Ali Port (AEJEA) — Container Terminal 1 & 2</option>
                <option value="Dubai International Cargo Terminal (DXB)">Dubai International Cargo Terminal (DXB) — Air Freight</option>
                <option value="Port Rashid (AEPRD)">Port Rashid (AEPRD)</option>
                <option value="Sharjah Container Terminal (AESCT)">Sharjah Container Terminal (AESCT)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Pre-Shipment Inspection Partner</label>
              <select
                value={defaultInspectionAgency}
                onChange={(e) => setDefaultInspectionAgency(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
              >
                <option value="SGS International">SGS International (Standard)</option>
                <option value="Bureau Veritas">Bureau Veritas</option>
                <option value="TUV Rheinland">TÜV Rheinland</option>
                <option value="Internal QA Directorate">Internal QA Directorate</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Standard Export Payment Terms</label>
              <select
                value={defaultPaymentTerms}
                onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
              >
                <option value="Confirmed Irrevocable LC at Sight">Confirmed Irrevocable LC at Sight (Recommended)</option>
                <option value="30% Advance, 70% Against BL Copy">30% Advance, 70% Against BL Copy</option>
                <option value="LC at 60 Days Usance">LC at 60 Days Usance</option>
                <option value="100% Advance Wire">100% Advance Wire</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Duty Drawback Beneficiary Bank Account</label>
              <input
                type="text"
                value={drawbackAccount}
                onChange={(e) => setDrawbackAccount(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </TradeCard>

        <TradeCard
          title="Export Documentation & Compliance Mandates"
          subtitle="Legalization and chamber attestation workflow controls"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50">
              <div>
                <p className="font-bold text-gray-900">Mandate Chamber of Commerce Certificate of Origin</p>
                <p className="text-gray-500 text-[11px]">
                  Require attested Certificate of Origin before finalizing bank presentation package.
                </p>
              </div>
              <input
                type="checkbox"
                checked={chamberAttestationRequired}
                onChange={(e) => setChamberAttestationRequired(e.target.checked)}
                className="w-4 h-4 text-[#014582] rounded"
              />
            </div>
          </div>
        </TradeCard>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] transition-all flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" /> Save Export Settings
          </button>
        </div>
      </form>
    </TradePage>
  );
}
