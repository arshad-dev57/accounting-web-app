'use client';

import { useEffect, useState } from 'react';
import { taxService } from '../../../lib/tax-service';

export default function TaxExemptionsPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [exemptions, setExemptions] = useState<any[]>([]);
  const [typeForm, setTypeForm] = useState({ code: '', name: '', percentage: 100, requiresCertificate: true });
  const [form, setForm] = useState({ exemptionTypeId: '', customerId: '', certificateNumber: '', certificateExpiresAt: '' });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [t, e] = await Promise.all([taxService.exemptionTypes(), taxService.exemptions()]);
      setTypes(t.data || []);
      setExemptions(e.data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax exemptions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Resale certificates, exports, charities and diplomatic relief. Applied automatically on POS and invoices when the customer or product matches.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold">Exemption types</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input placeholder="Code" value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Name" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="% relief" value={typeForm.percentage} onChange={(e) => setTypeForm({ ...typeForm, percentage: parseFloat(e.target.value) || 0 })} className="border rounded-lg px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={typeForm.requiresCertificate} onChange={(e) => setTypeForm({ ...typeForm, requiresCertificate: e.target.checked })} /> Certificate required</label>
          <button className="bg-[#014582] text-white rounded-lg text-sm font-semibold" onClick={async () => { await taxService.createExemptionType(typeForm); load(); }}>Add type</button>
        </div>
        <ul className="text-sm text-gray-600 divide-y">
          {types.map((t) => (
            <li key={t.id} className="py-2 flex justify-between">
              <span>{t.code} — {t.name}</span>
              <span>{t.percentage}%{t.requiresCertificate ? ' · cert' : ''}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold">Assign to a customer</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={form.exemptionTypeId} onChange={(e) => setForm({ ...form, exemptionTypeId: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Type</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input placeholder="Customer ID" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Certificate #" value={form.certificateNumber} onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={form.certificateExpiresAt} onChange={(e) => setForm({ ...form, certificateExpiresAt: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button className="px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold" onClick={async () => { await taxService.createExemption(form); load(); }}>Grant exemption</button>

        <table className="w-full text-sm mt-4">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Customer / product</th>
              <th className="text-left px-3 py-2">Certificate</th>
              <th className="text-left px-3 py-2">Expires</th>
            </tr>
          </thead>
          <tbody>
            {exemptions.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-3 py-2">{e.exemptionType?.name}</td>
                <td className="px-3 py-2">{e.customer?.name || e.product?.name || '—'}</td>
                <td className="px-3 py-2">{e.certificateNumber || '—'}</td>
                <td className="px-3 py-2">{e.certificateExpiresAt?.slice?.(0, 10) || 'No expiry'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
