'use client';

import { useEffect, useState } from 'react';
import { taxService } from '../../../lib/tax-service';

type Tab = 'types' | 'jurisdictions' | 'rates' | 'rules';

export default function TaxRatesPage() {
  const [tab, setTab] = useState<Tab>('rates');
  const [types, setTypes] = useState<any[]>([]);
  const [jurisdictions, setJurisdictions] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [typeForm, setTypeForm] = useState({ code: '', name: '', isCompound: false });
  const [jurForm, setJurForm] = useState({ code: '', name: '', level: 'Country', countryCode: '', parentId: '' });
  const [rateForm, setRateForm] = useState({ jurisdictionId: '', taxTypeId: '', rate: 0, isDefault: false, effectiveFrom: new Date().toISOString().slice(0, 10) });
  const [ruleForm, setRuleForm] = useState({ name: '', taxRateId: '', pricingModel: 'exclusive', priority: 0 });

  const load = async () => {
    try {
      const [t, j, r, ru] = await Promise.all([
        taxService.types(),
        taxService.jurisdictions(),
        taxService.rates(),
        taxService.rules(),
      ]);
      setTypes(t.data || []);
      setJurisdictions(j.data || []);
      setRates(r.data || []);
      setRules(ru.data || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Types, rates & rules</h1>
        <p className="text-sm text-gray-500 mt-1">These rates drive POS, sales invoices, purchase bills and inventory tax — not hardcoded percentages.</p>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-1 border-b border-gray-200">
        {(['rates', 'types', 'jurisdictions', 'rules'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize ${tab === t ? 'border-b-2 border-[#014582] text-[#014582]' : 'text-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'types' && (
        <Panel title="Tax types">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input placeholder="Code (VAT_STD)" value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Name" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={typeForm.isCompound} onChange={(e) => setTypeForm({ ...typeForm, isCompound: e.target.checked })} /> Compound (tax on tax)</label>
            <button className="bg-[#014582] text-white rounded-lg text-sm font-semibold" onClick={async () => { await taxService.createType(typeForm); setTypeForm({ code: '', name: '', isCompound: false }); load(); }}>Add type</button>
          </div>
          <Table headers={['Code', 'Name', 'Compound', 'Status']}>
            {types.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-2">{t.code}</td>
                <td className="px-4 py-2">{t.name}</td>
                <td className="px-4 py-2">{t.isCompound ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2">{t.isActive ? 'Active' : 'Off'}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 'jurisdictions' && (
        <Panel title="Jurisdictions">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <input placeholder="Code (AE)" value={jurForm.code} onChange={(e) => setJurForm({ ...jurForm, code: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Name" value={jurForm.name} onChange={(e) => setJurForm({ ...jurForm, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <select value={jurForm.level} onChange={(e) => setJurForm({ ...jurForm, level: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
              <option>Country</option><option>State</option><option>County</option><option>City</option><option>SpecialZone</option>
            </select>
            <input placeholder="ISO country" value={jurForm.countryCode} onChange={(e) => setJurForm({ ...jurForm, countryCode: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <button className="bg-[#014582] text-white rounded-lg text-sm font-semibold" onClick={async () => { await taxService.createJurisdiction(jurForm); setJurForm({ code: '', name: '', level: 'Country', countryCode: '', parentId: '' }); load(); }}>Add</button>
          </div>
          <Table headers={['Code', 'Name', 'Level', 'Country', 'Default']}>
            {jurisdictions.map((j) => (
              <tr key={j.id} className="border-t">
                <td className="px-4 py-2">{j.code}</td>
                <td className="px-4 py-2">{j.name}</td>
                <td className="px-4 py-2">{j.level}</td>
                <td className="px-4 py-2">{j.countryCode}</td>
                <td className="px-4 py-2">{j.isDefault ? 'Yes' : '—'}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 'rates' && (
        <Panel title="Tax rates">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <select value={rateForm.jurisdictionId} onChange={(e) => setRateForm({ ...rateForm, jurisdictionId: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
              <option value="">Jurisdiction</option>
              {jurisdictions.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
            <select value={rateForm.taxTypeId} onChange={(e) => setRateForm({ ...rateForm, taxTypeId: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
              <option value="">Tax type</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input type="number" step="0.01" placeholder="Rate %" value={rateForm.rate} onChange={(e) => setRateForm({ ...rateForm, rate: parseFloat(e.target.value) || 0 })} className="border rounded-lg px-3 py-2 text-sm" />
            <input type="date" value={rateForm.effectiveFrom} onChange={(e) => setRateForm({ ...rateForm, effectiveFrom: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <button className="bg-[#014582] text-white rounded-lg text-sm font-semibold" onClick={async () => { await taxService.createRate(rateForm); load(); }}>Add rate</button>
          </div>
          <Table headers={['Type', 'Jurisdiction', 'Rate', 'Default', 'From']}>
            {rates.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.taxType?.name}</td>
                <td className="px-4 py-2">{r.jurisdiction?.name}</td>
                <td className="px-4 py-2 font-semibold">{r.rate}%</td>
                <td className="px-4 py-2">
                  <button className="text-[#014582] text-xs font-semibold" onClick={async () => { await taxService.updateRate(r.id, { isDefault: true }); load(); }}>
                    {r.isDefault ? 'Default' : 'Make default'}
                  </button>
                </td>
                <td className="px-4 py-2 text-gray-500">{r.effectiveFrom?.slice?.(0, 10)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 'rules' && (
        <Panel title="Product / category rules">
          <p className="text-sm text-gray-500 mb-4">Leave product blank for a general rule. Higher priority wins.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input placeholder="Rule name" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <select value={ruleForm.taxRateId} onChange={(e) => setRuleForm({ ...ruleForm, taxRateId: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
              <option value="">Tax rate</option>
              {rates.map((r) => <option key={r.id} value={r.id}>{r.taxType?.name} {r.rate}%</option>)}
            </select>
            <select value={ruleForm.pricingModel} onChange={(e) => setRuleForm({ ...ruleForm, pricingModel: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
              <option value="exclusive">Exclusive</option>
              <option value="inclusive">Inclusive</option>
            </select>
            <button className="bg-[#014582] text-white rounded-lg text-sm font-semibold" onClick={async () => { await taxService.createRule(ruleForm); load(); }}>Add rule</button>
          </div>
          <Table headers={['Name', 'Rate', 'Pricing', 'Priority']}>
            {rules.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">{r.taxRate?.taxType?.name} {r.taxRate?.rate}%</td>
                <td className="px-4 py-2">{r.pricingModel}</td>
                <td className="px-4 py-2">{r.priority}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-gray-500">
        <tr>{headers.map((h) => <th key={h} className="text-left px-4 py-2 font-medium">{h}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
