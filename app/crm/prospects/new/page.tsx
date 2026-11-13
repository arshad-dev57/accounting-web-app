'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Users, Target, Info, CheckCircle2,
  Globe, Phone, DollarSign, Plus, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createProspect,
  getTerritories,
  getMarketSegments,
  getCustomerGroups,
  getLeads,
  NO_OF_EMPLOYEES,
  type CRMLead,
} from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
  deskSelect,
} from '../../components/ErpDeskForm';

const INDUSTRIES = [
  '',
  'Advertising', 'Agriculture', 'Automotive', 'Banking', 'Chemical',
  'Commercial', 'Communications', 'Construction', 'Consumer Goods',
  'Education', 'Electronics', 'Energy', 'Entertainment', 'Finance',
  'Government', 'Healthcare', 'Hospitality', 'Information Technology',
  'Insurance', 'Journalism', 'Legal', 'Manufacturing', 'Marketing',
  'Media', 'Mining', 'Non Profit', 'Oil & Gas', 'Other', 'Pharmaceuticals',
  'Real Estate', 'Retail', 'Services', 'Technology', 'Telecommunication',
  'Transportation', 'Utility', 'Wholesale',
];

function NewProspectForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Lookups
  const [territories, setTerritories] = useState<string[]>([]);
  const [marketSegments, setMarketSegments] = useState<string[]>([]);
  const [customerGroups, setCustomerGroups] = useState<string[]>([]);
  const [availableLeads, setAvailableLeads] = useState<CRMLead[]>([]);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [customerGroup, setCustomerGroup] = useState('');
  const [marketSegment, setMarketSegment] = useState('');
  const [industry, setIndustry] = useState('');
  const [territory, setTerritory] = useState('');
  const [noOfEmployees, setNoOfEmployees] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [website, setWebsite] = useState('');
  const [fax, setFax] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([
      getTerritories().catch(() => []),
      getMarketSegments().catch(() => []),
      getCustomerGroups().catch(() => []),
      getLeads({ limit: 100 }).catch(() => ({ leads: [] })),
    ]).then(([tList, mList, gList, lRes]) => {
      const terrs = Array.isArray(tList) ? tList.map((x) => x.name) : [];
      const segs = Array.isArray(mList) ? mList.map((x) => x.name) : [];
      const grps = Array.isArray(gList) ? gList.map((x) => x.name) : [];
      setTerritories(terrs);
      setMarketSegments(segs);
      setCustomerGroups(grps);
      setAvailableLeads(lRes.leads || []);

      if (terrs.length && !territory) {
        const root = terrs.find((t) => t.toLowerCase() === 'all territories') || terrs[0];
        setTerritory(root);
      }
      if (grps.length && !customerGroup) {
        setCustomerGroup(grps[0] || 'Commercial');
      }
    });
  }, [customerGroup, territory]);

  const handleToggleLead = (leadId: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const name = companyName.trim();
    if (!name) {
      toast.error('Organization / Company Name is required');
      return;
    }

    setSaving(true);
    try {
      const row = await createProspect({
        companyName: name,
        customerGroup: customerGroup || undefined,
        marketSegment: marketSegment || undefined,
        industry: industry || undefined,
        territory: territory || undefined,
        noOfEmployees: noOfEmployees || undefined,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : undefined,
        website: website.trim() || undefined,
        fax: fax.trim() || undefined,
        notes: notes.trim() || undefined,
        leadIds: selectedLeadIds,
      } as any);

      toast.success('Prospect created successfully');
      router.push(`/crm/prospects/${row.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create prospect');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* ── ERPNext Desk Header ───────────────────────── */}
      <DeskPageHeader
        title="New Prospect"
        dirty={true}
        saving={saving}
        onSave={handleSubmit}
        onCancel={() => router.push('/crm/prospects')}
        actions={
          <Link
            href="/crm/prospects"
            className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <DeskFormShell
          side={
            <div className="space-y-3">
              <DeskSideCard title="Prospect Guidance">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#014582] shrink-0 mt-0.5" />
                    <p>
                      <strong>What is a Prospect:</strong> An organization or account you are actively pitching to win as a customer.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Leads Association:</strong> You can link multiple leads from different contacts at this company under one prospect.
                    </p>
                  </div>
                </div>
              </DeskSideCard>

              {customerGroup && (
                <DeskSideCard title="Customer Group">
                  <span className="text-xs font-semibold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 block text-center">
                    {customerGroup}
                  </span>
                </DeskSideCard>
              )}

              {territory && (
                <DeskSideCard title="Territory">
                  <span className="text-xs font-semibold text-[#014582] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block text-center">
                    {territory}
                  </span>
                </DeskSideCard>
              )}
            </div>
          }
        >
          <div className="space-y-6">
            {/* ── Section: Organization Overview ───────────────────────── */}
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#014582]" />
                Organization Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <DeskField label="Organization / Company Name" required className="md:col-span-2">
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corporation, Indus Logistics"
                    className={deskInput}
                    autoFocus
                  />
                </DeskField>

                <DeskField label="Customer Group">
                  <select
                    value={customerGroup}
                    onChange={(e) => setCustomerGroup(e.target.value)}
                    className={deskSelect}
                  >
                    <option value="">Select Customer Group</option>
                    {customerGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </DeskField>

                <DeskField label="Industry">
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className={deskSelect}
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind || 'Select Industry'}
                      </option>
                    ))}
                  </select>
                </DeskField>

                <DeskField label="Market Segment">
                  <select
                    value={marketSegment}
                    onChange={(e) => setMarketSegment(e.target.value)}
                    className={deskSelect}
                  >
                    <option value="">Select Market Segment</option>
                    {marketSegments.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </DeskField>

                <DeskField label="Territory">
                  <select
                    value={territory}
                    onChange={(e) => setTerritory(e.target.value)}
                    className={deskSelect}
                  >
                    <option value="">Select Territory</option>
                    {territories.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </DeskField>

                <DeskField label="No. of Employees">
                  <select
                    value={noOfEmployees}
                    onChange={(e) => setNoOfEmployees(e.target.value)}
                    className={deskSelect}
                  >
                    <option value="">Select Size</option>
                    {NO_OF_EMPLOYEES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </DeskField>

                <DeskField label="Annual Revenue">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={annualRevenue}
                    onChange={(e) => setAnnualRevenue(e.target.value)}
                    placeholder="0.00"
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Website">
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Fax / Secondary Phone">
                  <input
                    type="tel"
                    value={fax}
                    onChange={(e) => setFax(e.target.value)}
                    placeholder="+92 42 1234567"
                    className={deskInput}
                  />
                </DeskField>
              </div>
            </div>

            {/* ── Section: Associate Existing Leads ───────────────────────── */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#014582]" />
                    Associate Leads with this Prospect
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select existing leads that belong to this organization.
                  </p>
                </div>
                {selectedLeadIds.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#014582] border border-blue-200">
                    {selectedLeadIds.length} lead(s) selected
                  </span>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-3">
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#f8f9fa] border-b border-gray-200 text-gray-600 font-semibold z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center"></th>
                        <th className="py-2.5 px-3 min-w-[160px]">Lead Name</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Email</th>
                        <th className="py-2.5 px-3 min-w-[140px]">Company Name</th>
                        <th className="py-2.5 px-3 min-w-[100px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {availableLeads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-400">
                            No unassociated leads available.
                          </td>
                        </tr>
                      ) : (
                        availableLeads.map((lead) => {
                          const isChecked = selectedLeadIds.includes(lead.id);
                          return (
                            <tr
                              key={lead.id}
                              onClick={() => handleToggleLead(lead.id)}
                              className={`cursor-pointer transition-colors ${
                                isChecked ? 'bg-blue-50/60' : 'hover:bg-gray-50/50'
                              }`}
                            >
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleLead(lead.id)}
                                  className="h-4 w-4 rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td className="py-2 px-3 font-medium text-gray-900">
                                {lead.fullName || `${lead.firstName} ${lead.lastName || ''}`}
                              </td>
                              <td className="py-2 px-3 text-gray-600">{lead.email || '—'}</td>
                              <td className="py-2 px-3 text-gray-600">{lead.companyName || '—'}</td>
                              <td className="py-2 px-3">
                                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                                  {lead.status || 'Lead'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Section: Notes & Comments ───────────────────────── */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">
                Internal Notes & Prospect Strategy
              </h2>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key stakeholders, deal context, current ERP system in use, strategic next steps…"
                className="w-full px-3 py-2 bg-[#f4f5f6] border border-transparent rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#014582]/40 focus:ring-2 focus:ring-[#014582]/15"
              />
            </div>
          </div>
        </DeskFormShell>
      </form>
    </div>
  );
}

export default function NewProspectPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-gray-500">
          Loading New Prospect form…
        </div>
      }
    >
      <NewProspectForm />
    </Suspense>
  );
}
