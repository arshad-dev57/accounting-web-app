'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe, Percent, ShieldCheck, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { taxService } from '../../lib/tax-service';
import TaxUseToggle from '../../components/TaxUseToggle';

export default function TaxOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taxService.overview()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading tax compliance…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  const profile = data?.profile;
  const counts = data?.counts || {};
  const month = data?.thisMonth || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax Compliance</h1>
        <p className="text-sm text-gray-500 mt-1">
          One source of truth for VAT, GST, sales tax and exemptions across accounting, POS, sales, inventory and purchases.
        </p>
      </div>

      <TaxUseToggle onChanged={() => {
        taxService.overview().then((r) => setData(r.data)).catch(() => {});
      }} />

      {profile && data?.enabled === false && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          Taxation is turned off. Rates stay saved, but POS, invoices, bills and products will not add tax until you switch it on.
        </div>
      )}

      {!profile && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Tax is not configured for this company</p>
            <p className="text-sm text-amber-800 mt-1">
              Choose your country pack to load statutory rates. Documents will then tax correctly worldwide.
            </p>
            <Link href="/tax/setup" className="inline-block mt-3 px-4 py-2 rounded-lg bg-[#014582] text-white text-sm font-semibold">
              Start country setup
            </Link>
          </div>
        </div>
      )}

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Stat label="Regime" value={profile.regime} />
          <Stat label="Pricing" value={profile.pricingModel === 'inclusive' ? 'Tax inclusive' : 'Tax exclusive'} />
          <Stat label="Country" value={profile.countryCode} />
          <Stat label="Filing" value={profile.filingFrequency} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="This month tax" value={fmt(month.taxAmount)} />
        <Stat label="Taxable amount" value={fmt(month.taxableAmount)} />
        <Stat label="Exemptions" value={fmt(month.exemptionAmount)} />
        <Stat label="Taxed documents" value={String(month.transactions || 0)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NavCard href="/tax/setup" icon={<Globe className="w-5 h-5" />} title="Country & profile" hint="Registration, regime, inclusive/exclusive" />
        <NavCard href="/tax/rates" icon={<Percent className="w-5 h-5" />} title="Rates & rules" hint={`${counts.taxRates || 0} rates · ${counts.taxTypes || 0} types`} />
        <NavCard href="/tax/exemptions" icon={<ShieldCheck className="w-5 h-5" />} title="Exemptions" hint={`${counts.exemptions || 0} certificates`} />
        <NavCard href="/tax/reports" icon={<FileSpreadsheet className="w-5 h-5" />} title="Liability report" hint="Returns-ready audit trail" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-800">Recent tax postings</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Document</th>
              <th className="text-left px-5 py-2 font-medium">Type</th>
              <th className="text-left px-5 py-2 font-medium">Jurisdiction</th>
              <th className="text-right px-5 py-2 font-medium">Tax</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recent || []).length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No tax has been posted yet. Complete a POS sale or invoice after setup.</td></tr>
            )}
            {(data?.recent || []).map((tx: any) => (
              <tr key={tx.id} className="border-t border-gray-50">
                <td className="px-5 py-2.5">{tx.transactionType} · {String(tx.transactionId).slice(0, 8)}</td>
                <td className="px-5 py-2.5">{tx.taxType?.name || '—'}</td>
                <td className="px-5 py-2.5">{tx.jurisdiction?.name || '—'}</td>
                <td className="px-5 py-2.5 text-right font-medium">{fmt(tx.taxAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-1 capitalize">{value || '—'}</p>
    </div>
  );
}

function NavCard({ href, icon, title, hint }: { href: string; icon: React.ReactNode; title: string; hint: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#014582] hover:shadow-sm transition-all">
      <div className="w-9 h-9 rounded-lg bg-[#014582]/10 text-[#014582] flex items-center justify-center mb-3">{icon}</div>
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 mt-1">{hint}</p>
    </Link>
  );
}
