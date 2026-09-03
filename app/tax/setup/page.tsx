'use client';

import { useEffect, useState } from 'react';
import { taxService } from '../../../lib/tax-service';
import TaxUseToggle from '../../../components/TaxUseToggle';

export function TaxSetupPage() {
  const [ctx, setCtx] = useState<any>(null);
  const [countryCode, setCountryCode] = useState('AE');
  const [reg, setReg] = useState('');
  const [pricingModel, setPricingModel] = useState('exclusive');
  const [filingFrequency, setFilingFrequency] = useState('quarterly');
  const [regime, setRegime] = useState('VAT');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    taxService.context().then((r) => {
      setCtx(r.data);
      const p = r.data?.profile;
      if (p) {
        setCountryCode(p.countryCode);
        setReg(p.taxRegistrationNumber || '');
        setPricingModel(p.pricingModel);
        setFilingFrequency(p.filingFrequency);
        setRegime(p.regime);
      }
    }).catch((e) => setError(e.message));
  };

  useEffect(() => { load(); }, []);

  const applyPack = async (replaceExisting = false) => {
    setSaving(true); setError(''); setMessage('');
    try {
      await taxService.setupCountry({ countryCode, taxRegistrationNumber: reg, replaceExisting });
      setMessage('Country tax pack applied. Rates are now live across POS, sales, purchases and accounting.');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true); setError(''); setMessage('');
    try {
      await taxService.saveProfile({
        countryCode,
        regime,
        pricingModel,
        taxRegistrationNumber: reg,
        filingFrequency,
        recoverInputTax: regime !== 'SALES_TAX',
      });
      setMessage('Tax profile saved. Inclusive/exclusive pricing now applies company-wide.');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const packs = ctx?.countryPacks || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Country & tax profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pick the country you operate in. We load VAT/GST/sales-tax rates as a starting point — you can edit them afterwards.
        </p>
      </div>

      <TaxUseToggle onChanged={() => load()} />

      {message && <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-sm">{message}</div>}
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">1. Apply a country pack</h2>
        <label className="block text-sm font-medium text-gray-700">Country</label>
        <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
          {packs.map((p: any) => (
            <option key={p.countryCode} value={p.countryCode}>
              {p.name} — {p.regime} ({p.pricingModel})
            </option>
          ))}
        </select>
        <label className="block text-sm font-medium text-gray-700">Tax registration number (VAT / GSTIN / TIN)</label>
        <input value={reg} onChange={(e) => setReg(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 100000000000003" />
        <div className="flex gap-3">
          <button disabled={saving} onClick={() => applyPack(false)} className="px-4 py-2 rounded-lg bg-[#014582] text-white text-sm font-semibold disabled:opacity-50">
            {ctx?.configured ? 'Add this country' : 'Apply pack'}
          </button>
          {ctx?.configured && (
            <button disabled={saving} onClick={() => applyPack(true)} className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold">
              Replace existing setup
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">2. Company tax profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Regime</label>
            <select value={regime} onChange={(e) => setRegime(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="VAT">VAT</option>
              <option value="GST">GST</option>
              <option value="SALES_TAX">Sales tax</option>
              <option value="SST">SST</option>
              <option value="MIXED">Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price tax treatment</label>
            <select value={pricingModel} onChange={(e) => setPricingModel(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="exclusive">Tax exclusive (add tax on top)</option>
              <option value="inclusive">Tax inclusive (extract tax from price)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filing frequency</label>
            <select value={filingFrequency} onChange={(e) => setFilingFrequency(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="monthly">Monthly</option>
              <option value="bimonthly">Bi-monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
        </div>
        <button disabled={saving} onClick={saveProfile} className="px-4 py-2 rounded-lg bg-[#014582] text-white text-sm font-semibold disabled:opacity-50">
          Save profile
        </button>
      </div>
    </div>
  );
}
/** Next.js route shell — real UI mounts via ModuleViewHost. */
export default function ModuleRoutePlaceholder() {
  return null;
}
