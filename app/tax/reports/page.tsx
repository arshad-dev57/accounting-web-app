'use client';

import { useEffect, useState } from 'react';
import { taxService } from '../../../lib/tax-service';

export default function TaxReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [auditId, setAuditId] = useState('');
  const [audit, setAudit] = useState<any[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const r = await taxService.liability(`startDate=${startDate}&endDate=${endDate}`);
      setData(r.data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const runAudit = async () => {
    if (!auditId.trim()) return;
    try {
      const r = await taxService.audit(auditId.trim());
      setAudit(r.data || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const summary = data?.summary || [];
  const txs = data?.transactions || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax liability & audit</h1>
        <p className="text-sm text-gray-500 mt-1">Output VAT/GST collected vs period — ready for filing packs.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={load} className="px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold">Refresh</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 font-semibold border-b">By jurisdiction / type</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-5 py-2">Jurisdiction</th>
              <th className="text-left px-5 py-2">Tax</th>
              <th className="text-right px-5 py-2">Taxable</th>
              <th className="text-right px-5 py-2">Tax</th>
              <th className="text-right px-5 py-2">Exempt</th>
              <th className="text-right px-5 py-2">Docs</th>
            </tr>
          </thead>
          <tbody>
            {summary.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No liability in this period</td></tr>}
            {summary.map((row: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="px-5 py-2">{row.jurisdiction}</td>
                <td className="px-5 py-2">{row.taxType}</td>
                <td className="px-5 py-2 text-right">{fmt(row.taxableAmount)}</td>
                <td className="px-5 py-2 text-right font-semibold">{fmt(row.taxAmount)}</td>
                <td className="px-5 py-2 text-right">{fmt(row.exemptionAmount)}</td>
                <td className="px-5 py-2 text-right">{row.transactionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold">Audit a document</h2>
        <div className="flex gap-2">
          <input value={auditId} onChange={(e) => setAuditId(e.target.value)} placeholder="Sale / invoice ID" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button onClick={runAudit} className="px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold">Lookup</button>
        </div>
        {audit.map((a) => (
          <div key={a.id} className="text-sm border rounded-lg px-3 py-2 flex justify-between">
            <span>{a.taxType?.name} · {a.jurisdiction?.name}</span>
            <span>{fmt(a.taxAmount)}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 font-semibold border-b">Postings ({txs.length})</div>
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 sticky top-0">
              <tr>
                <th className="text-left px-5 py-2">When</th>
                <th className="text-left px-5 py-2">Document</th>
                <th className="text-right px-5 py-2">Tax</th>
              </tr>
            </thead>
            <tbody>
              {txs.slice(0, 100).map((tx: any) => (
                <tr key={tx.id} className="border-t">
                  <td className="px-5 py-2 text-gray-500">{tx.createdAt?.slice?.(0, 19)?.replace('T', ' ')}</td>
                  <td className="px-5 py-2">{tx.transactionType}</td>
                  <td className="px-5 py-2 text-right">{fmt(tx.taxAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
